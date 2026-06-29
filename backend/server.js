import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import router from './routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');

const app = express();

// เปิด static file ในโฟลเดอร์ frontend เช่น index.html และ asset อื่น ๆ
app.use(express.static(FRONTEND_DIR));

// นำ route ทั้งหมดจาก backend/routes.js มาใช้งานกับ server หลัก
app.use(router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
