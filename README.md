# CMU HealthLine AI Workshop

โปรเจกต์สำหรับการอบรม **การพัฒนา LINE Bot และ Large Language Models (LLMs) สำหรับงานด้านสาธารณสุข** วันที่ 1–2 กรกฎาคม 2569

คู่มือนี้สอนสร้างโปรเจกต์นี้ตั้งแต่ศูนย์ ไปทีละขั้นจนได้ LINE Bot ที่ตอบสถิติผู้ป่วยรายจังหวัด คุยกับ ChatGPT (OpenAI) ส่งกราฟเป็นรูปภาพ และมี Rich Menu ให้กดใช้งานง่าย

> โปรเจกต์นี้ให้ข้อมูลเพื่อการเรียนรู้และสุขศึกษา ไม่ใช่การวินิจฉัยหรือคำแนะนำแทนแพทย์ หากมีอาการฉุกเฉินให้โทร 1669

## วิธีใช้คู่มือนี้

เปิดเทอร์มินัลและ editor บนเครื่องของคุณเองคู่กับคู่มือนี้ แล้วทำตามทีละขั้นจริงๆ (ไม่ใช่อ่านผ่านๆ):

- ทุก code block มีบรรทัดบอกไว้ก่อนเสมอว่าให้ **copy ไปวางในไฟล์ไหน** (เช่น `backend/core.js`, `backend/routes.js`) — เปิดไฟล์นั้นในเครื่องตัวเอง แล้ววางโค้ดตามจริง
- ทำตามลำดับขั้น 1 → 15 ห้ามข้าม เพราะโค้ดในขั้นหลังอ้างถึงไฟล์/ฟังก์ชันที่สร้างไว้ในขั้นก่อนหน้าเสมอ
- หลังวางโค้ดแต่ละขั้น ให้รันคำสั่งทดสอบที่ให้ไว้ (เช่น `curl`, `node backend/scripts/...`) ทันที เพื่อเช็คว่าขั้นนั้นทำงานจริงก่อนไปขั้นต่อไป

## สารบัญ

1. [เตรียมเครื่องมือ: VS Code, Node.js และ ngrok](#1-เตรียมเครื่องมือ-vs-code-nodejs-และ-ngrok)
2. [เริ่มโปรเจกต์และติดตั้งไลบรารี](#2-เริ่มโปรเจกต์และติดตั้งไลบรารี)
3. [โครงสร้าง Frontend / Backend](#3-โครงสร้าง-frontend--backend)
4. [เตรียมข้อมูลสถิติ](#4-เตรียมข้อมูลสถิติ)
5. [สร้าง Express server + REST API](#5-สร้าง-express-server--rest-api)
6. [สร้าง LINE Official Account และ Messaging API channel](#6-สร้าง-line-official-account-และ-messaging-api-channel)
7. [ตอบกลับด้วย Text และ Flex Message](#7-ตอบกลับด้วย-text-และ-flex-message)
8. [Webhook: รับข้อความจาก LINE อย่างปลอดภัย](#8-webhook-รับข้อความจาก-line-อย่างปลอดภัย)
9. [เปิด ngrok และเชื่อม Webhook URL](#9-เปิด-ngrok-และเชื่อม-webhook-url)
10. [Rich Menu: สร้างรูปเมนูและ action](#10-rich-menu-สร้างรูปเมนูและ-action)
11. [เชื่อม ChatGPT (OpenAI API)](#11-เชื่อม-chatgpt-openai-api)
12. [กราฟสถิติด้วย QuickChart](#12-กราฟสถิติด้วย-quickchart)
13. [สรุป REST endpoints ทั้งหมด](#13-สรุป-rest-endpoints-ทั้งหมด)
14. [Deploy ขึ้นใช้งานจริง](#14-deploy-ขึ้นใช้งานจริง)
15. [จุดที่มักพลาด / Checklist](#15-จุดที่มักพลาด--checklist)

---

## 1. เตรียมเครื่องมือ: VS Code, Node.js และ ngrok

### ติดตั้ง VS Code

โหลดและติดตั้งได้จาก **[code.visualstudio.com](https://code.visualstudio.com/download)** (มีให้ทั้ง Windows, macOS, Linux) ใช้เป็น editor หลักสำหรับเปิดโฟลเดอร์โปรเจกต์และแก้โค้ดตลอดคู่มือนี้

แนะนำติดตั้ง extension **REST Client** ไว้ด้วย เพื่อยิง request ในไฟล์ `api.http` ได้โดยไม่ต้องสลับไปเปิด terminal

### ติดตั้ง Node.js (>= 20)

โหลดได้จาก **[nodejs.org](https://nodejs.org/en/download)** (เลือกเวอร์ชัน LTS) หรือติดตั้งผ่าน package manager:

```bash
# macOS (Homebrew)
brew install node

# ตรวจสอบเวอร์ชัน
node -v   # ต้อง >= v20
npm -v
```

### ติดตั้ง ngrok

LINE ต้องเรียก webhook ผ่าน **HTTPS** เท่านั้น ขณะพัฒนาบนเครื่องตัวเอง (`localhost`) จึงต้องมี tunnel มาเปิดเป็น URL สาธารณะที่เป็น HTTPS — ngrok ทำหน้าที่นี้

โหลดได้จาก **[ngrok.com/download](https://ngrok.com/download)** หรือติดตั้งผ่าน package manager:

```bash
brew install ngrok
# หรือดาวน์โหลดตัวติดตั้งจาก https://ngrok.com/download

# สมัครบัญชีฟรีที่ https://dashboard.ngrok.com/signup แล้วคัดลอก authtoken จาก
# https://dashboard.ngrok.com/get-started/your-authtoken มาผูกกับเครื่อง
ngrok config add-authtoken <YOUR_AUTHTOKEN>
```

> บัญชีฟรีของ ngrok จะได้ URL สุ่มใหม่ทุกครั้งที่รันคำสั่ง `ngrok http` ใหม่ — แปลว่าทุกครั้งที่ restart ngrok ต้องไปอัปเดต Webhook URL ใน LINE Developers Console ใหม่ด้วย (ดูขั้นตอนที่ 9)

---

## 2. เริ่มโปรเจกต์และติดตั้งไลบรารี

```bash
mkdir cmu-healthline-ai && cd cmu-healthline-ai
npm init -y
```

แก้ `package.json` ให้เป็น ES module และเพิ่ม script:

```json
{
  "type": "module",
  "scripts": {
    "start": "node backend/server.js",
    "dev": "node --watch backend/server.js"
  },
  "engines": { "node": ">=20" }
}
```

ติดตั้งไลบรารีหลัก:

```bash
npm install express dotenv @line/bot-sdk openai
npm install -D xlsx
```

| ไลบรารี | ใช้ทำอะไร |
|---|---|
| `express` | web server, route, REST API |
| `dotenv` | โหลดค่าจาก `.env` เข้า `process.env` |
| `@line/bot-sdk` | เรียก LINE Messaging API (reply, rich menu, signature) |
| `openai` | เรียก OpenAI Responses API (ChatGPT) |
| `xlsx` (dev) | แปลงไฟล์ Excel สถิติ → JSON ตอน build ข้อมูล |

### ตั้งค่า environment variables

สร้างไฟล์ `.env.example` (เทมเพลตที่ commit ได้ ไม่มีค่าจริง) แล้ว copy เป็น `.env` (ห้าม commit):

```bash
# .env.example
PORT=3000
LINE_CHANNEL_SECRET=
LINE_CHANNEL_ACCESS_TOKEN=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
```

```bash
cp .env.example .env
```

เพิ่ม `.env` และ `node_modules` ลง `.gitignore` ทันที — ก่อนจะเริ่มเขียนโค้ดที่ดึงค่าพวกนี้มาใช้ เพื่อไม่ให้ secret หลุดเข้า git โดยไม่ตั้งใจ:

```
node_modules/
.env
```

---

## 3. โครงสร้าง Frontend / Backend

```text
backend/
  server.js          # Express app entrypoint
  core.js            # logic: stats repository, LINE service, signature check
  routes.js          # REST routes + webhook route
  data/              # province_stats.json
  scripts/           # convert_province_stats.js (xlsx → json)
frontend/
  index.html         # หน้าเว็บ (ทดสอบ UI แบบไม่ต้องผ่าน LINE)
  app.css, app.js
assets/
  stat.xlsx          # ไฟล์สถิติต้นฉบับ
```

แยกเหตุผล:

- **`server.js`** เบามาก มีหน้าที่แค่ bootstrap (โหลด env, สร้าง Express app, mount router) — ไม่ใส่ logic ใดๆ
- **`core.js`** เก็บ business logic ทั้งหมด (อ่านข้อมูล, ตอบแชต, เรียก LINE/OpenAI) เพื่อให้ทดสอบ unit ได้โดยไม่ต้องพึ่ง HTTP
- **`routes.js`** เป็นเปลือก HTTP เท่านั้น แปลง request → เรียก `core.js` → ส่ง response
- **`frontend/`** เสิร์ฟผ่าน `express.static` ตรงจาก `server.js` ใช้สำหรับ demo/ทดสอบบนเว็บโดยไม่ต้องเปิด LINE ก็ได้

สร้างไฟล์เปล่าไว้ก่อนตามนี้ แล้วค่อยเติมโค้ดในขั้นถัดไป

---

## 4. เตรียมข้อมูลสถิติ

ข้อมูลต้นทางอยู่ใน `assets/stat.xlsx` (province, patient, patient_rate, dead, dead_rate, cfr) แปลงเป็น JSON ด้วยสคริปต์ `backend/scripts/convert_province_stats.js`:

```js
// backend/scripts/convert_province_stats.js
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
```

รันครั้งเดียวตอน setup (และรันใหม่ทุกครั้งที่ไฟล์ Excel เปลี่ยน):

```bash
node backend/scripts/convert_province_stats.js
```

> เก็บไฟล์ผลลัพธ์ `backend/data/province_stats.json` ไว้ใน git ได้ตามปกติ เพราะเป็นข้อมูลสาธารณะที่แปลงแล้ว ไม่ใช่ secret

---

## 5. สร้าง Express server + REST API

`backend/server.js` — entrypoint:

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

`backend/core.js` — ส่วนอ่านข้อมูลสถิติ (logic ล้วนๆ ไม่ยุ่งกับ HTTP):

```js
import { readFileSync } from 'fs';

export class ProvinceStatsRepository {
    constructor(path) {
        this.items = JSON.parse(readFileSync(path, 'utf-8'));
    }

    findByProvince(name, year) {
        const normalized = name.trim().toLowerCase();
        const matches = this.items
            .filter(item => item.province.toLowerCase().includes(normalized) && (year === undefined || item.year === year));
        if (!matches.length) return null;
        return year === undefined ? matches : matches[0];
    }

    query({ field = 'patient_rate', min, max, year } = {}) {
        return this.items
            .filter(item => year === undefined || item.year === year)
            .filter(item => (min === undefined || item[field] >= min) && (max === undefined || item[field] <= max))
            .sort((a, b) => b[field] - a[field]);
    }
}
```

`backend/routes.js` — REST endpoints:

```js
import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import { ProvinceStatsRepository } from './core.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const provinceStats = new ProvinceStatsRepository(path.join(__dirname, 'data/province_stats.json'));

const router = express.Router();

router.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'healthline-ai' });
});

router.get('/api/provinces', (req, res) => {
    const { province, field, min, max, year } = req.query;
    const parsedYear = year !== undefined ? Number(year) : undefined;
    if (province) {
        const match = provinceStats.findByProvince(String(province), parsedYear);
        return match ? res.json(match) : res.status(404).json({ error: 'province not found' });
    }
    res.json(provinceStats.query({ field, min: min && Number(min), max: max && Number(max), year: parsedYear }));
});

export default router;
```

ทดสอบทันทีโดยยังไม่ต้องมี LINE/OpenAI key:

```bash
npm run dev
curl http://localhost:3000/health
curl "http://localhost:3000/api/provinces?year=2026&field=patient_rate&min=300"
```

### ทดสอบด้วย REST Client extension (แทน curl)

ติดตั้ง extension **[REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)** ใน VS Code (ถ้ายังไม่ได้ลงตอนขั้นตอนที่ 1) แล้วสร้างไฟล์ `api.http` ที่ root ของโปรเจกต์ copy เนื้อหานี้ไปวาง:

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

วิธีใช้:

1. รัน `npm run dev` ให้ server ทำงานอยู่ที่ `localhost:3000` ก่อน
2. เปิดไฟล์ `api.http` ใน VS Code — เหนือแต่ละ request (บรรทัด `GET ...`) จะมีลิงก์เล็กๆ เขียนว่า **Send Request** ปรากฏขึ้นมา (CodeLens)
3. คลิก **Send Request** ที่ request ที่ต้องการทดสอบ — VS Code จะเปิดแท็บผลลัพธ์ (status code, headers, JSON response) ขึ้นมาด้านข้างให้ทันที ไม่ต้องพิมพ์คำสั่งใน terminal
4. แก้ query string ในไฟล์แล้วกด **Send Request** ใหม่ได้เรื่อยๆ เพื่อลองพารามิเตอร์อื่น (เช่นเปลี่ยน `min=500` เป็นค่าอื่น)

> ตัวแปร `@host` ที่หัวไฟล์ช่วยให้สลับไปยิงกับ server จริง (เช่น URL หลัง deploy) ได้โดยแก้ค่าเดียว ไม่ต้องแก้ทุก request

---

## 6. สร้าง LINE Official Account และ Messaging API channel

1. ไปที่ [LINE Official Account Manager](https://manager.line.biz/) → สร้าง Official Account (OA) ใหม่ ถ้ายังไม่มี
2. ไปที่ [LINE Developers Console](https://developers.line.biz/console/) → สร้างหรือเลือก **Provider**
3. ภายใน Provider → **Create a new channel** → เลือก **Messaging API**
4. กรอกข้อมูล channel (ชื่อ, หมวดหมู่, ผูกกับ OA ที่สร้างไว้ในขั้นตอนที่ 1)
5. เข้าไปที่ channel ที่สร้าง → แท็บ **Basic settings** → คัดลอก **Channel secret**
6. แท็บ **Messaging API** → เลื่อนลงไปที่ **Channel access token** → กด **Issue** เพื่อออก long-lived token แล้วคัดลอกมา
7. นำสองค่านี้ไปวางใน `.env`:

```
LINE_CHANNEL_SECRET=xxxxxxxxxxxxxxxx
LINE_CHANNEL_ACCESS_TOKEN=xxxxxxxxxxxxxxxx...
```

8. ในแท็บ **Messaging API** เดียวกัน ปิดสองอย่างนี้ก่อน ไม่งั้นบอทจะตอบชนกับ LINE เอง:
   - **Auto-reply messages** → ปิด (Disabled)
   - **Greeting messages** → ปิดหรือเปิดได้ตามต้องการ แต่ auto-reply ต้องปิด
   - **Webhook** จะมาเปิดในขั้นตอนที่ 9

---

## 7. ตอบกลับด้วย Text และ Flex Message

`backend/core.js` ส่วน `LineService`:

```js
import * as line from '@line/bot-sdk';

function textReply(text) {
    return { type: 'text', text };
}

export function menuFlex() {
    return {
        type: 'flex',
        altText: 'เมนู HealthLine Stats',
        contents: {
            type: 'bubble',
            body: {
                type: 'box', layout: 'vertical', contents: [
                    { type: 'text', text: 'สถิติผู้ป่วยรายจังหวัด', weight: 'bold', size: 'xl' },
                    {
                        type: 'box', layout: 'horizontal', paddingAll: '12px', backgroundColor: '#E7F7EE',
                        action: { type: 'message', label: 'เลือกจังหวัด', text: 'เลือกจังหวัด' },
                        contents: [{ type: 'text', text: 'เลือกจังหวัด' }],
                    },
                ],
            },
        },
    };
}

export class LineService {
    constructor(accessToken, provinceStats) {
        this.accessToken = accessToken;
        this.provinceStats = provinceStats;
    }

    async respond(text) {
        const normalized = text.trim().toLowerCase();
        if (['เมนู', 'menu'].includes(normalized)) return menuFlex();

        const result = this.provinceStats.findByProvince(text.trim());
        if (!result) return textReply(`ไม่พบข้อมูลจังหวัด "${text}"\nพิมพ์ "เมนู" เพื่อดูตัวเลือก`);
        return textReply(JSON.stringify(result));
    }

    async reply(replyToken, payload) {
        if (!this.accessToken) return;
        const client = new line.messagingApi.MessagingApiClient({ channelAccessToken: this.accessToken });
        const messages = payload.type === 'flex'
            ? [{ type: 'flex', altText: payload.altText, contents: payload.contents }]
            : [{ type: 'text', text: payload.text }];
        await client.replyMessage({ replyToken, messages });
    }
}
```

**action ใน Flex Message ที่ใช้บ่อยที่สุดคือ `type: "message"`** — กดแล้วเสมือนผู้ใช้พิมพ์ `text` นั้นเข้ามาเอง ทำให้ logic ฝั่ง `respond()` จัดการ flow เดียวกันได้ทั้งจากการพิมพ์และการกดปุ่ม โดยไม่ต้องเขียน handler แยก

---

## 8. Webhook: รับข้อความจาก LINE อย่างปลอดภัย

LINE ส่ง POST มาที่ webhook ทุกครั้งที่มี event (มีคนพิมพ์, กดปุ่ม, follow ฯลฯ) พร้อม header `x-line-signature` ที่เป็น HMAC-SHA256 ของ body เซ็นด้วย **Channel secret** — เราต้อง verify ก่อนเชื่อ payload เสมอ มิฉะนั้นใครก็ยิง request ปลอมมาที่ webhook ได้

`backend/core.js` เพิ่มฟังก์ชัน verify:

```js
import { createHmac } from 'crypto';

export function validSignature(rawBody, signature, secret) {
    const expected = createHmac('sha256', secret).update(rawBody).digest('base64');
    return expected === signature;
}
```

> สำคัญ: ต้อง hash จาก **raw body แบบ buffer ดิบ** ไม่ใช่ object ที่ `express.json()` parse แล้ว เพราะการ stringify ซ้ำอาจได้ byte ไม่ตรงกับที่ LINE ใช้เซ็น ต้องใช้ `express.raw()` กับ route นี้โดยเฉพาะ

`backend/routes.js` เพิ่ม route `/webhook` (ใช้ `LineService` ที่สร้างไว้ในขั้นตอนก่อนหน้าเลย):

```js
import { LineService, validSignature } from './core.js';

const { LINE_CHANNEL_SECRET = '', LINE_CHANNEL_ACCESS_TOKEN = '' } = process.env;
const lineService = new LineService(LINE_CHANNEL_ACCESS_TOKEN, provinceStats);

router.post('/webhook', express.raw({ type: '*/*' }), async (req, res) => {
    const rawBody = req.body;
    const signature = req.headers['x-line-signature'] || '';
    if (!LINE_CHANNEL_SECRET || !validSignature(rawBody, signature, LINE_CHANNEL_SECRET)) {
        return res.status(400).send('Bad Request');
    }
    const payload = JSON.parse(rawBody.toString('utf-8'));
    for (const event of payload.events || []) {
        if (event.type === 'message' && event.message?.type === 'text') {
            await lineService.reply(event.replyToken, await lineService.respond(event.message.text));
        } else if (event.type === 'follow') {
            await lineService.reply(event.replyToken, await lineService.respond('เมนู'));
        }
    }
    res.send('OK'); // ต้องตอบ 200 เร็วๆ ไม่ว่าจะ reply LINE สำเร็จหรือไม่ ไม่งั้น LINE จะ retry/ตัดการเชื่อมต่อ
});
```

---

## 9. เปิด ngrok และเชื่อม Webhook URL

```bash
npm run dev          # รัน Express ที่ localhost:3000
ngrok http 3000       # เปิด tunnel ในเทอร์มินัลอีกอัน
```

ngrok จะพิมพ์ URL ลักษณะ `https://abcd-1234.ngrok-free.app` — คัดลอกมา

1. กลับไปที่ LINE Developers Console → channel ของเรา → แท็บ **Messaging API**
2. ที่ **Webhook URL** ใส่ `https://<ngrok-domain>/webhook`
3. กด **Verify** — ถ้าโค้ดถูกต้องและ server รันอยู่ จะได้ Success (LINE จะยิง request ทดสอบเข้ามาจริง แล้วเช็คว่า server ตอบ 200)
4. เปิดสวิตช์ **Use webhook** เป็น Enabled

ทดสอบ: เปิด LINE app → แอด OA เป็นเพื่อน (มี QR code ใน Console) → พิมพ์อะไรไปคุย ดู log ฝั่ง terminal ว่า request เข้ามาไหม

> ทุกครั้งที่ restart `ngrok http` (บัญชีฟรี) จะได้ domain ใหม่ ต้องย้อนมาทำขั้นตอนที่ 2-4 ใหม่ทุกรอบ

---

## 10. Rich Menu: สร้างรูปเมนูและ action

Rich Menu คือแถบเมนูรูปภาพที่ปักไว้ด้านล่างหน้าแชต กดแล้วส่ง action ได้ (เช่น ส่งข้อความ, เปิดลิงก์)

### 10.1 ออกแบบรูปภาพ

ข้อกำหนดของ LINE:

- ขนาด **2500×1686px** (full) หรือ **2500×843px** (compact) — เผื่อพื้นที่ปุ่มลงตัว
- ไฟล์ `.png` หรือ `.jpg`, ขนาดไม่เกิน 1MB

แบ่งกริดปุ่มในภาพ (เช่น 3 คอลัมน์ × 2 แถว) แล้วจด pixel bounds ของแต่ละช่องไว้ใช้ตอนกำหนด `areas` (ตัวอย่างใน repo: `linerichmenu.jpg`)

### 10.2 สร้างเมนูผ่าน Messaging API

เขียนสคริปต์ setup แยก (รันครั้งเดียวตอน deploy หรือเมื่อเปลี่ยนเมนู) เช่น `backend/scripts/setup_richmenu.js`:

```js
import 'dotenv/config';
import * as line from '@line/bot-sdk';
import { readFileSync } from 'fs';

const client = new line.messagingApi.MessagingApiClient({
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
});

// 1. ประกาศโครงเมนู + areas (พิกัดเป็น pixel บนภาพ) + action ของแต่ละปุ่ม
const { richMenuId } = await client.createRichMenu({
    size: { width: 2500, height: 1686 },
    selected: true,
    name: 'HealthLine main menu',
    chatBarText: 'เมนู',
    areas: [
        {
            bounds: { x: 0, y: 0, width: 1250, height: 1686 },
            action: { type: 'message', label: 'เลือกจังหวัด', text: 'เลือกจังหวัด' },
        },
        {
            bounds: { x: 1250, y: 0, width: 1250, height: 1686 },
            action: { type: 'message', label: 'สรุปข้อมูล', text: 'สรุปข้อมูล' },
        },
    ],
});

// 2. อัปโหลดรูปภาพไปผูกกับ richMenuId (ต้องสร้าง richMenuId ก่อนเสมอ ค่อยอัปโหลดรูป)
const imageBuffer = readFileSync('linerichmenu.jpg');
await client.setRichMenuImage(richMenuId, new Blob([imageBuffer], { type: 'image/jpeg' }));

// 3. ตั้งเป็นเมนู default ให้ผู้ใช้ทุกคนที่ยังไม่ได้ผูกเมนูอื่น
await client.setDefaultRichMenu(richMenuId);

console.log('Rich menu created:', richMenuId);
```

```bash
node backend/scripts/setup_richmenu.js
```

จุดสำคัญ:

- ต้อง **สร้าง rich menu (ได้ `richMenuId`) ก่อน แล้วค่อยอัปโหลดรูป** ลำดับสลับกันไม่ได้
- `action: { type: 'message', text: ... }` ทำให้กดปุ่มแล้วเข้า flow เดียวกับพิมพ์ข้อความ — ใช้ logic เดิมใน `LineService.respond()` ได้โดยไม่ต้องแยกเขียน handler ของ rich menu
- ถ้าอยากให้ผู้ใช้บางคนเห็นเมนูต่างจาก default ใช้ `linkRichMenuIdToUser(userId, richMenuId)` แทน `setDefaultRichMenu`
- แก้เมนูใหม่ ต้อง `deleteRichMenu(oldId)` เมนูเก่าก่อน ไม่งั้นจะมีเมนูเก่าตกค้างให้ผู้ใช้บางคน

---

## 11. เชื่อม ChatGPT (OpenAI API)

1. ไปที่ [OpenAI Platform](https://platform.openai.com/) → สร้าง API key
2. ใส่ใน `.env`:

```
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-4.1-mini
```

`gpt-4.1-mini` ถูกเลือกเพราะเร็วและถูก เหมาะกับงาน workshop เปลี่ยน model ได้จาก env โดยไม่แก้โค้ด

ใน `core.js` เพิ่มฟังก์ชันเรียก **Responses API** พร้อม fallback กรณีไม่มี key (เช่นตอน demo ไม่อยากผูก billing):

```js
import OpenAI from 'openai';

async function aiExplain(record, { apiKey, model }) {
    const fallback = `จังหวัด${record.province} ปี ${record.year} ผู้ป่วย ${record.patient} คน`;
    if (!apiKey) return fallback;
    try {
        const client = new OpenAI({ apiKey, fetch: globalThis.fetch });
        const response = await client.responses.create({
            model,
            instructions: 'คุณคือผู้ช่วยอธิบายสถิติโรคติดต่อภาษาไทย ใช้เฉพาะข้อมูลที่ให้มาเท่านั้น ห้ามวินิจฉัยใดๆ',
            input: `ข้อมูล: จังหวัด${record.province} ปี ${record.year} ผู้ป่วย ${record.patient} คน`,
        });
        return response.output_text.trim();
    } catch (err) {
        console.error('OpenAI request failed; using local fallback', err.message);
        return fallback;
    }
}
```

แนวคิดสำคัญ 2 ข้อ:

- **RAG แบบง่าย**: ให้ AI ตอบ "จากข้อมูลที่ส่งให้เท่านั้น" (ผ่าน `instructions`) ไม่ให้แต่งตัวเลขเอง — กันอาการ hallucination ในข้อมูลสุขภาพซึ่งเสี่ยงสูง
- **Graceful fallback**: ถ้าไม่มี `OPENAI_API_KEY` หรือเรียก API ไม่สำเร็จ ต้องมี response สำรองเสมอ ไม่ใช่ error ทั้ง flow — สำคัญมากตอน demo สด

---

## 12. กราฟสถิติด้วย QuickChart

ไม่ต้องลง chart library หรือ render รูปเอง ใช้ [QuickChart](https://quickchart.io/) ซึ่งรับ Chart.js config เป็น JSON ผ่าน query string แล้วคืนรูป PNG กลับมาเป็น URL ตรงๆ — ส่งเป็น LINE image message ได้เลย:

```js
function provinceChartImage(records) {
    const config = {
        type: 'bar',
        data: {
            labels: records.map(r => String(r.year)),
            datasets: [{ label: 'ผู้ป่วย (คน)', data: records.map(r => r.patient) }],
        },
    };
    const url = `https://quickchart.io/chart?width=800&height=500&backgroundColor=white&c=${encodeURIComponent(JSON.stringify(config))}`;
    return {
        type: 'image',
        originalContentUrl: url,
        previewImageUrl: url,
        caption: `สรุปข้อมูลจังหวัด${records[0].province}`,
    };
}
```

ฝั่ง `reply()` ส่งเป็น 2 ข้อความต่อกัน (image + caption text) เพราะ LINE image message ไม่มีช่อง caption ในตัว:

```js
messages = [
    { type: 'image', originalContentUrl: payload.originalContentUrl, previewImageUrl: payload.previewImageUrl },
    { type: 'text', text: payload.caption },
];
```

---

## 13. สรุป REST endpoints ทั้งหมด

| Endpoint | Method | คำอธิบาย |
|---|---|---|
| `/health` | GET | health check |
| `/api/provinces` | GET | คืนข้อมูลทุกจังหวัด รองรับ query `province`, `field`, `min`, `max`, `year` |
| `/api/provinces/:province` | GET | ค้นหาจังหวัดเดียวด้วย path param |
| `/webhook` | POST | รับ event จาก LINE (ตรวจ signature ก่อนเสมอ) |

จุดเชื่อมต่อ (integration) ของแต่ละ feature สรุปเป็น flow เดียว:

```
ผู้ใช้พิมพ์/กด rich menu ใน LINE
        │  POST /webhook (มี x-line-signature)
        ▼
validSignature() ผ่าน ──► LineService.respond(text)
        │
        ├─ คำสั่งเมนู/เลือกจังหวัด ──► Flex Message (ปุ่มกดต่อ)
        ├─ คำสั่ง "สรุปข้อมูล <จังหวัด>" ──► ProvinceStatsRepository ──► QuickChart URL ──► Image Message
        ├─ คำสั่ง "ai <จังหวัด> <ปี>" ──► ProvinceStatsRepository ──► OpenAI Responses API ──► Text Message
        └─ ชื่อจังหวัดตรงๆ ──► ProvinceStatsRepository ──► Text Message
        │
        ▼
LineService.reply(replyToken, payload) ──► LINE Messaging API
```

---

## 14. Deploy ขึ้นใช้งานจริง

ngrok เหมาะกับตอนพัฒนา/สอนในห้องเท่านั้น เพราะ URL ไม่ถาวรและพังเมื่อปิดเครื่อง สำหรับใช้งานจริงต้องมี:

- โฮสต์ที่มี HTTPS แบบถาวร (เช่น Render, Railway, Fly.io, VM + reverse proxy พร้อม TLS cert)
- ตั้งค่า environment variables (`LINE_CHANNEL_SECRET`, `LINE_CHANNEL_ACCESS_TOKEN`, `OPENAI_API_KEY`) ไว้ในระบบของโฮสต์ ไม่ใช่ใน repo
- กลับไปอัปเดต Webhook URL ในแท็บ Messaging API เป็น domain จริง แล้วกด Verify อีกครั้ง
- พิจารณาใช้ process manager (เช่น `pm2`) หรือให้แพลตฟอร์ม PaaS จัดการ restart ให้เองเมื่อ process ตาย

---

## 15. จุดที่มักพลาด / Checklist

- [ ] `.env` ถูกใส่ใน `.gitignore` **ก่อน** ที่จะมีค่า secret อยู่ในไฟล์ (ถ้า commit ไปแล้วต้อง revoke token เก่าแล้วออกใหม่ ลบไฟล์จาก git history ไม่พอ)
- [ ] ปิด **Auto-reply messages** ใน LINE Official Account Manager ก่อนทดสอบ ไม่งั้นจะเห็นทั้งข้อความอัตโนมัติของ LINE และของบอทเราพร้อมกัน
- [ ] route `/webhook` ต้องใช้ `express.raw()` ไม่ใช่ `express.json()` — มิฉะนั้น signature จะตรวจไม่ผ่านเพราะ body ถูก parse/stringify ซ้ำ
- [ ] ทุกครั้งที่ restart ngrok แบบฟรี ต้องอัปเดต Webhook URL ใหม่แล้วกด Verify อีกครั้ง
- [ ] สร้าง rich menu ต้อง **createRichMenu ก่อนเสมอ** ค่อย `setRichMenuImage` ตามด้วย `richMenuId`
- [ ] ถ้าไม่มี `OPENAI_API_KEY` ระบบต้อง fallback เป็นคำตอบจากข้อมูลในเครื่องได้ ไม่ error ทั้ง flow
- [ ] route ที่ต้องตอบ LINE เร็วๆ (`/webhook`) ควรตอบ `200 OK` แม้ reply message จะ fail ภายใน เพื่อกัน LINE retry ซ้ำๆ
- [ ] อย่าให้ AI แต่งตัวเลขสถิติเอง — บังคับด้วย `instructions` ว่าให้ใช้ข้อมูลที่ส่งให้เท่านั้น สำคัญมากสำหรับข้อมูลสุขภาพ
- [ ] เคสฉุกเฉิน (เช่น อาการที่ดูเร่งด่วน) ควรมี guardrail แนะนำให้โทร 1669 ทันที ไม่ปล่อยให้ AI ตอบเอง
