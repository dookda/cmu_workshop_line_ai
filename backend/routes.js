import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import { FAQRepository, StatsRepository, HealthAssistant, LineService, validSignature } from './core.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const {
    LINE_CHANNEL_SECRET = '',
    LINE_CHANNEL_ACCESS_TOKEN = '',
    OPENAI_API_KEY = '',
    OPENAI_MODEL = 'gpt-4.1-mini',
    RAG_TOP_K = '3',
} = process.env;

// Lazy-initialised services (created once on first request)
let _services = null;
function services() {
    if (!_services) {
        const repository = new FAQRepository(path.join(__dirname, 'data/health_faq.json'));
        const statsRepository = new StatsRepository(path.join(__dirname, 'data/health_stats.json'));
        const assistant = new HealthAssistant(repository, statsRepository, {
            apiKey: OPENAI_API_KEY,
            model: OPENAI_MODEL,
            topK: parseInt(RAG_TOP_K, 10),
        });
        _services = { line: new LineService(LINE_CHANNEL_ACCESS_TOKEN, assistant, repository, statsRepository) };
    }
    return _services;
}

const router = express.Router();

router.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'healthline-ai' });
});

router.post('/api/chat', express.json(), async (req, res) => {
    const text = String(req.body?.message || '').trim();
    if (!text) return res.status(400).json({ error: 'message is required' });
    const { line } = services();
    res.json(await line.respond(text));
});

router.post('/webhook', express.raw({ type: '*/*' }), async (req, res) => {
    const rawBody = req.body;
    const signature = req.headers['x-line-signature'] || '';
    if (!LINE_CHANNEL_SECRET || !validSignature(rawBody, signature, LINE_CHANNEL_SECRET)) {
        return res.status(400).send('Bad Request');
    }
    const payload = JSON.parse(rawBody.toString('utf-8'));
    const { line } = services();
    for (const event of payload.events || []) {
        if (event.type === 'message' && event.message?.type === 'text') {
            const reply = await line.respond(event.message.text);
            await line.reply(event.replyToken, reply);
        } else if (event.type === 'follow') {
            await line.reply(event.replyToken, await line.respond('เมนู'));
        }
    }
    res.send('OK');
});

export default router;
