// [R1] import package และ core logic
import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import { ProvinceStatsRepository, LineService, validSignature } from './core.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// [R2] อ่านค่า environment จาก .env
const {
    LINE_CHANNEL_SECRET = '',
    LINE_CHANNEL_ACCESS_TOKEN = '',
    OPENAI_API_KEY = '',
    OPENAI_MODEL = 'gpt-4.1-mini',
} = process.env;

// [R3] สร้าง service ที่ route ต้องใช้
let _services = null;
function services() {
    // สร้าง service แค่ครั้งเดียว เพื่อไม่ต้องอ่านไฟล์ JSON และสร้าง client ซ้ำทุก request
    if (!_services) {
        const provinceStats = new ProvinceStatsRepository(path.join(__dirname, 'data/province_stats.json'));
        _services = {
            provinceStats,
            line: new LineService(LINE_CHANNEL_ACCESS_TOKEN, provinceStats, { apiKey: OPENAI_API_KEY, model: OPENAI_MODEL }),
        };
    }
    return _services;
}

// [R4] สร้าง router และ health check
const router = express.Router();

router.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'healthline-ai' });
});

// [R5] helper สำหรับส่งข้อมูลจังหวัด
function sendProvince(res, provinceStats, name, year) {
    // ใช้ร่วมกันทั้ง query param และ path param เพื่อลดโค้ดซ้ำ
    const match = provinceStats.findByProvince(name, year);
    return match ? res.json(match) : res.status(404).json({ error: 'province not found' });
}

// [R6] API routes สำหรับทดสอบข้อมูลจังหวัด
router.get('/api/provinces', (req, res) => {
    // ถ้าส่ง province มา จะค้นจังหวัดเดียว ถ้าไม่ส่ง จะคืนรายการตาม filter
    const { province, field, min, max, year } = req.query;
    const { provinceStats } = services();
    const parsedYear = year !== undefined ? Number(year) : undefined;
    if (province) return sendProvince(res, provinceStats, String(province), parsedYear);
    res.json(provinceStats.query({
        field,
        min: min !== undefined ? Number(min) : undefined,
        max: max !== undefined ? Number(max) : undefined,
        year: parsedYear,
    }));
});

router.get('/api/provinces/:province', (req, res) => {
    // รองรับ URL แบบ /api/provinces/เชียงราย เพื่อให้ test ง่าย
    const { provinceStats } = services();
    const { year } = req.query;
    sendProvince(res, provinceStats, req.params.province, year !== undefined ? Number(year) : undefined);
});

// [R7] LINE webhook route
router.post('/webhook', express.raw({ type: '*/*' }), async (req, res) => {
    // ต้องใช้ raw body เพราะ LINE signature คำนวณจาก body ดิบก่อนแปลงเป็น JSON
    const rawBody = req.body;
    const signature = req.headers['x-line-signature'] || '';
    if (!LINE_CHANNEL_SECRET || !validSignature(rawBody, signature, LINE_CHANNEL_SECRET)) {
        return res.status(400).send('Bad Request');
    }
    let payload;
    try {
        // ตรวจ signature ผ่านแล้ว จึงค่อย parse JSON
        payload = JSON.parse(rawBody.toString('utf-8'));
    } catch {
        return res.status(400).send('Bad Request');
    }
    const { line } = services();
    try {
        // วนทุก event ที่ LINE ส่งมา แล้วตอบเฉพาะ event ที่มี replyToken
        for (const event of payload.events || []) {
            if (!event.replyToken) continue;
            if (event.type === 'message' && event.message?.type === 'text') {
                await line.reply(event.replyToken, await line.respond(event.message.text));
            } else if (event.type === 'follow') {
                await line.reply(event.replyToken, await line.respond('เมนู'));
            }
        }
    } catch (err) {
        console.error('webhook event handling failed', err);
    }
    res.send('OK');
});

export default router;
