# LINE Bot + AI Health Assistant Workshop

เอกสารนี้เป็นคู่มืออบรมภาษาไทยสำหรับโปรเจ็ค `cmu-workshop-line-ai` โดยใช้แนวทางค่อยๆ สร้างระบบทีละส่วน เพื่อให้ผู้เรียนเข้าใจว่าแต่ละไฟล์และแต่ละฟีเจอร์ถูกเพิ่มเข้ามาเพื่อแก้ปัญหาอะไร

เป้าหมายของโปรเจ็คคือสร้าง LINE Bot ที่สามารถตอบข้อมูลสถิติผู้ป่วยรายจังหวัด ค้นหาข้อมูลผ่าน API แสดงกราฟสรุป และใช้ AI ช่วยอธิบายข้อมูลเป็นภาษาไทยแบบเข้าใจง่าย

> หมายเหตุ: โปรเจ็คนี้ใช้ข้อมูลที่เตรียมไว้แล้วใน `backend/data/province_stats.json` เอกสารนี้จึงไม่สอนขั้นตอนแปลง Excel เป็น JSON

## สิ่งที่จะได้เรียนรู้

- สร้าง Node.js project ด้วย Express
- แยก server, routes, และ business logic ออกจากกัน
- อ่านข้อมูล JSON และสร้าง repository สำหรับค้นหา/filter ข้อมูล
- สร้าง API สำหรับข้อมูลสถิติจังหวัด
- รับ LINE Webhook และตรวจสอบ signature
- ตอบข้อความ LINE ด้วย text, image, และ Flex Message
- ใช้ OpenAI API เพื่ออธิบายข้อมูลสุขภาพเป็นภาษาไทย
- วางโครงสร้างโปรเจ็คให้ต่อยอดได้

## Software ที่ต้องใช้

ก่อนเริ่ม workshop ให้เตรียม software และบัญชีเหล่านี้ให้พร้อม

### Software หลัก

- **Node.js 20 ขึ้นไป** ใช้รัน backend server และติดตั้ง package ผ่าน `npm`
- **npm** มาพร้อมกับ Node.js ใช้ติดตั้ง dependency และรันคำสั่ง `npm start` / `npm run dev`
- **Visual Studio Code** หรือ code editor ที่ถนัด ใช้แก้ไขไฟล์ในโปรเจ็ค
- **REST Client** สำหรับทดสอบ API เช่น VS Code REST Client extension, Postman, Insomnia หรือ Thunder Client
- **Git** ใช้ clone โปรเจ็คและจัดการ version control

### Software หรือบัญชีสำหรับ LINE Bot

- **LINE account** สำหรับทดสอบใช้งาน bot บนมือถือหรือ LINE Desktop
- **LINE Developers account** ใช้สร้าง Messaging API channel
- **LINE Official Account Manager** ใช้จัดการ bot และตั้งค่าการใช้งานบางส่วน
- **Webhook URL แบบ public HTTPS** สำหรับให้ LINE ส่ง event มาที่เครื่องเรา เช่น ngrok, Cloudflare Tunnel หรือ deploy server ขึ้น cloud

ค่าที่ต้องได้จาก LINE Developers:

- `LINE_CHANNEL_SECRET`
- `LINE_CHANNEL_ACCESS_TOKEN`

### Software หรือบัญชีสำหรับ AI

- **OpenAI API key** ใช้เปิดฟีเจอร์ `ai ชื่อจังหวัด ปี`

ค่าที่ต้องเตรียม:

- `OPENAI_API_KEY`
- `OPENAI_MODEL` เช่น `gpt-4.1-mini`

ถ้ายังไม่มี OpenAI API key ระบบยังรันได้ โดย bot จะ fallback เป็นข้อความสถิติธรรมดาแทนคำอธิบายจาก AI

### ตรวจสอบเครื่องก่อนเริ่ม

เช็ค Node.js:

```bash
node -v
```

ควรได้ version `v20` หรือสูงกว่า

เช็ค npm:

```bash
npm -v
```

เช็ค Git:

```bash
git --version
```

## โครงสร้างโปรเจ็คสุดท้าย

```text
cmu-workshop-line-ai/
├── .env.example
├── api.http
├── package.json
├── backend/
│   ├── core.js
│   ├── data/
│   │   └── province_stats.json
│   ├── routes.js
│   └── server.js
└── frontend/
    ├── app.css
    ├── app.js
    └── index.html
```

ไฟล์หลักที่ใช้ในการอบรม:

- `package.json` กำหนด dependency และคำสั่งรันโปรเจ็ค
- `backend/server.js` จุดเริ่มต้นของ Express server
- `backend/routes.js` รวม API routes และ LINE webhook
- `backend/core.js` รวม logic การค้นหาข้อมูล, LINE message, chart, AI และ signature validation
- `backend/data/province_stats.json` ข้อมูลสถิติรายจังหวัดที่เตรียมไว้แล้ว
- `api.http` ตัวอย่าง request สำหรับทดสอบ API

## ขั้นตอนที่ 1: สร้าง Node.js Project

เริ่มจากไฟล์ `package.json`

```json
{
    "name": "cmu-workshop-line-ai",
    "version": "1.0.0",
    "description": "LINE Bot + AI Health Assistant workshop",
    "type": "module",
    "scripts": {
        "start": "node backend/server.js",
        "dev": "node --watch backend/server.js"
    },
    "engines": {
        "node": ">=20"
    },
    "dependencies": {
        "@line/bot-sdk": "^11.0.2",
        "dotenv": "^16.4.0",
        "express": "^4.21.0",
        "openai": "^6.45.0"
    }
}
```

คำอธิบาย:

- `"type": "module"` ทำให้เราใช้ `import` และ `export` ได้
- `express` ใช้สร้าง HTTP server และ API
- `dotenv` ใช้อ่านค่าจากไฟล์ `.env`
- `@line/bot-sdk` ใช้ส่งข้อความกลับไปยัง LINE
- `openai` ใช้เรียก OpenAI API
- `npm start` ใช้รัน server แบบปกติ
- `npm run dev` ใช้รัน server แบบ watch เมื่อแก้ไฟล์แล้ว restart ให้อัตโนมัติ

ติดตั้ง dependency:

```bash
npm install
```

## ขั้นตอนที่ 2: เตรียม Environment Variables

สร้างไฟล์ `.env` โดยอ้างอิงจาก `.env.example`

```env
PORT=3001
LINE_CHANNEL_SECRET=
LINE_CHANNEL_ACCESS_TOKEN=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
```

คำอธิบาย:

- `PORT` คือ port ที่ Express server จะเปิดใช้งาน
- `LINE_CHANNEL_SECRET` ใช้ตรวจสอบว่า webhook มาจาก LINE จริง
- `LINE_CHANNEL_ACCESS_TOKEN` ใช้ส่งข้อความตอบกลับผู้ใช้ใน LINE
- `OPENAI_API_KEY` ใช้เรียก OpenAI API
- `OPENAI_MODEL` ระบุ model ที่จะใช้สร้างคำอธิบาย

ในช่วงแรกยังไม่ต้องใส่ LINE และ OpenAI key ก็ได้ เพราะเราจะเริ่มจาก API ในเครื่องก่อน

## ขั้นตอนที่ 3: สร้าง Express Server แบบง่ายที่สุด

สร้างไฟล์ `backend/server.js`

```js
import 'dotenv/config';
import express from 'express';

const app = express();

app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
```

คำอธิบาย:

- `import 'dotenv/config'` โหลดค่าจาก `.env` เข้า `process.env`
- `express()` สร้าง app server
- `/health` เป็น endpoint ง่ายๆ สำหรับตรวจว่า server ทำงาน
- `app.listen` เปิด server ตาม port ที่กำหนด

รัน server:

```bash
npm run dev
```

ทดสอบด้วย browser หรือ REST client:

```http
GET http://localhost:3001/health
```

ผลลัพธ์ที่ควรได้:

```json
{
    "status": "ok"
}
```

## ขั้นตอนที่ 4: แยก Router ออกจาก Server

เมื่อ endpoint เริ่มเยอะขึ้น เราควรแยก route ออกไปอยู่ใน `backend/routes.js`

สร้างไฟล์ `backend/routes.js`

```js
import express from 'express';

const router = express.Router();

router.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'healthline-ai' });
});

export default router;
```

แล้วปรับ `backend/server.js`

```js
import 'dotenv/config';
import express from 'express';
import router from './routes.js';

const app = express();
app.use(router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
```

คำอธิบาย:

- `routes.js` รับผิดชอบ endpoint ทั้งหมด
- `server.js` รับผิดชอบเปิด server และ mount router
- การแยกไฟล์แบบนี้ทำให้โปรเจ็คอ่านง่ายขึ้นเมื่อระบบโตขึ้น

## ขั้นตอนที่ 5: Serve หน้า Frontend

โปรเจ็คนี้มีโฟลเดอร์ `frontend/` สำหรับไฟล์ static เช่น HTML, CSS และ JavaScript

ปรับ `backend/server.js` ให้ serve static file:

```js
import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import router from './routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');

const app = express();
app.use(express.static(FRONTEND_DIR));
app.use(router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
```

คำอธิบาย:

- ใน ES Module ไม่มี `__dirname` มาให้เหมือน CommonJS จึงต้องสร้างจาก `fileURLToPath(import.meta.url)`
- `express.static(FRONTEND_DIR)` ทำให้เปิด `frontend/index.html` ผ่าน browser ได้
- เมื่อเข้า `http://localhost:3001/` จะเห็นหน้า frontend

ตัวอย่าง `frontend/index.html` ขั้นต้น:

```html
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
</head>

<body>
  hello world
</body>

</html>
```

## ขั้นตอนที่ 6: ทำความเข้าใจข้อมูลจังหวัด

ข้อมูลหลักอยู่ที่ `backend/data/province_stats.json`

ตัวอย่างข้อมูล 1 record:

```json
{
    "province": "เชียงราย",
    "patient": 3442,
    "patient_rate": 265.402,
    "dead": 0,
    "dead_rate": 0,
    "cfr": 0,
    "year": 2029
}
```

ความหมายของ field:

- `province` ชื่อจังหวัด
- `patient` จำนวนผู้ป่วย
- `patient_rate` อัตราผู้ป่วยต่อแสนประชากร
- `dead` จำนวนผู้เสียชีวิต
- `dead_rate` อัตราผู้เสียชีวิต
- `cfr` อัตราป่วยตาย
- `year` ปีของข้อมูล

## ขั้นตอนที่ 7: สร้าง Repository สำหรับอ่านข้อมูล

สร้างไฟล์ `backend/core.js` แล้วเริ่มจาก class สำหรับอ่าน JSON

```js
import { readFileSync } from 'fs';

export class ProvinceStatsRepository {
    constructor(path) {
        this.items = JSON.parse(readFileSync(path, 'utf-8'));
        this.defaultYear = Math.max(...this.items.map(item => item.year));
    }
}
```

คำอธิบาย:

- `readFileSync` อ่านไฟล์ JSON จาก disk
- `JSON.parse` แปลง JSON string เป็น JavaScript object
- `defaultYear` ใช้ปีล่าสุดในข้อมูลเป็นค่าเริ่มต้น

## ขั้นตอนที่ 8: เพิ่มการค้นหาจังหวัด

เพิ่ม method `findByProvince`

```js
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
}
```

คำอธิบาย:

- `name.trim().toLowerCase()` ทำให้ค้นหาง่ายขึ้น
- ถ้าไม่ส่ง `year` จะคืนข้อมูลทุกปีของจังหวัดนั้น
- ถ้าส่ง `year` จะคืน record ของปีนั้นปีเดียว
- ถ้าไม่พบข้อมูล จะคืน `null`

ตัวอย่างแนวคิด:

- `findByProvince('เชียงราย')` ได้ข้อมูลเชียงรายทุกปี
- `findByProvince('เชียงราย', 2026)` ได้ข้อมูลเชียงรายปี 2026

## ขั้นตอนที่ 9: เพิ่มการ Query และ Filter ข้อมูล

เพิ่ม field ที่อนุญาตให้ filter/sort ได้

```js
const PROVINCE_RATE_FIELDS = ['patient', 'patient_rate', 'dead', 'dead_rate', 'cfr'];
```

เพิ่ม method `query`

```js
query({ field = 'patient_rate', min, max, year = this.defaultYear } = {}) {
    const rateField = PROVINCE_RATE_FIELDS.includes(field) ? field : 'patient_rate';
    return this.items
        .filter(item => item.year === year)
        .filter(item => (min === undefined || item[rateField] >= min) && (max === undefined || item[rateField] <= max))
        .sort((a, b) => b[rateField] - a[rateField]);
}
```

คำอธิบาย:

- `field` เลือกว่าจะ sort/filter ด้วย field ใด
- ถ้า field ไม่ถูกต้อง จะ fallback เป็น `patient_rate`
- `min` และ `max` ใช้กรองช่วงค่า
- `year` ถ้าไม่ส่งมา จะใช้ปีล่าสุด
- ผลลัพธ์ถูก sort จากค่ามากไปน้อย

## ขั้นตอนที่ 10: ต่อ Repository เข้ากับ API

ปรับ `backend/routes.js` ให้สร้าง service จาก repository

```js
import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import { ProvinceStatsRepository } from './core.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let _services = null;
function services() {
    if (!_services) {
        const provinceStats = new ProvinceStatsRepository(path.join(__dirname, 'data/province_stats.json'));
        _services = { provinceStats };
    }
    return _services;
}

const router = express.Router();
```

คำอธิบาย:

- ใช้ `path.join(__dirname, 'data/province_stats.json')` เพื่อชี้ไปยังไฟล์ข้อมูล
- `_services` เป็น lazy initialization สร้างครั้งแรกเมื่อมี request เข้ามา
- การสร้าง service แบบนี้ทำให้ route เรียกใช้ repository ได้ง่าย

## ขั้นตอนที่ 11: เพิ่ม API `/api/provinces`

เพิ่ม helper สำหรับส่งข้อมูลจังหวัด:

```js
function sendProvince(res, provinceStats, name, year) {
    const match = provinceStats.findByProvince(name, year);
    return match ? res.json(match) : res.status(404).json({ error: 'province not found' });
}
```

เพิ่ม route สำหรับ query ข้อมูล:

```js
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
```

เพิ่ม route สำหรับค้นหาจังหวัดจาก path:

```js
router.get('/api/provinces/:province', (req, res) => {
    const { provinceStats } = services();
    const { year } = req.query;
    sendProvince(res, provinceStats, req.params.province, year !== undefined ? Number(year) : undefined);
});
```

ตัวอย่าง request:

```http
GET http://localhost:3001/api/provinces
```

```http
GET http://localhost:3001/api/provinces?year=2026
```

```http
GET http://localhost:3001/api/provinces?province=เชียงราย&year=2026
```

```http
GET http://localhost:3001/api/provinces/เชียงราย
```

```http
GET http://localhost:3001/api/provinces?field=patient_rate&min=500
```

Lab ย่อย:

- ลองเปลี่ยน `field` เป็น `patient`
- ลองใส่ `min` และ `max`
- ลองค้นหาจังหวัดที่ไม่มีในข้อมูล แล้วดู response 404

## ขั้นตอนที่ 12: เตรียม Helper สำหรับ LINE Text Reply

ใน `backend/core.js` เพิ่ม helper สำหรับสร้าง payload แบบ text

```js
function textReply(text) {
    return { type: 'text', text };
}
```

เพิ่ม function สำหรับ format ข้อมูลจังหวัด 1 record:

```js
function formatRecord({ province, year, patient, patient_rate, dead, dead_rate, cfr }) {
    return `จังหวัด${province} ปี ${year}\n` +
        `ผู้ป่วย: ${patient.toLocaleString()} คน (อัตรา ${patient_rate} ต่อแสนประชากร)\n` +
        `เสียชีวิต: ${dead.toLocaleString()} คน (อัตรา ${dead_rate})\n` +
        `CFR: ${cfr}%`;
}
```

เพิ่ม function สำหรับ format ข้อมูลหลายปี:

```js
function formatRecords(records) {
    const province = records[0].province;
    const lines = records.map(r => `ปี ${r.year}: ผู้ป่วย ${r.patient.toLocaleString()} คน (อัตรา ${r.patient_rate})`);
    return `จังหวัด${province}\n${lines.join('\n')}`;
}
```

คำอธิบาย:

- LINE Bot จะส่งข้อความกลับเป็น plain text ได้ง่ายที่สุด
- เราแยก format function ออกมาเพื่อให้ logic อ่านง่าย
- `toLocaleString()` ช่วยใส่ comma ให้ตัวเลข เช่น `3,442`

## ขั้นตอนที่ 13: Parse ข้อความจากผู้ใช้

เพิ่ม function สำหรับอ่านข้อความที่ผู้ใช้พิมพ์ เช่น `เชียงราย 2026`

```js
function parseQuery(text) {
    const match = text.trim().match(/^(.+?)\s+(\d{4})$/);
    if (match) return { province: match[1].trim(), year: Number(match[2]) };
    return { province: text.trim(), year: undefined };
}
```

คำอธิบาย:

- ถ้าข้อความลงท้ายด้วยปี 4 หลัก จะถือว่าเป็นการค้นหาแบบระบุปี
- ถ้าไม่มีปี จะถือว่าเป็นการค้นหาทุกปีของจังหวัดนั้น

ตัวอย่าง:

- `เชียงราย 2026` ได้ `{ province: 'เชียงราย', year: 2026 }`
- `เชียงราย` ได้ `{ province: 'เชียงราย', year: undefined }`

## ขั้นตอนที่ 14: สร้าง LineService เริ่มต้น

เพิ่ม class `LineService` ใน `backend/core.js`

```js
export class LineService {
    constructor(accessToken, provinceStats) {
        this.accessToken = accessToken;
        this.provinceStats = provinceStats;
    }

    async respond(text) {
        const { province, year } = parseQuery(text);
        const result = this.provinceStats.findByProvince(province, year);
        if (!result) {
            const suffix = year !== undefined ? ` ปี ${year}` : '';
            return textReply(`ไม่พบข้อมูลจังหวัด "${province}"${suffix}`);
        }
        return textReply(Array.isArray(result) ? formatRecords(result) : formatRecord(result));
    }
}
```

คำอธิบาย:

- `LineService` รับข้อความจากผู้ใช้ แล้วตัดสินใจว่าจะตอบอะไร
- ในขั้นแรก เรารองรับแค่การพิมพ์ชื่อจังหวัด หรือชื่อจังหวัดตามด้วยปี
- method `respond` ยังไม่ส่งข้อความเข้า LINE จริง แค่สร้าง payload สำหรับตอบกลับ

## ขั้นตอนที่ 15: เพิ่ม LINE SDK สำหรับ Reply Message

เพิ่ม import:

```js
import * as line from '@line/bot-sdk';
```

เพิ่ม method `reply` ใน `LineService`

```js
async reply(replyToken, payload) {
    if (!this.accessToken) return;
    const client = new line.messagingApi.MessagingApiClient({ channelAccessToken: this.accessToken });
    const messages = [{ type: 'text', text: payload.text }];
    await client.replyMessage({ replyToken, messages });
}
```

คำอธิบาย:

- `replyToken` ได้มาจาก LINE webhook event
- `accessToken` ใช้ยืนยันสิทธิ์การส่งข้อความกลับ LINE
- ถ้าไม่มี `accessToken` function จะ return ทันที เพื่อให้ทดสอบในเครื่องได้โดยไม่ error

## ขั้นตอนที่ 16: ตรวจสอบ LINE Signature

LINE webhook ควรตรวจสอบ signature ก่อนเชื่อถือข้อมูลที่ส่งมา

เพิ่ม import:

```js
import { createHmac, timingSafeEqual } from 'crypto';
```

เพิ่ม function:

```js
export function validSignature(rawBody, signature, secret) {
    const expected = Buffer.from(createHmac('sha256', secret).update(rawBody).digest('base64'));
    const actual = Buffer.from(signature);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
}
```

คำอธิบาย:

- LINE จะส่ง header `x-line-signature` มาด้วย
- เราสร้าง HMAC จาก raw body และ channel secret
- ใช้ `timingSafeEqual` เพื่อลดความเสี่ยงจาก timing attack
- ต้องใช้ raw body เพราะถ้า parse JSON ก่อน signature อาจไม่ตรง

## ขั้นตอนที่ 17: เพิ่ม LINE Webhook Route

ปรับ `backend/routes.js` ให้ import `LineService` และ `validSignature`

```js
import { ProvinceStatsRepository, LineService, validSignature } from './core.js';
```

อ่านค่า environment:

```js
const {
    LINE_CHANNEL_SECRET = '',
    LINE_CHANNEL_ACCESS_TOKEN = '',
} = process.env;
```

เพิ่ม `LineService` เข้า service:

```js
_services = {
    provinceStats,
    line: new LineService(LINE_CHANNEL_ACCESS_TOKEN, provinceStats),
};
```

เพิ่ม webhook route:

```js
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
            }
        }
    } catch (err) {
        console.error('webhook event handling failed', err);
    }
    res.send('OK');
});
```

คำอธิบาย flow:

1. LINE ส่ง event มาที่ `/webhook`
2. Server ตรวจ signature
3. Server parse JSON body
4. วนอ่าน events
5. ถ้าเป็น text message จะเรียก `line.respond`
6. ส่งผลลัพธ์กลับด้วย `line.reply`

## ขั้นตอนที่ 18: เพิ่มข้อความ Help และ Menu

เพิ่มข้อความแนะนำใน `backend/core.js`

```js
const HELP_TEXT =
    'พิมพ์ชื่อจังหวัด เพื่อดูข้อมูลผู้ป่วยทุกปีที่มี เช่น "เชียงราย"\n' +
    'หรือพิมพ์ชื่อจังหวัดตามด้วยปี เพื่อดูข้อมูลปีนั้น เช่น "เชียงราย 2026"\n' +
    'หรือพิมพ์ "สรุปข้อมูล ชื่อจังหวัด" เพื่อดูกราฟสรุป เช่น "สรุปข้อมูล เชียงราย"\n' +
    'หรือพิมพ์ "เลือกจังหวัด" เพื่อเลือกจังหวัดและปีจากเมนู\n' +
    'หรือพิมพ์ "ai ชื่อจังหวัด ปี" ให้ AI อธิบายข้อมูลเป็นภาษาที่เข้าใจง่าย เช่น "ai เชียงราย 2026"';
```

เพิ่มเงื่อนไขใน `respond`

```js
async respond(text) {
    const normalized = text.trim().toLowerCase();
    if (['help', 'ช่วยเหลือ', 'วิธีใช้งาน'].includes(normalized)) return textReply(HELP_TEXT);

    const { province, year } = parseQuery(text);
    const result = this.provinceStats.findByProvince(province, year);
    if (!result) {
        const suffix = year !== undefined ? ` ปี ${year}` : '';
        return textReply(`ไม่พบข้อมูลจังหวัด "${province}"${suffix}\n\n${HELP_TEXT}`);
    }
    return textReply(Array.isArray(result) ? formatRecords(result) : formatRecord(result));
}
```

คำอธิบาย:

- ผู้ใช้พิมพ์ `help` เพื่อดูวิธีใช้งานได้
- เมื่อค้นหาไม่เจอ ระบบแนบ help text เพื่อให้ผู้ใช้รู้ว่าควรพิมพ์อย่างไร

## ขั้นตอนที่ 19: เพิ่ม Flex Message เมนูหลัก

Flex Message คือรูปแบบ UI ที่ LINE แสดงเป็น card, ปุ่ม, list และ layout ต่างๆ ได้

เพิ่ม helper:

```js
function flex(altText, contents) {
    return { type: 'flex', altText, contents };
}
```

เพิ่ม function สำหรับแถวปุ่ม:

```js
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
```

เพิ่มเมนูหลัก:

```js
export function menuFlex() {
    return flex('เมนู HealthLine Stats', {
        type: 'bubble',
        styles: { header: { backgroundColor: '#0C5C4C' } },
        header: {
            type: 'box', layout: 'vertical', paddingAll: '20px', contents: [
                { type: 'text', text: 'HEALTHLINE STATS', color: '#BDF5D8', size: 'xs', weight: 'bold' },
                { type: 'text', text: 'สถิติผู้ป่วยรายจังหวัด', color: '#FFFFFF', size: 'xl', weight: 'bold', margin: 'sm' },
            ],
        },
        body: {
            type: 'box', layout: 'vertical', spacing: 'md', contents: [
                { type: 'text', text: 'เลือกหัวข้อ หรือพิมพ์ชื่อจังหวัดได้เลย', wrap: true, color: '#40544D' },
                actionRow('เลือกจังหวัด', 'เลือกจังหวัด', '#E7F7EE'),
                actionRow('สรุปข้อมูล', 'สรุปข้อมูล', '#FFF0D9'),
                actionRow('ถาม AI', 'ai', '#E9F0FF'),
            ],
        },
    });
}
```

เพิ่มใน `respond`:

```js
if (['เมนู', 'menu'].includes(normalized)) return menuFlex();
```

ปรับ `reply` ให้ส่ง Flex Message ได้:

```js
async reply(replyToken, payload) {
    if (!this.accessToken) return;
    const client = new line.messagingApi.MessagingApiClient({ channelAccessToken: this.accessToken });
    let messages;
    if (payload.type === 'flex') {
        messages = [{ type: 'flex', altText: payload.altText, contents: payload.contents }];
    } else {
        messages = [{ type: 'text', text: payload.text }];
    }
    await client.replyMessage({ replyToken, messages });
}
```

Lab ย่อย:

- ลองเปลี่ยนสีปุ่ม
- ลองเปลี่ยนข้อความในเมนู
- ลองเพิ่มปุ่มใหม่ เช่น `help`

## ขั้นตอนที่ 20: เพิ่มเมนูเลือกจังหวัดและเลือกปี

เพิ่มค่าคงที่:

```js
const PICK_PROVINCE_KEYWORDS = ['เลือกจังหวัด', 'กรองข้อมูล', 'pick', 'filter'];
const PICK_YEAR_PREFIX = 'เลือกปี';
const CURATED_PROVINCES = ['เชียงราย', 'เชียงใหม่', 'กรุงเทพมหานคร', 'ชลบุรี', 'นครราชสีมา', 'ขอนแก่น'];
const ALL_YEARS_LABEL = 'ทุกปี';
const YEAR_CHOICES = [2025, 2026, 2027, 2028, 2029];
```

เพิ่ม helper สำหรับ match keyword ที่มีข้อความต่อท้าย:

```js
function matchPrefixed(text, keywords) {
    const match = text.trim().match(new RegExp(`^(?:${keywords.join('|')})\\s+(.+)$`, 'i'));
    return match ? match[1].trim() : null;
}
```

เพิ่ม list flex:

```js
function listFlex(title, subtitle, rows) {
    return flex(title, {
        type: 'bubble',
        header: {
            type: 'box', layout: 'vertical', contents: [
                { type: 'text', text: title, size: 'xl', weight: 'bold', color: '#0C5C4C' },
                { type: 'text', text: subtitle, size: 'xs', color: '#40544D', margin: 'sm' },
            ],
        },
        body: { type: 'box', layout: 'vertical', spacing: 'sm', contents: rows },
    });
}
```

เพิ่มเมนูเลือกจังหวัด:

```js
export function provinceListFlex() {
    const rows = CURATED_PROVINCES.map(province =>
        actionRow(province, `${PICK_YEAR_PREFIX} ${province}`, '#E7F7EE'));
    return listFlex('เลือกจังหวัด', 'หรือพิมพ์ชื่อจังหวัดอื่นได้เลย', rows);
}
```

เพิ่มเมนูเลือกปี:

```js
export function yearListFlex(province) {
    const rows = [
        ...YEAR_CHOICES.map(year => actionRow(String(year), `${province} ${year}`, '#FFF6EA')),
        actionRow(ALL_YEARS_LABEL, province, '#E9F0FF'),
    ];
    return listFlex('เลือกปี', `จังหวัด${province}`, rows);
}
```

เพิ่ม logic ใน `respond`:

```js
if (PICK_PROVINCE_KEYWORDS.includes(normalized)) return provinceListFlex();

const pickYearProvince = matchPrefixed(text, [PICK_YEAR_PREFIX]);
if (pickYearProvince !== null) {
    const exists = this.provinceStats.findByProvince(pickYearProvince);
    if (!exists) return textReply(`ไม่พบข้อมูลจังหวัด "${pickYearProvince}"\n\n${HELP_TEXT}`);
    return yearListFlex(pickYearProvince);
}
```

คำอธิบาย:

- ผู้ใช้พิมพ์ `เลือกจังหวัด` เพื่อเห็นรายการจังหวัดที่เลือกบ่อย
- เมื่อกดจังหวัด ระบบส่งข้อความ `เลือกปี เชียงราย`
- Bot ตอบกลับเป็นเมนูปี
- เมื่อกดปี ระบบส่งข้อความ `เชียงราย 2026` ซึ่ง reuse logic ค้นหาจังหวัดเดิมได้

## ขั้นตอนที่ 21: เพิ่ม Chart Image

เพิ่ม keyword:

```js
const CHART_PROMPT = 'พิมพ์ชื่อจังหวัดที่ต้องการดูกราฟสรุปข้อมูล เช่น "สรุปข้อมูล เชียงราย"';
const CHART_KEYWORDS = ['สรุปข้อมูล', 'chart', 'summary'];
```

เพิ่ม parser:

```js
function parseChartQuery(text) {
    const rest = matchPrefixed(text, CHART_KEYWORDS);
    return rest ? rest.replace(/\s+\d{4}$/, '') : null;
}
```

เพิ่ม function สร้าง chart image:

```js
function provinceChartImage(records) {
    const province = records[0].province;
    const config = {
        type: 'bar',
        data: {
            labels: records.map(r => String(r.year)),
            datasets: [{ label: 'ผู้ป่วย (คน)', data: records.map(r => r.patient), backgroundColor: '#20A475' }],
        },
        options: {
            plugins: {
                title: { display: true, text: `สรุปข้อมูลจังหวัด${province}` },
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
        altText: `สรุปข้อมูลจังหวัด${province}`,
        caption: `สรุปข้อมูลจังหวัด${province} (${records[0].year}-${records[records.length - 1].year})`,
    };
}
```

เพิ่ม logic ใน `respond`:

```js
if (CHART_KEYWORDS.includes(normalized)) return textReply(CHART_PROMPT);

const chartProvince = parseChartQuery(text);
if (chartProvince !== null) {
    const records = this.provinceStats.findByProvince(chartProvince);
    if (!records) return textReply(`ไม่พบข้อมูลจังหวัด "${chartProvince}"\n\n${HELP_TEXT}`);
    return provinceChartImage(records);
}
```

ปรับ `reply` ให้ส่ง image ได้:

```js
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
```

คำอธิบาย:

- QuickChart รับ config ของ Chart.js ผ่าน URL
- Bot ส่งกลับเป็น image message
- แล้วส่ง caption เป็น text อีก 1 ข้อความ

## ขั้นตอนที่ 22: เพิ่ม OpenAI สำหรับอธิบายข้อมูล

เพิ่ม import:

```js
import OpenAI from 'openai';
```

เพิ่ม keyword และ prompt:

```js
const AI_KEYWORDS = ['ai', 'ถามai', 'ถาม ai'];
const AI_PROMPT = 'พิมพ์ "ai ชื่อจังหวัด ปี" เพื่อให้ AI อธิบายข้อมูลเป็นภาษาที่เข้าใจง่าย เช่น "ai เชียงราย 2026"';
```

เพิ่ม parser:

```js
function parseAiQuery(text) {
    const rest = matchPrefixed(text, AI_KEYWORDS);
    const match = rest && rest.match(/^(.+?)\s+(\d{4})$/);
    return match ? { province: match[1].trim(), year: Number(match[2]) } : null;
}
```

เพิ่ม function เรียก OpenAI:

```js
async function aiExplain(record, { apiKey, model }) {
    const fallback = formatRecord(record);
    if (!apiKey) return fallback;
    try {
        const client = new OpenAI({ apiKey, fetch: globalThis.fetch });
        const response = await client.responses.create({
            model,
            instructions:
                'คุณคือผู้ช่วยอธิบายสถิติโรคติดต่อภาษาไทย ใช้เฉพาะข้อมูลที่ให้มาเท่านั้น ' +
                'อธิบายเป็นประโยคสั้นๆ 1-2 ประโยค ภาษาที่เข้าใจง่าย ห้ามแต่งตัวเลขเพิ่มหรือวินิจฉัยใดๆ ' +
                'ใช้ปี ค.ศ. ตามที่ระบุไว้เป๊ะๆ ห้ามแปลงเป็นปี พ.ศ. หรือเปลี่ยนตัวเลขปี',
            input:
                `ข้อมูล: จังหวัด${record.province} ปี ${record.year} ผู้ป่วย ${record.patient} คน ` +
                `(อัตรา ${record.patient_rate} ต่อแสนประชากร) เสียชีวิต ${record.dead} คน (อัตรา ${record.dead_rate}) CFR ${record.cfr}%`,
        });
        return response.output_text.trim();
    } catch (err) {
        console.error('OpenAI request failed; using local fallback', err.message);
        return fallback;
    }
}
```

ปรับ constructor ของ `LineService`:

```js
constructor(accessToken, provinceStats, { apiKey = '', model = 'gpt-4.1-mini' } = {}) {
    this.accessToken = accessToken;
    this.provinceStats = provinceStats;
    this.apiKey = apiKey;
    this.model = model;
}
```

เพิ่ม logic ใน `respond`:

```js
if (AI_KEYWORDS.includes(normalized)) return textReply(AI_PROMPT);

if (matchPrefixed(text, AI_KEYWORDS) !== null) {
    const aiQuery = parseAiQuery(text);
    if (!aiQuery) return textReply(AI_PROMPT);
    const record = this.provinceStats.findByProvince(aiQuery.province, aiQuery.year);
    if (!record || Array.isArray(record)) {
        return textReply(`ไม่พบข้อมูลจังหวัด "${aiQuery.province}" ปี ${aiQuery.year}\n\n${AI_PROMPT}`);
    }
    return textReply(await aiExplain(record, { apiKey: this.apiKey, model: this.model }));
}
```

ปรับ `backend/routes.js` ให้อ่านค่า OpenAI:

```js
const {
    LINE_CHANNEL_SECRET = '',
    LINE_CHANNEL_ACCESS_TOKEN = '',
    OPENAI_API_KEY = '',
    OPENAI_MODEL = 'gpt-4.1-mini',
} = process.env;
```

และส่งค่าเข้า `LineService`:

```js
line: new LineService(LINE_CHANNEL_ACCESS_TOKEN, provinceStats, { apiKey: OPENAI_API_KEY, model: OPENAI_MODEL }),
```

คำอธิบาย:

- ถ้าไม่มี `OPENAI_API_KEY` ระบบจะ fallback เป็นข้อความสถิติธรรมดา
- prompt จำกัดให้ AI ใช้เฉพาะข้อมูลที่ส่งให้
- prompt ห้ามแต่งตัวเลขเพิ่ม
- prompt บังคับให้ใช้ปี ค.ศ. ตามข้อมูล ไม่แปลงเป็น พ.ศ.

## ขั้นตอนที่ 23: รองรับ Event ตอนผู้ใช้ Follow Bot

ใน LINE เมื่อผู้ใช้เพิ่ม bot เป็นเพื่อน จะได้ event type `follow`

เพิ่มใน webhook loop:

```js
for (const event of payload.events || []) {
    if (event.type === 'message' && event.message?.type === 'text') {
        await line.reply(event.replyToken, await line.respond(event.message.text));
    } else if (event.type === 'follow') {
        await line.reply(event.replyToken, await line.respond('เมนู'));
    }
}
```

คำอธิบาย:

- เมื่อผู้ใช้ follow bot ครั้งแรก ระบบจะตอบเมนูหลักทันที
- ช่วยให้ผู้ใช้รู้ว่าควรเริ่มใช้งานอย่างไร

## ขั้นตอนที่ 24: ทดสอบ API ด้วย `api.http`

ตัวอย่างไฟล์ `api.http`

```http
@host = http://localhost:3000

### Health check
GET {{host}}/health

### List provinces filtered by field + range
GET {{host}}/api/provinces?field=patient_rate&min=500

### List provinces for a specific year
GET {{host}}/api/provinces?year=2026

### Look up a single province by query param for a specific year
GET {{host}}/api/provinces?province=เชียงราย&year=2026

### Look up a single province by path param
GET {{host}}/api/provinces/เชียงราย
```

ถ้าใน `.env` ใช้ `PORT=3001` ให้เปลี่ยน host:

```http
@host = http://localhost:3001
```

Lab ย่อย:

- เพิ่ม request สำหรับ `field=patient`
- เพิ่ม request สำหรับ `max=300`
- เพิ่ม request สำหรับจังหวัดอื่น

## ขั้นตอนที่ 25: คำสั่งที่ Bot รองรับ

เมื่อระบบสมบูรณ์ ผู้ใช้สามารถพิมพ์ข้อความเหล่านี้ใน LINE ได้:

```text
เมนู
```

แสดงเมนูหลักแบบ Flex Message

```text
help
```

แสดงวิธีใช้งาน

```text
เชียงราย
```

แสดงข้อมูลจังหวัดเชียงรายทุกปี

```text
เชียงราย 2026
```

แสดงข้อมูลจังหวัดเชียงรายปี 2026

```text
เลือกจังหวัด
```

แสดงเมนูเลือกจังหวัด

```text
สรุปข้อมูล เชียงราย
```

แสดงกราฟสรุปข้อมูลหลายปี

```text
ai เชียงราย 2026
```

ให้ AI อธิบายข้อมูลเชียงรายปี 2026 เป็นภาษาไทย

## ขั้นตอนที่ 26: โค้ดสุดท้ายของ `backend/server.js`

```js
import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import router from './routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');

const app = express();
app.use(express.static(FRONTEND_DIR));
app.use(router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
```

## ขั้นตอนที่ 27: โค้ดสุดท้ายของ `backend/routes.js`

```js
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
```

## ขั้นตอนที่ 28: โครงสร้างสุดท้ายของ `backend/core.js`

ไฟล์ `backend/core.js` สุดท้ายประกอบด้วยส่วนหลักเหล่านี้:

1. import dependency
2. `ProvinceStatsRepository`
3. helper สำหรับ format ข้อความ
4. parser สำหรับอ่านข้อความผู้ใช้
5. OpenAI explanation
6. QuickChart image
7. LINE Flex Message
8. `LineService`
9. `validSignature`

เนื่องจากไฟล์นี้ยาวกว่าไฟล์อื่น ในการอบรมควรให้ผู้เรียนค่อยๆ เติมตามขั้นตอนที่ 7-23 แทนการวางทั้งไฟล์ตั้งแต่ต้น

## ขั้นตอนที่ 29: Troubleshooting

ปัญหา: เปิด server ไม่ได้

วิธีตรวจ:

- ตรวจว่าใช้ Node.js 20+
- รัน `npm install` แล้วหรือยัง
- ตรวจว่า port ซ้ำหรือไม่

ปัญหา: เรียก `/health` ไม่ได้

วิธีตรวจ:

- ดูว่า server รันอยู่หรือไม่
- ตรวจ `PORT` ใน `.env`
- ตรวจ URL เช่น `http://localhost:3001/health`

ปัญหา: ค้นหาจังหวัดไม่เจอ

วิธีตรวจ:

- ตรวจชื่อจังหวัดใน `backend/data/province_stats.json`
- ลองค้นหาด้วย path เช่น `/api/provinces/เชียงราย`
- ตรวจว่า `year` ที่ส่งมีอยู่จริงหรือไม่

ปัญหา: LINE webhook ได้ `Bad Request`

วิธีตรวจ:

- ตรวจ `LINE_CHANNEL_SECRET`
- ตรวจว่า webhook URL ตรงกับ server จริง
- ต้องส่ง raw body เข้า signature validation

ปัญหา: Bot ไม่ตอบกลับใน LINE

วิธีตรวจ:

- ตรวจ `LINE_CHANNEL_ACCESS_TOKEN`
- ตรวจ console ว่ามี error จาก LINE SDK หรือไม่
- ตรวจว่า event มี `replyToken`

ปัญหา: AI ไม่ตอบเป็นคำอธิบาย

วิธีตรวจ:

- ตรวจ `OPENAI_API_KEY`
- ตรวจ `OPENAI_MODEL`
- ถ้าไม่มี API key ระบบจะ fallback เป็นข้อความสถิติธรรมดา

ปัญหา: กราฟไม่ขึ้น

วิธีตรวจ:

- ตรวจว่า LINE เปิด URL จาก `quickchart.io` ได้
- ตรวจว่าจังหวัดนั้นมีข้อมูลหลายปี

## ขั้นตอนที่ 30: แบบฝึกหัดต่อยอด

แบบฝึกหัด 1: เพิ่มคำสั่ง `top 5`

แนวคิด:

- ถ้าผู้ใช้พิมพ์ `top 5`
- เรียก `provinceStats.query({ field: 'patient_rate' })`
- เลือก 5 จังหวัดแรก
- format เป็นข้อความตอบกลับ

แบบฝึกหัด 2: เพิ่มจังหวัดในเมนู

แก้ค่า:

```js
const CURATED_PROVINCES = ['เชียงราย', 'เชียงใหม่', 'กรุงเทพมหานคร', 'ชลบุรี', 'นครราชสีมา', 'ขอนแก่น'];
```

แบบฝึกหัด 3: เพิ่ม field สำหรับ sort

ลองให้ผู้ใช้พิมพ์:

```text
เรียงตาม patient
```

แล้วให้ระบบตอบจังหวัดที่มีจำนวนผู้ป่วยสูงสุด

แบบฝึกหัด 4: ปรับ prompt ของ AI

ลองให้ AI ตอบในรูปแบบ:

- ภาษาง่ายสำหรับประชาชนทั่วไป
- ภาษาเชิงวิชาการสำหรับเจ้าหน้าที่
- สรุปเป็น bullet สั้นๆ

แบบฝึกหัด 5: ทำหน้า Dashboard

ใช้ `frontend/index.html`, `frontend/app.js`, และ `frontend/app.css` เรียก `/api/provinces` แล้วแสดงเป็นตารางหรือกราฟใน browser

## สรุป Architecture

ภาพรวมการทำงาน:

```text
ผู้ใช้ LINE
   ↓
LINE Platform
   ↓ webhook
POST /webhook
   ↓
routes.js
   ↓
LineService.respond()
   ↓
ProvinceStatsRepository
   ↓
backend/data/province_stats.json
   ↓
ตอบกลับ LINE ด้วย text / flex / image / AI explanation
```

ส่วน API สำหรับทดสอบในเครื่อง:

```text
Browser หรือ REST Client
   ↓
GET /api/provinces
   ↓
routes.js
   ↓
ProvinceStatsRepository.query()
   ↓
backend/data/province_stats.json
   ↓
JSON response
```

หลังจบ workshop ผู้เรียนควรเข้าใจว่า Express server รับ request อย่างไร, LINE webhook ทำงานอย่างไร, ข้อมูล JSON ถูกอ่านและค้นหาอย่างไร และ OpenAI ถูกนำมาใช้เพื่อช่วยอธิบายข้อมูลให้เข้าใจง่ายขึ้นอย่างไร
