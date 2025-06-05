"use client";
import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "bot";
  text: string;
  context?: string;
}

const LS_KEY = "rag-chat-history";
const THEME_KEY = "rag-chat-theme";
const SUGGESTIONS = [
  "Jaka jest historia Polski?",
  "Kto był pierwszym królem Polski?",
  "Opowiedz o rozbiorach Polski.",
  "Jak Polska odzyskała niepodległość?",
];

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

const THEMES = [
  { name: "Jasny", key: "light" },
  { name: "Ciemny", key: "dark" },
  { name: "Kolorowy", key: "color" },
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<string>("auto");
  const [isDark, setIsDark] = useState(false);

  // Tryb ciemny/kolorowy/manualny
  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved && saved !== "auto") setTheme(saved);
    else setTheme("auto");
  }, []);
  useEffect(() => {
    if (theme === "auto") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      setIsDark(mq.matches);
      const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    } else if (theme === "dark") setIsDark(true);
    else setIsDark(false);
  }, [theme]);

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

  // Zapisuj motyw
  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !file) return;
    let fileContent = "";
    if (file) {
      if (file.type === "application/pdf") {
        // PDF: tylko nazwa, bo nie parsujemy PDF po stronie frontu (można dodać pdfjs w przyszłości)
        fileContent = `\n[Załączono plik PDF: ${file.name}]`;
      } else {
        fileContent = await file.text();
      }
    }
    setMessages((msgs) => [...msgs, { role: "user", text: input + (fileContent ? `\n${fileContent}` : "") }]);
    setLoading(true);
    try {
      const body: any = { query: input };
      if (file && file.type !== "application/pdf") {
        body.fileContent = fileContent;
        body.fileName = file.name;
      }
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
      setFile(null);
      setFileName("");
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
  const bg = theme === "color" ? "linear-gradient(135deg,#e3f0ff 0%,#f7e8ff 100%)" : isDark ? "#181c20" : "#f7f8fa";
  const card = isDark ? "#23272e" : "#fff";
  const border = isDark ? "#333" : "#e0e0e0";
  const userBubble = theme === "color" ? "linear-gradient(135deg,#4285f4,#34a853)" : "#4285f4";
  const botBubble = theme === "color" ? "linear-gradient(135deg,#fff,#4285f4 80%)" : isDark ? "#23272e" : "#f1f3f4";
  const botText = isDark ? "#fff" : "#222";
  const userText = "#fff";
  const contextBg = isDark ? "#222b" : "#e8f0fe";
  const contextText = isDark ? "#bcd" : "#333";

  return (
    <main style={{ maxWidth: 600, margin: "40px auto", fontFamily: "Inter, sans-serif", background: bg, borderRadius: 16, boxShadow: "0 2px 16px #0001", padding: 24, minHeight: "100vh" }}>
      <h1 style={{ textAlign: "center", fontWeight: 700, fontSize: 28, marginBottom: 16, color: isDark ? "#fff" : undefined }}>
        RAG Chatbot <span style={{ color: "#4285f4" }}>(Gemini Flash)</span>
      </h1>
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 12 }}>
        {THEMES.map(t => (
          <button key={t.key} onClick={() => setTheme(t.key)} style={{
            padding: "6px 16px", borderRadius: 8, border: 0, fontWeight: 500, fontSize: 14,
            background: theme === t.key ? "#4285f4" : isDark ? "#23272e" : "#e0e0e0",
            color: theme === t.key ? "#fff" : isDark ? "#fff" : "#333",
            cursor: "pointer"
          }}>{t.name}</button>
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        {SUGGESTIONS.map(s => (
          <button key={s} onClick={() => setInput(s)} style={{
            padding: "6px 12px", borderRadius: 8, border: 0, fontWeight: 400, fontSize: 14,
            background: isDark ? "#23272e" : "#e0e0e0", color: isDark ? "#fff" : "#333", cursor: "pointer"
          }}>{s}</button>
        ))}
      </div>
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
              <b style={{ fontWeight: 600 }}>{msg.role === "user" ? "Ty" : "Bot"}:</b>{" "}
              <ReactMarkdown>{msg.text}</ReactMarkdown>
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
      <form onSubmit={sendMessage} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Twoje pytanie…"
          style={{ flex: 1, padding: 12, borderRadius: 8, border: `1px solid ${border}`, fontSize: 16, background: isDark ? "#23272e" : "#f9f9fb", color: isDark ? "#fff" : undefined }}
          disabled={loading}
        />
        <input
          type="file"
          accept=".txt,application/pdf"
          style={{ display: "none" }}
          id="file-upload"
          onChange={e => {
            if (e.target.files && e.target.files[0]) {
              setFile(e.target.files[0]);
              setFileName(e.target.files[0].name);
            }
          }}
        />
        <label htmlFor="file-upload" style={{
          background: isDark ? "#23272e" : "#e0e0e0",
          color: isDark ? "#fff" : "#333",
          borderRadius: 8,
          padding: "10px 14px",
          fontWeight: 500,
          fontSize: 14,
          cursor: "pointer",
          border: 0,
          marginRight: 4
        }}>
          📎
        </label>
        {fileName && <span style={{ fontSize: 13, color: isDark ? "#fff" : "#333", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis" }}>{fileName}</span>}
        <button type="submit" disabled={loading || (!input.trim() && !file)} style={{ padding: "12px 24px", borderRadius: 8, background: "#4285f4", color: "#fff", border: 0, fontWeight: 600, fontSize: 16, cursor: loading ? "not-allowed" : "pointer" }}>
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
