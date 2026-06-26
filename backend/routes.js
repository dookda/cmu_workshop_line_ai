import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import { ProvinceStatsRepository } from './core.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Lazy-initialised services (created once on first request)
let _services = null;
function services() {
    if (!_services) {
        _services = {
            provinceStats: new ProvinceStatsRepository(path.join(__dirname, 'data/province_stats.json')),
        };
    }
    return _services;
}

const router = express.Router();

router.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'healthline-ai' });
});

router.get('/api/provinces', (req, res) => {
    const { province, field, min, max, year } = req.query;
    const { provinceStats } = services();
    const parsedYear = year !== undefined ? Number(year) : undefined;
    if (province) {
        const match = provinceStats.findByProvince(String(province), parsedYear);
        return match ? res.json(match) : res.status(404).json({ error: 'province not found' });
    }
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
    const match = provinceStats.findByProvince(req.params.province, year !== undefined ? Number(year) : undefined);
    return match ? res.json(match) : res.status(404).json({ error: 'province not found' });
});

export default router;
