# CMU HealthLine AI Workshop

โปรเจกต์สมบูรณ์สำหรับการอบรม **การพัฒนา LINE Bot และ Large Language Models (LLMs) สำหรับงานด้านสาธารณสุข** วันที่ 1–2 กรกฎาคม 2569

โปรเจกต์นี้ครอบคลุมทุกหัวข้อในกำหนดการ:

- Express.js webhook และการตรวจสอบ `X-Line-Signature`
- LINE Messaging API, Text Message, Flex Message และ Rich Menu
- FAQ จาก static JSON พร้อมการค้นหาภาษาไทยแบบไม่ต้องใช้ API
- กราฟสถิติสุขภาพแบบรูปภาพจริง (เรนเดอร์ด้วย Chart.js ผ่าน QuickChart) ตามคำขอ
- OpenAI Responses API พร้อม RAG จากฐานความรู้ท้องถิ่น
- Health-safety guardrails, ข้อความฉุกเฉิน และคำเตือนทางการแพทย์
- Web simulator สำหรับทดลองได้ทันทีโดยยังไม่ต้องมี LINE/OpenAI key
- สคริปต์สร้าง Rich Menu

## เริ่มใช้งานแบบเร็ว

ต้องการ Node.js 20 ขึ้นไป

```bash
npm install
cp .env.example .env
npm run dev
```

เปิด <http://localhost:3001> แล้วทดลองถาม `ไข้หวัดใหญ่ป้องกันอย่างไร` หรือพิมพ์ `สถิติ`

## เชื่อมต่อ LINE

1. สร้าง Messaging API channel ที่ [LINE Developers Console](https://developers.line.biz/console/)
2. ใส่ `LINE_CHANNEL_SECRET` และ `LINE_CHANNEL_ACCESS_TOKEN` ใน `.env`
3. รันแอป แล้วเปิด public URL ด้วย `ngrok http 3001`
4. ตั้ง Webhook URL เป็น `https://<ngrok-domain>/webhook` และกด Verify
5. เปิด **Use webhook** และปิดข้อความตอบกลับอัตโนมัติใน LINE Official Account Manager

Webhook จริงจะปฏิเสธ request ที่ไม่มีหรือลายเซ็นไม่ถูกต้องเสมอ

## เปิดใช้ AI + RAG

ใส่ `OPENAI_API_KEY` ใน `.env` แอปจะส่งเฉพาะคำถามและ FAQ ที่ค้นพบไปยัง OpenAI Responses API หากไม่ใส่ key ระบบจะตอบจาก FAQ แบบ local โดยอัตโนมัติ

ค่าเริ่มต้น `OPENAI_MODEL=gpt-4.1-mini` ถูกเลือกเพื่อให้ workshop ใช้งานง่ายและประหยัด เปลี่ยน model ได้จาก environment โดยไม่แก้โค้ด

RAG ในโปรเจกต์นี้ตั้งใจใช้ lexical retrieval ที่อ่านง่ายในชั้นเรียน ข้อมูลจริงอยู่ที่ `data/health_faq.json`; เปลี่ยนเป็น vector database หรือ embeddings ได้ภายหลังโดยคง interface `FAQRepository.search()` เดิม

## Rich Menu

เตรียมภาพ PNG/JPEG ขนาด 2500×1686 แล้วรัน:

```bash
node backend/scripts/create_rich_menu.js path/to/rich-menu.png
```

เมนูมี 3 ช่อง: FAQ, สถิติ และความช่วยเหลือ สคริปต์จะสร้าง อัปโหลด และตั้งเป็น default rich menu

## คำสั่งที่มีในแชต

| คำสั่ง | ผลลัพธ์ |
|---|---|
| `เมนู`, `help`, `ช่วยเหลือ` | Flex Message แนะนำการใช้งาน |
| `faq`, `คำถาม` | รายการหัวข้อ FAQ |
| `สถิติ`, `stats` | รายการหัวข้อสถิติให้เลือก |
| คำขอกราฟ เช่น `ขอกราฟฝุ่น PM2.5`, `กราฟไข้หวัดใหญ่รายเดือน` | OpenAI เลือกชุดข้อมูลที่ตรงที่สุดจาก `data/health_stats.json` แล้วสร้าง Flex Card bar chart (ถ้าไม่มี API key จะค้นหาในเครื่องแบบ lexical แทน) |
| คำถามสุขภาพทั่วไป | ค้น FAQ และให้ AI สรุปแบบมีแหล่งอ้างอิง |
| ข้อความฉุกเฉิน เช่น `เจ็บหน้าอก หายใจไม่ออก` | แนะนำให้โทร 1669 ทันที |

Endpoints: `GET /health` สำหรับ health check, `POST /api/chat` สำหรับ simulator, `POST /webhook` สำหรับ LINE

## โครงสร้าง

```text
server.js             # Express app entrypoint
app/
  core.js              # FAQ search, AI assistant, Flex builders, LINE service
  routes.js             # web, simulator และ signed webhook
data/               # FAQ และข้อมูลสถิติ
scripts/            # Rich Menu provisioning
```

> โปรเจกต์นี้ให้ข้อมูลเพื่อการเรียนรู้และสุขศึกษา ไม่ใช่การวินิจฉัยหรือคำแนะนำแทนแพทย์ หากมีอาการฉุกเฉินให้โทร 1669
