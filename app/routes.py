import hashlib
import hmac
import json
from functools import lru_cache

from flask import Blueprint, abort, current_app, jsonify, render_template, request

from .ai import HealthAssistant
from .health_data import FAQRepository
from .line_service import LineService

bp = Blueprint("main", __name__)


@lru_cache(maxsize=8)
def _services(faq_path: str, stats_path: str, api_key: str, model: str, top_k: int, token: str):
    repository = FAQRepository(faq_path)
    stats = json.loads(open(stats_path, encoding="utf-8").read())
    assistant = HealthAssistant(repository, api_key=api_key, model=model, top_k=top_k)
    return repository, LineService(token, assistant, repository, stats)


def services():
    config = current_app.config
    return _services(str(config["FAQ_PATH"]), str(config["STATS_PATH"]), config["OPENAI_API_KEY"], config["OPENAI_MODEL"], config["RAG_TOP_K"], config["LINE_CHANNEL_ACCESS_TOKEN"])


@bp.get("/")
def index():
    return render_template("index.html")


@bp.get("/health")
def health():
    return jsonify(status="ok", service="healthline-ai")


@bp.post("/api/chat")
def chat():
    payload = request.get_json(silent=True) or {}
    text = str(payload.get("message", "")).strip()
    if not text:
        return jsonify(error="message is required"), 400
    _, line = services()
    return jsonify(line.respond(text))


@bp.post("/webhook")
def webhook():
    secret = current_app.config["LINE_CHANNEL_SECRET"]
    signature = request.headers.get("X-Line-Signature", "")
    body = request.get_data()
    if not secret or not _valid_signature(body, signature, secret):
        abort(400)

    payload = request.get_json(silent=True) or {}
    _, line = services()
    for event in payload.get("events", []):
        if event.get("type") == "message" and event.get("message", {}).get("type") == "text":
            reply = line.respond(event["message"]["text"])
            line.reply(event.get("replyToken", ""), reply)
        elif event.get("type") == "follow":
            line.reply(event.get("replyToken", ""), line.respond("เมนู"))
    return "OK"


def _valid_signature(body: bytes, signature: str, secret: str) -> bool:
    import base64
    expected = base64.b64encode(hmac.new(secret.encode(), body, hashlib.sha256).digest()).decode()
    return hmac.compare_digest(expected, signature)
