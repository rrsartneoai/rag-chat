"use client";
import { useState, useEffect, useRef } from "react";

interface Message {
  role: "user" | "bot";
  text: string;
  context?: string;
}

const LS_KEY = "rag-chat-history";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Wczytaj historię z localStorage
  useEffect(() => {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) setMessages(JSON.parse(raw));
  }, []);

  // Zapisuj historię do localStorage
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(messages));
    // Scroll do dołu po każdej wiadomości
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

  return (
    <main style={{ maxWidth: 600, margin: "40px auto", fontFamily: "Inter, sans-serif", background: "#f7f8fa", borderRadius: 16, boxShadow: "0 2px 16px #0001", padding: 24 }}>
      <h1 style={{ textAlign: "center", fontWeight: 700, fontSize: 28, marginBottom: 16 }}>RAG Chatbot <span style={{ color: "#4285f4" }}>(Gemini Flash)</span></h1>
      <div style={{ minHeight: 320, background: "#fff", border: "1px solid #e0e0e0", borderRadius: 12, padding: 16, marginBottom: 16, overflowY: "auto", maxHeight: 400 }}>
        {messages.length === 0 && <div style={{ color: "#888", textAlign: "center" }}>Zadaj pytanie…</div>}
        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", flexDirection: msg.role === "user" ? "row-reverse" : "row", alignItems: "flex-end", margin: "12px 0" }}>
            <div style={{
              background: msg.role === "user" ? "#4285f4" : "#f1f3f4",
              color: msg.role === "user" ? "#fff" : "#222",
              borderRadius: 18,
              padding: "12px 16px",
              maxWidth: "75%",
              boxShadow: msg.role === "user" ? "0 2px 8px #4285f422" : "0 2px 8px #0001",
              fontSize: 16,
              position: "relative"
            }}>
              <b style={{ fontWeight: 600 }}>{msg.role === "user" ? "Ty" : "Bot"}:</b> {msg.text}
              {msg.role === "bot" && msg.context && (
                <details style={{ marginTop: 8, fontSize: 13, background: "#e8f0fe", borderRadius: 8, padding: 8, color: "#333" }}>
                  <summary style={{ cursor: "pointer", fontWeight: 500, color: "#4285f4" }}>Pokaż kontekst</summary>
                  <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{msg.context}</pre>
                </details>
              )}
            </div>
          </div>
        ))}
        {loading && <div style={{ color: "#888", textAlign: "center" }}>Generowanie odpowiedzi…</div>}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Twoje pytanie…"
          style={{ flex: 1, padding: 12, borderRadius: 8, border: "1px solid #ccc", fontSize: 16, background: "#f9f9fb" }}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()} style={{ padding: "12px 24px", borderRadius: 8, background: "#4285f4", color: "#fff", border: 0, fontWeight: 600, fontSize: 16, cursor: loading ? "not-allowed" : "pointer" }}>
          Wyślij
        </button>
      </form>
      <button onClick={clearHistory} style={{ width: "100%", padding: 8, borderRadius: 8, background: "#e0e0e0", color: "#333", border: 0, fontWeight: 500, fontSize: 14, cursor: "pointer" }}>
        Wyczyść historię
      </button>
      <div style={{ textAlign: "center", color: "#bbb", fontSize: 13, marginTop: 16 }}>
        <span>Made with Gemini Flash & AI SDK</span>
      </div>
    </main>
  );
}
