# LINE Bot + AI Health Assistant Workshop

โปรเจ็คนี้เป็น LINE Bot สำหรับดูสถิติผู้ป่วยรายจังหวัด โดยตั้งใจให้โค้ดสั้นและทำตามง่าย ล้อกับ `assets/linerichmenu.jpg` ที่มี 3 ช่องหลัก:

1. `สรุปข้อมูล` แสดงกราฟหลายปีของจังหวัด
2. `กรองข้อมูล` เลือกจังหวัด แล้วเลือกปี
3. `AI` ให้ AI อธิบายค่าที่ query ได้

ข้อมูลตัวอย่างอยู่ใน `backend/data/province_stats.json`

## โครงสร้างไฟล์

```text
cmu-workshop-line-ai/
├── api.http
├── backend/
│   ├── core.js
│   ├── data/province_stats.json
│   ├── routes.js
│   └── server.js
├── frontend/
│   └── index.html
├── assets/
│   └── linerichmenu.jpg
├── package.json
└── .env.example
```

ไฟล์หลัก:

- `backend/server.js` เปิด Express server
- `backend/routes.js` รวม API และ LINE webhook
- `backend/core.js` รวม logic 3 feature ของ bot
- `api.http` ใช้ทดสอบ API และ webhook

## ติดตั้งและรัน

ติดตั้ง dependencies:

```bash
npm install
```

สร้างไฟล์ `.env`:

```env
PORT=3001
LINE_CHANNEL_SECRET=
LINE_CHANNEL_ACCESS_TOKEN=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
```

รัน server:

```bash
npm run dev
```

เปิด health check:

```text
http://localhost:3001/health
```

## Environment

- `LINE_CHANNEL_SECRET` ใช้ตรวจ `x-line-signature` ว่า webhook มาจาก LINE จริง
- `LINE_CHANNEL_ACCESS_TOKEN` ใช้ส่งข้อความตอบกลับผู้ใช้ใน LINE
- `OPENAI_API_KEY` ใช้เปิดฟีเจอร์ AI
- `OPENAI_MODEL` ระบุ model ที่ใช้ เช่น `gpt-4.1-mini`

ถ้าไม่มี `OPENAI_API_KEY` ระบบยังทำงานได้ โดยคำสั่ง `AI จังหวัด ปี` จะ fallback เป็นข้อความสถิติธรรมดา

## คำสั่ง LINE Bot

```text
เมนู
```

แสดง Flex Message ที่มี 3 feature: `สรุปข้อมูล`, `กรองข้อมูล`, `AI`

```text
สรุปข้อมูล
```

ให้ bot บอกตัวอย่างการพิมพ์

```text
สรุปข้อมูล เชียงราย
```

ส่งกราฟสรุปผู้ป่วยหลายปีของจังหวัดเชียงราย

```text
กรองข้อมูล
```

แสดงเมนูเลือกจังหวัด

```text
เลือกปี เชียงราย
```

แสดงเมนูเลือกปีของจังหวัดเชียงราย

```text
เชียงราย 2026
```

แสดงข้อมูลจังหวัดเชียงรายปี 2026

```text
AI
```

ให้ bot บอกตัวอย่างการพิมพ์

```text
AI เชียงราย 2026
```

ให้ AI อธิบายข้อมูลเชียงรายปี 2026 เป็นภาษาไทยสั้น ๆ

## Feature Flow

### 1. สรุปข้อมูลเป็นกราฟ

ผู้ใช้พิมพ์:

```text
สรุปข้อมูล เชียงราย
```

โค้ดจะ:

1. ค้นข้อมูลทุกปีของจังหวัดเชียงราย
2. สร้าง QuickChart URL
3. ส่ง image message กลับไปใน LINE

### 2. กรองข้อมูล จังหวัด > ปี

ผู้ใช้พิมพ์:

```text
กรองข้อมูล
```

จากนั้นเลือกจังหวัด เช่น `เชียงราย` แล้วเลือกปี เช่น `2026`

สุดท้าย bot จะส่งข้อความสถิติของจังหวัดและปีนั้น

### 3. AI อธิบายค่าที่ query ได้

ผู้ใช้พิมพ์:

```text
AI เชียงราย 2026
```

โค้ดจะ:

1. query ข้อมูล `เชียงราย 2026`
2. ส่งข้อมูลตัวเลขให้ OpenAI
3. ให้ AI อธิบายเป็นภาษาไทยแบบสั้นและไม่แต่งตัวเลขเพิ่ม

## ทดสอบ API ด้วย `api.http`

ไฟล์ `api.http` ตั้ง host ไว้ที่ port 3001 แล้ว:

```http
@host = http://localhost:3001
```

ตัวอย่าง request:

```http
### Health check
GET {{host}}/health

### List provinces for a specific year
GET {{host}}/api/provinces?year=2026

### Look up a single province by query param
GET {{host}}/api/provinces?province=เชียงราย&year=2026
```

## ทดสอบ Webhook Signature

เริ่ม server ก่อน:

```bash
npm run dev
```

คำนวณ signature จาก body เดียวกับที่จะส่ง:

```bash
BODY='{"events":[]}'
SIG=$(node -r dotenv/config -e "const { createHmac } = require('crypto'); const body = process.argv[1]; console.log(createHmac('sha256', process.env.LINE_CHANNEL_SECRET).update(body).digest('base64'))" "$BODY")
echo $SIG
```

ทดสอบด้วย `curl`:

```bash
curl -i -X POST http://localhost:3001/webhook \
  -H "Content-Type: application/json" \
  -H "x-line-signature: $SIG" \
  --data "$BODY"
```

ผลที่ควรได้:

```text
HTTP/1.1 200 OK

OK
```

ทดสอบ signature ผิด:

```bash
curl -i -X POST http://localhost:3001/webhook \
  -H "Content-Type: application/json" \
  -H "x-line-signature: wrong-signature" \
  --data '{"events":[]}'
```

ผลที่ควรได้:

```text
HTTP/1.1 400 Bad Request

Bad Request
```

ถ้าจะทดสอบใน `api.http` ให้นำค่าจาก `echo $SIG` ไปใส่:

```http
@lineSignature = paste-generated-signature-here
```

ข้อสำคัญ: body ใน `api.http` ต้องตรงกับ `BODY='{"events":[]}'` แบบตัวอักษรต่อหน่วย ถ้าเพิ่มช่องว่างหรือขึ้นบรรทัดใน JSON แล้ว signature อาจไม่ตรง

## ตั้งค่า LINE Developers

1. เปิด public HTTPS URL มาที่เครื่อง เช่น ngrok หรือ Cloudflare Tunnel
2. ตั้งค่า Webhook URL เป็น `https://your-public-url/webhook`
3. เปิด `Use webhook`
4. กด `Verify`
5. เพิ่ม bot เป็นเพื่อน แล้วลองพิมพ์ `เมนู`

ถ้า `Verify` ผ่านแต่ bot ไม่ตอบกลับ ให้ตรวจ `LINE_CHANNEL_ACCESS_TOKEN` และดู error ใน terminal

## Troubleshooting

ปัญหา: webhook ได้ `Bad Request`

- ตรวจ `LINE_CHANNEL_SECRET`
- ตรวจว่า body ที่ใช้คำนวณ signature ตรงกับ body ที่ส่งจริง
- ตรวจ header `x-line-signature`

ปัญหา: bot ไม่ตอบใน LINE

- ตรวจ `LINE_CHANNEL_ACCESS_TOKEN`
- ตรวจว่า webhook URL เป็น public HTTPS
- ตรวจว่า LINE Developers เปิด `Use webhook`
- ดู error ใน terminal ที่รัน server

ปัญหา: AI ไม่อธิบาย

- ตรวจ `OPENAI_API_KEY`
- ตรวจ `OPENAI_MODEL`
- ถ้าไม่มี key ระบบจะ fallback เป็นข้อความสถิติธรรมดา
