// Converts assets/stat.xlsx into backend/data/province_stats.json.
// Run with: node backend/scripts/convert_province_stats.js
import XLSX from 'xlsx';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCE = path.join(__dirname, '..', '..', 'assets', 'stat.xlsx');
const DEST = path.join(__dirname, '..', 'data', 'province_stats.json');

const workbook = XLSX.readFile(SOURCE);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { defval: 0 });

writeFileSync(DEST, JSON.stringify(rows, null, 2) + '\n', 'utf-8');
console.log(`Wrote ${rows.length} rows to ${DEST}`);
