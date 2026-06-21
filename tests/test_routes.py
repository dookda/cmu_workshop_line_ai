from pathlib import Path
from app import create_app
from app.config import Config


ROOT = Path(__file__).resolve().parent.parent


class TestConfig(Config):
    TESTING = True
    LINE_CHANNEL_SECRET = "test-secret"
    LINE_CHANNEL_ACCESS_TOKEN = ""
    OPENAI_API_KEY = ""
    FAQ_PATH = ROOT / "data" / "health_faq.json"
    STATS_PATH = ROOT / "data" / "health_stats.json"


def test_health_endpoint():
    client = create_app(TestConfig).test_client()
    assert client.get("/health").json["status"] == "ok"


def test_homepage_renders_simulator():
    response = create_app(TestConfig).test_client().get("/")
    assert response.status_code == 200
    assert b'id="chat-form"' in response.data


def test_simulator_answers_from_local_knowledge():
    client = create_app(TestConfig).test_client()
    response = client.post("/api/chat", json={"message": "ป้องกันไข้หวัดใหญ่อย่างไร"})
    assert response.status_code == 200
    assert response.json["type"] == "text"
    assert "กรมควบคุมโรค" in response.json["text"]


def test_webhook_rejects_missing_signature():
    client = create_app(TestConfig).test_client()
    assert client.post("/webhook", json={"events": []}).status_code == 400
