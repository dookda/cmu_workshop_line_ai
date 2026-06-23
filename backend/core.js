// core.js — all domain logic: FAQ search, AI assistant, LINE messaging, flex messages
import { readFileSync } from 'fs';
import { createHmac } from 'crypto';
import OpenAI, { APIError } from 'openai';
import * as line from '@line/bot-sdk';

// The SDK already retries API-level errors (429, 5xx, timeouts) internally, so retrying
// those again here would be redundant. A second attempt only helps with errors that slip
// past that logic, like a connection dropping mid-body-read ("Premature close").
async function withRetry(fn) {
    try {
        return await fn();
    } catch (err) {
        if (err instanceof APIError) throw err;
        return await fn();
    }
}

// ---------------------------------------------------------------------------
// Emergency detection
// ---------------------------------------------------------------------------
const EMERGENCY_PATTERNS = [
    'เจ็บหน้าอก', 'หายใจไม่ออก', 'หมดสติ', 'ชัก', 'เลือดออกไม่หยุด',
    'อัมพาต', 'แขนขาอ่อนแรง', 'ฆ่าตัวตาย', 'ทำร้ายตัวเอง',
];
const EMERGENCY_REPLY =
    'อาการที่เล่ามาอาจเป็นภาวะฉุกเฉิน กรุณาโทร 1669 หรือไปห้องฉุกเฉินทันที ' +
    'อย่ารอคำตอบจากแชตบอต หากอยู่คนเดียวให้ติดต่อคนใกล้ตัวให้มาช่วยค่ะ';
const DISCLAIMER = '\n\nข้อมูลนี้เพื่อสุขศึกษา ไม่แทนการตรวจวินิจฉัยจากแพทย์';

function isEmergency(text) {
    const compact = text.toLowerCase().replace(/\s+/g, '');
    return EMERGENCY_PATTERNS.some(p => compact.includes(p.replace(/\s+/g, '')));
}

// ---------------------------------------------------------------------------
// FAQ search
// ---------------------------------------------------------------------------
function terms(text) {
    const normalized = text.toLowerCase().replace(/[^0-9a-zA-Z\u0E00-\u0E7F]+/g, ' ').trim();
    const words = new Set(normalized.split(/\s+/).filter(Boolean));
    const compact = normalized.replace(/\s+/g, '');
    for (let i = 0; i < Math.max(0, compact.length - 2); i++) {
        words.add(compact.slice(i, i + 3));
    }
    return words;
}

function rankByTerms(query, items, haystackOf) {
    const queryTerms = terms(query);
    if (!queryTerms.size) return [];
    const ranked = [];
    for (const item of items) {
        const itemTerms = terms(haystackOf(item));
        let score = [...queryTerms].filter(t => itemTerms.has(t)).length / Math.max(1, queryTerms.size);
        score += (item.keywords || []).filter(kw => query.toLowerCase().includes(kw.toLowerCase())).length * 0.8;
        if (score > 0) ranked.push({ item, score });
    }
    return ranked.sort((a, b) => b.score - a.score);
}

export class FAQRepository {
    constructor(path) {
        this.items = JSON.parse(readFileSync(path, 'utf-8'));
    }

    search(query, limit = 3) {
        return rankByTerms(query, this.items,
            item => [item.question, item.answer, ...(item.keywords || [])].join(' ')).slice(0, limit);
    }
}

// ---------------------------------------------------------------------------
// Province statistics (converted from assets/stat.xlsx)
// ---------------------------------------------------------------------------
const PROVINCE_RATE_FIELDS = ['patient', 'patient_rate', 'dead', 'dead_rate', 'cfr'];

export class ProvinceStatsRepository {
    constructor(path) {
        this.items = JSON.parse(readFileSync(path, 'utf-8'));
    }

    findByProvince(name) {
        const normalized = name.trim().toLowerCase();
        return this.items.find(item => item.province.toLowerCase().includes(normalized)) || null;
    }

    query({ field = 'patient_rate', min, max } = {}) {
        const rateField = PROVINCE_RATE_FIELDS.includes(field) ? field : 'patient_rate';
        return this.items
            .filter(item => (min === undefined || item[rateField] >= min) && (max === undefined || item[rateField] <= max))
            .sort((a, b) => b[rateField] - a[rateField]);
    }
}

// ---------------------------------------------------------------------------
// Stats / chart-on-demand
// ---------------------------------------------------------------------------
const CHART_PATTERNS = ['กราฟ', 'แผนภูมิ', 'ชาร์ต', 'สถิติ', 'chart', 'graph', 'stats'];

function isChartRequest(text) {
    const compact = text.toLowerCase().replace(/\s+/g, '');
    return CHART_PATTERNS.some(p => compact.includes(p));
}

export class StatsRepository {
    constructor(path) {
        this.items = JSON.parse(readFileSync(path, 'utf-8'));
    }

    get topics() {
        return this.items.map(({ id, title }) => ({ id, title }));
    }

    findById(id) {
        return this.items.find(item => item.id === id) || null;
    }

    search(query, limit = 1) {
        return rankByTerms(query, this.items,
            item => [item.title, ...(item.keywords || [])].join(' ')).slice(0, limit);
    }
}

async function pickChartTopic(question, statsRepository, { apiKey, model }) {
    if (apiKey) {
        try {
            const topics = statsRepository.topics;
            const client = new OpenAI({ apiKey, fetch: globalThis.fetch });
            const response = await withRetry(() => client.responses.create({
                model,
                instructions:
                    'เลือกหัวข้อสถิติที่ตรงกับคำขอของผู้ใช้มากที่สุดจากรายการนี้:\n' +
                    topics.map(t => `- ${t.id}: ${t.title}`).join('\n'),
                input: question,
                tools: [{
                    type: 'function',
                    name: 'show_chart',
                    description: 'แสดงกราฟสถิติของหัวข้อที่ผู้ใช้ขอ',
                    parameters: {
                        type: 'object',
                        properties: {
                            topic: { type: 'string', enum: topics.map(t => t.id) },
                        },
                        required: ['topic'],
                        additionalProperties: false,
                    },
                    strict: true,
                }],
                tool_choice: { type: 'function', name: 'show_chart' },
            }));
            const call = response.output.find(o => o.type === 'function_call');
            if (call) {
                const { topic } = JSON.parse(call.arguments);
                const match = statsRepository.findById(topic);
                if (match) return { item: match, mode: 'ai' };
            }
        } catch (err) {
            console.error('Chart topic selection failed; using local fallback', err.message);
        }
    }
    const [best] = statsRepository.search(question, 1);
    return { item: best ? best.item : null, mode: 'local' };
}

// ---------------------------------------------------------------------------
// AI assistant
// ---------------------------------------------------------------------------
export class HealthAssistant {
    constructor(repository, statsRepository, { apiKey = '', model = 'gpt-4.1-mini', topK = 3 } = {}) {
        this.repository = repository;
        this.statsRepository = statsRepository;
        this.apiKey = apiKey;
        this.model = model;
        this.topK = topK;
    }

    async answer(question) {
        question = question.trim().slice(0, 1500);
        if (isEmergency(question)) {
            return { text: EMERGENCY_REPLY, sources: [], mode: 'emergency' };
        }

        if (this.statsRepository && isChartRequest(question)) {
            const { item: chart, mode } = await pickChartTopic(question, this.statsRepository, { apiKey: this.apiKey, model: this.model });
            if (chart) return { chart, sources: [chart.source], mode };
        }

        const results = this.repository.search(question, this.topK);
        if (!results.length) {
            return {
                text: 'ยังไม่พบข้อมูลที่ตรงกับคำถามนี้ กรุณาลองระบุอาการหรือหัวข้อให้ชัดขึ้น เช่น ไข้หวัดใหญ่ เบาหวาน หรือความดันโลหิตค่ะ' + DISCLAIMER,
                sources: [],
                mode: 'local',
            };
        }

        const sources = results.map(r => r.item.source);
        if (!this.apiKey) {
            const best = results[0].item;
            return { text: `${best.answer}\n\nแหล่งข้อมูล: ${best.source}` + DISCLAIMER, sources, mode: 'local' };
        }

        const context = results.map((r, i) =>
            `[${i + 1}] คำถาม: ${r.item.question}\nคำตอบ: ${r.item.answer}\nแหล่งข้อมูล: ${r.item.source}`
        ).join('\n\n');

        try {
            const client = new OpenAI({ apiKey: this.apiKey, fetch: globalThis.fetch });
            const response = await withRetry(() => client.responses.create({
                model: this.model,
                instructions:
                    'คุณคือผู้ช่วยสุขศึกษาภาษาไทย ตอบอย่างกระชับ สุภาพ และเข้าใจง่าย ' +
                    'ใช้เฉพาะฐานความรู้ที่ให้มา ห้ามวินิจฉัย ห้ามแต่งข้อมูลหรือขนาดยา ' +
                    'ถ้าฐานความรู้ไม่พอให้บอกตรงๆ อ้างแหล่งข้อมูลท้ายคำตอบ และเตือนให้พบแพทย์เมื่ออาการรุนแรง',
                input: `ฐานความรู้:\n${context}\n\nคำถามผู้ใช้: ${question}`,
            }));
            return { text: response.output_text.trim() + DISCLAIMER, sources, mode: 'ai' };
        } catch (err) {
            console.error('OpenAI request failed; using local fallback', err.message);
            const best = results[0].item;
            return { text: `${best.answer}\n\nแหล่งข้อมูล: ${best.source}` + DISCLAIMER, sources, mode: 'fallback' };
        }
    }
}

// ---------------------------------------------------------------------------
// Flex message builders
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
    return flex('เมนู HealthLine AI', {
        type: 'bubble',
        styles: { header: { backgroundColor: '#0C5C4C' } },
        header: {
            type: 'box', layout: 'vertical', paddingAll: '20px', contents: [
                { type: 'text', text: 'HEALTHLINE AI', color: '#BDF5D8', size: 'xs', weight: 'bold' },
                { type: 'text', text: 'ผู้ช่วยสุขภาพใกล้ตัว', color: '#FFFFFF', size: 'xl', weight: 'bold', margin: 'sm' },
            ],
        },
        body: {
            type: 'box', layout: 'vertical', spacing: 'md', contents: [
                { type: 'text', text: 'เลือกหัวข้อหรือพิมพ์คำถามสุขภาพทั่วไปได้เลย', wrap: true, color: '#40544D' },
                actionRow('คำถามที่พบบ่อย', 'faq', '#E7F7EE'),
                actionRow('สถิติสุขภาพ', 'สถิติ', '#FFF0D9'),
                actionRow('วิธีใช้งาน', 'ช่วยเหลือ', '#E9F0FF'),
                { type: 'separator', margin: 'md' },
                { type: 'text', text: 'กรณีฉุกเฉิน โทร 1669', color: '#B42318', size: 'sm', weight: 'bold' },
            ],
        },
    });
}

export function faqFlex(items) {
    const rows = items.slice(0, 6).map(item => ({
        type: 'box', layout: 'vertical', paddingAll: '12px', backgroundColor: '#F4F8F6',
        cornerRadius: '8px',
        action: { type: 'message', label: item.question.slice(0, 20), text: item.question },
        contents: [{ type: 'text', text: item.question, wrap: true, size: 'sm', weight: 'bold', color: '#173F35' }],
    }));
    return flex('คำถามสุขภาพที่พบบ่อย', {
        type: 'bubble',
        header: {
            type: 'box', layout: 'vertical', contents: [
                { type: 'text', text: 'คำถามที่พบบ่อย', size: 'xl', weight: 'bold', color: '#0C5C4C' },
            ]
        },
        body: { type: 'box', layout: 'vertical', spacing: 'sm', contents: rows },
    });
}

export function statsMenuFlex(topics) {
    const rows = topics.map(t => ({
        type: 'box', layout: 'vertical', paddingAll: '12px', backgroundColor: '#FFF6EA',
        cornerRadius: '8px',
        action: { type: 'message', label: t.title.slice(0, 20), text: `กราฟ${t.title}` },
        contents: [{ type: 'text', text: t.title, wrap: true, size: 'sm', weight: 'bold', color: '#7A4A12' }],
    }));
    return flex('เลือกหัวข้อสถิติ', {
        type: 'bubble',
        header: {
            type: 'box', layout: 'vertical', contents: [
                { type: 'text', text: 'สถิติสุขภาพ', size: 'xl', weight: 'bold', color: '#0C5C4C' },
            ]
        },
        body: { type: 'box', layout: 'vertical', spacing: 'sm', contents: rows },
    });
}

// ---------------------------------------------------------------------------
// Chart image rendering (via QuickChart's hosted Chart.js renderer)
// ---------------------------------------------------------------------------
export function statsChartImage(stats, mode = 'local') {
    const config = {
        type: 'bar',
        data: {
            labels: stats.items.map(item => item.label),
            datasets: [{
                label: stats.title,
                data: stats.items.map(item => item.value),
                backgroundColor: stats.items.map(item => item.color || '#20A475'),
            }],
        },
        options: {
            plugins: {
                title: { display: true, text: stats.title },
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
        altText: stats.title,
        caption: `${stats.title}\n\n${stats.source}`,
        mode,
    };
}

// ---------------------------------------------------------------------------
// LINE service
// ---------------------------------------------------------------------------
export class LineService {
    constructor(accessToken, assistant, repository, statsRepository) {
        this.accessToken = accessToken;
        this.assistant = assistant;
        this.repository = repository;
        this.statsRepository = statsRepository;
    }

    async respond(text) {
        const normalized = text.trim().toLowerCase();
        if (['เมนู', 'menu', 'help', 'ช่วยเหลือ'].includes(normalized)) return menuFlex();
        if (['faq', 'คำถาม', 'คำถามที่พบบ่อย'].includes(normalized)) return faqFlex(this.repository.items);
        if (['สถิติ', 'stats', 'ข้อมูลสถิติ'].includes(normalized)) return statsMenuFlex(this.statsRepository.topics);
        const result = await this.assistant.answer(text);
        if (result.chart) return statsChartImage(result.chart, result.mode);
        return { type: 'text', text: result.text, mode: result.mode };
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
    const expected = createHmac('sha256', secret).update(rawBody).digest('base64');
    return expected === signature;
}
