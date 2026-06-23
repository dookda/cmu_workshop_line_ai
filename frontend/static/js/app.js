const form = document.querySelector("#chat-form");
const input = document.querySelector("#message");
const messages = document.querySelector("#messages");

function addMessage(text, role, loading = false) {
  const item = document.createElement("div");
  item.className = `message ${role}${loading ? " loading" : ""}`;
  const bubble = document.createElement("span");
  bubble.textContent = text;
  const meta = document.createElement("small");
  meta.textContent = role === "user" ? "YOU · NOW" : "BOT · NOW";
  item.append(bubble, meta);
  messages.append(item);
  messages.scrollTop = messages.scrollHeight;
  return item;
}

async function send(text) {
  if (!text.trim()) return;
  addMessage(text, "user");
  const pending = addMessage("กำลังค้นฐานความรู้", "bot", true);
  try {
    const response = await fetch("/api/chat", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({message:text})});
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "request failed");
    pending.remove();
    if (data.type === "flex") {
      addMessage(`${data.altText}\n\nพิมพ์หัวข้อที่สนใจเพื่อดูรายละเอียด`, "bot");
    } else {
      addMessage(data.text, "bot");
    }
  } catch (_) {
    pending.remove();
    addMessage("เชื่อมต่อระบบไม่ได้ กรุณาลองใหม่อีกครั้ง", "bot");
  }
}

form.addEventListener("submit", event => { event.preventDefault(); const text=input.value; input.value=""; send(text); });
document.querySelectorAll("[data-prompt]").forEach(button => button.addEventListener("click", () => { document.querySelector("#lab").scrollIntoView(); send(button.dataset.prompt); }));
