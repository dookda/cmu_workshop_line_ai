// core.js — simple province stats + LINE bot features
// [C1] import package
import { readFileSync } from 'fs';
import { createHmac, timingSafeEqual } from 'crypto';
import * as line from '@line/bot-sdk';
import OpenAI from 'openai';

// [C2] constant ข้อความและรายการจังหวัด
const RATE_FIELDS = ['patient', 'patient_rate', 'dead', 'dead_rate', 'cfr'];
const FEATURE_TEXT =
    'เลือกเมนูจาก Rich Menu หรือพิมพ์:\n' +
    '- สรุปข้อมูล เชียงราย\n' +
    '- กรองข้อมูล\n' +
    '- AI เชียงราย 2026';
const CHART_PROMPT = 'พิมพ์ "สรุปข้อมูล ชื่อจังหวัด" เช่น "สรุปข้อมูล เชียงราย"';
const AI_PROMPT = 'พิมพ์ "AI ชื่อจังหวัด ปี" เช่น "AI เชียงราย 2026"';
const QUICK_PROVINCES = ['เชียงราย', 'เชียงใหม่', 'กรุงเทพมหานคร', 'ชลบุรี', 'นครราชสีมา', 'ขอนแก่น'];

// [C3] ProvinceStatsRepository — อ่านข้อมูล JSON และค้นหาข้อมูลจังหวัด
export class ProvinceStatsRepository {
    constructor(path) {
        this.items = JSON.parse(readFileSync(path, 'utf-8'));
        this.defaultYear = Math.max(...this.items.map(item => item.year));
    }

    findByProvince(name, year) {
        const keyword = name.trim().toLowerCase();
        const matches = this.items
            .filter(item => item.province.toLowerCase().includes(keyword))
            .filter(item => year === undefined || item.year === year)
            .sort((a, b) => a.year - b.year);
        if (!matches.length) return null;
        return year === undefined ? matches : matches[0];
    }

    yearsByProvince(name) {
        const records = this.findByProvince(name);
        return records ? records.map(item => item.year) : [];
    }

    query({ field = 'patient_rate', min, max, year = this.defaultYear } = {}) {
        const rateField = RATE_FIELDS.includes(field) ? field : 'patient_rate';
        return this.items
            .filter(item => item.year === year)
            .filter(item => min === undefined || item[rateField] >= min)
            .filter(item => max === undefined || item[rateField] <= max)
            .sort((a, b) => b[rateField] - a[rateField]);
    }
}

// [C4] helper functions — สร้างข้อความ, parse จังหวัด+ปี, สร้าง chart URL
function textReply(text) {
    return { type: 'text', text };
}

function formatRecord({ province, year, patient, patient_rate, dead, dead_rate, cfr }) {
    return `จังหวัด${province} ปี ${year}\n` +
        `ผู้ป่วย: ${patient.toLocaleString()} คน (อัตรา ${patient_rate} ต่อแสนประชากร)\n` +
        `เสียชีวิต: ${dead.toLocaleString()} คน (อัตรา ${dead_rate})\n` +
        `CFR: ${cfr}%`;
}

function parseProvinceYear(text) {
    const match = text.trim().match(/^(.+?)\s+(\d{4})$/);
    return match ? { province: match[1].trim(), year: Number(match[2]) } : null;
}

function afterPrefix(text, prefix) {
    return text.startsWith(`${prefix} `) ? text.slice(prefix.length).trim() : null;
}

function chartImage(records) {
    const province = records[0].province;
    const config = {
        type: 'bar',
        data: {
            labels: records.map(item => String(item.year)),
            datasets: [{ label: 'ผู้ป่วย (คน)', data: records.map(item => item.patient), backgroundColor: '#20A475' }],
        },
        options: {
            plugins: { title: { display: true, text: `สรุปข้อมูลจังหวัด${province}` }, legend: { display: false } },
            scales: { y: { beginAtZero: true } },
        },
    };
    const url = `https://quickchart.io/chart?width=800&height=500&backgroundColor=white&v=4&c=${encodeURIComponent(JSON.stringify(config))}`;
    return {
        type: 'image',
        originalContentUrl: url,
        previewImageUrl: url,
        caption: `สรุปข้อมูลจังหวัด${province} (${records[0].year}-${records[records.length - 1].year})`,
    };
}

// [C5] Flex Message — สร้างปุ่มเมนูสำหรับ LINE
function flex(altText, contents) {
    return { type: 'flex', altText, contents };
}

function button(label, text, color) {
    return {
        type: 'box',
        layout: 'horizontal',
        backgroundColor: color,
        cornerRadius: '10px',
        paddingAll: '14px',
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
        body: {
            type: 'box',
            layout: 'vertical',
            spacing: 'md',
            contents: [
                { type: 'text', text: 'HealthLine Stats', weight: 'bold', size: 'xl', color: '#0C5C4C' },
                button('สรุปข้อมูล', 'สรุปข้อมูล', '#FFE0C2'),
                button('กรองข้อมูล', 'กรองข้อมูล', '#CFF6DF'),
                button('AI', 'AI', '#D7F0FF'),
            ],
        },
    });
}

function listFlex(title, rows) {
    return flex(title, {
        type: 'bubble',
        body: { type: 'box', layout: 'vertical', spacing: 'sm', contents: rows },
    });
}

function provinceListFlex() {
    return listFlex('กรองข้อมูล', QUICK_PROVINCES.map(province =>
        button(province, `เลือกปี ${province}`, '#CFF6DF')));
}

function yearListFlex(province, years) {
    return listFlex(`เลือกปี ${province}`, years.map(year =>
        button(String(year), `${province} ${year}`, '#FFE8C7')));
}

// [C6] LineService — รับข้อความผู้ใช้ แล้วเลือกว่าจะทำ feature ไหน
export class LineService {
    constructor(accessToken, provinceStats, { apiKey = '', model = 'gpt-4.1-mini' } = {}) {
        this.provinceStats = provinceStats;
        this.model = model;
        this.lineClient = accessToken ? new line.messagingApi.MessagingApiClient({ channelAccessToken: accessToken }) : null;
        this.openai = apiKey ? new OpenAI({ apiKey, fetch: globalThis.fetch }) : null;
    }

    async respond(input) {
        const text = input.trim();
        const lower = text.toLowerCase();

        if (['เมนู', 'menu'].includes(lower)) return menuFlex();
        if (text === 'สรุปข้อมูล') return textReply(CHART_PROMPT);
        if (text === 'กรองข้อมูล') return provinceListFlex();
        if (lower === 'ai') return textReply(AI_PROMPT);

        const chartProvince = afterPrefix(text, 'สรุปข้อมูล');
        if (chartProvince) return this.chart(chartProvince.replace(/\s+\d{4}$/, ''));

        const yearProvince = afterPrefix(text, 'เลือกปี');
        if (yearProvince) return this.yearPicker(yearProvince);

        if (lower.startsWith('ai ')) return this.ai(text.slice(3).trim());

        const query = parseProvinceYear(text);
        if (query) return this.record(query.province, query.year);

        return textReply(FEATURE_TEXT);
    }

    chart(province) {
        const records = this.provinceStats.findByProvince(province);
        return records ? chartImage(records) : textReply(`ไม่พบข้อมูลจังหวัด "${province}"`);
    }

    yearPicker(province) {
        const years = this.provinceStats.yearsByProvince(province);
        return years.length ? yearListFlex(province, years) : textReply(`ไม่พบข้อมูลจังหวัด "${province}"`);
    }

    record(province, year) {
        const record = this.provinceStats.findByProvince(province, year);
        return record ? textReply(formatRecord(record)) : textReply(`ไม่พบข้อมูลจังหวัด "${province}" ปี ${year}`);
    }

    async ai(text) {
        const query = parseProvinceYear(text);
        if (!query) return textReply(AI_PROMPT);

        const record = this.provinceStats.findByProvince(query.province, query.year);
        if (!record) return textReply(`ไม่พบข้อมูลจังหวัด "${query.province}" ปี ${query.year}`);
        if (!this.openai) return textReply(formatRecord(record));

        try {
            const response = await this.openai.responses.create({
                model: this.model,
                instructions:
                    'อธิบายสถิติโรคติดต่อภาษาไทยแบบสั้น 1-2 ประโยค ใช้เฉพาะข้อมูลที่ให้มา ห้ามแต่งตัวเลขเพิ่ม และใช้ปี ค.ศ. ตามข้อมูล',
                input:
                    `จังหวัด${record.province} ปี ${record.year}: ผู้ป่วย ${record.patient} คน ` +
                    `อัตราป่วย ${record.patient_rate} ต่อแสนประชากร เสียชีวิต ${record.dead} คน ` +
                    `อัตราตาย ${record.dead_rate} CFR ${record.cfr}%`,
            });
            return textReply(response.output_text.trim());
        } catch (err) {
            console.error('OpenAI request failed; using local fallback', err.message);
            return textReply(formatRecord(record));
        }
    }

    async reply(replyToken, payload) {
        if (!this.lineClient) return;

        let messages;
        if (payload.type === 'image') {
            messages = [
                { type: 'image', originalContentUrl: payload.originalContentUrl, previewImageUrl: payload.previewImageUrl },
                { type: 'text', text: payload.caption },
            ];
        } else if (payload.type === 'flex') {
            messages = [{ type: 'flex', altText: payload.altText, contents: payload.contents }];
        } else {
            messages = [{ type: 'text', text: payload.text }];
        }

        await this.lineClient.replyMessage({ replyToken, messages });
    }
}

// [C7] validSignature — ตรวจ webhook signature จาก LINE
export function validSignature(rawBody, signature, secret) {
    const expected = Buffer.from(createHmac('sha256', secret).update(rawBody).digest('base64'));
    const actual = Buffer.from(signature);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
}
