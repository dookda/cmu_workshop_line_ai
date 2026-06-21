import logging
import re
from openai import OpenAI

logger = logging.getLogger(__name__)

EMERGENCY_PATTERNS = (
    "เจ็บหน้าอก", "หายใจไม่ออก", "หมดสติ", "ชัก", "เลือดออกไม่หยุด",
    "อัมพาต", "แขนขาอ่อนแรง", "ฆ่าตัวตาย", "ทำร้ายตัวเอง",
)
EMERGENCY_REPLY = (
    "อาการที่เล่ามาอาจเป็นภาวะฉุกเฉิน กรุณาโทร 1669 หรือไปห้องฉุกเฉินทันที "
    "อย่ารอคำตอบจากแชตบอต หากอยู่คนเดียวให้ติดต่อคนใกล้ตัวให้มาช่วยค่ะ"
)
DISCLAIMER = "\n\nข้อมูลนี้เพื่อสุขศึกษา ไม่แทนการตรวจวินิจฉัยจากแพทย์"


def is_emergency(text: str) -> bool:
    compact = re.sub(r"\s+", "", text.lower())
    return any(pattern.replace(" ", "") in compact for pattern in EMERGENCY_PATTERNS)


class HealthAssistant:
    def __init__(self, repository, api_key="", model="gpt-4.1-mini", top_k=3):
        self.repository = repository
        self.api_key = api_key
        self.model = model
        self.top_k = top_k

    def answer(self, question: str) -> dict:
        question = question.strip()[:1500]
        if is_emergency(question):
            return {"text": EMERGENCY_REPLY, "sources": [], "mode": "emergency"}

        results = self.repository.search(question, self.top_k)
        if not results:
            return {
                "text": "ยังไม่พบข้อมูลที่ตรงกับคำถามนี้ กรุณาลองระบุอาการหรือหัวข้อให้ชัดขึ้น เช่น ไข้หวัดใหญ่ เบาหวาน หรือความดันโลหิตค่ะ" + DISCLAIMER,
                "sources": [],
                "mode": "local",
            }

        sources = [result.item["source"] for result in results]
        if not self.api_key:
            best = results[0].item
            return {
                "text": f"{best['answer']}\n\nแหล่งข้อมูล: {best['source']}" + DISCLAIMER,
                "sources": sources,
                "mode": "local",
            }

        context = "\n\n".join(
            f"[{index}] คำถาม: {result.item['question']}\nคำตอบ: {result.item['answer']}\nแหล่งข้อมูล: {result.item['source']}"
            for index, result in enumerate(results, start=1)
        )
        try:
            client = OpenAI(api_key=self.api_key)
            response = client.responses.create(
                model=self.model,
                instructions=(
                    "คุณคือผู้ช่วยสุขศึกษาภาษาไทย ตอบอย่างกระชับ สุภาพ และเข้าใจง่าย "
                    "ใช้เฉพาะฐานความรู้ที่ให้มา ห้ามวินิจฉัย ห้ามแต่งข้อมูลหรือขนาดยา "
                    "ถ้าฐานความรู้ไม่พอให้บอกตรงๆ อ้างแหล่งข้อมูลท้ายคำตอบ และเตือนให้พบแพทย์เมื่ออาการรุนแรง"
                ),
                input=f"ฐานความรู้:\n{context}\n\nคำถามผู้ใช้: {question}",
            )
            text = response.output_text.strip()
            return {"text": text + DISCLAIMER, "sources": sources, "mode": "ai"}
        except Exception:
            logger.exception("OpenAI request failed; using local fallback")
            best = results[0].item
            return {
                "text": f"{best['answer']}\n\nแหล่งข้อมูล: {best['source']}" + DISCLAIMER,
                "sources": sources,
                "mode": "fallback",
            }
