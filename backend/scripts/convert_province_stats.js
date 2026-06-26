// Converts assets/stat.xlsx into backend/data/province_stats.json.
// Run with: node backend/scripts/convert_province_stats.js
import XLSX from 'xlsx';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCE = path.join(__dirname, '..', '..', 'assets', 'stat.xlsx');
const DEST = path.join(__dirname, '..', 'data', 'province_stats.json');

const REAL_YEAR = 2029;
const SYNTHETIC_YEARS = [2025, 2026, 2027, 2028];

const workbook = XLSX.readFile(SOURCE);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const realRows = XLSX.utils.sheet_to_json(sheet, { defval: 0 }).map(row => ({ ...row, year: REAL_YEAR }));

// Synthesize prior years by perturbing the real (2029) figures per province,
// since no historical data exists for 2025-2028.
function synthesizeRow(real, year) {
    const population = real.patient_rate > 0 ? (real.patient / real.patient_rate) * 100000 : 0;
    const patient = Math.max(0, Math.round(real.patient * (0.7 + Math.random() * 0.6)));
    const dead = Math.random() < (real.dead > 0 ? 0.4 : 0.1) ? Math.round(Math.random() * 2) : 0;
    const patient_rate = population > 0 ? Math.round((patient / population) * 100000 * 1000) / 1000 : 0;
    const dead_rate = population > 0 ? Math.round((dead / population) * 100000 * 1000) / 1000 : 0;
    const cfr = patient > 0 ? Math.round((dead / patient) * 100 * 1000) / 1000 : 0;
    return { province: real.province, patient, patient_rate, dead, dead_rate, cfr, year };
}

const syntheticRows = realRows.flatMap(real => SYNTHETIC_YEARS.map(year => synthesizeRow(real, year)));
const rows = [...realRows, ...syntheticRows];

writeFileSync(DEST, JSON.stringify(rows, null, 2) + '\n', 'utf-8');
console.log(`Wrote ${rows.length} rows to ${DEST}`);
