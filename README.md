# HealthLine AI — LINE Bot สถิติโรคติดต่อ สำหรับกรมควบคุมโรค

โครงการตัวอย่างสำหรับทีมเฝ้าระวังและสื่อสารความเสี่ยงของ **กรมควบคุมโรค (Department of Disease Control)** พัฒนาขึ้นในการอบรม **การพัฒนา LINE Bot และ Large Language Models (LLMs) สำหรับงานด้านสาธารณสุข** ร่วมกับมหาวิทยาลัยเชียงใหม่ วันที่ 1–2 กรกฎาคม 2569

คู่มือฉบับนี้อธิบายขั้นตอนการพัฒนาโครงการดังกล่าวตั้งแต่เริ่มต้น โดยนำเสนอเป็นลำดับขั้นตอนจนสามารถสร้าง LINE Bot ที่ตอบกลับข้อมูลสถิติผู้ป่วยรายจังหวัดได้ (สามารถปรับใช้กับข้อมูลโรคเฝ้าระวังหรือรหัส ICD-10 ของกรมควบคุมโรคได้) เชื่อมต่อกับ ChatGPT (OpenAI) จัดทำกราฟเป็นรูปภาพ และมี Rich Menu สำหรับการใช้งานที่สะดวกยิ่งขึ้น

> โครงการนี้จัดทำขึ้นเพื่อการเรียนรู้และการสื่อสารด้านสุขศึกษาเท่านั้น มิใช่เครื่องมือสำหรับการวินิจฉัยโรคหรือให้คำแนะนำทางการแพทย์ทดแทนแพทย์ผู้เชี่ยวชาญ หากผู้ใช้มีอาการฉุกเฉิน ขอให้โทรแจ้งสายด่วน 1669 ทันที

## วิธีการใช้คู่มือนี้

กรุณาเปิดโปรแกรมเทอร์มินัลและโปรแกรมแก้ไขโค้ด (editor) บนเครื่องคอมพิวเตอร์ของท่าน ควบคู่กับการอ่านคู่มือฉบับนี้ และดำเนินการตามลำดับขั้นตอนดังต่อไปนี้:

- ตัวอย่างโค้ด (code block) ทุกรายการจะระบุไว้ก่อนเสมอว่าให้ **คัดลอกไปวางในไฟล์ใด** (เช่น `backend/core.js`, `backend/routes.js`) กรุณาเปิดไฟล์ดังกล่าวบนเครื่องคอมพิวเตอร์ของท่าน แล้ววางโค้ดตามที่ระบุไว้
- กรุณาดำเนินการตามลำดับขั้นตอนที่ 1 ถึง 14 โดยไม่ข้ามขั้นตอนใด เนื่องจากโค้ดในขั้นตอนถัดไปจะอ้างอิงถึงไฟล์หรือฟังก์ชันที่สร้างไว้ในขั้นตอนก่อนหน้าเสมอ
- หลังจากวางโค้ดในแต่ละขั้นตอนแล้ว ขอให้รันคำสั่งทดสอบที่ระบุไว้ทันที (เช่น `curl`, `node backend/scripts/...`) เพื่อตรวจสอบว่าขั้นตอนดังกล่าวทำงานได้ถูกต้อง ก่อนดำเนินการในขั้นตอนต่อไป

## สารบัญ

1. [เตรียมเครื่องมือ: VS Code, Node.js และ ngrok](#1-เตรียมเครื่องมือ-vs-code-nodejs-และ-ngrok)
2. [เริ่มต้นโครงการและติดตั้งไลบรารี](#2-เริ่มต้นโครงการและติดตั้งไลบรารี)
3. [โครงสร้าง Frontend / Backend](#3-โครงสร้าง-frontend--backend)
4. [สร้าง Express server + REST API](#4-สร้าง-express-server--rest-api)
5. [สร้าง LINE Official Account และ Messaging API channel](#5-สร้าง-line-official-account-และ-messaging-api-channel)
6. [ตอบกลับด้วย Text และ Flex Message](#6-ตอบกลับด้วย-text-และ-flex-message)
7. [Webhook: รับข้อความจาก LINE อย่างปลอดภัย](#7-webhook-รับข้อความจาก-line-อย่างปลอดภัย)
8. [เปิด ngrok และเชื่อม Webhook URL](#8-เปิด-ngrok-และเชื่อม-webhook-url)
9. [Rich Menu: สร้างรูปเมนูและ action](#9-rich-menu-สร้างรูปเมนูและ-action)
10. [เชื่อม ChatGPT (OpenAI API)](#10-เชื่อม-chatgpt-openai-api)
11. [กราฟสถิติด้วย QuickChart](#11-กราฟสถิติด้วย-quickchart)
12. [สรุป REST endpoints ทั้งหมด](#12-สรุป-rest-endpoints-ทั้งหมด)
13. [Deploy ขึ้นใช้งานจริง](#13-deploy-ขึ้นใช้งานจริง)
14. [จุดที่มักพลาด / Checklist](#14-จุดที่มักพลาด--checklist)

---

## 1. เตรียมเครื่องมือ: VS Code, Node.js และ ngrok

### ติดตั้ง VS Code

สามารถดาวน์โหลดและติดตั้งได้จาก **[code.visualstudio.com](https://code.visualstudio.com/download)** (รองรับระบบปฏิบัติการ Windows, macOS และ Linux) โดยใช้เป็นโปรแกรมหลักสำหรับเปิดโฟลเดอร์โครงการและแก้ไขโค้ดตลอดคู่มือฉบับนี้

```powershell
# Windows (winget) หรือดาวน์โหลดโปรแกรมติดตั้งจาก https://code.visualstudio.com/download แล้วดำเนินการติดตั้ง
winget install -e --id Microsoft.VisualStudioCode
```

```bash
# macOS (Homebrew)
brew install --cask visual-studio-code
```

ขอแนะนำให้ติดตั้ง extension **[REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)** เพิ่มเติมด้วย เพื่อให้สามารถส่ง request ในไฟล์ `api.http` ได้โดยไม่ต้องสลับไปเปิดเทอร์มินัล โดยเปิด VS Code แล้วกด `Ctrl+Shift+X` (Windows) หรือ `Cmd+Shift+X` (macOS) ค้นหาคำว่า "REST Client" แล้วกด Install

### ติดตั้ง Node.js (เวอร์ชัน 20 ขึ้นไป)

สามารถดาวน์โหลดได้จาก **[nodejs.org](https://nodejs.org/en/download)** (เลือกเวอร์ชัน LTS) หรือติดตั้งผ่านโปรแกรมจัดการแพ็กเกจ (package manager) ดังนี้:

```powershell
# Windows (winget)
winget install -e --id OpenJS.NodeJS.LTS

# ตรวจสอบเวอร์ชัน (เปิด PowerShell หรือ Command Prompt ใหม่หลังการติดตั้ง)
node -v   # ต้องเป็นเวอร์ชัน 20 ขึ้นไป
npm -v
```

```bash
# macOS (Homebrew)
brew install node

# ตรวจสอบเวอร์ชัน
node -v   # ต้องเป็นเวอร์ชัน 20 ขึ้นไป
npm -v
```

### ติดตั้ง ngrok

ระบบ LINE กำหนดให้ต้องเรียกใช้งาน webhook ผ่านโพรโทคอล **HTTPS** เท่านั้น ในระหว่างการพัฒนาบนเครื่องคอมพิวเตอร์ส่วนตัว (`localhost`) จึงจำเป็นต้องใช้ tunnel เพื่อเปิดเป็น URL สาธารณะที่รองรับ HTTPS โดย ngrok จะทำหน้าที่ดังกล่าว

สามารถดาวน์โหลดได้จาก **[ngrok.com/download](https://ngrok.com/download)** หรือติดตั้งผ่านโปรแกรมจัดการแพ็กเกจ ดังนี้:

```powershell
# Windows (winget) หรือดาวน์โหลดไฟล์ zip จาก https://ngrok.com/download แล้วแตกไฟล์ ngrok.exe ไปไว้ในโฟลเดอร์ที่อยู่ใน PATH
winget install -e --id ngrok.ngrok

# กรุณาสมัครบัญชีแบบไม่มีค่าใช้จ่ายที่ https://dashboard.ngrok.com/signup แล้วคัดลอก authtoken จาก
# https://dashboard.ngrok.com/get-started/your-authtoken มาตั้งค่า (เปิด PowerShell ใหม่หลังการติดตั้ง)
ngrok config add-authtoken <YOUR_AUTHTOKEN>
```

```bash
# macOS (Homebrew)
brew install ngrok

# กรุณาสมัครบัญชีแบบไม่มีค่าใช้จ่ายที่ https://dashboard.ngrok.com/signup แล้วคัดลอก authtoken จาก
# https://dashboard.ngrok.com/get-started/your-authtoken มาผูกกับเครื่อง
ngrok config add-authtoken <YOUR_AUTHTOKEN>
```

ไฟล์การตั้งค่า (config) ของ ngrok ซึ่งเก็บ authtoken ที่ผูกไว้ จะถูกสร้างขึ้นโดยอัตโนมัติที่ตำแหน่งดังนี้:

- **Windows**: `%USERPROFILE%\AppData\Local\ngrok\ngrok.yml`
- **macOS**: `~/Library/Application Support/ngrok/ngrok.yml`

ไม่จำเป็นต้องแก้ไขไฟล์นี้โดยตรง เนื่องจากคำสั่ง `ngrok config add-authtoken` จะดำเนินการเขียนไฟล์ดังกล่าวให้โดยอัตโนมัติ

> บัญชีแบบไม่มีค่าใช้จ่ายของ ngrok จะได้รับ URL ใหม่แบบสุ่มทุกครั้งที่รันคำสั่ง `ngrok http` ใหม่ ดังนั้นทุกครั้งที่เริ่มต้น ngrok ใหม่ จะต้องอัปเดต Webhook URL ใน LINE Developers Console ด้วยเช่นกัน (โปรดดูรายละเอียดในขั้นตอนที่ 8)

---

## 2. เริ่มต้นโครงการและติดตั้งไลบรารี

```bash
mkdir cmu-healthline-ai && cd cmu-healthline-ai
npm init -y
```

ปรับแก้ไฟล์ `package.json` ให้เป็น ES module และเพิ่ม script ดังนี้:

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

ติดตั้งไลบรารีหลักที่จำเป็น:

```bash
npm install express dotenv @line/bot-sdk openai
```

| ไลบรารี | หน้าที่การใช้งาน |
|---|---|
| `express` | web server, route, REST API |
| `dotenv` | โหลดค่าจาก `.env` เข้า `process.env` |
| `@line/bot-sdk` | เรียกใช้งาน LINE Messaging API (reply, rich menu, signature) |
| `openai` | เรียกใช้งาน OpenAI Responses API (ChatGPT) |

### ตั้งค่า environment variables

สร้างไฟล์ `.env.example` (ไฟล์ต้นแบบที่สามารถ commit เข้า git ได้ โดยไม่มีค่าจริงอยู่ภายใน) จากนั้นคัดลอกเป็นไฟล์ `.env` (ห้าม commit ไฟล์นี้):

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

ขอให้เพิ่ม `.env` และ `node_modules` ลงในไฟล์ `.gitignore` ทันที ก่อนเริ่มเขียนโค้ดที่เรียกใช้ค่าดังกล่าว เพื่อป้องกันมิให้ข้อมูลลับ (secret) ถูกบันทึกเข้าสู่ระบบ git โดยไม่ตั้งใจ:

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
  data/              # province_stats.json (ได้รับจากผู้จัดอบรมโดยตรง)
frontend/
  index.html         # หน้าเว็บ (ทดสอบ UI แบบไม่ต้องผ่าน LINE)
  app.css, app.js
```

เหตุผลในการแบ่งโครงสร้างไฟล์มีดังนี้:

- **`server.js`** มีขนาดเล็กและทำหน้าที่เพียงเริ่มต้นระบบ (bootstrap) เท่านั้น ได้แก่ การโหลดค่า environment การสร้าง Express app และการเชื่อม router โดยไม่มีการใส่ business logic ใดๆ
- **`core.js`** เก็บ business logic ทั้งหมดของระบบ (การอ่านข้อมูล การตอบกลับข้อความ การเรียกใช้งาน LINE และ OpenAI) เพื่อให้สามารถทดสอบในระดับ unit test ได้โดยไม่ต้องพึ่งพา HTTP
- **`routes.js`** ทำหน้าที่เป็นชั้น HTTP เท่านั้น โดยรับ request แล้วเรียกใช้งาน `core.js` ก่อนส่งกลับเป็น response
- **`frontend/`** ถูกให้บริการผ่าน `express.static` โดยตรงจาก `server.js` ใช้สำหรับสาธิตหรือทดสอบการทำงานผ่านเว็บเบราว์เซอร์ โดยไม่จำเป็นต้องเปิดแอปพลิเคชัน LINE

ขอให้สร้างไฟล์เปล่าตามโครงสร้างไฟล์โค้ดข้างต้นไว้ก่อน ส่วนไฟล์ `backend/data/province_stats.json` จะได้รับจากผู้จัดอบรมโดยตรง กรุณาบันทึกไว้ในตำแหน่งดังกล่าวก่อนดำเนินการในขั้นตอนถัดไป

---

## 4. สร้าง Express server + REST API

`backend/server.js` (จุดเริ่มต้นของแอปพลิเคชัน):

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

`backend/core.js` — ส่วนสำหรับอ่านข้อมูลสถิติ (เป็น business logic เพียงอย่างเดียว ไม่เกี่ยวข้องกับ HTTP):

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

`backend/routes.js` — ส่วนกำหนด REST endpoints:

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

// คืน record ของจังหวัด name หรือ 404 ถ้าไม่พบ
// (findByProvince คืน object เดียวถ้าระบุ year, คืน array ทุกปีถ้าไม่ระบุ)
function sendProvince(res, name, year) {
    const match = provinceStats.findByProvince(name, year);
    return match ? res.json(match) : res.status(404).json({ error: 'province not found' });
}

router.get('/api/provinces', (req, res) => {
    const { province, field, min, max, year } = req.query;
    const parsedYear = year !== undefined ? Number(year) : undefined;
    if (province) return sendProvince(res, String(province), parsedYear);
    res.json(provinceStats.query({
        field,
        min: min !== undefined ? Number(min) : undefined,
        max: max !== undefined ? Number(max) : undefined,
        year: parsedYear,
    }));
});

router.get('/api/provinces/:province', (req, res) => {
    const { year } = req.query;
    sendProvince(res, req.params.province, year !== undefined ? Number(year) : undefined);
});

export default router;
```

สามารถทดสอบได้ทันทีโดยยังไม่ต้องมี LINE/OpenAI key:

```bash
npm run dev
curl http://localhost:3000/health
curl "http://localhost:3000/api/provinces?year=2026&field=patient_rate&min=300"
```

### ทดสอบด้วย REST Client extension (แทน curl)

ติดตั้ง extension **[REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)** ใน VS Code (หากยังไม่ได้ติดตั้งในขั้นตอนที่ 1) จากนั้นสร้างไฟล์ `api.http` ที่ root ของโครงการ แล้วคัดลอกเนื้อหาดังต่อไปนี้ไปวาง:

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

วิธีการใช้งาน:

1. รันคำสั่ง `npm run dev` เพื่อให้ server ทำงานที่ `localhost:3000` ก่อน
2. เปิดไฟล์ `api.http` ใน VS Code โดยเหนือแต่ละ request (บรรทัด `GET ...`) จะปรากฏลิงก์ขนาดเล็กระบุว่า **Send Request** (CodeLens)
3. คลิก **Send Request** ที่ request ที่ต้องการทดสอบ VS Code จะเปิดแท็บแสดงผลลัพธ์ (status code, headers, JSON response) ขึ้นมาด้านข้างให้โดยทันที โดยไม่จำเป็นต้องพิมพ์คำสั่งในเทอร์มินัล
4. สามารถแก้ไข query string ในไฟล์ แล้วกด **Send Request** ใหม่ได้ตามต้องการ เพื่อทดสอบพารามิเตอร์อื่น (เช่น เปลี่ยนค่า `min=500` เป็นค่าอื่น)

> ตัวแปร `@host` ที่ระบุไว้ต้นไฟล์ช่วยให้สามารถสลับไปทดสอบกับ server จริง (เช่น URL หลังการ deploy) ได้โดยแก้ไขเพียงค่าเดียว โดยไม่ต้องแก้ไขทุก request

---

## 5. สร้าง LINE Official Account และ Messaging API channel

1. เข้าไปที่ [LINE Official Account Manager](https://manager.line.biz/) เพื่อสร้าง Official Account (OA) ใหม่ ในกรณีที่ยังไม่มี
2. เข้าไปที่ [LINE Developers Console](https://developers.line.biz/console/) เพื่อสร้างหรือเลือก **Provider**
3. ภายใน Provider ดังกล่าว เลือก **Create a new channel** แล้วเลือกประเภท **Messaging API**
4. กรอกข้อมูลของ channel (ชื่อ หมวดหมู่ และผูกกับ OA ที่สร้างไว้ในขั้นตอนที่ 1)
5. เข้าไปที่ channel ที่สร้างขึ้น เลือกแท็บ **Basic settings** แล้วคัดลอก **Channel secret**
6. เลือกแท็บ **Messaging API** เลื่อนลงไปยังส่วน **Channel access token** แล้วกด **Issue** เพื่อออก long-lived token จากนั้นคัดลอกค่าดังกล่าว
7. นำค่าทั้งสองนี้ไปวางในไฟล์ `.env`:

```
LINE_CHANNEL_SECRET=xxxxxxxxxxxxxxxx
LINE_CHANNEL_ACCESS_TOKEN=xxxxxxxxxxxxxxxx...
```

8. ในแท็บ **Messaging API** เดียวกันนี้ ขอให้ปิดการใช้งานสองรายการดังต่อไปนี้ก่อน เพื่อป้องกันการตอบกลับซ้ำซ้อนระหว่างระบบของ LINE และบอทของเรา:
   - **Auto-reply messages** ปิดการใช้งาน (Disabled)
   - **Greeting messages** สามารถเปิดหรือปิดได้ตามความเหมาะสม แต่ Auto-reply messages จำเป็นต้องปิด
   - **Webhook** จะดำเนินการเปิดใช้งานในขั้นตอนที่ 8

---

## 6. ตอบกลับด้วย Text และ Flex Message

`backend/core.js` ในส่วนของ `LineService`:

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

**action ใน Flex Message ที่ใช้งานบ่อยที่สุด คือ `type: "message"`** ซึ่งเมื่อผู้ใช้กดปุ่มดังกล่าว ระบบจะถือเสมือนว่าผู้ใช้พิมพ์ข้อความ `text` นั้นเข้ามาเอง ส่งผลให้ logic ในฝั่ง `respond()` สามารถจัดการได้ในรูปแบบเดียวกัน ทั้งจากการพิมพ์ข้อความและการกดปุ่ม โดยไม่ต้องเขียน handler แยกต่างหาก

---

## 7. Webhook: รับข้อความจาก LINE อย่างปลอดภัย

ระบบ LINE จะส่งคำขอแบบ POST มายัง webhook ทุกครั้งที่เกิด event ขึ้น (เช่น มีผู้ใช้พิมพ์ข้อความ กดปุ่ม หรือเพิ่มเป็นเพื่อน) โดยจะแนบ header `x-line-signature` ซึ่งเป็นค่า HMAC-SHA256 ของ body ที่ลงนามด้วย **Channel secret** มาด้วย จึงจำเป็นต้องตรวจสอบ (verify) ค่าดังกล่าวก่อนเชื่อถือ payload ทุกครั้ง เพื่อป้องกันมิให้ผู้ไม่หวังดีส่งคำขอปลอมมายัง webhook

เพิ่มฟังก์ชันสำหรับตรวจสอบลายเซ็นในไฟล์ `backend/core.js`:

```js
import { createHmac, timingSafeEqual } from 'crypto';

export function validSignature(rawBody, signature, secret) {
    const expected = Buffer.from(createHmac('sha256', secret).update(rawBody).digest('base64'));
    const actual = Buffer.from(signature);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
}
```

> ข้อควรระวัง: การคำนวณ hash จะต้องใช้ **raw body ในรูปแบบ buffer ดิบ** เท่านั้น มิใช่ object ที่ผ่านการ parse ด้วย `express.json()` แล้ว เนื่องจากการ stringify ซ้ำอาจทำให้ได้ byte ที่ไม่ตรงกับที่ LINE ใช้ในการลงนาม จึงต้องใช้ `express.raw()` สำหรับ route นี้โดยเฉพาะ
>
> ใช้ `timingSafeEqual` แทนการเทียบด้วย `===` เนื่องจากการเทียบ string ด้วย `===` จะหยุดการเทียบทันทีที่พบตัวอักษรไม่ตรงกัน (ไม่เป็น constant-time) ซึ่งอาจก่อให้เกิดความเสี่ยงจาก timing attack ในการเดาค่า signature ได้ทีละไบต์ในทางทฤษฎี ดังนั้นการเปรียบเทียบค่า HMAC หรือข้อมูลลับใดๆ ควรใช้ฟังก์ชันนี้เสมอ

เพิ่ม route `/webhook` ในไฟล์ `backend/routes.js` (โดยใช้ `LineService` ที่ได้สร้างไว้ในขั้นตอนก่อนหน้า):

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

    let payload;
    try {
        payload = JSON.parse(rawBody.toString('utf-8'));
    } catch {
        return res.status(400).send('Bad Request');
    }

    try {
        for (const event of payload.events || []) {
            if (event.type === 'message' && event.message?.type === 'text') {
                await lineService.reply(event.replyToken, await lineService.respond(event.message.text));
            } else if (event.type === 'follow') {
                await lineService.reply(event.replyToken, await lineService.respond('เมนู'));
            }
        }
    } catch (err) {
        console.error('webhook event handling failed', err); // บันทึก log แล้วยังตอบ 200 ต่อไป ไม่ปล่อยให้ throw หลุดออกจาก async handler
    }

    res.send('OK'); // ต้องตอบ 200 อย่างรวดเร็ว ไม่ว่าการ reply ไปยัง LINE จะสำเร็จหรือไม่ มิฉะนั้น LINE จะส่งคำขอซ้ำหรือตัดการเชื่อมต่อ
});
```

> ข้อสังเกต: Express เวอร์ชัน 4 จะไม่ดักจับ (catch) exception ที่เกิดจากการ throw ภายใน async route handler ให้โดยอัตโนมัติ หากไม่มีการครอบด้วย try/catch (เช่น กรณี `JSON.parse` พบ body ที่ไม่ใช่รูปแบบ JSON ที่ถูกต้อง หรือ `lineService.respond()` เกิด throw) จะกลายเป็น unhandled rejection ซึ่งอาจส่งผลให้ process ทั้งระบบหยุดทำงาน มิใช่เพียงคำขอ (request) นั้นเพียงรายการเดียว

---

## 8. เปิด ngrok และเชื่อม Webhook URL

```bash
npm run dev          # รัน Express ที่ localhost:3000
ngrok http 3000       # เปิด tunnel ในเทอร์มินัลอีกหน้าต่าง
```

ngrok จะแสดง URL ในรูปแบบ `https://abcd-1234.ngrok-free.app` ขอให้คัดลอกค่าดังกล่าวไว้

1. กลับไปที่ LINE Developers Console เลือก channel ของเรา แล้วเข้าไปที่แท็บ **Messaging API**
2. ในช่อง **Webhook URL** ให้ระบุ `https://<ngrok-domain>/webhook`
3. กดปุ่ม **Verify** หากโค้ดถูกต้องและ server กำลังทำงานอยู่ จะปรากฏผลลัพธ์เป็น Success (LINE จะส่งคำขอทดสอบเข้ามาจริง แล้วตรวจสอบว่า server ตอบกลับด้วยสถานะ 200 หรือไม่)
4. เปิดสวิตช์ **Use webhook** ให้เป็นสถานะ Enabled

การทดสอบ: เปิดแอปพลิเคชัน LINE เพิ่ม OA เป็นเพื่อน (สามารถสแกน QR code ที่แสดงใน Console ได้) แล้วลองพิมพ์ข้อความเพื่อทดสอบการสนทนา จากนั้นตรวจสอบ log ฝั่ง terminal ว่ามีคำขอ (request) เข้ามาหรือไม่

> ทุกครั้งที่เริ่มต้นคำสั่ง `ngrok http` ใหม่ (สำหรับบัญชีแบบไม่มีค่าใช้จ่าย) จะได้รับ domain ใหม่เสมอ จึงต้องย้อนกลับไปดำเนินการตามขั้นตอนที่ 2-4 ใหม่ทุกครั้ง

---

## 9. Rich Menu: สร้างรูปเมนูและ action

Rich Menu คือแถบเมนูในรูปแบบรูปภาพที่ปรากฏอยู่ด้านล่างของหน้าสนทนา เมื่อผู้ใช้กดจะสามารถส่ง action ได้ (เช่น การส่งข้อความ หรือการเปิดลิงก์)

### 9.1 ออกแบบรูปภาพ

ข้อกำหนดของ LINE มีดังนี้:

- ขนาดภาพต้องเป็น **2500×1686px** (รูปแบบ full) หรือ **2500×843px** (รูปแบบ compact) เพื่อให้พื้นที่ของปุ่มต่างๆ พอดีกับภาพ
- ไฟล์ภาพต้องเป็นนามสกุล `.png` หรือ `.jpg` และมีขนาดไม่เกิน 1MB

ขอให้แบ่งพื้นที่ของภาพเป็นตารางปุ่ม (เช่น 3 คอลัมน์ × 2 แถว) แล้วบันทึกค่าพิกัด (pixel bounds) ของแต่ละช่องไว้ใช้ในการกำหนดค่า `areas` (ตัวอย่างไฟล์ในโครงการนี้ คือ `linerichmenu.jpg`)

### 9.2 สร้างเมนูผ่าน Messaging API

ขอให้เขียนสคริปต์สำหรับตั้งค่าแยกต่างหาก (รันเพียงครั้งเดียวในขั้นตอน deploy หรือเมื่อมีการเปลี่ยนแปลงเมนู) เช่น `backend/scripts/setup_richmenu.js`:

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

ข้อควรพิจารณาที่สำคัญ:

- จำเป็นต้อง **สร้าง rich menu เพื่อให้ได้ `richMenuId` ก่อน แล้วจึงอัปโหลดรูปภาพในลำดับต่อไป** โดยไม่สามารถสลับลำดับได้
- การกำหนด `action: { type: 'message', text: ... }` จะทำให้การกดปุ่มมีผลเสมือนการพิมพ์ข้อความ จึงสามารถใช้ logic เดิมใน `LineService.respond()` ได้ โดยไม่ต้องเขียน handler แยกสำหรับ rich menu
- ในกรณีที่ต้องการให้ผู้ใช้บางรายเห็นเมนูที่แตกต่างจากเมนู default ให้ใช้ `linkRichMenuIdToUser(userId, richMenuId)` แทนการใช้ `setDefaultRichMenu`
- เมื่อต้องการแก้ไขเมนูใหม่ ควรเรียก `deleteRichMenu(oldId)` เพื่อลบเมนูเก่าก่อนเสมอ มิฉะนั้นผู้ใช้บางรายอาจยังคงเห็นเมนูเก่าตกค้างอยู่

---

## 10. เชื่อม ChatGPT (OpenAI API)

1. เข้าไปที่ [OpenAI Platform](https://platform.openai.com/) เพื่อสร้าง API key
2. นำค่าดังกล่าวไปกำหนดไว้ในไฟล์ `.env`:

```
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-4.1-mini
```

การเลือกใช้ `gpt-4.1-mini` เนื่องจากมีความรวดเร็วและค่าใช้จ่ายต่ำ เหมาะสำหรับการอบรมเชิงปฏิบัติการ ทั้งนี้สามารถเปลี่ยน model ได้จากค่า environment โดยไม่ต้องแก้ไขโค้ด

เพิ่มฟังก์ชันสำหรับเรียกใช้งาน **Responses API** ในไฟล์ `core.js` พร้อมด้วยกลไก fallback สำหรับกรณีที่ไม่มี API key (เช่น ในระหว่างการสาธิตที่ยังไม่ต้องการผูก billing):

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

แนวคิดสำคัญ 2 ประการ:

- **RAG ในรูปแบบที่เรียบง่าย**: กำหนดให้ AI ตอบกลับโดยอ้างอิงจากข้อมูลที่ส่งให้เท่านั้น (ผ่านค่า `instructions`) โดยไม่อนุญาตให้สร้างตัวเลขขึ้นเอง เพื่อป้องกันปรากฏการณ์ hallucination ในข้อมูลด้านสุขภาพซึ่งมีความเสี่ยงสูง
- **Graceful fallback**: ในกรณีที่ไม่มี `OPENAI_API_KEY` หรือการเรียก API ไม่สำเร็จ ระบบจะต้องมี response สำรองให้เสมอ มิให้เกิด error ตลอดทั้ง flow ซึ่งมีความสำคัญอย่างยิ่งในระหว่างการสาธิตแบบสด (live demo)

---

## 11. กราฟสถิติด้วย QuickChart

ไม่จำเป็นต้องติดตั้ง chart library หรือ render รูปภาพด้วยตนเอง โดยใช้บริการ [QuickChart](https://quickchart.io/) ซึ่งรับค่า Chart.js config ในรูปแบบ JSON ผ่าน query string แล้วส่งกลับเป็นรูปภาพ PNG ในรูปแบบ URL โดยตรง สามารถนำไปส่งเป็น LINE image message ได้ทันที:

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

ในฝั่งของฟังก์ชัน `reply()` จะส่งข้อความ 2 รายการต่อเนื่องกัน (image และ caption text) เนื่องจาก LINE image message ไม่มีช่องสำหรับ caption ในตัวเอง:

```js
messages = [
    { type: 'image', originalContentUrl: payload.originalContentUrl, previewImageUrl: payload.previewImageUrl },
    { type: 'text', text: payload.caption },
];
```

---

## 12. สรุป REST endpoints ทั้งหมด

| Endpoint | Method | คำอธิบาย |
|---|---|---|
| `/health` | GET | health check |
| `/api/provinces` | GET | คืนข้อมูลทุกจังหวัด รองรับ query `province`, `field`, `min`, `max`, `year` |
| `/api/provinces/:province` | GET | ค้นหาจังหวัดเดียวด้วย path param |
| `/webhook` | POST | รับ event จาก LINE (ตรวจสอบ signature ก่อนเสมอ) |

สามารถสรุปจุดเชื่อมต่อ (integration) ของแต่ละฟีเจอร์เป็น flow เดียวได้ดังนี้:

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

## 13. Deploy ขึ้นใช้งานจริง

ngrok เหมาะสำหรับใช้งานในขั้นตอนพัฒนาหรือการอบรมในห้องเรียนเท่านั้น เนื่องจาก URL ที่ได้รับไม่มีความถาวรและจะหยุดทำงานเมื่อปิดเครื่อง สำหรับการใช้งานจริงจำเป็นต้องมีองค์ประกอบดังต่อไปนี้:

- บริการโฮสติ้งที่รองรับ HTTPS แบบถาวร (เช่น Render, Railway, Fly.io หรือ VM ร่วมกับ reverse proxy ที่มี TLS certificate)
- กำหนดค่า environment variables (`LINE_CHANNEL_SECRET`, `LINE_CHANNEL_ACCESS_TOKEN`, `OPENAI_API_KEY`) ไว้ในระบบของผู้ให้บริการโฮสติ้ง มิใช่ในที่เก็บโค้ด (repository)
- กลับไปอัปเดต Webhook URL ในแท็บ Messaging API ให้เป็น domain จริง แล้วกดปุ่ม Verify อีกครั้ง
- พิจารณาใช้ process manager (เช่น `pm2`) หรือให้แพลตฟอร์มประเภท PaaS ดำเนินการ restart ให้โดยอัตโนมัติ ในกรณีที่ process หยุดทำงาน

---

## 14. จุดที่มักพลาด / Checklist

- [ ] ไฟล์ `.env` ถูกเพิ่มลงใน `.gitignore` **ก่อน** ที่จะมีค่า secret บันทึกอยู่ในไฟล์ (หาก commit ไปแล้ว จำเป็นต้อง revoke token เดิมและออกใหม่ การลบไฟล์ออกจาก git history เพียงอย่างเดียวยังไม่เพียงพอ)
- [ ] ปิดการใช้งาน **Auto-reply messages** ใน LINE Official Account Manager ก่อนทำการทดสอบ มิฉะนั้นจะปรากฏทั้งข้อความอัตโนมัติของ LINE และข้อความตอบกลับของบอทพร้อมกัน
- [ ] route `/webhook` ต้องใช้ `express.raw()` มิใช่ `express.json()` เนื่องจากการตรวจสอบ signature จะไม่ผ่าน หาก body ถูก parse และ stringify ซ้ำ
- [ ] เปรียบเทียบค่า signature ด้วย `crypto.timingSafeEqual` มิใช่ `===` เพื่อป้องกัน timing attack ในการเดาค่า signature
- [ ] ครอบ `JSON.parse(rawBody)` และ loop สำหรับประมวลผล event ด้วย try/catch ใน route `/webhook` เนื่องจาก Express เวอร์ชัน 4 จะไม่ดักจับ exception ใน async handler ให้โดยอัตโนมัติ หากไม่ดำเนินการดังกล่าว body ที่มีรูปแบบไม่ถูกต้องเพียงครั้งเดียวอาจทำให้ process ทั้งระบบหยุดทำงาน
- [ ] ทุกครั้งที่เริ่มต้น ngrok แบบไม่มีค่าใช้จ่ายใหม่ ต้องอัปเดต Webhook URL และกด Verify อีกครั้ง
- [ ] การสร้าง rich menu ต้อง **เรียก createRichMenu ก่อนเสมอ** จึงค่อยเรียก `setRichMenuImage` โดยใช้ `richMenuId` ที่ได้รับ
- [ ] หากไม่มี `OPENAI_API_KEY` ระบบต้องสามารถ fallback ไปใช้คำตอบจากข้อมูลในเครื่องได้ โดยไม่เกิด error ตลอดทั้ง flow
- [ ] route ที่ต้องตอบกลับ LINE อย่างรวดเร็ว (`/webhook`) ควรตอบกลับด้วยสถานะ `200 OK` แม้ reply message จะล้มเหลวภายใน เพื่อป้องกันการ retry ซ้ำจากฝั่ง LINE
- [ ] ไม่ควรอนุญาตให้ AI สร้างตัวเลขสถิติขึ้นเอง โดยกำหนดผ่าน `instructions` ให้ใช้เฉพาะข้อมูลที่ส่งให้เท่านั้น ซึ่งมีความสำคัญอย่างยิ่งสำหรับข้อมูลด้านสุขภาพ
- [ ] กรณีฉุกเฉิน (เช่น อาการที่มีความเร่งด่วน) ควรมี guardrail เพื่อแนะนำให้โทรแจ้งสายด่วน 1669 ในทันที โดยไม่ปล่อยให้ AI เป็นผู้ตอบกลับเพียงฝ่ายเดียว
