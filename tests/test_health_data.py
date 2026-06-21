from app.health_data import FAQRepository


def test_thai_query_finds_relevant_faq(tmp_path):
    path = tmp_path / "faq.json"
    path.write_text('[{"question":"ป้องกันไข้หวัดใหญ่","answer":"ล้างมือและฉีดวัคซีน","keywords":["ไข้หวัดใหญ่"],"source":"test"}]', encoding="utf-8")
    repository = FAQRepository(path)
    results = repository.search("ไข้หวัดใหญ่ทำอย่างไร")
    assert results
    assert results[0].item["source"] == "test"


def test_empty_query_returns_no_results(tmp_path):
    path = tmp_path / "faq.json"
    path.write_text("[]", encoding="utf-8")
    assert FAQRepository(path).search("   ") == []
