// core.js — province statistics domain logic + LINE messaging
import { readFileSync } from 'fs';
import { createHmac, timingSafeEqual } from 'crypto';
import * as line from '@line/bot-sdk';
import OpenAI from 'openai';

// ---------------------------------------------------------------------------
// Province statistics (converted from assets/stat.xlsx)
// ---------------------------------------------------------------------------
const PROVINCE_RATE_FIELDS = ['patient', 'patient_rate', 'dead', 'dead_rate', 'cfr'];

export class ProvinceStatsRepository {
    constructor(path) {
        this.items = JSON.parse(readFileSync(path, 'utf-8'));
        this.defaultYear = Math.max(...this.items.map(item => item.year));
    }

    findByProvince(name, year) {
        const normalized = name.trim().toLowerCase();
        const matches = this.items
            .filter(item => item.province.toLowerCase().includes(normalized) && (year === undefined || item.year === year))
            .sort((a, b) => a.year - b.year);
        if (!matches.length) return null;
        return year === undefined ? matches : matches[0];
    }

    query({ field = 'patient_rate', min, max, year = this.defaultYear } = {}) {
        const rateField = PROVINCE_RATE_FIELDS.includes(field) ? field : 'patient_rate';
        return this.items
            .filter(item => item.year === year)
            .filter(item => (min === undefined || item[rateField] >= min) && (max === undefined || item[rateField] <= max))
            .sort((a, b) => b[rateField] - a[rateField]);
    }
}

// ---------------------------------------------------------------------------
// LINE chatbot — lets users look up province stats by chatting
// ---------------------------------------------------------------------------
const HELP_TEXT =
    'พิมพ์ชื่อจังหวัด เพื่อดูข้อมูลผู้ป่วยทุกปีที่มี เช่น "เชียงราย"\n' +
    'หรือพิมพ์ชื่อจังหวัดตามด้วยปี เพื่อดูข้อมูลปีนั้น เช่น "เชียงราย 2026"\n' +
    'หรือพิมพ์ "สรุปข้อมูล ชื่อจังหวัด" เพื่อดูกราฟสรุป เช่น "สรุปข้อมูล เชียงราย"\n' +
    'หรือพิมพ์ "เลือกจังหวัด" เพื่อเลือกจังหวัดและปีจากเมนู\n' +
    'หรือพิมพ์ "ai ชื่อจังหวัด ปี" ให้ AI อธิบายข้อมูลเป็นภาษาที่เข้าใจง่าย เช่น "ai เชียงราย 2026"';
const CHART_PROMPT = 'พิมพ์ชื่อจังหวัดที่ต้องการดูกราฟสรุปข้อมูล เช่น "สรุปข้อมูล เชียงราย"';
const CHART_KEYWORDS = ['สรุปข้อมูล', 'chart', 'summary'];
const PICK_PROVINCE_KEYWORDS = ['เลือกจังหวัด', 'กรองข้อมูล', 'pick', 'filter'];
const PICK_YEAR_PREFIX = 'เลือกปี';
const CURATED_PROVINCES = ['เชียงราย', 'เชียงใหม่', 'กรุงเทพมหานคร', 'ชลบุรี', 'นครราชสีมา', 'ขอนแก่น'];
const ALL_YEARS_LABEL = 'ทุกปี';
const YEAR_CHOICES = [2025, 2026, 2027, 2028, 2029];
const AI_KEYWORDS = ['ai', 'ถามai', 'ถาม ai'];
const AI_PROMPT = 'พิมพ์ "ai ชื่อจังหวัด ปี" เพื่อให้ AI อธิบายข้อมูลเป็นภาษาที่เข้าใจง่าย เช่น "ai เชียงราย 2026"';

function textReply(text) {
    return { type: 'text', text };
}

function formatRecord({ province, year, patient, patient_rate, dead, dead_rate, cfr }) {
    return `จังหวัด${province} ปี ${year}\n` +
        `ผู้ป่วย: ${patient.toLocaleString()} คน (อัตรา ${patient_rate} ต่อแสนประชากร)\n` +
        `เสียชีวิต: ${dead.toLocaleString()} คน (อัตรา ${dead_rate})\n` +
        `CFR: ${cfr}%`;
}

function formatRecords(records) {
    const province = records[0].province;
    const lines = records.map(r => `ปี ${r.year}: ผู้ป่วย ${r.patient.toLocaleString()} คน (อัตรา ${r.patient_rate})`);
    return `จังหวัด${province}\n${lines.join('\n')}`;
}

function parseQuery(text) {
    const match = text.trim().match(/^(.+?)\s+(\d{4})$/);
    if (match) return { province: match[1].trim(), year: Number(match[2]) };
    return { province: text.trim(), year: undefined };
}

// Matches "<keyword> <rest>" and returns <rest>, or null if the text doesn't start with one of the keywords.
function matchPrefixed(text, keywords) {
    const match = text.trim().match(new RegExp(`^(?:${keywords.join('|')})\\s+(.+)$`, 'i'));
    return match ? match[1].trim() : null;
}

function parseChartQuery(text) {
    const rest = matchPrefixed(text, CHART_KEYWORDS);
    // Chart always plots the full multi-year trend, so drop any trailing year
    // (e.g. "สรุปข้อมูล เชียงราย 2026") instead of treating it as part of the name.
    return rest ? rest.replace(/\s+\d{4}$/, '') : null;
}

function parseAiQuery(text) {
    const rest = matchPrefixed(text, AI_KEYWORDS);
    const match = rest && rest.match(/^(.+?)\s+(\d{4})$/);
    return match ? { province: match[1].trim(), year: Number(match[2]) } : null;
}

async function aiExplain(record, { apiKey, model }) {
    const fallback = formatRecord(record);
    if (!apiKey) return fallback;
    try {
        const client = new OpenAI({ apiKey, fetch: globalThis.fetch });
        const response = await client.responses.create({
            model,
            instructions:
                'คุณคือผู้ช่วยอธิบายสถิติโรคติดต่อภาษาไทย ใช้เฉพาะข้อมูลที่ให้มาเท่านั้น ' +
                'อธิบายเป็นประโยคสั้นๆ 1-2 ประโยค ภาษาที่เข้าใจง่าย ห้ามแต่งตัวเลขเพิ่มหรือวินิจฉัยใดๆ ' +
                'ใช้ปี ค.ศ. ตามที่ระบุไว้เป๊ะๆ ห้ามแปลงเป็นปี พ.ศ. หรือเปลี่ยนตัวเลขปี',
            input:
                `ข้อมูล: จังหวัด${record.province} ปี ${record.year} ผู้ป่วย ${record.patient} คน ` +
                `(อัตรา ${record.patient_rate} ต่อแสนประชากร) เสียชีวิต ${record.dead} คน (อัตรา ${record.dead_rate}) CFR ${record.cfr}%`,
        });
        return response.output_text.trim();
    } catch (err) {
        console.error('OpenAI request failed; using local fallback', err.message);
        return fallback;
    }
}

// ---------------------------------------------------------------------------
// Chart image rendering (via QuickChart's hosted Chart.js renderer)
// ---------------------------------------------------------------------------
function provinceChartImage(records) {
    const province = records[0].province;
    const config = {
        type: 'bar',
        data: {
            labels: records.map(r => String(r.year)),
            datasets: [{ label: 'ผู้ป่วย (คน)', data: records.map(r => r.patient), backgroundColor: '#20A475' }],
        },
        options: {
            plugins: {
                title: { display: true, text: `สรุปข้อมูลจังหวัด${province}` },
                legend: { display: false },
            },
            scales: { y: { beginAtZero: true } },
        },
    };
    const url = `https://quickchart.io/chart?width=800&height=500&backgroundColor=white&v=4&c=${encodeURIComponent(JSON.stringify(config))}`;
    return {
        type: 'image',
        originalContentUrl: url,
        previewImageUrl: url,
        altText: `สรุปข้อมูลจังหวัด${province}`,
        caption: `สรุปข้อมูลจังหวัด${province} (${records[0].year}-${records[records.length - 1].year})`,
    };
}

// ---------------------------------------------------------------------------
// Flex messages — main menu + pickers
// ---------------------------------------------------------------------------
function flex(altText, contents) {
    return { type: 'flex', altText, contents };
}

function actionRow(label, text, color) {
    return {
        type: 'box', layout: 'horizontal', backgroundColor: color,
        cornerRadius: '10px', paddingAll: '14px',
        action: { type: 'message', label, text },
        contents: [
            { type: 'text', text: label, weight: 'bold', color: '#173F35' },
            { type: 'text', text: '›', align: 'end', color: '#0C5C4C', size: 'xl' },
        ],
    };
}

export function menuFlex() {
    return flex('เมนู HealthLine Stats', {
        type: 'bubble',
        styles: { header: { backgroundColor: '#0C5C4C' } },
        header: {
            type: 'box', layout: 'vertical', paddingAll: '20px', contents: [
                { type: 'text', text: 'HEALTHLINE STATS', color: '#BDF5D8', size: 'xs', weight: 'bold' },
                { type: 'text', text: 'สถิติผู้ป่วยรายจังหวัด', color: '#FFFFFF', size: 'xl', weight: 'bold', margin: 'sm' },
            ],
        },
        body: {
            type: 'box', layout: 'vertical', spacing: 'md', contents: [
                { type: 'text', text: 'เลือกหัวข้อ หรือพิมพ์ชื่อจังหวัดได้เลย', wrap: true, color: '#40544D' },
                actionRow('เลือกจังหวัด', 'เลือกจังหวัด', '#E7F7EE'),
                actionRow('สรุปข้อมูล', 'สรุปข้อมูล', '#FFF0D9'),
                actionRow('ถาม AI', 'ai', '#E9F0FF'),
            ],
        },
    });
}

function listFlex(title, subtitle, rows) {
    return flex(title, {
        type: 'bubble',
        header: {
            type: 'box', layout: 'vertical', contents: [
                { type: 'text', text: title, size: 'xl', weight: 'bold', color: '#0C5C4C' },
                { type: 'text', text: subtitle, size: 'xs', color: '#40544D', margin: 'sm' },
            ],
        },
        body: { type: 'box', layout: 'vertical', spacing: 'sm', contents: rows },
    });
}

export function provinceListFlex() {
    const rows = CURATED_PROVINCES.map(province =>
        actionRow(province, `${PICK_YEAR_PREFIX} ${province}`, '#E7F7EE'));
    return listFlex('เลือกจังหวัด', 'หรือพิมพ์ชื่อจังหวัดอื่นได้เลย', rows);
}

export function yearListFlex(province) {
    const rows = [
        ...YEAR_CHOICES.map(year => actionRow(String(year), `${province} ${year}`, '#FFF6EA')),
        actionRow(ALL_YEARS_LABEL, province, '#E9F0FF'),
    ];
    return listFlex('เลือกปี', `จังหวัด${province}`, rows);
}

export class LineService {
    constructor(accessToken, provinceStats, { apiKey = '', model = 'gpt-4.1-mini' } = {}) {
        this.accessToken = accessToken;
        this.provinceStats = provinceStats;
        this.apiKey = apiKey;
        this.model = model;
    }

    async respond(text) {
        const normalized = text.trim().toLowerCase();
        if (['เมนู', 'menu'].includes(normalized)) return menuFlex();
        if (['help', 'ช่วยเหลือ', 'วิธีใช้งาน'].includes(normalized)) return textReply(HELP_TEXT);
        if (CHART_KEYWORDS.includes(normalized)) return textReply(CHART_PROMPT);
        if (PICK_PROVINCE_KEYWORDS.includes(normalized)) return provinceListFlex();
        if (AI_KEYWORDS.includes(normalized)) return textReply(AI_PROMPT);

        if (matchPrefixed(text, AI_KEYWORDS) !== null) {
            const aiQuery = parseAiQuery(text);
            if (!aiQuery) return textReply(AI_PROMPT);
            const record = this.provinceStats.findByProvince(aiQuery.province, aiQuery.year);
            if (!record || Array.isArray(record)) {
                return textReply(`ไม่พบข้อมูลจังหวัด "${aiQuery.province}" ปี ${aiQuery.year}\n\n${AI_PROMPT}`);
            }
            return textReply(await aiExplain(record, { apiKey: this.apiKey, model: this.model }));
        }

        const pickYearProvince = matchPrefixed(text, [PICK_YEAR_PREFIX]);
        if (pickYearProvince !== null) {
            const exists = this.provinceStats.findByProvince(pickYearProvince);
            if (!exists) return textReply(`ไม่พบข้อมูลจังหวัด "${pickYearProvince}"\n\n${HELP_TEXT}`);
            return yearListFlex(pickYearProvince);
        }

        const chartProvince = parseChartQuery(text);
        if (chartProvince !== null) {
            const records = this.provinceStats.findByProvince(chartProvince);
            if (!records) return textReply(`ไม่พบข้อมูลจังหวัด "${chartProvince}"\n\n${HELP_TEXT}`);
            return provinceChartImage(records);
        }

        const { province, year } = parseQuery(text);
        const result = this.provinceStats.findByProvince(province, year);
        if (!result) {
            const suffix = year !== undefined ? ` ปี ${year}` : '';
            return textReply(`ไม่พบข้อมูลจังหวัด "${province}"${suffix}\n\n${HELP_TEXT}`);
        }
        return textReply(Array.isArray(result) ? formatRecords(result) : formatRecord(result));
    }

    async reply(replyToken, payload) {
        if (!this.accessToken) return;
        const client = new line.messagingApi.MessagingApiClient({ channelAccessToken: this.accessToken });
        let messages;
        if (payload.type === 'flex') {
            messages = [{ type: 'flex', altText: payload.altText, contents: payload.contents }];
        } else if (payload.type === 'image') {
            messages = [
                { type: 'image', originalContentUrl: payload.originalContentUrl, previewImageUrl: payload.previewImageUrl },
                { type: 'text', text: payload.caption },
            ];
        } else {
            messages = [{ type: 'text', text: payload.text }];
        }
        await client.replyMessage({ replyToken, messages });
    }
}

// ---------------------------------------------------------------------------
// Signature validation
// ---------------------------------------------------------------------------
export function validSignature(rawBody, signature, secret) {
    const expected = Buffer.from(createHmac('sha256', secret).update(rawBody).digest('base64'));
    const actual = Buffer.from(signature);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
}
