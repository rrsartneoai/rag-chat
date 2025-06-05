"use client";
import { useState, useEffect, useRef } from "react";

interface Message {
  role: "user" | "bot";
  text: string;
  context?: string;
}

const LS_KEY = "rag-chat-history";

const AVATAR_USER = (
  <span style={{
    display: "inline-block",
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "linear-gradient(135deg,#4285f4,#34a853)",
    color: "#fff",
    fontWeight: 700,
    fontSize: 20,
    textAlign: "center",
    lineHeight: "36px",
    margin: 4,
    boxShadow: "0 2px 8px #4285f422"
  }}>Ty</span>
);
const AVATAR_BOT = (
  <span style={{
    display: "inline-block",
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "linear-gradient(135deg,#fff,#4285f4 80%)",
    color: "#4285f4",
    fontWeight: 700,
    fontSize: 20,
    textAlign: "center",
    lineHeight: "36px",
    margin: 4,
    boxShadow: "0 2px 8px #0001"
  }}>🤖</span>
);

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isDark, setIsDark] = useState(false);

  // Tryb ciemny na podstawie prefers-color-scheme
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Wczytaj historię z localStorage
  useEffect(() => {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) setMessages(JSON.parse(raw));
  }, []);

  // Zapisuj historię do localStorage
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages((msgs) => [...msgs, { role: "user", text: input }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: input }),
      });
      const data = await res.json();
      setMessages((msgs) => [
        ...msgs,
        { role: "bot", text: data.answer, context: data.context },
      ]);
    } catch (err) {
      setMessages((msgs) => [
        ...msgs,
        { role: "bot", text: "Błąd podczas generowania odpowiedzi." },
      ]);
    } finally {
      setLoading(false);
      setInput("");
    }
  };

  const clearHistory = () => {
    setMessages([]);
    localStorage.removeItem(LS_KEY);
  };

  // Animacja fade-in dla wiadomości
  const fadeIn = {
    animation: "fadein 0.6s",
    "@keyframes fadein": {
      from: { opacity: 0, transform: "translateY(20px)" },
      to: { opacity: 1, transform: "none" },
    },
  };

  // Kolory zależne od trybu
  const bg = isDark ? "#181c20" : "#f7f8fa";
  const card = isDark ? "#23272e" : "#fff";
  const border = isDark ? "#333" : "#e0e0e0";
  const userBubble = isDark ? "#4285f4" : "#4285f4";
  const botBubble = isDark ? "#23272e" : "#f1f3f4";
  const botText = isDark ? "#fff" : "#222";
  const userText = "#fff";
  const contextBg = isDark ? "#222b" : "#e8f0fe";
  const contextText = isDark ? "#bcd" : "#333";

  return (
    <main style={{ maxWidth: 600, margin: "40px auto", fontFamily: "Inter, sans-serif", background: bg, borderRadius: 16, boxShadow: "0 2px 16px #0001", padding: 24, minHeight: "100vh" }}>
      <h1 style={{ textAlign: "center", fontWeight: 700, fontSize: 28, marginBottom: 16, color: isDark ? "#fff" : undefined }}>
        RAG Chatbot <span style={{ color: "#4285f4" }}>(Gemini Flash)</span>
      </h1>
      <div style={{ minHeight: 320, background: card, border: `1px solid ${border}`, borderRadius: 12, padding: 16, marginBottom: 16, overflowY: "auto", maxHeight: 400 }}>
        {messages.length === 0 && <div style={{ color: isDark ? "#888" : "#888", textAlign: "center" }}>Zadaj pytanie…</div>}
        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", flexDirection: msg.role === "user" ? "row-reverse" : "row", alignItems: "flex-end", margin: "12px 0", ...fadeIn }}>
            <div style={{ margin: "0 8px" }}>{msg.role === "user" ? AVATAR_USER : AVATAR_BOT}</div>
            <div style={{
              background: msg.role === "user" ? userBubble : botBubble,
              color: msg.role === "user" ? userText : botText,
              borderRadius: 18,
              padding: "12px 16px",
              maxWidth: "75%",
              boxShadow: msg.role === "user" ? "0 2px 8px #4285f422" : "0 2px 8px #0001",
              fontSize: 16,
              position: "relative",
              transition: "background 0.3s, color 0.3s"
            }}>
              <b style={{ fontWeight: 600 }}>{msg.role === "user" ? "Ty" : "Bot"}:</b> {msg.text}
              {msg.role === "bot" && msg.context && (
                <details style={{ marginTop: 8, fontSize: 13, background: contextBg, borderRadius: 8, padding: 8, color: contextText }}>
                  <summary style={{ cursor: "pointer", fontWeight: 500, color: "#4285f4" }}>Pokaż kontekst</summary>
                  <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{msg.context}</pre>
                </details>
              )}
            </div>
          </div>
        ))}
        {loading && <div style={{ color: isDark ? "#888" : "#888", textAlign: "center" }}>Generowanie odpowiedzi…</div>}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Twoje pytanie…"
          style={{ flex: 1, padding: 12, borderRadius: 8, border: `1px solid ${border}`, fontSize: 16, background: isDark ? "#23272e" : "#f9f9fb", color: isDark ? "#fff" : undefined }}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()} style={{ padding: "12px 24px", borderRadius: 8, background: "#4285f4", color: "#fff", border: 0, fontWeight: 600, fontSize: 16, cursor: loading ? "not-allowed" : "pointer" }}>
          Wyślij
        </button>
      </form>
      <button onClick={clearHistory} style={{ width: "100%", padding: 8, borderRadius: 8, background: isDark ? "#333" : "#e0e0e0", color: isDark ? "#fff" : "#333", border: 0, fontWeight: 500, fontSize: 14, cursor: "pointer" }}>
        Wyczyść historię
      </button>
      <div style={{ textAlign: "center", color: isDark ? "#666" : "#bbb", fontSize: 13, marginTop: 16 }}>
        <span>Made with Gemini Flash & AI SDK</span>
      </div>
      <style>{`
        @media (max-width: 700px) {
          main { padding: 8px !important; }
        }
        @keyframes fadein {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: none; }
        }
      `}</style>
    </main>
  );
}
