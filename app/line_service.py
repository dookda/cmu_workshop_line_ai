import json
from linebot.v3.messaging import ApiClient, Configuration, FlexMessage, MessagingApi, ReplyMessageRequest, TextMessage
from linebot.v3.messaging.models.flex_container import FlexContainer

from .messages import faq_flex, menu_flex, stats_flex


class LineService:
    def __init__(self, access_token: str, assistant, repository, stats: dict):
        self.access_token = access_token
        self.assistant = assistant
        self.repository = repository
        self.stats = stats

    def respond(self, text: str) -> dict:
        normalized = text.strip().lower()
        if normalized in {"เมนู", "menu", "help", "ช่วยเหลือ"}:
            return menu_flex()
        if normalized in {"faq", "คำถาม", "คำถามที่พบบ่อย"}:
            return faq_flex(self.repository.items)
        if normalized in {"สถิติ", "stats", "ข้อมูลสถิติ"}:
            return stats_flex(self.stats)
        result = self.assistant.answer(text)
        return {"type": "text", "text": result["text"], "mode": result["mode"]}

    def reply(self, reply_token: str, payload: dict) -> None:
        if not self.access_token:
            return
        if payload["type"] == "flex":
            container = FlexContainer.from_json(json.dumps(payload["contents"], ensure_ascii=False))
            message = FlexMessage(alt_text=payload["altText"], contents=container)
        else:
            message = TextMessage(text=payload["text"])
        configuration = Configuration(access_token=self.access_token)
        with ApiClient(configuration) as api_client:
            MessagingApi(api_client).reply_message(ReplyMessageRequest(reply_token=reply_token, messages=[message]))
