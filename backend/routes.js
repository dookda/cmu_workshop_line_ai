import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import { ProvinceStatsRepository, LineService, validSignature } from './core.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const {
    LINE_CHANNEL_SECRET = '',
    LINE_CHANNEL_ACCESS_TOKEN = '',
    OPENAI_API_KEY = '',
    OPENAI_MODEL = 'gpt-4.1-mini',
} = process.env;

// Lazy-initialised services (created once on first request)
let _services = null;
function services() {
    if (!_services) {
        const provinceStats = new ProvinceStatsRepository(path.join(__dirname, 'data/province_stats.json'));
        _services = {
            provinceStats,
            line: new LineService(LINE_CHANNEL_ACCESS_TOKEN, provinceStats, { apiKey: OPENAI_API_KEY, model: OPENAI_MODEL }),
        };
    }
    return _services;
}

const router = express.Router();

router.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'healthline-ai' });
});

// Sends a single province's record(s), or 404 if no province matches `name`.
// (findByProvince returns one record when `year` is given, or all years when omitted.)
function sendProvince(res, provinceStats, name, year) {
    const match = provinceStats.findByProvince(name, year);
    return match ? res.json(match) : res.status(404).json({ error: 'province not found' });
}

router.get('/api/provinces', (req, res) => {
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
    const { provinceStats } = services();
    const { year } = req.query;
    sendProvince(res, provinceStats, req.params.province, year !== undefined ? Number(year) : undefined);
});

router.post('/webhook', express.raw({ type: '*/*' }), async (req, res) => {
    const rawBody = req.body;
    const signature = req.headers['x-line-signature'] || '';
    if (!LINE_CHANNEL_SECRET || !validSignature(rawBody, signature, LINE_CHANNEL_SECRET)) {
        return res.status(400).send('Bad Request');
    }
    let payload;
    try {
        payload = JSON.parse(rawBody.toString('utf-8'));
    } catch {
        return res.status(400).send('Bad Request');
    }
    const { line } = services();
    try {
        for (const event of payload.events || []) {
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
