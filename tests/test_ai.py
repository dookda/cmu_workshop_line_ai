from app.ai import HealthAssistant, is_emergency


class Repo:
    def search(self, *_):
        return []


def test_emergency_guardrail_runs_before_rag():
    answer = HealthAssistant(Repo()).answer("ตอนนี้เจ็บหน้าอกและหายใจไม่ออก")
    assert answer["mode"] == "emergency"
    assert "1669" in answer["text"]


def test_emergency_detection_ignores_spaces():
    assert is_emergency("หายใจ ไม่ออก")
