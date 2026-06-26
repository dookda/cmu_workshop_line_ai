// core.js — province statistics domain logic
import { readFileSync } from 'fs';

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
