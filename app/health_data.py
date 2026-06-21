import json
import re
from dataclasses import dataclass
from pathlib import Path


def _terms(text: str) -> set[str]:
    normalized = re.sub(r"[^0-9A-Za-zก-๙]+", " ", text.lower()).strip()
    words = set(normalized.split())
    # Thai often has no spaces: character n-grams keep retrieval dependency-free.
    compact = normalized.replace(" ", "")
    words.update(compact[i : i + 3] for i in range(max(0, len(compact) - 2)))
    return {word for word in words if word}


@dataclass(frozen=True)
class SearchResult:
    item: dict
    score: float


class FAQRepository:
    def __init__(self, path: str | Path):
        self.path = Path(path)
        self.items = json.loads(self.path.read_text(encoding="utf-8"))

    def search(self, query: str, limit: int = 3) -> list[SearchResult]:
        query_terms = _terms(query)
        if not query_terms:
            return []
        ranked = []
        for item in self.items:
            haystack = " ".join(
                [item["question"], item["answer"], *item.get("keywords", [])]
            )
            item_terms = _terms(haystack)
            overlap = len(query_terms & item_terms)
            score = overlap / max(1, len(query_terms))
            keyword_bonus = sum(
                0.8 for keyword in item.get("keywords", []) if keyword.lower() in query.lower()
            )
            score += keyword_bonus
            if score > 0:
                ranked.append(SearchResult(item=item, score=score))
        return sorted(ranked, key=lambda result: result.score, reverse=True)[:limit]
