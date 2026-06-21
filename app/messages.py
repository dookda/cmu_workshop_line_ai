from datetime import datetime


def flex_message(alt_text: str, contents: dict) -> dict:
    return {"type": "flex", "altText": alt_text, "contents": contents}


def menu_flex() -> dict:
    return flex_message("เมนู HealthLine AI", {
        "type": "bubble",
        "styles": {"header": {"backgroundColor": "#0C5C4C"}},
        "header": {"type": "box", "layout": "vertical", "paddingAll": "20px", "contents": [
            {"type": "text", "text": "HEALTHLINE AI", "color": "#BDF5D8", "size": "xs", "weight": "bold"},
            {"type": "text", "text": "ผู้ช่วยสุขภาพใกล้ตัว", "color": "#FFFFFF", "size": "xl", "weight": "bold", "margin": "sm"},
        ]},
        "body": {"type": "box", "layout": "vertical", "spacing": "md", "contents": [
            {"type": "text", "text": "เลือกหัวข้อหรือพิมพ์คำถามสุขภาพทั่วไปได้เลย", "wrap": True, "color": "#40544D"},
            _action_row("คำถามที่พบบ่อย", "faq", "#E7F7EE"),
            _action_row("สถิติสุขภาพ", "สถิติ", "#FFF0D9"),
            _action_row("วิธีใช้งาน", "ช่วยเหลือ", "#E9F0FF"),
            {"type": "separator", "margin": "md"},
            {"type": "text", "text": "กรณีฉุกเฉิน โทร 1669", "color": "#B42318", "size": "sm", "weight": "bold"},
        ]},
    })


def _action_row(label: str, text: str, color: str) -> dict:
    return {"type": "box", "layout": "horizontal", "backgroundColor": color, "cornerRadius": "10px", "paddingAll": "14px", "action": {"type": "message", "label": label, "text": text}, "contents": [
        {"type": "text", "text": label, "weight": "bold", "color": "#173F35"},
        {"type": "text", "text": "›", "align": "end", "color": "#0C5C4C", "size": "xl"},
    ]}


def faq_flex(items: list[dict]) -> dict:
    rows = []
    for item in items[:6]:
        rows.append({"type": "box", "layout": "vertical", "paddingAll": "12px", "backgroundColor": "#F4F8F6", "cornerRadius": "8px", "action": {"type": "message", "label": item["question"][:20], "text": item["question"]}, "contents": [
            {"type": "text", "text": item["question"], "wrap": True, "size": "sm", "weight": "bold", "color": "#173F35"}
        ]})
    return flex_message("คำถามสุขภาพที่พบบ่อย", {"type": "bubble", "header": {"type": "box", "layout": "vertical", "contents": [{"type": "text", "text": "คำถามที่พบบ่อย", "size": "xl", "weight": "bold", "color": "#0C5C4C"}]}, "body": {"type": "box", "layout": "vertical", "spacing": "sm", "contents": rows}})


def stats_flex(stats: dict) -> dict:
    bars = []
    for item in stats["items"]:
        width = f"{max(8, round(item['value'] / stats['max'] * 100))}%"
        bars.extend([
            {"type": "box", "layout": "horizontal", "contents": [
                {"type": "text", "text": item["label"], "size": "sm", "color": "#40544D", "flex": 4},
                {"type": "text", "text": f"{item['value']}{item['unit']}", "size": "sm", "weight": "bold", "align": "end", "flex": 2},
            ]},
            {"type": "box", "layout": "horizontal", "height": "8px", "backgroundColor": "#E8EEEB", "cornerRadius": "4px", "contents": [
                {"type": "box", "layout": "vertical", "width": width, "backgroundColor": item.get("color", "#20A475"), "cornerRadius": "4px", "contents": []}
            ]},
        ])
    return flex_message(stats["title"], {"type": "bubble", "header": {"type": "box", "layout": "vertical", "backgroundColor": "#102D27", "contents": [
        {"type": "text", "text": "HEALTH SNAPSHOT", "size": "xs", "color": "#79DEB0", "weight": "bold"},
        {"type": "text", "text": stats["title"], "wrap": True, "size": "xl", "weight": "bold", "color": "#FFFFFF", "margin": "sm"},
        {"type": "text", "text": datetime.now().strftime("อัปเดต %d/%m/%Y"), "size": "xs", "color": "#C7D8D2", "margin": "sm"},
    ]}, "body": {"type": "box", "layout": "vertical", "spacing": "md", "contents": bars + [
        {"type": "separator", "margin": "md"}, {"type": "text", "text": stats["source"], "size": "xxs", "color": "#6D7E78", "wrap": True}
    ]}})
