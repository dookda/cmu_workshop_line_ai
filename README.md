# HealthLine AI — LINE Bot สถิติโรคติดต่อ สำหรับกรมควบคุมโรค

โครงการตัวอย่างสำหรับทีมเฝ้าระวังและสื่อสารความเสี่ยงของ **กรมควบคุมโรค (Department of Disease Control)** พัฒนาขึ้นในการอบรม **การพัฒนา LINE Bot และ Large Language Models (LLMs) สำหรับงานด้านสาธารณสุข** วันที่ 1–2 กรกฎาคม 2569

คู่มือฉบับนี้อธิบายขั้นตอนการพัฒนาโครงการดังกล่าวตั้งแต่เริ่มต้น โดยนำเสนอเป็นลำดับขั้นตอนจนสามารถสร้าง LINE Bot ที่ตอบกลับข้อมูลสถิติผู้ป่วยรายจังหวัดได้ (สามารถปรับใช้กับข้อมูลโรคเฝ้าระวังหรือรหัส ICD-10 ของกรมควบคุมโรคได้) เชื่อมต่อกับ ChatGPT (OpenAI) จัดทำกราฟเป็นรูปภาพ และมี Rich Menu สำหรับการใช้งานที่สะดวกยิ่งขึ้น

## วิธีการใช้คู่มือนี้

คู่มือฉบับนี้เขียนขึ้นโดยไม่ถือว่าผู้อ่านมีพื้นฐานการเขียนโปรแกรมมาก่อน ทุกขั้นตอนจึงถูกแบ่งให้เล็กที่สุดเท่าที่จะทำได้ พร้อมคำอธิบาย "ทำไมต้องทำแบบนี้" และจุด "ทดสอบ" ก่อนไปขั้นตอนถัดไปเสมอ — ขอให้อ่านและทำตามทีละขั้นตอนอย่างละเอียด ไม่ต้องรีบ และไม่ต้องเดาขั้นตอนล่วงหน้า

ก่อนเริ่ม ขอให้ทำความรู้จักคำศัพท์พื้นฐาน 2 คำที่จะปรากฏซ้ำตลอดทั้งคู่มือ:

- **Terminal (เทอร์มินัล)** คือโปรแกรมสำหรับพิมพ์คำสั่งสั่งงานคอมพิวเตอร์โดยตรง (ไม่ใช่การคลิกเมาส์) ในคู่มือนี้จะเปิดผ่าน VS Code เอง (เมนู **Terminal → New Terminal** หรือกด `` Ctrl+` ``) จึงไม่ต้องเปิดโปรแกรม Terminal/Command Prompt แยกต่างหาก
- **คำสั่ง (command)** คือข้อความที่พิมพ์ในเทอร์มินัลแล้วกด Enter เพื่อสั่งให้คอมพิวเตอร์ทำงานอย่างหนึ่ง ทุกคำสั่งในคู่มือนี้จะอยู่ในกล่องสีเทาแบบนี้ — ให้คัดลอกไปวางในเทอร์มินัล (คลิกขวา → Paste หรือ `Ctrl+V`) แล้วกด **Enter** เพื่อรัน

วิธีใช้คู่มือ:

- ตัวอย่างโค้ด (code block) ทุกรายการจะระบุไว้ก่อนเสมอว่าให้ **คัดลอกไปวางในไฟล์ใด** (เช่น `backend/core.js`, `backend/routes.js`) กรุณาเปิดไฟล์ดังกล่าวใน VS Code แล้ววางโค้ดตามที่ระบุไว้ ส่วนที่ขึ้นต้นด้วย `$` หรืออยู่ในกล่องที่บอกว่า "รันคำสั่งนี้" คือคำสั่งที่ต้องพิมพ์ในเทอร์มินัล ไม่ใช่โค้ดที่ต้องวางในไฟล์
- กรุณาดำเนินการตามลำดับขั้นตอนที่ 1 ถึง 11 **ทีละขั้นตอนเล็กๆ โดยไม่ข้ามขั้นตอนใด** เนื่องจากโค้ดในขั้นตอนถัดไปจะอ้างอิงถึงไฟล์หรือฟังก์ชันที่สร้างไว้ในขั้นตอนก่อนหน้าเสมอ
- หลังจากวางโค้ดในแต่ละขั้นตอนแล้ว ขอให้รันคำสั่งทดสอบที่ระบุไว้ใต้หัวข้อ **ทดสอบ** ทันที (เช่น `curl`, `node -e "..."`) เพื่อตรวจสอบว่าขั้นตอนดังกล่าวทำงานได้ถูกต้อง ก่อนดำเนินการในขั้นตอนต่อไป
- หากรันคำสั่งทดสอบแล้วได้ผลลัพธ์ไม่ตรงกับที่คู่มือระบุไว้ **ห้ามข้ามไปขั้นตอนถัดไป** ให้ย้อนกลับไปอ่านโค้ดของขั้นตอนนั้นอีกครั้งว่าพิมพ์/วางตรงทุกตัวอักษรหรือไม่ (จุด, comma, วงเล็บ มีผลทั้งหมด) เนื่องจากภาษาโปรแกรมไม่ยอมรับเครื่องหมายที่ผิดแม้แต่ตัวเดียว

## สารบัญ

1. [เตรียมเครื่องมือ: VS Code, Node.js, ngrok และ OpenAI API key](#1-เตรียมเครื่องมือ-vs-code-nodejs-ngrok-และ-openai-api-key)
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

---

## 1. เตรียมเครื่องมือ: VS Code, Node.js, ngrok และ OpenAI API key

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

### สมัครและสร้าง OpenAI API key (สำหรับเชื่อมต่อ ChatGPT)

โครงการนี้ใช้ **OpenAI Responses API** เพื่อให้ ChatGPT ช่วยอธิบายข้อมูลสถิติเป็นภาษาที่เข้าใจง่าย (รายละเอียดการเรียกใช้งานอยู่ในขั้นตอนที่ 10) จึงควรสมัครและออก API key ไว้ตั้งแต่ขั้นตอนเตรียมเครื่องมือ เพื่อให้พร้อมใช้งานทันทีเมื่อถึงขั้นตอนนั้น

1. เข้าไปที่ **[platform.openai.com](https://platform.openai.com/)** แล้วสมัครสมาชิกหรือเข้าสู่ระบบด้วยบัญชีที่มีอยู่
2. ผูกบัตรเครดิตและเติมเครดิต (billing) ไว้ล่วงหน้าที่เมนู **Settings → Billing** เนื่องจาก Responses API เป็นบริการแบบเสียค่าใช้จ่ายตามการใช้งานจริง (pay-as-you-go) ไม่มีโควต้าใช้งานฟรีให้ตั้งแต่ต้น
3. ไปที่เมนู **[API keys](https://platform.openai.com/api-keys)** กดปุ่ม **Create new secret key** ตั้งชื่อ key (เช่น `cmu-workshop-line-ai`) แล้วกด **Create secret key**
4. คัดลอกค่า key ที่ขึ้นต้นด้วย `sk-` ไว้ทันที (ระบบจะแสดงให้เห็นเพียงครั้งเดียวเท่านั้น หากปิดหน้าต่างไปแล้วจะต้องสร้าง key ใหม่)
5. นำค่าดังกล่าวไปวางในไฟล์ `.env` ที่ตัวแปร `OPENAI_API_KEY` ในขั้นตอนที่ 2 (เตรียมโครงการ)

> ขอแนะนำให้ตั้งค่า **Usage limits** (วงเงินการใช้งานต่อเดือน) ไว้ในเมนู Billing ด้วย เพื่อป้องกันค่าใช้จ่ายเกินคาดหากมีการเรียก API ผิดพลาดซ้ำๆ ระหว่างการพัฒนาหรือทดสอบ

---

## 2. เริ่มต้นโครงการและติดตั้งไลบรารี

หัวข้อนี้แบ่งเป็นขั้นตอนย่อยทีละจุด ขอให้ทำตามลำดับและรันคำสั่งตรวจสอบ ("ทดสอบ") ทุกครั้งก่อนไปขั้นตอนถัดไป เพื่อให้ทราบได้ทันทีว่าจุดใดเกิดปัญหา หากดำเนินการหลายขั้นตอนพร้อมกันแล้วเกิด error จะไม่สามารถระบุสาเหตุที่แท้จริงได้

### 2.1 สร้างโฟลเดอร์โปรเจกต์

```powershell
# Windows (PowerShell)
mkdir cmu-healthline-ai; cd cmu-healthline-ai
```

```bash
# macOS / Linux (bash)
mkdir cmu-healthline-ai && cd cmu-healthline-ai
```

**คำอธิบาย**: สร้างโฟลเดอร์เปล่าสำหรับเก็บโค้ดทั้งหมดของโครงการ แล้วเข้าไปอยู่ในโฟลเดอร์นั้นทันที (`cd`) เพื่อให้คำสั่งทั้งหมดในขั้นตอนถัดไปถูกรันอยู่ในตำแหน่งที่ถูกต้องเสมอ ใช้ `;` แทน `&&` บน PowerShell รุ่นที่มากับ Windows 10/11 โดยปริยาย (5.1) เนื่องจาก `&&` รองรับเฉพาะ PowerShell 7 ขึ้นไป

### 2.2 กำหนดค่าโครงการด้วย npm init

```bash
npm init -y
```

**คำอธิบาย**: คำสั่งนี้สร้างไฟล์ `package.json` ขึ้นมาโดยอัตโนมัติ (flag `-y` คือยอมรับค่าเริ่มต้นทั้งหมดโดยไม่ถามคำถามทีละข้อ) ไฟล์นี้ทำหน้าที่เป็น "บัตรประจำตัว" ของโปรเจกต์ Node.js เก็บชื่อ เวอร์ชัน รายชื่อไลบรารีที่ติดตั้ง และคำสั่ง (scripts) สำหรับรันโปรเจกต์

**ทดสอบ**: เปิดไฟล์ `package.json` ที่ถูกสร้างขึ้น ควรเห็นโครงสร้างประมาณนี้ (ค่า `name`/`version` อาจต่างกันได้):

```json
{
  "name": "cmu-healthline-ai",
  "version": "1.0.0",
  "main": "index.js"
}
```

### 2.3 แก้ไข package.json ให้เป็น ES module พร้อม scripts

เปิดไฟล์ `package.json` ที่สร้างไว้ในขั้นตอนก่อนหน้า แล้ว**แก้ไข**ให้มีคีย์ดังนี้ (เพิ่มเข้าไปในไฟล์เดิม ไม่ต้องลบคีย์อื่นที่ `npm init` สร้างไว้):

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

**คำอธิบาย**:
- `"type": "module"` กำหนดให้ Node.js ตีความไฟล์ `.js` ทุกไฟล์ในโปรเจกต์เป็น ES module (ใช้ `import`/`export`) แทนรูปแบบ CommonJS (`require`/`module.exports`) แบบเดิม
- `scripts.start` และ `scripts.dev` คือคำสั่งย่อที่เรียกผ่าน `npm run` — `dev` ใช้ flag `--watch` ของ Node.js เพื่อรีสตาร์ท server อัตโนมัติทุกครั้งที่บันทึกไฟล์ ส่วน `start` ใช้สำหรับรันจริงโดยไม่ watch
- `engines.node` ระบุเวอร์ชัน Node.js ขั้นต่ำที่โปรเจกต์ต้องการ ให้ตรงกับเวอร์ชันที่ติดตั้งไว้ในขั้นตอนที่ 1

ขั้นตอนนี้ยังไม่มีคำสั่งให้รันทดสอบ เนื่องจากยังไม่มีไฟล์ `backend/server.js` ให้เรียก (จะสร้างในขั้นตอนที่ 4) — เพียงบันทึกไฟล์แล้วไปขั้นตอนถัดไป

### 2.4 ติดตั้งไลบรารีหลัก

```bash
npm install express dotenv @line/bot-sdk openai
```

**คำอธิบาย**: คำสั่งนี้ดาวน์โหลดไลบรารีทั้ง 4 รายการเข้าโฟลเดอร์ `node_modules/` และบันทึกชื่อ+เวอร์ชันไว้ในช่อง `dependencies` ของ `package.json` โดยอัตโนมัติ

| ไลบรารี | หน้าที่การใช้งาน |
|---|---|
| `express` | web server, route, REST API |
| `dotenv` | โหลดค่าจาก `.env` เข้า `process.env` |
| `@line/bot-sdk` | เรียกใช้งาน LINE Messaging API (reply, rich menu, signature) |
| `openai` | เรียกใช้งาน OpenAI Responses API (ChatGPT) |

**ทดสอบ**: รันคำสั่ง `npm ls --depth=0` ควรเห็นไลบรารีทั้ง 4 รายการแสดงอยู่ในรายการ โดยไม่มีข้อความ `UNMET DEPENDENCY` ปรากฏ

### 2.5 สร้างไฟล์ .env.example

สร้างไฟล์ใหม่ชื่อ `.env.example` ที่ root ของโปรเจกต์ แล้ววางเนื้อหานี้:

```bash
PORT=3000
LINE_CHANNEL_SECRET=
LINE_CHANNEL_ACCESS_TOKEN=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
```

**คำอธิบาย**: ไฟล์นี้เป็น "ต้นแบบ" ที่ระบุชื่อตัวแปร environment ทั้งหมดที่โค้ดในขั้นตอนถัดไปจะเรียกใช้ โดยไม่มีค่าจริงอยู่ภายใน จึงสามารถ commit เข้า git ได้อย่างปลอดภัย เพื่อให้ผู้ร่วมโครงการคนอื่นทราบว่าต้องตั้งค่าตัวแปรใดบ้างโดยไม่ต้องเปิดอ่านโค้ด

### 2.6 คัดลอกเป็นไฟล์ .env จริง

```powershell
# Windows (PowerShell)
Copy-Item .env.example .env
```

```bash
# macOS / Linux (bash)
cp .env.example .env
```

**คำอธิบาย**: ไฟล์ `.env` คือไฟล์ที่จะเก็บค่าจริง (เช่น API key) ในขั้นตอนถัดๆ ไป และ**ต้องไม่ commit เข้า git เด็ดขาด** จึงต้องแยกออกจาก `.env.example` ในขั้นตอนก่อนหน้าเสมอ

### 2.7 ป้องกันไม่ให้ secret หลุดเข้า git

สร้างไฟล์ `.gitignore` ที่ root ของโปรเจกต์ (หากยังไม่มี) แล้วเพิ่มเนื้อหาดังนี้:

```
node_modules/
.env
```

**คำอธิบาย**: ขอให้ดำเนินการขั้นตอนนี้**ก่อน**ที่จะเริ่มเขียนโค้ดที่อ้างถึงค่าใน `.env` เสมอ (แม้ไฟล์ `.env` ในขั้นตอนนี้จะยังไม่มีค่าจริงก็ตาม) เพื่อป้องกันความผิดพลาดที่อาจเกิดขึ้นได้หากลืมทำขั้นตอนนี้ภายหลัง เมื่อเริ่มมีค่า secret อยู่ในไฟล์แล้ว

**ทดสอบ**: หากเริ่ม git repository ไว้แล้ว (`git init`) ให้รันคำสั่ง `git status` — ไฟล์ `.env` และโฟลเดอร์ `node_modules/` ต้อง**ไม่ปรากฏ**อยู่ในรายการ untracked files

---

## 3. โครงสร้าง Frontend / Backend

### 3.1 สร้างโฟลเดอร์และไฟล์เปล่า

```powershell
# Windows (PowerShell)
New-Item -ItemType Directory -Force -Path backend\data, backend\scripts, frontend
New-Item -ItemType File -Force -Path backend\server.js, backend\core.js, backend\routes.js
New-Item -ItemType File -Force -Path frontend\index.html, frontend\app.css, frontend\app.js
```

```bash
# macOS / Linux (bash)
mkdir -p backend/data backend/scripts frontend
touch backend/server.js backend/core.js backend/routes.js
touch frontend/index.html frontend/app.css frontend/app.js
```

**คำอธิบาย**: Windows ไม่มีคำสั่ง `touch` ติดตั้งมาให้โดยกำเนิด (ทั้ง `cmd.exe` และ PowerShell) จึงต้องใช้ `New-Item -ItemType File` แทน ส่วนการสร้างโฟลเดอร์ซ้อนกัน (`backend\data`, `backend\scripts`) ใช้ `New-Item -ItemType Directory -Force` แทน `mkdir -p` ของฝั่ง Unix (flag `-Force` ทำให้ไม่ error หากโฟลเดอร์นั้นมีอยู่แล้ว) เป้าหมายของขั้นตอนนี้คือสร้างไฟล์เปล่าให้เห็นโครงสร้างไฟล์ทั้งหมดของโปรเจกต์ตั้งแต่ต้น ก่อนเริ่มเติมเนื้อหาโค้ดในขั้นตอนที่ 4

> หากเครื่อง Windows มี **Git Bash** ติดตั้งอยู่ (มาพร้อมกับ Git for Windows) สามารถเปิด terminal เป็น Git Bash แล้วใช้คำสั่ง `mkdir -p`/`touch` แบบ bash เดิมได้ทันที โดยไม่ต้องแปลงเป็น PowerShell — สะดวกกว่าหากต้องรันคู่มือนี้ทั้งฉบับซึ่งมีคำสั่ง bash ปนอยู่หลายจุด

**ทดสอบ**:

```powershell
# Windows (PowerShell)
Get-ChildItem -Recurse -File backend, frontend
```

```bash
# macOS / Linux (bash)
find backend frontend -type f
```

ผลลัพธ์ควรตรงกับโครงสร้างไฟล์ดังนี้:

```text
backend/
  server.js          # Express app entrypoint
  core.js            # logic: stats repository, LINE service, signature check
  routes.js          # REST routes + webhook route
  data/              # province_stats.json (ได้รับจากผู้จัดอบรมโดยตรง)
  scripts/           # สคริปต์เสริม เช่น convert_province_stats.js (ได้รับจากผู้จัดอบรม ไม่ต้องสร้างเอง)
frontend/
  index.html         # หน้าเว็บ (ทดสอบ UI แบบไม่ต้องผ่าน LINE)
  app.css, app.js
```

### 3.2 เหตุผลของการแบ่งไฟล์เช่นนี้

ก่อนเริ่มเขียนโค้ดในขั้นตอนที่ 4 ขอให้ทำความเข้าใจบทบาทของแต่ละไฟล์ก่อน เนื่องจากขั้นตอนถัดไปทั้งหมดจะอ้างอิงแนวคิดนี้ตลอด:

- **`server.js`** มีขนาดเล็กและทำหน้าที่เพียงเริ่มต้นระบบ (bootstrap) เท่านั้น ได้แก่ การโหลดค่า environment การสร้าง Express app และการเชื่อม router โดยไม่มีการใส่ business logic ใดๆ
- **`core.js`** เก็บ business logic ทั้งหมดของระบบ (การอ่านข้อมูล การตอบกลับข้อความ การเรียกใช้งาน LINE และ OpenAI) เพื่อให้สามารถทดสอบในระดับ unit test ได้โดยไม่ต้องพึ่งพา HTTP
- **`routes.js`** ทำหน้าที่เป็นชั้น HTTP เท่านั้น โดยรับ request แล้วเรียกใช้งาน `core.js` ก่อนส่งกลับเป็น response
- **`frontend/`** ถูกให้บริการผ่าน `express.static` โดยตรงจาก `server.js` ใช้สำหรับสาธิตหรือทดสอบการทำงานผ่านเว็บเบราว์เซอร์ โดยไม่จำเป็นต้องเปิดแอปพลิเคชัน LINE

### 3.3 นำไฟล์ข้อมูลมาวางตำแหน่ง

ขอให้นำไฟล์ `backend/data/province_stats.json` (ได้รับจากผู้จัดอบรมโดยตรง) มาวางไว้ในตำแหน่งดังกล่าว ก่อนดำเนินการในขั้นตอนถัดไป เนื่องจากขั้นตอนที่ 4 จะเขียนโค้ดที่อ่านไฟล์นี้ทันทีที่ server เริ่มทำงาน หากไม่มีไฟล์อยู่จริง server จะ throw error ตอน start

---

## 4. สร้าง Express server + REST API

หัวข้อนี้คือใจความสำคัญที่สุดของคู่มือ ขอให้สร้างให้เสร็จ**ทีละไฟล์**ตามลำดับนี้เท่านั้น: `core.js` → `routes.js` → `server.js` เนื่องจากแต่ละไฟล์พึ่งพาไฟล์ก่อนหน้าเสมอ (`routes.js` เรียกใช้ `core.js`, `server.js` เรียกใช้ `routes.js`) การสร้างตามลำดับนี้ทำให้ทุกครั้งที่เปิดไฟล์ใหม่ จะมีของจริงให้เรียกใช้งานได้ทันที ไม่ต้องย้อนกลับไปแก้ไฟล์ก่อนหน้าซ้ำหลายรอบ และภายในแต่ละไฟล์ ขอให้เพิ่มโค้ด**ทีละฟังก์ชัน/ทีละเมธอด** พร้อมรันทดสอบทุกครั้งก่อนไปขั้นตอนถัดไป **ห้ามวางโค้ดทั้งไฟล์ในครั้งเดียว** เนื่องจากหากมีจุดผิดพลาดเกิดขึ้น จะไม่สามารถรู้ได้ว่าผิดที่ขั้นตอนใด

### 4.1 backend/core.js — ชั้นข้อมูล (ไม่พึ่งพาไฟล์อื่นเลย)

ไฟล์นี้สร้างก่อนเป็นไฟล์แรก เพราะไม่ต้องพึ่งพา Express หรือไฟล์อื่นใดในโปรเจกต์ จึงทดสอบได้ทันทีโดยไม่ต้องเปิด server

#### 4.1.1 โครงคลาส + constructor

วางโค้ดนี้เป็นเนื้อหาทั้งหมดของไฟล์ `backend/core.js` ในขั้นตอนนี้:

```js
import { readFileSync } from 'fs';

export class ProvinceStatsRepository {
    constructor(path) {
        this.items = JSON.parse(readFileSync(path, 'utf-8'));
    }
}
```

**คำอธิบาย**: `constructor` อ่านไฟล์ JSON ที่ตำแหน่ง `path` แล้วแปลงเป็น array เก็บไว้ใน `this.items` ครั้งเดียวตอนสร้าง instance เพื่อไม่ต้องอ่านไฟล์จากดิสก์ซ้ำทุกครั้งที่มีการค้นหาในภายหลัง

**ทดสอบ** (รันได้เหมือนกันทั้ง PowerShell, cmd.exe และ bash เนื่องจากเป็น argument ของ `node -e` เพียงตัวเดียวที่ครอบด้วยเครื่องหมายคำพูดคู่ ไม่มีอักขระต่อบรรทัดที่แต่ละ shell ตีความต่างกัน):

```bash
node -e "import('./backend/core.js').then(({ ProvinceStatsRepository }) => { const repo = new ProvinceStatsRepository('./backend/data/province_stats.json'); console.log(repo.items.length); });"
```

ควรได้ตัวเลขจำนวน record ที่มากกว่า 0 แสดงผลใน terminal โดยไม่มี error

#### 4.1.2 เพิ่มเมธอด findByProvince

แก้ไข `backend/core.js` เพิ่มเมธอดนี้ไว้ในคลาส ต่อจาก `constructor`:

```js
    findByProvince(name, year) {
        const normalized = name.trim().toLowerCase();
        const matches = this.items
            .filter(item => item.province.toLowerCase().includes(normalized) && (year === undefined || item.year === year));
        if (!matches.length) return null;
        return year === undefined ? matches : matches[0];
    }
```

**คำอธิบาย**: ค้นจังหวัดด้วยการเทียบ substring แบบไม่สนตัวพิมพ์เล็ก/ใหญ่ ถ้าระบุ `year` จะคืนระเบียนเดียวของปีนั้น ถ้าไม่ระบุจะคืน array ทุกปีที่มี คืน `null` ถ้าไม่พบจังหวัดดังกล่าวเลย

**ทดสอบ**:

```bash
node -e "import('./backend/core.js').then(({ ProvinceStatsRepository }) => { const repo = new ProvinceStatsRepository('./backend/data/province_stats.json'); console.log(repo.findByProvince('เชียงราย', 2026)); });"
```

ควรเห็น object ข้อมูลของจังหวัดเชียงรายปี 2026 แสดงผลใน terminal

#### 4.1.3 เพิ่มเมธอด query

แก้ไข `backend/core.js` เพิ่มเมธอดนี้ไว้ในคลาส ต่อจาก `findByProvince`:

```js
    query({ field = 'patient_rate', min, max, year } = {}) {
        return this.items
            .filter(item => year === undefined || item.year === year)
            .filter(item => (min === undefined || item[field] >= min) && (max === undefined || item[field] <= max))
            .sort((a, b) => b[field] - a[field]);
    }
```

**คำอธิบาย**: กรองข้อมูลของปีที่ระบุ ตามช่วงค่า `min`–`max` ของฟิลด์ `field` แล้วเรียงจากมากไปน้อย ใช้สำหรับงานประเภท "อันดับจังหวัด" เช่น จังหวัดที่มีอัตราป่วยสูงสุด

**ทดสอบ**:

```bash
node -e "import('./backend/core.js').then(({ ProvinceStatsRepository }) => { const repo = new ProvinceStatsRepository('./backend/data/province_stats.json'); console.log(repo.query({ year: 2026, field: 'patient_rate', min: 300 })); });"
```

ควรได้ array ของจังหวัดที่มี `patient_rate` ปี 2026 มากกว่า 300 เรียงจากมากไปน้อย

ถึงจุดนี้ไฟล์ `backend/core.js` มีเนื้อหาสมบูรณ์ครบทั้งไฟล์ดังนี้ (ใช้เป็น checkpoint เทียบกับไฟล์ของท่านก่อนไปขั้นตอนถัดไป):

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

---

### 4.2 backend/routes.js — ชั้น HTTP (พึ่งพา core.js)

ไฟล์นี้สร้างเป็นไฟล์ที่สอง เพราะต้อง `import` คลาส `ProvinceStatsRepository` จาก `core.js` ที่สร้างเสร็จสมบูรณ์แล้วในขั้นตอนที่ 4.1 — **ยังไม่สามารถทดสอบผ่าน `curl` ได้ในหัวข้อนี้** เนื่องจากยังไม่มี `server.js` เปิด HTTP server ขึ้นมาเรียกใช้ router นี้เลย (จะทดสอบรวมกันในขั้นตอนที่ 4.4 หลังสร้าง `server.js` เสร็จ)

#### 4.2.1 โครง router + route /health

วางโค้ดนี้เป็นเนื้อหาทั้งหมดของไฟล์ `backend/routes.js` ในขั้นตอนนี้:

```js
import express from 'express';

const router = express.Router();

router.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'healthline-ai' });
});

export default router;
```

**คำอธิบาย**: `express.Router()` คือกลุ่มของ route ที่แยกออกจาก `app` หลัก เพื่อให้ `server.js` ไม่ต้องรู้รายละเอียดของแต่ละ endpoint มีหน้าที่แค่ "เสียบ" router นี้เข้ากับ app เท่านั้น route `/health` เป็น route ที่ง่ายที่สุดที่ใช้ตรวจสอบว่า server ยังทำงานอยู่หรือไม่ (มักใช้โดยระบบ monitoring) — บันทึกไฟล์แล้วไปขั้นตอนถัดไปได้เลย โดยยังไม่ต้องรันทดสอบใดๆ

#### 4.2.2 ผูก core.js + เพิ่ม route /api/provinces

แก้ไข `backend/routes.js` เพิ่ม import และ route ใหม่ (เพิ่มต่อจาก route `/health` ก่อนบรรทัด `export default router;`):

```js
import { fileURLToPath } from 'url';
import path from 'path';
import { ProvinceStatsRepository } from './core.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const provinceStats = new ProvinceStatsRepository(path.join(__dirname, 'data/province_stats.json'));

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
```

**คำอธิบาย**: route นี้รองรับ 2 รูปแบบการใช้งานในจุดเดียว — หากมี query `?province=...` จะค้นหาจังหวัดนั้นโดยตรง (ผ่าน `sendProvince`) หากไม่มีจะคืนรายการที่กรอง/เรียงลำดับตาม `field`, `min`, `max`, `year` แทน (ผ่าน `query()`) ค่าทั้งหมดที่มาจาก `req.query` เป็น string เสมอ จึงต้องแปลงเป็น `Number` ก่อนส่งให้เมธอดของ repository ที่คาดหวังค่าตัวเลข

#### 4.2.3 เพิ่ม route ค้นหาด้วย path param

แก้ไข `backend/routes.js` เพิ่ม route ใหม่ต่อจาก `/api/provinces` (ก่อนบรรทัด `export default router;`):

```js
router.get('/api/provinces/:province', (req, res) => {
    const { year } = req.query;
    sendProvince(res, req.params.province, year !== undefined ? Number(year) : undefined);
});
```

**คำอธิบาย**: `req.params.province` มาจากส่วน `:province` ของ path โดยตรง (เช่น `/api/provinces/เชียงราย`) ต่างจาก `req.query.province` ที่มาจาก query string (`?province=เชียงราย`) ในขั้นตอนที่ 4.2.2 — เป็นการเปิดให้เรียกใช้ได้ทั้งสองรูปแบบ เพื่อความสะดวกของผู้ใช้ API

ถึงจุดนี้ไฟล์ `backend/routes.js` มีเนื้อหาสมบูรณ์ครบทั้งไฟล์ดังนี้ (ใช้เป็น checkpoint เทียบกับไฟล์ของท่านก่อนไปขั้นตอนถัดไป — สังเกตว่า `import` ทั้งหมดถูกย้ายมารวมไว้บนสุดของไฟล์ตามธรรมเนียมของ JavaScript):

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

---

### 4.3 backend/server.js — จุดเริ่มต้นแอป (พึ่งพา routes.js)

ไฟล์นี้สร้างเป็นไฟล์สุดท้าย เพราะต้อง `import router from './routes.js'` ที่สร้างเสร็จสมบูรณ์แล้วในขั้นตอนที่ 4.2 — เมื่อไฟล์นี้เสร็จ จะสามารถทดสอบทุก endpoint ผ่าน `curl` ได้จริงเป็นครั้งแรก

#### 4.3.1 boot เปล่าๆ ไม่มี route

วางโค้ดนี้เป็นเนื้อหาทั้งหมดของไฟล์ `backend/server.js` ในขั้นตอนนี้:

```js
import 'dotenv/config';
import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
```

**คำอธิบาย**: `import 'dotenv/config'` ต้องอยู่บรรทัดบนสุดของไฟล์เสมอ เพื่อให้ค่าจาก `.env` (เช่น `PORT`) ถูกโหลดเข้า `process.env` ก่อนโค้ดบรรทัดถัดไปเรียกใช้งาน ในขั้นตอนนี้ app ยังไม่มี route หรือไฟล์ static ใดๆ เป้าหมายคือยืนยันก่อนว่า process เริ่มทำงานได้จริง

**ทดสอบ**:

```bash
npm run dev
```

ควรเห็นข้อความ `http://localhost:3000` ปรากฏใน terminal เปิดเบราว์เซอร์ไปที่ `http://localhost:3000` จะเห็นข้อความ error "Cannot GET /" ซึ่ง**ถือว่าถูกต้อง**ในขั้นตอนนี้ เพราะยังไม่มี route ใดถูกกำหนดไว้เลย

#### 4.3.2 เพิ่มการให้บริการไฟล์ frontend (static)

แก้ไข `backend/server.js` โดยเพิ่มโค้ดต่อไปนี้ (เพิ่มเข้าไปในไฟล์เดิม ก่อนบรรทัด `app.listen`):

```js
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');

app.use(express.static(FRONTEND_DIR));
```

**คำอธิบาย**: เนื่องจากโปรเจกต์นี้ใช้ ES module ตัวแปร `__dirname` แบบเดิมของ Node.js (CommonJS) จะไม่มีให้ใช้งานโดยอัตโนมัติ จึงต้องสร้างขึ้นเองผ่าน `fileURLToPath` และ `import.meta.url` จากนั้น `express.static` จะให้บริการทุกไฟล์ในโฟลเดอร์ `frontend/` ผ่าน HTTP โดยตรง (เช่น `index.html`, `app.css`)

**ทดสอบ**: ใส่ข้อความทดสอบลงใน `frontend/index.html` เช่น `<h1>Hello</h1>` แล้วเปิด `http://localhost:3000/index.html` (Node.js จะรีสตาร์ท server ให้อัตโนมัติเนื่องจากใช้ `npm run dev` ที่มี `--watch`) ควรเห็นข้อความนั้นแสดงผลในเบราว์เซอร์

#### 4.3.3 เชื่อม router จาก routes.js

แก้ไข `backend/server.js` เพิ่มการ import และเสียบ router (เพิ่มก่อนบรรทัด `app.listen`):

```js
import router from './routes.js';
app.use(router);
```

**คำอธิบาย**: ขั้นตอนนี้คือจุดที่ไฟล์ทั้ง 3 ไฟล์ — `core.js`, `routes.js`, `server.js` — ถูกเชื่อมเข้าด้วยกันเป็นครั้งแรก `app.use(router)` บอกให้ Express ส่งทุก request ที่ตรงกับ route ใดๆ ที่กำหนดไว้ใน `router` (มาจาก `routes.js`) ให้ไปประมวลผลที่ฟังก์ชันที่ผูกไว้ในขั้นตอนที่ 4.2

**ทดสอบ**:

```bash
curl http://localhost:3000/health
```

ควรได้ผลลัพธ์ `{"status":"ok","service":"healthline-ai"}`

> **หมายเหตุสำหรับผู้ใช้ Windows**: คำว่า `curl` ใน PowerShell (ไม่ใช่ cmd.exe) แท้จริงเป็นเพียง **alias ของ `Invoke-WebRequest`** ซึ่งมีรูปแบบผลลัพธ์และพารามิเตอร์ต่างจาก curl ตัวจริงโดยสิ้นเชิง หากต้องการให้พฤติกรรมตรงกับตัวอย่างในคู่มือนี้ทุกประการ ให้เรียกใช้ไฟล์ binary ตัวจริง (มีมาให้แล้วใน Windows 10 ขึ้นไป) แทน:
>
> ```powershell
> curl.exe http://localhost:3000/health
> ```

ถึงจุดนี้ไฟล์ `backend/server.js` มีเนื้อหาสมบูรณ์ครบทั้งไฟล์ดังนี้ (ใช้เป็น checkpoint เทียบกับไฟล์ของท่าน):

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

---

### 4.4 ทดสอบ endpoint ทั้งหมดพร้อมกัน

เมื่อไฟล์ทั้ง 3 ไฟล์เสร็จสมบูรณ์และเชื่อมกันแล้ว ให้ทดสอบทุก endpoint ที่สร้างไว้ในหัวข้อนี้รวมกันอีกครั้ง (บน PowerShell ให้ใช้ `curl.exe` แทน `curl` ตามหมายเหตุในขั้นตอนที่ 4.3.3):

```bash
curl http://localhost:3000/health
curl "http://localhost:3000/api/provinces?province=เชียงราย&year=2026"
curl "http://localhost:3000/api/provinces?year=2026&field=patient_rate&min=300"
curl http://localhost:3000/api/provinces/เชียงราย
```

ผลลัพธ์ที่คาดหวังตามลำดับ: สถานะ `ok`, ข้อมูลจังหวัดเชียงรายปี 2026 เพียงระเบียนเดียว, array ของจังหวัดที่กรองตามเงื่อนไข, array ข้อมูลจังหวัดเชียงรายทุกปีที่มี หากคำสั่งใดไม่ตรงกับที่คาดหวัง ให้ย้อนกลับไปเทียบกับไฟล์ checkpoint ของขั้นตอนที่เกี่ยวข้อง (4.1 สำหรับ logic การค้นหา, 4.2 สำหรับ route, 4.3 สำหรับการเชื่อม router)

### 4.5 ทดสอบด้วย REST Client extension (แทน curl)

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

หัวข้อนี้เพิ่มโค้ดต่อจากขั้นตอนที่ 4 ใน **ไฟล์เดิม** คือ `backend/core.js` (ไฟล์เดียวกับที่มี `ProvinceStatsRepository` อยู่แล้ว) ขอให้เพิ่มทีละส่วนต่อจากโค้ดเดิมที่มีอยู่ (ไม่ต้องลบของเดิม) และทดสอบทุกครั้งก่อนไปขั้นตอนถัดไปเช่นเดิม

ก่อนเริ่ม ขอให้ทำความเข้าใจคำว่า **Flex Message** ก่อน: ปกติบอท LINE ตอบกลับเป็นข้อความตัวอักษรธรรมดา (text message) แต่ถ้าต้องการตอบกลับเป็น "การ์ด" ที่มีปุ่มกดได้ จัดวางสีและตัวอักษรได้ ต้องส่งเป็น Flex Message ซึ่งมีโครงสร้างเป็น JSON (ข้อมูลแบบ key-value ที่ซ้อนกันเป็นชั้นๆ) บอกแก่ LINE ว่าจะให้วาดอะไรบนหน้าจอ — ในหัวข้อนี้จะสร้างฟังก์ชันที่ "ประกอบ" JSON ดังกล่าวขึ้นมาเอง

### 6.1 เพิ่มฟังก์ชัน textReply

แก้ไข `backend/core.js` เพิ่มโค้ดนี้ต่อจากโค้ดเดิมที่มีอยู่ (ท้ายไฟล์ หรือใต้ `import` เดิม):

```js
function textReply(text) {
    return { type: 'text', text };
}
```

**คำอธิบาย**: ฟังก์ชันนี้รับ string ธรรมดา (เช่น `"สวัสดี"`) แล้ว "ห่อ" ให้อยู่ในรูปแบบ object ที่มี `type: 'text'` กำกับไว้ เพื่อให้โค้ดส่วนอื่นในไฟล์รู้ว่า payload นี้เป็นข้อความตัวอักษรธรรมดา (ไม่ใช่ Flex Message หรือรูปภาพ) — ยังไม่ต้องทดสอบในขั้นนี้ เพราะฟังก์ชันนี้สั้นมากและไม่มี logic ที่ซับซ้อน

### 6.2 เพิ่มฟังก์ชัน menuFlex

แก้ไข `backend/core.js` เพิ่มโค้ดนี้ต่อจาก `textReply`:

```js
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
```

**คำอธิบาย**: `bubble` คือ "การ์ด" หนึ่งใบ ภายในมี `body` (เนื้อหา) เป็น `box` แบบ `vertical` (เรียงจากบนลงล่าง) ประกอบด้วยข้อความหัวเรื่อง 1 บรรทัด และกล่องปุ่ม 1 ปุ่ม — ส่วนที่สำคัญที่สุดคือ `action: { type: 'message', label: 'เลือกจังหวัด', text: 'เลือกจังหวัด' }` ซึ่งหมายความว่า **เมื่อผู้ใช้กดปุ่มนี้ จะเสมือนว่าผู้ใช้พิมพ์คำว่า "เลือกจังหวัด" เข้ามาเอง** (อธิบายเพิ่มเติมในขั้นตอนที่ 6.4)

**ทดสอบ**:

```bash
node -e "import('./backend/core.js').then(({ menuFlex }) => { console.log(JSON.stringify(menuFlex(), null, 2)); });"
```

ควรเห็นโครงสร้าง JSON ของเมนูแสดงผลใน terminal โดยไม่มี error (ยังไม่เห็นเป็นภาพการ์ดจริง เพราะต้องส่งผ่าน LINE ก่อน ซึ่งจะทำในขั้นตอนที่ 8)

### 6.3 สร้างคลาส LineService (เริ่มจาก constructor)

แก้ไข `backend/core.js` เพิ่มโค้ดนี้ต่อจาก `menuFlex` — เพิ่ม `import` ไว้บนสุดของไฟล์ด้วย:

```js
import * as line from '@line/bot-sdk';
```

```js
export class LineService {
    constructor(accessToken, provinceStats) {
        this.accessToken = accessToken;
        this.provinceStats = provinceStats;
    }
}
```

**คำอธิบาย**: `LineService` คือ "สมอง" ของบอท มีหน้าที่ตัดสินใจว่าจะตอบอะไร (ผ่านเมธอด `respond` ในขั้นตอนที่ 6.4) แล้วส่งคำตอบนั้นไปให้ LINE จริงๆ (ผ่านเมธอด `reply` ในขั้นตอนที่ 6.5) `constructor` เก็บค่า 2 อย่างไว้ใช้ภายหลัง: `accessToken` (กุญแจสำหรับเรียก LINE API) และ `provinceStats` (instance ของ `ProvinceStatsRepository` ที่สร้างไว้ในขั้นตอนที่ 4.1 สำหรับค้นข้อมูลจังหวัด)

### 6.4 เพิ่มเมธอด respond — ตัดสินใจว่าจะตอบอะไร

แก้ไข `backend/core.js` เพิ่มเมธอดนี้ไว้ในคลาส `LineService` ต่อจาก `constructor`:

```js
    async respond(text) {
        const normalized = text.trim().toLowerCase();
        if (['เมนู', 'menu'].includes(normalized)) return menuFlex();

        const result = this.provinceStats.findByProvince(text.trim());
        if (!result) return textReply(`ไม่พบข้อมูลจังหวัด "${text}"\nพิมพ์ "เมนู" เพื่อดูตัวเลือก`);
        return textReply(JSON.stringify(result));
    }
```

**คำอธิบาย**: เมธอดนี้รับข้อความที่ผู้ใช้พิมพ์มา (`text`) แล้วตัดสินใจเป็น 3 กรณีตามลำดับ: (1) ถ้าพิมพ์ "เมนู" หรือ "menu" → ส่ง Flex Message เมนูกลับ (2) ถ้าค้นจังหวัดที่พิมพ์มาไม่พบ → ส่งข้อความแจ้งเตือน (3) ถ้าพบ → ส่งข้อมูลกลับเป็นข้อความ คำว่า `async` หมายความว่าเมธอดนี้สามารถ `await` งานที่ใช้เวลาได้ (จะมีประโยชน์ในขั้นตอนที่ 10 เมื่อต้องรอ AI ตอบกลับ)

**ทดสอบ**: คำสั่งนี้สร้าง `LineService` ขึ้นมาทดลองโดยตรง (ยังไม่ต้องมี LINE access token จริง เพราะ `respond()` ไม่ได้ใช้ `accessToken`) แล้วลองส่งข้อความ 2 แบบเข้าไป:

```bash
node -e "import('./backend/core.js').then(async ({ LineService, ProvinceStatsRepository }) => { const repo = new ProvinceStatsRepository('./backend/data/province_stats.json'); const svc = new LineService('', repo); console.log(await svc.respond('เมนู')); console.log(await svc.respond('เชียงราย')); });"
```

ควรเห็นผลลัพธ์ 2 บรรทัด: บรรทัดแรกเป็น object `{ type: 'flex', ... }` (จากคำว่า "เมนู") บรรทัดที่สองเป็น object `{ type: 'text', text: '...' }` ที่มีข้อมูลจังหวัดเชียงรายอยู่ภายใน

> **เกี่ยวกับปุ่มใน Flex Message**: action ที่ใช้งานบ่อยที่สุดคือ `type: "message"` ซึ่งเมื่อผู้ใช้กดปุ่มดังกล่าว ระบบจะถือเสมือนว่าผู้ใช้พิมพ์ข้อความ `text` นั้นเข้ามาเอง ส่งผลให้ logic ใน `respond()` ที่เพิ่งสร้างไว้ สามารถจัดการได้ในรูปแบบเดียวกัน ทั้งจากการพิมพ์ข้อความและการกดปุ่ม โดยไม่ต้องเขียน handler แยกต่างหาก

### 6.5 เพิ่มเมธอด reply — ส่งคำตอบไปให้ LINE จริง

แก้ไข `backend/core.js` เพิ่มเมธอดนี้ไว้ในคลาส `LineService` ต่อจาก `respond`:

```js
    async reply(replyToken, payload) {
        if (!this.accessToken) return;
        const client = new line.messagingApi.MessagingApiClient({ channelAccessToken: this.accessToken });
        const messages = payload.type === 'flex'
            ? [{ type: 'flex', altText: payload.altText, contents: payload.contents }]
            : [{ type: 'text', text: payload.text }];
        await client.replyMessage({ replyToken, messages });
    }
```

**คำอธิบาย**: เมธอดนี้รับผลลัพธ์ที่ได้จาก `respond()` (`payload`) มาแปลงเป็นรูปแบบที่ LINE SDK ต้องการ แล้วเรียก `replyMessage` เพื่อส่งกลับไปยังผู้ใช้จริงๆ ผ่าน LINE `replyToken` คือ "ตั๋ว" ที่ LINE แนบมากับทุก event เพื่อให้รู้ว่าต้องตอบกลับไปหาใคร (ใช้ได้ครั้งเดียวและมีเวลาหมดอายุสั้นมาก) บรรทัด `if (!this.accessToken) return;` ทำให้ถ้ายังไม่ได้ตั้งค่า `LINE_CHANNEL_ACCESS_TOKEN` ในไฟล์ `.env` (เช่น ระหว่างทดสอบ logic ด้วย `node -e` แบบขั้นตอนที่ 6.4) โค้ดจะไม่ error แต่จะข้ามการส่งจริงไปเงียบๆ

**ยังไม่สามารถทดสอบเมธอดนี้ได้จริงในขั้นตอนนี้** เนื่องจากต้องมี `replyToken` จริงที่มาจาก LINE เท่านั้น (ไม่สามารถปลอมขึ้นมาทดสอบเองได้) — จะได้เห็นผลลัพธ์จริงในขั้นตอนที่ 8 หลังเชื่อม webhook กับ ngrok และเปิดแอป LINE คุยกับบอทจริง

ถึงจุดนี้ไฟล์ `backend/core.js` มีเนื้อหาเพิ่มขึ้นจากขั้นตอนที่ 4 ดังนี้ (ส่วนที่เพิ่มในหัวข้อนี้ — วางต่อจาก `ProvinceStatsRepository` เดิม ใช้เป็น checkpoint เทียบกับไฟล์ของท่าน):

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

---

## 7. Webhook: รับข้อความจาก LINE อย่างปลอดภัย

**Webhook** คือ URL ปลายทางที่ระบบ LINE จะส่งคำขอ (request) แบบ POST มาบอกเราเองทุกครั้งที่เกิดเหตุการณ์ขึ้น (เช่น มีผู้ใช้พิมพ์ข้อความ กดปุ่ม หรือเพิ่มเป็นเพื่อน) — ต่างจาก route ในขั้นตอนที่ 4 ที่เราเป็นฝ่ายเรียกเข้าไปเอง (เช่นกด curl) ในกรณีนี้ **LINE เป็นฝ่ายเรียกเข้ามาหาเรา** จึงต้องมีวิธีตรวจสอบว่าคำขอที่เข้ามานั้นมาจาก LINE จริง ไม่ใช่คนอื่นปลอมขึ้นมา วิธีตรวจสอบคือ LINE จะแนบ header ชื่อ `x-line-signature` มาด้วยทุกครั้ง ซึ่งเป็นรหัสที่คำนวณจาก **Channel secret** (ค่าที่เก็บไว้ในขั้นตอนที่ 5) — ถ้าเราคำนวณรหัสแบบเดียวกันแล้วได้ค่าตรงกัน ก็มั่นใจได้ว่าคำขอนั้นมาจาก LINE จริง

### 7.1 เพิ่มฟังก์ชัน validSignature

แก้ไข `backend/core.js` เพิ่ม `import` นี้ไว้บนสุดของไฟล์:

```js
import { createHmac, timingSafeEqual } from 'crypto';
```

แล้วเพิ่มฟังก์ชันนี้ต่อจากโค้ดเดิมในไฟล์ (เช่น ต่อจาก `LineService` ที่สร้างไว้ในขั้นตอนที่ 6):

```js
export function validSignature(rawBody, signature, secret) {
    const expected = Buffer.from(createHmac('sha256', secret).update(rawBody).digest('base64'));
    const actual = Buffer.from(signature);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
}
```

**คำอธิบาย**: `createHmac('sha256', secret)` คือการคำนวณรหัส (hash) จากเนื้อหาคำขอ (`rawBody`) โดยใช้ `secret` เป็นกุญแจ — ผลลัพธ์จะไม่เหมือนกันเลยถ้า `secret` หรือเนื้อหาต่างกันแม้แต่ตัวอักษรเดียว ฟังก์ชันนี้คำนวณรหัสคาดหวัง (`expected`) แล้วเทียบกับรหัสที่ LINE แนบมาจริง (`actual`) คืนค่า `true` ถ้าตรงกัน

> **ทำไมต้องใช้ `timingSafeEqual` แทน `===`**: การเทียบ string ด้วย `===` จะหยุดเทียบทันทีที่พบตัวอักษรไม่ตรงกัน ทำให้คนร้ายสามารถจับเวลาการตอบสนองเพื่อเดารหัสได้ทีละตัวอักษรในทางทฤษฎี (timing attack) ส่วน `timingSafeEqual` ใช้เวลาเทียบเท่ากันเสมอไม่ว่าจะตรงหรือไม่ตรง จึงปลอดภัยกว่าสำหรับการเทียบรหัสลับ

**ทดสอบ**: จำลองการคำนวณ signature เหมือนที่ LINE ทำ แล้วตรวจว่าฟังก์ชันยอมรับค่าที่ถูกต้อง และปฏิเสธค่าที่ผิด:

```bash
node -e "import('./backend/core.js').then(({ validSignature }) => { import('crypto').then(({ createHmac }) => { const secret = 'test-secret'; const body = Buffer.from('hello'); const sig = createHmac('sha256', secret).update(body).digest('base64'); console.log('ถูกต้อง:', validSignature(body, sig, secret)); console.log('ผิด:', validSignature(body, 'wrong-signature', secret)); }); });"
```

ควรเห็นผลลัพธ์ `ถูกต้อง: true` และ `ผิด: false`

### 7.2 เพิ่ม route /webhook — ตรวจลายเซ็นอย่างเดียวก่อน

แก้ไข `backend/routes.js` เพิ่ม `import` และตัวแปรนี้ (เพิ่มต่อจาก `import` เดิม):

```js
import { LineService, validSignature } from './core.js';

const { LINE_CHANNEL_SECRET = '', LINE_CHANNEL_ACCESS_TOKEN = '' } = process.env;
const lineService = new LineService(LINE_CHANNEL_ACCESS_TOKEN, provinceStats);
```

แล้วเพิ่ม route ใหม่นี้ (เพิ่มก่อนบรรทัด `export default router;`) — ขั้นตอนนี้ตรวจสอบลายเซ็นอย่างเดียวก่อน ยังไม่อ่านเนื้อหาข้อความ:

```js
router.post('/webhook', express.raw({ type: '*/*' }), async (req, res) => {
    const rawBody = req.body;
    const signature = req.headers['x-line-signature'] || '';
    if (!LINE_CHANNEL_SECRET || !validSignature(rawBody, signature, LINE_CHANNEL_SECRET)) {
        return res.status(400).send('Bad Request');
    }

    res.send('OK');
});
```

**คำอธิบาย**: `express.raw({ type: '*/*' })` คือสิ่งที่ทำให้ `req.body` เป็น **buffer ดิบ** (ข้อมูลตัวเลขไบต์ตรงตามที่ส่งมา) แทนที่จะถูกแปลงเป็น JavaScript object โดยอัตโนมัติแบบ route อื่นในขั้นตอนที่ 4 — จำเป็นต้องใช้แบบนี้เฉพาะ route นี้เท่านั้น เพราะการคำนวณ signature ใน 7.1 ต้องใช้ไบต์ดิบเป๊ะๆ หากปล่อยให้ Express แปลงเป็น object ก่อน แล้วค่อยแปลงกลับเป็น string ทีหลัง ไบต์อาจไม่ตรงกับที่ LINE ใช้คำนวณตอนแรก ทำให้ signature ไม่ตรงกันเสมอ

**ทดสอบ**: เนื่องจากยังไม่มี request จริงจาก LINE ให้จำลองคำขอปลอม (ไม่มี signature ที่ถูกต้อง) แล้วตรวจสอบว่า server ปฏิเสธอย่างถูกต้อง:

```bash
curl -i -X POST http://localhost:3000/webhook -H "Content-Type: application/json" -d "{}"
```

ควรได้ผลลัพธ์ `HTTP/1.1 400 Bad Request` (เพราะไม่มี header `x-line-signature` ที่ถูกต้องแนบมา) — **การได้ 400 ในขั้นนี้ถือว่าถูกต้อง** เนื่องจากเป็นการพิสูจน์ว่า route ปฏิเสธคำขอปลอมได้จริง ยังไม่ใช่ข้อผิดพลาด

### 7.3 อ่านเนื้อหาข้อความเป็น JSON

แก้ไข `backend/routes.js` ในฟังก์ชัน route `/webhook` เพิ่มโค้ดนี้ต่อจากการตรวจสอบ signature (ก่อนบรรทัด `res.send('OK');`):

```js
    let payload;
    try {
        payload = JSON.parse(rawBody.toString('utf-8'));
    } catch {
        return res.status(400).send('Bad Request');
    }
```

**คำอธิบาย**: เมื่อผ่านการตรวจสอบ signature แล้ว ขั้นตอนต่อไปคือแปลง `rawBody` (buffer ดิบ) ให้กลับมาเป็น string ด้วย `.toString('utf-8')` แล้วแปลงเป็น JavaScript object ด้วย `JSON.parse` ครอบด้วย `try/catch` เผื่อกรณีที่เนื้อหาไม่ใช่ JSON ที่ถูกต้อง (ป้องกัน server หยุดทำงานหากได้รับข้อมูลแปลกปลอม)

ยังไม่ต้องทดสอบในขั้นนี้ เนื่องจากต้องมี `payload.events` จริงก่อนจึงจะเห็นผลต่างจากขั้นตอนที่ 7.2 — จะทดสอบรวมในขั้นตอนที่ 7.4

### 7.4 ประมวลผล event แต่ละรายการ

แก้ไข `backend/routes.js` เพิ่มโค้ดนี้ต่อจากการ parse JSON (ก่อนบรรทัด `res.send('OK');`):

```js
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
```

**คำอธิบาย**: LINE อาจส่ง event มาหลายรายการพร้อมกันในคำขอเดียว (เก็บอยู่ใน `payload.events` ซึ่งเป็น array) จึงต้องวนลูป (`for...of`) ประมวลผลทีละรายการ — กรณีที่จัดการคือ (1) ผู้ใช้พิมพ์ข้อความ (`message` + `text`) → เรียก `respond()` แล้วส่งผลลัพธ์ด้วย `reply()` (2) ผู้ใช้เพิ่มบอทเป็นเพื่อนใหม่ (`follow`) → ส่งเมนูให้อัตโนมัติเสมือนพิมพ์คำว่า "เมนู"

> **ทำไมต้องครอบด้วย try/catch**: Express เวอร์ชัน 4 จะไม่ดักจับ (catch) exception ที่เกิดจากการ throw ภายใน async route handler ให้โดยอัตโนมัติ หากไม่มีการครอบด้วย try/catch แล้ว `lineService.respond()` เกิด error ขึ้นมา จะกลายเป็น unhandled rejection ซึ่งอาจส่งผลให้ process ทั้งระบบหยุดทำงาน มิใช่เพียงคำขอ (request) นั้นเพียงรายการเดียว — การ `console.error` แล้วปล่อยให้ทำงานต่อ (ไม่ throw ซ้ำ) ทำให้ระบบยังตอบ `200 OK` กลับไปได้เสมอในขั้นตอนที่ 7.5

### 7.5 ตอบกลับ LINE ให้เร็วที่สุดเสมอ

ตรวจสอบว่าบรรทัดสุดท้ายในฟังก์ชัน route `/webhook` (ก่อนปิด `});`) คือ:

```js
    res.send('OK'); // ต้องตอบ 200 อย่างรวดเร็ว ไม่ว่าการ reply ไปยัง LINE จะสำเร็จหรือไม่ มิฉะนั้น LINE จะส่งคำขอซ้ำหรือตัดการเชื่อมต่อ
```

**คำอธิบาย**: LINE กำหนดเวลาจำกัด (timeout) ในการรอคำตอบจาก webhook ของเรา หากตอบช้าเกินไปหรือไม่ตอบเลย LINE จะส่งคำขอเดิมซ้ำ หรือพิจารณาว่า webhook มีปัญหา การที่ `try/catch` ในขั้นตอนที่ 7.4 ดักจับ error ทั้งหมดไว้ ทำให้บรรทัด `res.send('OK')` นี้ถูกเรียกได้เสมอ ไม่ว่าการส่งข้อความกลับไปหาผู้ใช้จะสำเร็จหรือไม่

**ทดสอบรวม**: ทำซ้ำคำสั่ง curl เดิมจากขั้นตอนที่ 7.2 อีกครั้ง เพื่อยืนยันว่า route ยังทำงานถูกต้องหลังเพิ่มโค้ดทั้งหมดแล้ว (ยังคาดหวังผลลัพธ์ `400 Bad Request` เหมือนเดิม เนื่องจากยังไม่มี signature ที่ถูกต้อง):

```bash
curl -i -X POST http://localhost:3000/webhook -H "Content-Type: application/json" -d "{}"
```

การทดสอบกับ **signature ที่ถูกต้องจริง** และข้อความจริงจากแอป LINE จะทำในขั้นตอนที่ 8 หลังเชื่อมต่อ ngrok เรียบร้อยแล้ว

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

Rich Menu คือแถบเมนูในรูปแบบรูปภาพที่ปรากฏอยู่ด้านล่างของหน้าสนทนา เมื่อผู้ใช้กดจะสามารถส่ง action ได้ (เช่น การส่งข้อความ หรือการเปิดลิงก์) **โครงการนี้ตั้งค่า Rich Menu ผ่านหน้าเว็บ LINE Official Account Manager โดยตรง ไม่ได้เขียนโค้ดหรือสคริปต์เพื่อสร้างเมนูแต่อย่างใด** จึงไม่มีไฟล์ใหม่ต้องสร้างในหัวข้อนี้

### 9.1 ออกแบบรูปภาพ

ข้อกำหนดของ LINE มีดังนี้:

- ขนาดภาพต้องเป็น **2500×1686px** (รูปแบบ full) หรือ **2500×843px** (รูปแบบ compact) เพื่อให้พื้นที่ของปุ่มต่างๆ พอดีกับภาพ
- ไฟล์ภาพต้องเป็นนามสกุล `.png` หรือ `.jpg` และมีขนาดไม่เกิน 1MB

ขอให้แบ่งพื้นที่ของภาพเป็นตารางปุ่ม (เช่น 3 คอลัมน์ × 2 แถว) ไว้ในใจหรือบนกระดาษร่างก่อน เนื่องจากในขั้นตอนที่ 9.2 จะต้องกำหนดตำแหน่งปุ่มแต่ละปุ่มให้ตรงกับพื้นที่บนภาพนี้ (ตัวอย่างไฟล์ภาพในโครงการนี้ คือ `assets/linerichmenu.jpg`)

### 9.2 สร้าง Rich Menu ผ่าน LINE Official Account Manager

1. เข้าสู่ระบบที่ **[LINE Official Account Manager](https://manager.line.biz/)** ด้วยบัญชีที่ผูกกับ OA ของท่าน (OA เดียวกับที่สร้างไว้ในขั้นตอนที่ 5) แล้วเลือกเมนู **Rich menu** จากแถบด้านซ้าย (URL จะมีรูปแบบ `https://manager.line.biz/account/@xxxxxxxx/richmenu`)
2. กดปุ่ม **Create rich menu** (หรือ "สร้าง")
3. ตั้งชื่อเมนูในช่อง **Title** (สำหรับผู้ดูแลดูเอง ผู้ใช้จะไม่เห็นชื่อนี้) เช่น `HealthLine main menu` และตั้งค่า **Display period** เป็นช่วงที่ต้องการ หรือปล่อยให้เป็นค่าตั้งต้น
4. เปิดสวิตช์ **Set as default rich menu** เพื่อให้เมนูนี้แสดงให้ผู้ใช้ทุกคนเห็นโดยอัตโนมัติ
5. เลือก **Template** ที่มีจำนวนช่องปุ่มตรงกับที่ออกแบบไว้ในขั้นตอนที่ 9.1 (เช่น แบบ 2 ช่องแนวนอน หรือ 6 ช่องแบบตาราง)
6. กด **Upload image** แล้วเลือกไฟล์ภาพที่ออกแบบไว้ในขั้นตอนที่ 9.1 (`linerichmenu.jpg`)
7. คลิกที่แต่ละช่องปุ่มบนภาพที่อัปโหลดแล้ว ตั้งค่า **Action** เป็นประเภท **Text** ใส่ข้อความให้ตรงกับคำสั่งที่ `LineService.respond()` เข้าใจ (สร้างไว้ในขั้นตอนที่ 6) เช่น `เลือกจังหวัด`, `สรุปข้อมูล`, `เมนู` — **ห้ามพิมพ์ข้อความอื่นที่ระบบไม่รู้จัก** เพราะปุ่มจะกลายเป็นเสมือนผู้ใช้พิมพ์ข้อความนั้นเข้ามาเอง หากพิมพ์คำที่ `respond()` ไม่รู้จัก ผู้ใช้จะได้รับข้อความ "ไม่พบข้อมูลจังหวัด..." กลับมาแทน
8. กด **Save** เพื่อบันทึกเมนู

**คำอธิบาย**: การตั้งค่า action เป็น **Text** ทำให้การกดปุ่มมีผลเสมือนผู้ใช้พิมพ์ข้อความนั้นเข้ามาเอง (แนวคิดเดียวกับปุ่มใน Flex Message ของขั้นตอนที่ 6.2 ที่ใช้ `action: { type: 'message', text: ... }`) จึงทำให้ logic เดิมใน `LineService.respond()` ที่สร้างไว้แล้วจัดการคำสั่งจากปุ่ม Rich Menu ได้ทันที โดยไม่ต้องเขียนโค้ดเพิ่มแม้แต่บรรทัดเดียว — Rich Menu จึงเป็นเพียง "ทางลัด" ให้ผู้ใช้กดแทนการพิมพ์เองเท่านั้น

**ทดสอบ**: เปิดแอป LINE แล้วคุยกับ OA ของท่าน (เพิ่มเป็นเพื่อนแล้วในขั้นตอนที่ 8) ควรเห็นแถบเมนูรูปภาพปรากฏที่ด้านล่างของหน้าสนทนาภายในเวลาไม่กี่นาที (อาจต้องปิดแล้วเปิดแชทใหม่ หากยังไม่เห็นให้รอ 2-3 นาทีแล้วลองใหม่) ลองกดปุ่มแต่ละปุ่ม แล้วตรวจสอบว่าบอทตอบกลับตรงกับคำสั่งที่ตั้งไว้ในขั้นตอนที่ 7 หรือไม่

> **หากต้องการแก้ไขปุ่มหรือรูปภาพใหม่ภายหลัง**: กลับไปที่หน้า Rich menu list ใน LINE Official Account Manager แล้วกดแก้ไขเมนูเดิมได้โดยตรง ไม่ต้องลบแล้วสร้างใหม่ — ผู้ดูแลหลายคนสามารถเข้ามาแก้ไขผ่านหน้านี้ได้พร้อมกัน โดยไม่ต้องแก้โค้ดหรือ deploy ระบบใหม่แต่อย่างใด

---

## 10. เชื่อม ChatGPT (OpenAI API)

### 10.1 ตั้งค่า API key

นำค่า API key ที่สมัครและคัดลอกไว้ในขั้นตอนที่ 1 มากำหนดไว้ในไฟล์ `.env` (หากยังไม่ได้สมัคร โปรดย้อนกลับไปดำเนินการตามขั้นตอนที่ 1 ก่อน):

```
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-4.1-mini
```

**คำอธิบาย**: การเลือกใช้ `gpt-4.1-mini` เนื่องจากมีความรวดเร็วและค่าใช้จ่ายต่ำ เหมาะสำหรับการอบรมเชิงปฏิบัติการ ทั้งนี้สามารถเปลี่ยน model ได้จากค่า environment โดยไม่ต้องแก้ไขโค้ด

### 10.2 เพิ่มฟังก์ชัน aiExplain

แก้ไข `backend/core.js` เพิ่ม `import` นี้ไว้บนสุดของไฟล์:

```js
import OpenAI from 'openai';
```

แล้วเพิ่มฟังก์ชันนี้ต่อจากโค้ดเดิมในไฟล์:

```js
export async function aiExplain(record, { apiKey, model }) {
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

**คำอธิบาย**: ฟังก์ชันนี้รับข้อมูล 1 ระเบียน (`record`) แล้วส่งให้ ChatGPT ช่วยอธิบายเป็นภาษาที่เข้าใจง่าย จุดสำคัญ 2 ประการ:

- **จำกัดให้ AI ใช้แต่ข้อมูลที่ส่งให้เท่านั้น**: ค่า `instructions` สั่งห้าม AI สร้างตัวเลขหรือวินิจฉัยขึ้นเอง เพื่อป้องกันปรากฏการณ์ "หลอน" (hallucination — AI ตอบมั่นใจแต่ข้อมูลผิด) ซึ่งมีความเสี่ยงสูงมากสำหรับข้อมูลด้านสุขภาพ
- **Graceful fallback (สำรองไว้เสมอ)**: บรรทัด `if (!apiKey) return fallback;` ทำให้ถ้ายังไม่ได้ตั้งค่า `OPENAI_API_KEY` ฟังก์ชันจะคืนค่าข้อความสรุปแบบง่ายๆ ทันทีโดยไม่เรียก AI เลย และ `try/catch` ทำให้ถ้าเรียก OpenAI ไม่สำเร็จ (เช่น เน็ตหลุด, เครดิตหมด) ก็ยังมีคำตอบสำรองเสมอ ไม่ทำให้บอท error

**ทดสอบ**: ลองเรียกฟังก์ชันนี้ตรงๆ ด้วยข้อมูลจำลอง 1 ระเบียน (ทดสอบได้ทั้งแบบไม่มี API key และแบบมี API key จริง):

```bash
node -e "import('./backend/core.js').then(async ({ aiExplain }) => { const record = { province: 'เชียงราย', year: 2026, patient: 500, patient_rate: 320, dead: 2, dead_rate: 1.2, cfr: 0.4 }; console.log(await aiExplain(record, { apiKey: process.env.OPENAI_API_KEY || '', model: 'gpt-4.1-mini' })); });"
```

หากยังไม่ตั้งค่า `OPENAI_API_KEY` ควรเห็นข้อความสรุปแบบง่าย (`fallback`) หากตั้งค่าไว้แล้วและมีเครดิตในบัญชี OpenAI ควรเห็นคำอธิบายที่ ChatGPT เขียนให้แบบเป็นธรรมชาติมากขึ้น (ทั้งสองกรณีถือว่าถูกต้อง ขึ้นอยู่กับว่าตั้งค่า API key ไว้หรือไม่)

---

## 11. กราฟสถิติด้วย QuickChart

ไม่จำเป็นต้องติดตั้ง chart library หรือ render รูปภาพด้วยตนเอง โดยใช้บริการ [QuickChart](https://quickchart.io/) ซึ่งรับค่า Chart.js config (โครงสร้างกราฟในรูปแบบ JSON) ผ่าน query string ของ URL แล้วส่งกลับเป็นรูปภาพ PNG ให้ทันที สามารถนำ URL นั้นไปส่งเป็น LINE image message ได้โดยตรง โดยไม่ต้องสร้างไฟล์รูปภาพเก็บไว้บนเครื่องเราเองเลย

### 11.1 เพิ่มฟังก์ชัน provinceChartImage

แก้ไข `backend/core.js` เพิ่มฟังก์ชันนี้ต่อจากโค้ดเดิมในไฟล์:

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

**คำอธิบาย**: `config` คือคำอธิบายกราฟแบบ bar chart (แกน X = ปี, แกน Y = จำนวนผู้ป่วย) ตามรูปแบบที่ไลบรารี Chart.js เข้าใจ จากนั้น `encodeURIComponent(JSON.stringify(config))` แปลง object นี้เป็น string แล้วเข้ารหัสให้ใส่ใน URL ได้อย่างปลอดภัย (อักขระพิเศษ เช่น `{`, `"`, เว้นวรรค จะถูกแปลงเป็นรหัสที่ใช้ใน URL ได้) รวมเป็น URL เดียวที่เมื่อเปิดดูจะได้รูปภาพกราฟออกมาทันที

**ทดสอบ**: สร้าง URL กราฟจากข้อมูลจำลอง แล้วเปิดดูผลลัพธ์ในเบราว์เซอร์:

```bash
node -e "import('./backend/core.js').then((core) => { const records = [{ province: 'เชียงราย', year: 2025, patient: 400 }, { province: 'เชียงราย', year: 2026, patient: 500 }]; console.log(core.provinceChartImage ? core.provinceChartImage(records).originalContentUrl : 'ฟังก์ชันยังไม่ได้ export'); });"
```

คัดลอก URL ที่พิมพ์ออกมาไปเปิดในเบราว์เซอร์ ควรเห็นรูปกราฟแท่งแสดงจำนวนผู้ป่วย 2 ปี (เหมือนกับขั้นตอนที่ 10.2 ต้องเพิ่มคำว่า `export` หน้าฟังก์ชันก่อน จึงจะเรียกทดสอบจากนอกไฟล์ได้)

### 11.2 ส่งภาพพร้อม caption ผ่าน LINE

เนื่องจาก LINE image message ไม่มีช่องสำหรับ caption ในตัวเอง จึงต้องส่งข้อความ 2 รายการต่อเนื่องกัน (รูปภาพ ตามด้วยข้อความ) ในเมธอด `reply()` ที่สร้างไว้ในขั้นตอนที่ 6.5 — ส่วนนี้มีอยู่แล้วในโค้ดที่สร้างไว้ก่อนหน้า (ตรวจสอบว่ามีเงื่อนไขสำหรับ `payload.type === 'image'` ในเมธอด `reply`):

```js
messages = [
    { type: 'image', originalContentUrl: payload.originalContentUrl, previewImageUrl: payload.previewImageUrl },
    { type: 'text', text: payload.caption },
];
```

**คำอธิบาย**: `originalContentUrl` คือรูปขนาดเต็มที่ LINE จะแสดงเมื่อผู้ใช้กดดูภาพ ส่วน `previewImageUrl` คือรูปขนาดย่อที่แสดงในหน้าแชท (ในที่นี้ใช้ URL เดียวกันทั้งสองค่า เพื่อความเรียบง่าย) ทั้งสองค่ามาจาก `provinceChartImage()` ที่สร้างไว้ในขั้นตอนที่ 11.1

