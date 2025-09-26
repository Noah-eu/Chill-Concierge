// src/App.jsx
import React, { useEffect, useRef, useState } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { LANGS, FLOWS } from "./flows";

export default function App() {
  const [lang, setLang] = useState(null);        // vybraný jazyk
  const [stack, setStack] = useState([]);        // breadcrumb vybraných úrovní (pro návrat)
  const [chat, setChat] = useState([]);          // zprávy v chatu
  const [input, setInput] = useState("");        // volitelný textový vstup
  const [loading, setLoading] = useState(false);
  const scrollerRef = useRef(null);

  useEffect(() => { scrollerRef.current?.scrollTo(0, 9_999_999); }, [chat]);

  // vícejazyčný pozdrav v bublině na začátku
  useEffect(() => {
    if (chat.length) return;
    setChat([{
      role: "assistant",
      content: [
        "**Ahoj! Jak vám mohu pomoci dnes?** 🇨🇿",
        "**Hello! How can I help you today?** 🇬🇧",
        "**¡Hola! ¿Cómo puedo ayudarte hoy?** 🇪🇸",
        "**Hallo! Wie kann ich Ihnen heute helfen?** 🇩🇪",
        "**Bonjour ! Comment puis-je vous aider aujourd'hui ?** 🇫🇷"
      ].join("\n")
    }]);
  }, [chat.length]);

  function renderAssistant(md = "") {
    const rawHtml = marked.parse(md, { breaks: true });
    const cleanHtml = DOMPurify.sanitize(rawHtml);
    return <div className="bubble bot" dangerouslySetInnerHTML={{ __html: cleanHtml }} />;
  }

  async function sendPrompt(prompt) {
    const next = [...chat, { role: "user", content: prompt }];
    setChat(next);
    setLoading(true);
    try {
      const r = await fetch("/.netlify/functions/concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next })
      });
      const data = await r.json();
      setChat([...next, { role: "assistant", content: data.reply }]);
    } catch (e) {
      setChat([...next, { role: "assistant", content: "⚠️ Nelze se připojit k serveru. Zkuste to prosím znovu." }]);
    } finally {
      setLoading(false);
    }
  }

  function openNode(node) {
    // list dětí = další úroveň menu
    setStack(s => [...s, node]);
  }

  function goBack() {
    setStack(s => s.slice(0, -1));
  }

  // aktuální seznam voleb podle jazyka a úrovně
  const rootFlows = lang ? FLOWS[lang] : null;
  const currentChildren =
    !lang ? null :
    stack.length === 0 ? rootFlows :
    stack[stack.length - 1]?.children ?? rootFlows;

  return (
    <div className="row">
      <div className="scroller" ref={scrollerRef}>
        {chat.map((m, i) =>
          m.role === "assistant"
            ? <div key={i}>{renderAssistant(m.content)}</div>
            : <div key={i} className="bubble me">{m.content}</div>
        )}

        {/* Jazyková volba */}
        {!lang && (
          <div className="bubble bot" style={{ display: "inline-block" }}>
            <strong>Zvolte jazyk / Choose a language:</strong>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
              {Object.entries(LANGS).map(([code, label]) => (
                <button
                  key={code}
                  onClick={() => setLang(code)}
                  style={btnStyle}
                >{label}</button>
              ))}
            </div>
          </div>
        )}

        {/* Nabídka témat/podtémat */}
        {lang && currentChildren && (
          <div className="bubble bot" style={{ display: "inline-block", maxWidth: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <strong style={{ marginBottom: 6 }}>
                {stack.length === 0 ? "Vyberte téma / Pick a topic" : "Podtéma / Subtopic"}
              </strong>
              {stack.length > 0 && (
                <button onClick={goBack} style={{ ...btnStyle, background: "#fff", color: "#111", borderColor: "#ddd" }}>
                  ← Zpět
                </button>
              )}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
              {currentChildren.map((n, idx) => (
                n.children ? (
                  <button key={idx} style={chipStyle} onClick={() => openNode(n)}>{n.label}</button>
                ) : (
                  <button
                    key={idx}
                    style={chipPrimary}
                    onClick={() => sendPrompt(n.prompt)}
                    disabled={loading}
                    title={n.prompt}
                  >
                    {n.label}
                  </button>
                )
              ))}
            </div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>
              Stále můžete psát vlastní dotaz: dole do pole zprávy.
            </div>
          </div>
        )}
      </div>

      {/* Volitelný textový dotaz (fallback) */}
      <div className="input">
        <textarea
          placeholder={lang === "en" ? "Type your question…" : "Napište dotaz…"}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (input.trim()) { sendPrompt(input.trim()); setInput(""); }
            }
          }}
        />
        <button
          disabled={loading || !input.trim()}
          onClick={() => { sendPrompt(input.trim()); setInput(""); }}
        >
          {loading ? "…" : lang === "en" ? "Send" : "Poslat"}
        </button>
      </div>
    </div>
  );
}

/* drobný inline styl tlačítek, ať to hned vypadá pěkně */
const btnStyle = {
  padding: "8px 12px",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "#111827",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 600
};
const chipStyle = {
  padding: "8px 12px",
  borderRadius: 999,
  border: "1px solid #e5e7eb",
  background: "#fff",
  color: "#111",
  cursor: "pointer",
  fontWeight: 600
};
const chipPrimary = { ...chipStyle, background: "#111827", color: "#fff" };
