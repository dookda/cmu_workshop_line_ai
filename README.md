# LINE OA + AI Health Assistant Workshop

คู่มือนี้สำหรับผู้เริ่มต้นที่ยังไม่มีพื้นฐานเขียนโปรแกรม เป้าหมายคือ copy code ไปวางทีละไฟล์ แล้วค่อย ๆ เห็นว่า LINE Official Account รับข้อความจากผู้ใช้ ส่งเข้า server ของเรา และใช้ AI ช่วยอธิบายข้อมูลได้อย่างไร

โปรเจ็คนี้ทำ 3 feature ให้ตรงกับ Rich Menu ใน `assets/linerichmenu.jpg`

1. `สรุปข้อมูล` สร้างกราฟจากข้อมูลรายจังหวัด
2. `กรองข้อมูล` เลือกจังหวัด แล้วเลือกปี
3. `AI` อธิบายข้อมูลที่ query ได้เป็นภาษาไทย

## ภาพรวม

```text
ผู้ใช้ใน LINE
   ↓ พิมพ์ข้อความ หรือกด Rich Menu
LINE Official Account
   ↓ ส่ง webhook มาที่ /webhook
Express server ของเรา
   ↓ ค้นข้อมูล / สร้างกราฟ / เรียก AI
ตอบกลับไปที่ LINE
```

คำศัพท์สำคัญ:

- LINE OA คือบัญชี LINE Official Account ที่ผู้ใช้เพิ่มเป็นเพื่อน
- Messaging API คือระบบที่ทำให้ server ของเราคุยกับ LINE OA ได้
- Webhook คือ URL ที่ LINE จะยิง event มาหาเราเมื่อผู้ใช้พิมพ์ข้อความ
- Channel secret ใช้ตรวจว่า request มาจาก LINE จริง
- Channel access token ใช้ให้ server ส่งข้อความตอบกลับ LINE

## สิ่งที่ต้องเตรียม

ติดตั้งในเครื่อง:

- Node.js 20 ขึ้นไป
- Visual Studio Code
- REST Client extension ใน VS Code หรือใช้ Postman/Insomnia ก็ได้

บัญชีที่ต้องมี:

- LINE account
- LINE Official Account
- LINE Developers account
- OpenAI API key ถ้าต้องการเปิดฟีเจอร์ AI จริง

ถ้ายังไม่มี OpenAI API key โปรเจ็คยังรันได้ แต่คำสั่ง `AI เชียงราย 2026` จะตอบเป็นข้อความสถิติธรรมดาแทน

## โครงสร้างไฟล์

```text
cmu-workshop-line-ai/
├── api.http
├── package.json
├── .env
├── backend/
│   ├── server.js
│   ├── routes.js
│   ├── core.js
│   └── data/
│       └── province_stats.json
├── frontend/
│   └── index.html
└── assets/
    └── linerichmenu.jpg
```

ไฟล์ที่เราจะสนใจมากที่สุด:

- `backend/server.js` เปิดเว็บ server
- `backend/routes.js` สร้าง API และ webhook
- `backend/core.js` เก็บ logic ของ bot
- `api.http` ใช้ทดสอบ request
- `.env` เก็บ secret ต่าง ๆ ห้ามส่งไฟล์นี้ขึ้น public repo

## ขั้นตอนที่ 1: สร้าง `package.json` และติดตั้ง package

เปิดไฟล์ `package.json` แล้ววาง code นี้:

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

- `"type": "module"` ทำให้เราใช้ `import ... from ...` ได้
- `"start"` ใช้รัน server แบบปกติ
- `"dev"` ใช้รัน server แบบ watch เมื่อแก้ไฟล์แล้ว Node จะ restart ให้
- `"dependencies"` คือ package ที่โปรเจ็คต้องใช้

จากนั้นเปิด terminal ในโฟลเดอร์โปรเจ็ค แล้วรัน:

```bash
npm install
```

คำสั่งนี้จะติดตั้ง package ที่โปรเจ็คใช้:

- `express` สำหรับสร้าง server
- `dotenv` สำหรับอ่านไฟล์ `.env`
- `@line/bot-sdk` สำหรับตอบกลับ LINE
- `openai` สำหรับเรียก AI

### Checkpoint 1: ตรวจว่า Node และ package พร้อมแล้ว

ตรวจ version ของ Node และ npm:

```bash
node -v
npm -v
```

ควรเห็นเลข version แสดงออกมา เช่น `v20...` หรือสูงกว่า

ตรวจว่า `package.json` อ่านได้:

```bash
node -e "console.log(require('./package.json').scripts)"
```

ควรเห็น `start` และ `dev`

จากนั้นลองดูว่า dependency ถูกติดตั้งแล้ว:

```bash
npm list express dotenv @line/bot-sdk openai
```

ถ้าไม่มี error แปลว่าพร้อมไปขั้นตอนถัดไป

## ขั้นตอนที่ 2: สร้างไฟล์ `.env`

สร้างไฟล์ชื่อ `.env` ที่ root ของโปรเจ็ค แล้วใส่:

```env
PORT=3000
LINE_CHANNEL_SECRET=
LINE_CHANNEL_ACCESS_TOKEN=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
```

ตอนแรกเว้นค่า LINE และ OpenAI ไว้ก่อนได้ เราจะทดสอบ API ในเครื่องก่อน

### Checkpoint 2: ตรวจว่า `.env` ถูกอ่านได้

ให้แน่ใจก่อนว่า terminal อยู่ที่ root ของโปรเจ็ค เช่นโฟลเดอร์ `cmu_workshop_line_ai` ไม่ใช่โฟลเดอร์อื่น

รัน:

```bash
node -r dotenv/config -e "console.log(process.env.PORT)"
```

ควรเห็น:

```text
3000
```

ถ้าได้ `undefined` ให้ตรวจ 2 อย่างนี้:

1. ตอนรันคำสั่งอยู่ผิดโฟลเดอร์ ให้ `cd` กลับมาที่ root ของโปรเจ็คก่อน
2. ไฟล์ `.env` ยังไม่มีบรรทัด `PORT=3000`

ใช้คำสั่งนี้เพื่อตรวจว่า `.env` มี key อะไรบ้าง โดยไม่แสดงค่า secret:

```bash
node -e "const fs=require('fs'); console.log(fs.readFileSync('.env','utf8').split(/\r?\n/).filter(line=>line && !line.startsWith('#')).map(line=>line.split('=')[0]).join('\n'))"
```

## ขั้นตอนที่ 3: สร้าง server

เปิดไฟล์ `backend/server.js` แล้ววาง code นี้:

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

- `dotenv/config` อ่านค่าใน `.env`
- `express.static` ทำให้เปิดไฟล์ใน `frontend/` ได้
- `router` คือ route ทั้งหมดที่เราจะเขียนใน `backend/routes.js`

### Checkpoint 3: ตรวจ syntax ของ server

ตอนนี้ยังไม่ต้องรัน server เพราะ `routes.js` และ `core.js` จะถูกเขียนในขั้นตอนถัดไปก่อน ให้ตรวจว่าไฟล์นี้ไม่มี syntax error:

```bash
node --check backend/server.js
```

ถ้าผ่าน จะไม่มีข้อความ error แสดงออกมา

## ขั้นตอนที่ 4: Draft layout ของ `backend/core.js`

ก่อนวาง code ยาว ๆ ให้ดูโครงร่างก่อนว่าไฟล์นี้แบ่งเป็นก้อนอะไรบ้าง

```js
// [C1] import package

// [C2] constant ข้อความและรายการจังหวัด

// [C3] ProvinceStatsRepository
// อ่านข้อมูล JSON และค้นหาข้อมูลจังหวัด

// [C4] helper functions
// สร้างข้อความ, parse จังหวัด+ปี, สร้าง chart URL

// [C5] Flex Message
// สร้างปุ่มเมนูสำหรับ LINE

// [C6] LineService
// รับข้อความผู้ใช้ แล้วเลือกว่าจะทำ feature ไหน

// [C7] validSignature
// ตรวจ webhook signature จาก LINE
```

เวลาอ่าน code ให้จำภาพนี้ไว้: repository หา data, helper สร้าง response, LineService เป็นตัวเลือก flow

เวลา copy code ให้ดูหมายเลขใน comment เช่น `// [C3] ProvinceStatsRepository` แล้ววางไว้ใต้ section หมายเลขเดียวกันในไฟล์ `backend/core.js`

## ขั้นตอนที่ 5: เริ่มเขียน `backend/core.js`

เปิดไฟล์ `backend/core.js` แล้วเริ่มจาก import และค่าคงที่:

```js
// [C1] import package
import { readFileSync } from 'fs';
import { createHmac, timingSafeEqual } from 'crypto';
import * as line from '@line/bot-sdk';
import OpenAI from 'openai';

// [C2] constant ข้อความและรายการจังหวัด
const RATE_FIELDS = ['patient', 'patient_rate', 'dead', 'dead_rate', 'cfr'];
const FEATURE_TEXT =
    'เลือกเมนูจาก Rich Menu หรือพิมพ์:\n' +
    '- สรุปข้อมูล เชียงราย\n' +
    '- กรองข้อมูล\n' +
    '- AI เชียงราย 2026';
const CHART_PROMPT = 'พิมพ์ "สรุปข้อมูล ชื่อจังหวัด" เช่น "สรุปข้อมูล เชียงราย"';
const AI_PROMPT = 'พิมพ์ "AI ชื่อจังหวัด ปี" เช่น "AI เชียงราย 2026"';
const QUICK_PROVINCES = ['เชียงราย', 'เชียงใหม่', 'กรุงเทพมหานคร', 'ชลบุรี', 'นครราชสีมา', 'ขอนแก่น'];
```

คำอธิบาย:

- `RATE_FIELDS` คือ field ที่ API อนุญาตให้ filter ได้
- `FEATURE_TEXT` คือข้อความ fallback ถ้าผู้ใช้พิมพ์ไม่ตรง pattern
- `QUICK_PROVINCES` คือจังหวัดที่จะแสดงในเมนูกรองข้อมูล

### Checkpoint 4: ตรวจ syntax หลังเริ่ม `core.js`

รัน:

```bash
node --check backend/core.js
```

ถ้าผ่าน แปลว่า import และค่าคงที่ยังเขียนถูกต้อง

## ขั้นตอนที่ 6: เพิ่ม Repository สำหรับอ่านข้อมูล

วางต่อจากค่าคงที่:

```js
// [C3] ProvinceStatsRepository — อ่านข้อมูล JSON และค้นหาข้อมูลจังหวัด
export class ProvinceStatsRepository {
    constructor(path) {
        this.items = JSON.parse(readFileSync(path, 'utf-8'));
        this.defaultYear = Math.max(...this.items.map(item => item.year));
    }

    findByProvince(name, year) {
        const keyword = name.trim().toLowerCase();
        const matches = this.items
            .filter(item => item.province.toLowerCase().includes(keyword))
            .filter(item => year === undefined || item.year === year)
            .sort((a, b) => a.year - b.year);
        if (!matches.length) return null;
        return year === undefined ? matches : matches[0];
    }

    yearsByProvince(name) {
        const records = this.findByProvince(name);
        return records ? records.map(item => item.year) : [];
    }

    query({ field = 'patient_rate', min, max, year = this.defaultYear } = {}) {
        const rateField = RATE_FIELDS.includes(field) ? field : 'patient_rate';
        return this.items
            .filter(item => item.year === year)
            .filter(item => min === undefined || item[rateField] >= min)
            .filter(item => max === undefined || item[rateField] <= max)
            .sort((a, b) => b[rateField] - a[rateField]);
    }
}
```

คำอธิบาย:

- `constructor` อ่านไฟล์ JSON หนึ่งครั้ง
- `findByProvince` ค้นหาจังหวัด และเลือกปีได้ถ้าส่ง `year`
- `yearsByProvince` ใช้ทำปุ่มเลือกปี
- `query` ใช้กับ API `/api/provinces`

### Checkpoint 5: ทดสอบ Repository

รัน:

```bash
node --input-type=module -e "import { ProvinceStatsRepository } from './backend/core.js'; const repo = new ProvinceStatsRepository('./backend/data/province_stats.json'); console.log(repo.findByProvince('เชียงราย', 2026));"
```

ควรเห็นข้อมูล JSON ของจังหวัดเชียงรายปี 2026 แสดงออกมา ถ้าเห็น `null` ให้ตรวจชื่อจังหวัดหรือปีในข้อมูล

## ขั้นตอนที่ 7: เพิ่ม helper สำหรับข้อความและ parser

วางต่อจาก class:

```js
// [C4] helper functions — สร้างข้อความ, parse จังหวัด+ปี, สร้าง chart URL
function textReply(text) {
    return { type: 'text', text };
}

function formatRecord({ province, year, patient, patient_rate, dead, dead_rate, cfr }) {
    return `จังหวัด${province} ปี ${year}\n` +
        `ผู้ป่วย: ${patient.toLocaleString()} คน (อัตรา ${patient_rate} ต่อแสนประชากร)\n` +
        `เสียชีวิต: ${dead.toLocaleString()} คน (อัตรา ${dead_rate})\n` +
        `CFR: ${cfr}%`;
}

function parseProvinceYear(text) {
    const match = text.trim().match(/^(.+?)\s+(\d{4})$/);
    return match ? { province: match[1].trim(), year: Number(match[2]) } : null;
}

function afterPrefix(text, prefix) {
    return text.startsWith(`${prefix} `) ? text.slice(prefix.length).trim() : null;
}
```

คำอธิบาย:

- `textReply` สร้าง payload สำหรับตอบข้อความธรรมดา
- `formatRecord` แปลงข้อมูล JSON เป็นข้อความภาษาไทย
- `parseProvinceYear` อ่านข้อความแบบ `เชียงราย 2026`
- `afterPrefix` อ่านข้อความแบบ `สรุปข้อมูล เชียงราย`

### Checkpoint 6: ตรวจ syntax หลังเพิ่ม helper

รัน:

```bash
node --check backend/core.js
```

ถ้าผ่าน แปลว่า helper ที่เพิ่มเข้ามาไม่มี syntax error

## ขั้นตอนที่ 8: เพิ่มฟังก์ชันสร้างกราฟ

วางต่อจาก helper:

```js
// [C4] helper functions — สร้างข้อความ, parse จังหวัด+ปี, สร้าง chart URL

...
function chartImage(records) {
    const province = records[0].province;
    const config = {
        type: 'bar',
        data: {
            labels: records.map(item => String(item.year)),
            datasets: [{ label: 'ผู้ป่วย (คน)', data: records.map(item => item.patient), backgroundColor: '#20A475' }],
        },
        options: {
            plugins: { title: { display: true, text: `สรุปข้อมูลจังหวัด${province}` }, legend: { display: false } },
            scales: { y: { beginAtZero: true } },
        },
    };
    const url = `https://quickchart.io/chart?width=800&height=500&backgroundColor=white&v=4&c=${encodeURIComponent(JSON.stringify(config))}`;
    return {
        type: 'image',
        originalContentUrl: url,
        previewImageUrl: url,
        caption: `สรุปข้อมูลจังหวัด${province} (${records[0].year}-${records[records.length - 1].year})`,
    };
}
```

คำอธิบาย:

- เราใช้ QuickChart เพื่อสร้างรูปกราฟจาก URL
- LINE จะได้รับ image message พร้อม caption
- feature นี้ทำงานเมื่อผู้ใช้พิมพ์ `สรุปข้อมูล เชียงราย`

### Checkpoint 7: ตรวจ syntax หลังเพิ่มกราฟ

รัน:

```bash
node --check backend/core.js
```

ถ้าผ่าน แปลว่า config ของกราฟและ template string ยังถูกต้อง

## ขั้นตอนที่ 9: เพิ่ม Flex Message สำหรับ Rich Menu flow

วางต่อจาก `chartImage`:

```js
// [C5] Flex Message — สร้างปุ่มเมนูสำหรับ LINE
function flex(altText, contents) {
    return { type: 'flex', altText, contents };
}

function button(label, text, color) {
    return {
        type: 'box',
        layout: 'horizontal',
        backgroundColor: color,
        cornerRadius: '10px',
        paddingAll: '14px',
        action: { type: 'message', label, text },
        contents: [
            { type: 'text', text: label, weight: 'bold', color: '#173F35' },
            { type: 'text', text: '›', align: 'end', color: '#0C5C4C', size: 'xl' },
        ],
    };
}

export function menuFlex() {
    return flex('เมนู HealthLine Stats', {
        type: 'bubble',
        body: {
            type: 'box',
            layout: 'vertical',
            spacing: 'md',
            contents: [
                { type: 'text', text: 'HealthLine Stats', weight: 'bold', size: 'xl', color: '#0C5C4C' },
                button('สรุปข้อมูล', 'สรุปข้อมูล', '#FFE0C2'),
                button('กรองข้อมูล', 'กรองข้อมูล', '#CFF6DF'),
                button('AI', 'AI', '#D7F0FF'),
            ],
        },
    });
}

function listFlex(title, rows) {
    return flex(title, {
        type: 'bubble',
        body: { type: 'box', layout: 'vertical', spacing: 'sm', contents: rows },
    });
}

function provinceListFlex() {
    return listFlex('กรองข้อมูล', QUICK_PROVINCES.map(province =>
        button(province, `เลือกปี ${province}`, '#CFF6DF')));
}

function yearListFlex(province, years) {
    return listFlex(`เลือกปี ${province}`, years.map(year =>
        button(String(year), `${province} ${year}`, '#FFE8C7')));
}
```

คำอธิบาย:

- `menuFlex` คือเมนู 3 feature
- `provinceListFlex` คือรายการจังหวัด
- `yearListFlex` คือรายการปีของจังหวัดนั้น

### Checkpoint 8: ทดสอบ Flex Message

รัน:

```bash
node --input-type=module -e "import { menuFlex } from './backend/core.js'; console.log(JSON.stringify(menuFlex(), null, 2));"
```

ควรเห็น JSON ที่มีข้อความ `สรุปข้อมูล`, `กรองข้อมูล`, และ `AI`

## ขั้นตอนที่ 10: เพิ่ม LineService

วางต่อจาก Flex Message:

```js
// [C6] LineService — รับข้อความผู้ใช้ แล้วเลือกว่าจะทำ feature ไหน
export class LineService {
    constructor(accessToken, provinceStats, { apiKey = '', model = 'gpt-4.1-mini' } = {}) {
        this.provinceStats = provinceStats;
        this.model = model;
        this.lineClient = accessToken ? new line.messagingApi.MessagingApiClient({ channelAccessToken: accessToken }) : null;
        this.openai = apiKey ? new OpenAI({ apiKey, fetch: globalThis.fetch }) : null;
    }

    async respond(input) {
        const text = input.trim();
        const lower = text.toLowerCase();

        if (['เมนู', 'menu'].includes(lower)) return menuFlex();
        if (text === 'สรุปข้อมูล') return textReply(CHART_PROMPT);
        if (text === 'กรองข้อมูล') return provinceListFlex();
        if (lower === 'ai') return textReply(AI_PROMPT);

        const chartProvince = afterPrefix(text, 'สรุปข้อมูล');
        if (chartProvince) return this.chart(chartProvince.replace(/\s+\d{4}$/, ''));

        const yearProvince = afterPrefix(text, 'เลือกปี');
        if (yearProvince) return this.yearPicker(yearProvince);

        if (lower.startsWith('ai ')) return this.ai(text.slice(3).trim());

        const query = parseProvinceYear(text);
        if (query) return this.record(query.province, query.year);

        return textReply(FEATURE_TEXT);
    }

    chart(province) {
        const records = this.provinceStats.findByProvince(province);
        return records ? chartImage(records) : textReply(`ไม่พบข้อมูลจังหวัด "${province}"`);
    }

    yearPicker(province) {
        const years = this.provinceStats.yearsByProvince(province);
        return years.length ? yearListFlex(province, years) : textReply(`ไม่พบข้อมูลจังหวัด "${province}"`);
    }

    record(province, year) {
        const record = this.provinceStats.findByProvince(province, year);
        return record ? textReply(formatRecord(record)) : textReply(`ไม่พบข้อมูลจังหวัด "${province}" ปี ${year}`);
    }

    async ai(text) {
        const query = parseProvinceYear(text);
        if (!query) return textReply(AI_PROMPT);

        const record = this.provinceStats.findByProvince(query.province, query.year);
        if (!record) return textReply(`ไม่พบข้อมูลจังหวัด "${query.province}" ปี ${query.year}`);
        if (!this.openai) return textReply(formatRecord(record));

        try {
            const response = await this.openai.responses.create({
                model: this.model,
                instructions:
                    'อธิบายสถิติโรคติดต่อภาษาไทยแบบสั้น 1-2 ประโยค ใช้เฉพาะข้อมูลที่ให้มา ห้ามแต่งตัวเลขเพิ่ม และใช้ปี ค.ศ. ตามข้อมูล',
                input:
                    `จังหวัด${record.province} ปี ${record.year}: ผู้ป่วย ${record.patient} คน ` +
                    `อัตราป่วย ${record.patient_rate} ต่อแสนประชากร เสียชีวิต ${record.dead} คน ` +
                    `อัตราตาย ${record.dead_rate} CFR ${record.cfr}%`,
            });
            return textReply(response.output_text.trim());
        } catch (err) {
            console.error('OpenAI request failed; using local fallback', err.message);
            return textReply(formatRecord(record));
        }
    }

    async reply(replyToken, payload) {
        if (!this.lineClient) return;

        let messages;
        if (payload.type === 'image') {
            messages = [
                { type: 'image', originalContentUrl: payload.originalContentUrl, previewImageUrl: payload.previewImageUrl },
                { type: 'text', text: payload.caption },
            ];
        } else if (payload.type === 'flex') {
            messages = [{ type: 'flex', altText: payload.altText, contents: payload.contents }];
        } else {
            messages = [{ type: 'text', text: payload.text }];
        }

        await this.lineClient.replyMessage({ replyToken, messages });
    }
}
```

คำอธิบาย flow ใน `respond`:

```text
เมนู                 → menuFlex()
สรุปข้อมูล           → บอกตัวอย่าง
สรุปข้อมูล เชียงราย   → chart()
กรองข้อมูล           → provinceListFlex()
เลือกปี เชียงราย      → yearPicker()
เชียงราย 2026        → record()
AI                  → บอกตัวอย่าง
AI เชียงราย 2026     → ai()
```

### Checkpoint 9: ทดสอบ bot logic โดยยังไม่ต้องต่อ LINE

รัน:

```bash
node --input-type=module -e "import { ProvinceStatsRepository, LineService } from './backend/core.js'; const repo = new ProvinceStatsRepository('./backend/data/province_stats.json'); const bot = new LineService('', repo); for (const text of ['เมนู','สรุปข้อมูล เชียงราย','กรองข้อมูล','เลือกปี เชียงราย','เชียงราย 2026','AI เชียงราย 2026']) { const res = await bot.respond(text); console.log(text, '=>', res.type); }"
```

ผลที่ควรได้:

```text
เมนู => flex
สรุปข้อมูล เชียงราย => image
กรองข้อมูล => flex
เลือกปี เชียงราย => flex
เชียงราย 2026 => text
AI เชียงราย 2026 => text
```

จุดนี้สำคัญมาก เพราะเราทดสอบ logic หลักของ bot ได้โดยยังไม่ต้องมี LINE OA, webhook, หรือ OpenAI API key

## ขั้นตอนที่ 11: เพิ่ม signature validation

วางไว้ท้ายไฟล์ `backend/core.js`:

```js
// [C7] validSignature — ตรวจ webhook signature จาก LINE
export function validSignature(rawBody, signature, secret) {
    const expected = Buffer.from(createHmac('sha256', secret).update(rawBody).digest('base64'));
    const actual = Buffer.from(signature);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
}
```

คำอธิบาย:

- LINE จะส่ง header ชื่อ `x-line-signature`
- เราใช้ `LINE_CHANNEL_SECRET` สร้าง signature จาก raw body
- ถ้า signature ตรง แปลว่า request เชื่อถือได้

### Checkpoint 10: ตรวจ syntax หลังเพิ่ม signature

รัน:

```bash
node --check backend/core.js
```

ถ้าผ่าน แปลว่า `core.js` พร้อมให้ `routes.js` import ไปใช้แล้ว

## ขั้นตอนที่ 12: เตรียม `api.http` สำหรับ test endpoint ทีละตัว

เปิดไฟล์ `api.http` แล้ววาง:

```http
@host = http://localhost:3000
@lineSignature = paste-generated-signature-here

### [R4] Health check
GET {{host}}/health

### [R6] List provinces filtered by field + range
GET {{host}}/api/provinces?field=patient_rate&min=500

### [R6] List provinces for a specific year
GET {{host}}/api/provinces?year=2026

### [R6] Look up a single province by query param for a specific year
GET {{host}}/api/provinces?province=เชียงราย&year=2026

### [R6] Look up a single province by path param
GET {{host}}/api/provinces/เชียงราย

### [R6] Province not found
GET {{host}}/api/provinces?province=ไม่มีจังหวัดนี้&year=2026

### [R7] LINE webhook signature test
POST {{host}}/webhook
Content-Type: application/json
x-line-signature: {{lineSignature}}

{"events":[]}

### [R7] LINE webhook invalid signature test
POST {{host}}/webhook
Content-Type: application/json
x-line-signature: wrong-signature

{"events":[]}
```

ถ้าใช้ VS Code REST Client ให้กด `Send Request` เหนือ request ที่ต้องการ

แนวคิดของขั้นนี้คือสร้าง endpoint เสร็จหนึ่งตัว แล้วกด test request ของ endpoint นั้นทันที ไม่ต้องรอเขียนครบทั้งไฟล์แล้วค่อย test

## ขั้นตอนที่ 13: เขียน route แบบเพิ่มทีละก้อน แล้ว test ทันที

ก่อนวาง code ให้ดู Draft layout ของ `backend/routes.js` ก่อน:

```js
// [R1] import package และ core logic

// [R2] อ่านค่า environment จาก .env

// [R3] สร้าง service ที่ route ต้องใช้

// [R4] สร้าง router และ health check

// [R5] helper สำหรับส่งข้อมูลจังหวัด

// [R6] API routes สำหรับทดสอบข้อมูลจังหวัด

// [R7] LINE webhook route
```

เวลา copy code ให้ดูหมายเลข `// [R...]` เหมือนกับ `core.js` จะช่วยให้วางถูกตำแหน่งและ debug ง่ายขึ้น

### ขั้นตอนที่ 13.1 `[R1-R4]`: วาง route พื้นฐาน แล้ว test `/health`

ขั้นตอนนี้ตรงกับ Draft layout ส่วน `[R1]`, `[R2]`, `[R3]`, และ `[R4]`

เปิดไฟล์ `backend/routes.js` แล้ววาง code ชุดแรกนี้:

```js
// [R1] import package และ core logic
import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import { ProvinceStatsRepository, LineService, validSignature } from './core.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// [R2] อ่านค่า environment จาก .env
const {
    LINE_CHANNEL_SECRET = '',
    LINE_CHANNEL_ACCESS_TOKEN = '',
    OPENAI_API_KEY = '',
    OPENAI_MODEL = 'gpt-4.1-mini',
} = process.env;

// [R3] สร้าง service ที่ route ต้องใช้
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

// [R4] สร้าง router และ health check
const router = express.Router();

router.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'healthline-ai' });
});

// [R5] helper สำหรับส่งข้อมูลจังหวัด
// จะเติมในขั้นตอนที่ 13.2

// [R6] API routes สำหรับทดสอบข้อมูลจังหวัด
// จะเติมในขั้นตอนที่ 13.2

// [R7] LINE webhook route
// จะเติมในขั้นตอนที่ 13.3

export default router;
```

ตรวจ syntax:

```bash
node --check backend/routes.js
```

รัน server:

```bash
npm run dev
```

ถ้า server ทำงาน จะเห็น URL ประมาณนี้ใน terminal:

```text
http://localhost:3000
```

เปิด terminal นี้ค้างไว้ แล้วกลับไปที่ไฟล์ `api.http`

กด `Send Request` ที่:

```http
### [R4] Health check
GET {{host}}/health
```

ผลที่ควรได้:

```json
{
  "status": "ok",
  "service": "healthline-ai"
}
```

ถ้าไม่ได้ `200 OK` ให้แก้ `[R4]` ก่อน อย่าเพิ่งไปต่อ `[R5]` หรือ `[R6]`

### ขั้นตอนที่ 13.2 `[R5-R6]`: เพิ่ม province API แล้ว test ทันที

หยุด server ก่อนด้วย `Ctrl+C`

ขั้นตอนนี้ตรงกับ Draft layout ส่วน `[R5]` และ `[R6]`

จากนั้นเปิด `backend/routes.js` แล้วแทนที่ placeholder `[R5]` และ `[R6]` ด้วย code นี้ โดยวางไว้เหนือ placeholder `[R7]` และเหนือ `export default router;`

```js
// [R5] helper สำหรับส่งข้อมูลจังหวัด
function sendProvince(res, provinceStats, name, year) {
    const match = provinceStats.findByProvince(name, year);
    return match ? res.json(match) : res.status(404).json({ error: 'province not found' });
}

// [R6] API routes สำหรับทดสอบข้อมูลจังหวัด
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

// [R7] LINE webhook route
// จะเติมในขั้นตอนที่ 13.3
```

ตรวจ syntax:

```bash
node --check backend/routes.js
```

รัน server ใหม่:

```bash
npm run dev
```

กลับไปที่ `api.http` แล้วกด `Send Request` ทีละอัน:

```http
### [R6] List provinces for a specific year
GET {{host}}/api/provinces?year=2026
```

ควรได้ array ของหลายจังหวัด

```http
### [R6] Look up a single province by query param for a specific year
GET {{host}}/api/provinces?province=เชียงราย&year=2026
```

ควรได้ object จังหวัดเชียงรายปี 2026

```http
### [R6] Look up a single province by path param
GET {{host}}/api/provinces/เชียงราย
```

ควรได้ array ของจังหวัดเชียงรายหลายปี

ถ้าต้องการ test กรณีไม่พบข้อมูล ให้เพิ่ม request นี้ใน `api.http` แล้วกด `Send Request`:

```http
### [R6] Province not found
GET {{host}}/api/provinces?province=ไม่มีจังหวัดนี้&year=2026
```

ผลที่ควรได้คือ `404 Not Found`:

```json
{
  "error": "province not found"
}
```

ถ้า request เหล่านี้ไม่ผ่าน ให้แก้ `[R5]` หรือ `[R6]` ก่อน อย่าเพิ่งไปต่อ `[R7]`

### ขั้นตอนที่ 13.3 `[R7]`: เพิ่ม LINE webhook แล้ว test ทันที

หยุด server ก่อนด้วย `Ctrl+C`

ขั้นตอนนี้ตรงกับ Draft layout ส่วน `[R7]`

จากนั้นเปิด `backend/routes.js` แล้วแทนที่ placeholder `[R7]` ด้วย code นี้ โดยวางไว้เหนือ `export default router;`

```js
// [R7] LINE webhook route
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
            if (!event.replyToken) continue;
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
```

ตรวจ syntax:

```bash
node --check backend/routes.js
```

รัน server ใหม่:

```bash
npm run dev
```

เริ่มจาก test แบบ signature ผิดก่อน เพราะไม่ต้องสร้างค่า signature:

```http
### [R7] LINE webhook invalid signature test
POST {{host}}/webhook
Content-Type: application/json
x-line-signature: wrong-signature

{"events":[]}
```

ผลที่ควรได้คือ `400 Bad Request`

ถ้ายังไม่มี `LINE_CHANNEL_SECRET` ให้หยุด test `[R7]` ตรงนี้ก่อน แล้วไปสร้าง LINE OA ในขั้นตอนถัดไป

ถ้ามี `LINE_CHANNEL_SECRET` แล้ว ค่อย test signature ถูก โดยสร้างค่า signature ใน terminal:

```bash
BODY='{"events":[]}'
SIG=$(node -r dotenv/config -e "const { createHmac } = require('crypto'); const body = process.argv[1]; console.log(createHmac('sha256', process.env.LINE_CHANNEL_SECRET).update(body).digest('base64'))" "$BODY")
echo $SIG
```

นำค่าที่ได้จาก `echo $SIG` ไปแทน `@lineSignature` ด้านบนของ `api.http`:

```http
@lineSignature = paste-generated-signature-here
```

จากนั้นกด `Send Request` ที่:

```http
### [R7] LINE webhook signature test
POST {{host}}/webhook
Content-Type: application/json
x-line-signature: {{lineSignature}}

{"events":[]}
```

ผลที่ควรได้คือ `200 OK` และข้อความ `OK`

ถ้าขั้นไหนไม่ผ่าน ให้แก้ขั้นนั้นก่อน อย่าเพิ่งไปต่อ LINE OA

## ขั้นตอนที่ 14: สร้าง LINE Official Account และ Messaging API

ทำครั้งเดียวใน LINE:

1. เข้า LINE Official Account Manager
2. สร้าง Official Account ใหม่
3. เข้า LINE Developers Console
4. สร้าง Provider ถ้ายังไม่มี
5. สร้าง Messaging API channel หรือเชื่อม LINE OA เข้ากับ Messaging API
6. คัดลอก `Channel secret`
7. สร้างและคัดลอก `Channel access token`

นำค่าไปใส่ใน `.env`:

```env
LINE_CHANNEL_SECRET=ใส่ Channel secret
LINE_CHANNEL_ACCESS_TOKEN=ใส่ Channel access token
```

หลังแก้ `.env` ให้หยุด server แล้วรันใหม่ เพราะ `.env` ถูกอ่านตอน server เริ่มทำงาน

### Checkpoint 15: ตรวจว่ามีค่า LINE ใน `.env`

รัน:

```bash
node -r dotenv/config -e "console.log(Boolean(process.env.LINE_CHANNEL_SECRET), Boolean(process.env.LINE_CHANNEL_ACCESS_TOKEN))"
```

ควรเห็น:

```text
true true
```

ถ้าเห็น `false` แปลว่ายังไม่ได้ใส่ค่า หรือชื่อ key ใน `.env` สะกดไม่ตรง

## ขั้นตอนที่ 15: ทดสอบ webhook signature ถูกด้วย `api.http`

หลังจากได้ `LINE_CHANNEL_SECRET` แล้ว ให้กลับมาทดสอบ `[R7] LINE webhook route` แบบ signature ถูก

สร้าง signature จาก body ตัวอย่าง:

```bash
BODY='{"events":[]}'
SIG=$(node -r dotenv/config -e "const { createHmac } = require('crypto'); const body = process.argv[1]; console.log(createHmac('sha256', process.env.LINE_CHANNEL_SECRET).update(body).digest('base64'))" "$BODY")
echo $SIG
```

นำค่าจาก `echo $SIG` ไปใส่ด้านบนของ `api.http`:

```http
@lineSignature = paste-generated-signature-here
```

จากนั้นกด `Send Request` ที่:

```http
### [R7] LINE webhook signature test
POST {{host}}/webhook
Content-Type: application/json
x-line-signature: {{lineSignature}}

{"events":[]}
```

ผลที่ควรได้คือ `200 OK` และข้อความ:

```text
OK
```

ข้อสำคัญ: body ใน `api.http` ต้องตรงกับ `BODY='{"events":[]}'` แบบเป๊ะ ๆ ถ้าเพิ่มช่องว่างหรือขึ้นบรรทัดใน JSON signature อาจไม่ตรง

## ขั้นตอนที่ 16: เปิด webhook ให้ LINE เข้ามาที่เครื่องเรา

LINE ต้องเรียก URL แบบ public HTTPS ได้ แต่เครื่องเราคือ localhost จึงต้องใช้ tunnel เช่น ngrok หรือ Cloudflare Tunnel

ตัวอย่าง URL ที่ต้องได้:

```text
https://your-public-url.example/webhook
```

นำ URL นี้ไปใส่ใน LINE Developers:

1. เปิดหน้า Messaging API channel
2. ไปที่ Webhook settings
3. ใส่ Webhook URL เป็น `https://.../webhook`
4. เปิด `Use webhook`
5. กด `Verify`

ถ้า Verify ผ่าน แปลว่า LINE ยิง request มาถึง server ของเราแล้ว

### Checkpoint 16: ดู terminal ตอนกด Verify

ตอนกด `Verify` ใน LINE Developers ให้กลับมาดู terminal ที่รัน `npm run dev`

- ถ้า Verify ผ่านและ terminal ไม่มี error แปลว่า webhook route ใช้งานได้
- ถ้าเห็น `Bad Request` ให้กลับไปตรวจ `LINE_CHANNEL_SECRET`
- ถ้า tunnel หยุดทำงาน LINE จะยิงมาไม่ถึง server

## ขั้นตอนที่ 17: ทดลองคุยกับ bot

เพิ่ม LINE OA เป็นเพื่อน แล้วลองพิมพ์:

```text
เมนู
```

ควรเห็นปุ่ม 3 feature

ลอง feature กราฟ:

```text
สรุปข้อมูล เชียงราย
```

ลอง feature กรองข้อมูล:

```text
กรองข้อมูล
```

จากนั้นกดจังหวัด แล้วกดปี

ลอง feature AI:

```text
AI เชียงราย 2026
```

ถ้ายังไม่ได้ใส่ `OPENAI_API_KEY` ระบบจะตอบเป็นข้อความสถิติแทน

### Checkpoint 17: ทดสอบ 3 feature ใน LINE

ให้ทดสอบตามลำดับนี้:

1. พิมพ์ `เมนู` ต้องเห็นปุ่ม 3 ปุ่ม
2. พิมพ์ `สรุปข้อมูล เชียงราย` ต้องได้รูปกราฟ
3. พิมพ์ `กรองข้อมูล` ต้องเห็นรายการจังหวัด
4. กดจังหวัด แล้วกดปี ต้องได้ข้อความสถิติ
5. พิมพ์ `AI เชียงราย 2026` ต้องได้ข้อความอธิบาย หรือ fallback เป็นข้อความสถิติถ้ายังไม่มี OpenAI key

ถ้า feature แรกผ่านแต่ feature หลังไม่ผ่าน ให้ดู error ใน terminal แล้วแก้ทีละ feature

## ขั้นตอนที่ 18: ตั้งค่า OpenAI

ใส่ค่าใน `.env`:

```env
OPENAI_API_KEY=ใส่ OpenAI API key
OPENAI_MODEL=gpt-4.1-mini
```

หยุด server แล้วรันใหม่:

```bash
npm run dev
```

ลองพิมพ์ใน LINE:

```text
AI เชียงราย 2026
```

ระบบจะ query ข้อมูลก่อน แล้วส่งเฉพาะตัวเลขของ record นั้นให้ AI อธิบาย

### Checkpoint 18: ตรวจ OpenAI key

รัน:

```bash
node -r dotenv/config -e "console.log(Boolean(process.env.OPENAI_API_KEY), process.env.OPENAI_MODEL)"
```

ควรเห็น:

```text
true gpt-4.1-mini
```

จากนั้นลองพิมพ์ใน LINE:

```text
AI เชียงราย 2026
```

ถ้าคำตอบยังเป็นข้อความสถิติธรรมดา ให้ดู terminal ว่ามีข้อความ `OpenAI request failed` หรือไม่

## ขั้นตอนที่ 19: สรุปว่าแต่ละ feature อยู่ตรงไหน

```text
Feature: สรุปข้อมูล
ข้อความที่พิมพ์: สรุปข้อมูล เชียงราย
โค้ดหลัก: LineService.respond → chart → chartImage
ผลลัพธ์: image message
```

```text
Feature: กรองข้อมูล
ข้อความที่พิมพ์: กรองข้อมูล → เลือกปี เชียงราย → เชียงราย 2026
โค้ดหลัก: LineService.respond → provinceListFlex → yearPicker → record
ผลลัพธ์: flex message และ text message
```

```text
Feature: AI
ข้อความที่พิมพ์: AI เชียงราย 2026
โค้ดหลัก: LineService.respond → ai
ผลลัพธ์: text message จาก AI หรือ fallback เป็นข้อมูลสถิติ
```

## แบบฝึกหัดต่อยอด

1. เพิ่มจังหวัดใน `QUICK_PROVINCES`
2. เปลี่ยนสีปุ่มใน `button(...)`
3. เปลี่ยน prompt ใน `ai(...)` ให้ตอบสั้นลงหรือเป็น bullet
4. เพิ่ม field ในกราฟ เช่น ผู้เสียชีวิต แทนจำนวนผู้ป่วย
5. เพิ่มคำสั่งใหม่ เช่น `อันดับ 10 จังหวัด`
