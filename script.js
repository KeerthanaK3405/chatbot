// ===== CONFIG =====
const API_KEY = ""; // Groq Key

// ===== STATE =====
let savedChats = [
  { title: "Python basics", preview: "How to write a for loop in Python?" },
  { title: "UI Color tips", preview: "Best color combinations for dark mode..." },
  { title: "Story ideas", preview: "A robot who dreams of being human..." },
];
let conversationHistory = [];

// ===== INIT =====
window.addEventListener("DOMContentLoaded", () => {
  renderSavedChats();
});

// ===== SPLASH → CHAT =====
function enterChat() {
  const splash = document.getElementById("splash");
  splash.classList.add("fade-out");
  setTimeout(() => {
    splash.style.display = "none";
    const chatScreen = document.getElementById("chatScreen");
    chatScreen.classList.remove("hidden");
    chatScreen.style.animation = "fadeUp 0.5s ease";
  }, 600);
}

// ===== SIDEBAR =====
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  sidebar.classList.toggle("open");
}

// ===== RENDER SAVED CHATS =====
function renderSavedChats() {
  const list = document.getElementById("savedList");
  list.innerHTML = savedChats
    .map(
      (c, i) => `
      <div class="saved-item" onclick="loadSavedChat(${i})">
        <div class="saved-item-title">💬 ${c.title}</div>
        <div class="saved-item-preview">${c.preview}</div>
      </div>`
    )
    .join("");
}

function loadSavedChat(i) {
  const chat = savedChats[i];
  quickAsk(chat.preview);
  if (window.innerWidth <= 700) toggleSidebar();
}

// ===== QUICK ASK =====
function quickAsk(text) {
  document.getElementById("userInput").value = text;
  sendMessage();
}

// ===== SEND MESSAGE =====
async function sendMessage() {
  const input = document.getElementById("userInput");
  const text = input.value.trim();
  if (!text) return;
  input.value = "";

  const hero = document.getElementById("welcomeHero");
  if (hero) hero.style.display = "none";

  appendMessage("user", text);
  conversationHistory.push({ role: "user", content: text });

  const typingId = showTyping();

  try {
    // ===== GROQ API CALL =====
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
       model: "llama-3.1-8b-instant",
        max_tokens: 1000,
        messages: [
          {
            role: "system",
            content: "You are a smart, friendly AI assistant. Respond helpfully and concisely. Plain text only."
          },
          ...conversationHistory
        ],
      }),
    });

    removeTyping(typingId);

    if (!response.ok) {
      const err = await response.json();
      appendMessage("ai", "Error: " + (err.error?.message || "Something went wrong."));
      return;
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Sorry, I could not understand that.";

    appendMessage("ai", reply);
    conversationHistory.push({ role: "assistant", content: reply });

    if (conversationHistory.length === 2) {
      savedChats.unshift({
        title: text.slice(0, 30) + (text.length > 30 ? "..." : ""),
        preview: reply.slice(0, 50) + "...",
      });
      renderSavedChats();
    }

  } catch (err) {
    removeTyping(typingId);
    appendMessage("ai", "Network error! Live Server-la run pannunga: http://127.0.0.1:5500");
    console.error(err);
  }
}

// ===== APPEND MESSAGE =====
function appendMessage(role, text) {
  const messages = document.getElementById("messages");
  const div = document.createElement("div");
  div.className = `msg ${role}`;
  div.innerHTML = `
    <div class="msg-icon">${role === "ai" ? "AI" : "You"}</div>
    <div class="msg-bubble">${escapeHtml(text).replace(/\n/g, "<br/>")}</div>
  `;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

// ===== TYPING INDICATOR =====
function showTyping() {
  const messages = document.getElementById("messages");
  const id = "typing-" + Date.now();
  const div = document.createElement("div");
  div.className = "msg ai";
  div.id = id;
  div.innerHTML = `
    <div class="msg-icon">AI</div>
    <div class="msg-bubble"><div class="typing-dots"><span></span><span></span><span></span></div></div>
  `;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
  return id;
}

function removeTyping(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

// ===== UTILS =====
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
