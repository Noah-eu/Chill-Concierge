// src/App.jsx
import React, { useEffect, useRef, useState } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { LANGS, FLOWS } from "./flows";

export default function App({ initialMessages = [] }) {
  const [lang, setLang] = useState(null);
  const [stack, setStack] = useState([]);
  const [chat, setChat] = useState(initialMessages.length ? initialMessages : []);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollerRef = useRef(null);

  useEffect(() => { scrollerRef.current?.scrollTo(0, 9_999_999); }, [chat]);

  // po volbě jazyka schovej multi-greeting (statický v index.html)
  useEffect(() => {
    document.body.classList.toggle("lang-selected", !!lang);
  }, [lang]);

  function renderAssistant(md = "") {
    const rawHtml = marked.parse(md, { breaks: true });
    const cleanHtml = DOMPurify.sanitize(rawHtml);
    return <div className="bubble bot" dangerouslySetInnerHTML={{ __html: cleanHtml }} />;
  }

  async function sendPrompt(prompt) {
    if (!prompt) return;
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
    } catch {
      setChat([...next, { role: "assistant", content: "⚠️ Nelze se připojit k serveru. Zkuste to prosím znovu." }]);
    } finally {
      setLoading(false);
    }
  }

  function openNode(node) { setStack(s => [...s, node]); }
  function goBack() { setStack(s => s.slice(0, -1)); }

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

        {!lang && (
          <div className="bubble bot" style={{ display: "inline-block" }}>
            <strong>Zvolte jazyk / Choose a language:</strong>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 10 }}>
              {Object.entries(LANGS).map(([code, label]) => (
                <button key={code} onClick={() => setLang(code)} style={btnStyle}>{label}</button>
              ))}
            </div>
          </div>
        )}

        {lang && currentChildren && (
          <div className="bubble bot" style={{ display: "inline-block", maxWidth: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <strong style={{ marginBottom: 6 }}>
                {stack.length === 0 ? (lang === "en" ? "Pick a topic / Vyberte téma" : "Vyberte téma / Pick a topic") : "Podtéma / Subtopic"}
              </strong>
              {stack.length > 0 && (
                <button onClick={goBack} style={{ ...btnStyle, background: "#fff", color: "#111", borderColor: "#ddd", minWidth: 90 }}>
                  {lang === "en" ? "← Back" : "← Zpět"}
                </button>
              )}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 8 }}>
              {currentChildren.map((n, idx) =>
                n.children ? (
                  <button key={idx} style={chipStyle} onClick={() => openNode(n)}>{n.label}</button>
                ) : (
                  <button
                    key={idx}
                    style={chipPrimary}
                    onClick={() => sendPrompt(n.prompt)}
                    disabled={loading || !n.prompt}
                    title={n.prompt}
                  >
                    {n.label}
                  </button>
                )
              )}
            </div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 10 }}>
              {lang === "en"
                ? "You can always type your own question below."
                : "Stále můžete napsat vlastní dotaz do pole níže."}
            </div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>
              {lang === "en"
                ? "If you can’t find what you need, message David – WhatsApp +420 733 439 733."
                : "Pokud jste nenašli informace, které potřebujete, obraťte se na Davida – WhatsApp +420 733 439 733."}
            </div>
          </div>
        )}
      </div>

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
        <button disabled={loading || !input.trim()} onClick={() => { sendPrompt(input.trim()); setInput(""); }}>
          {loading ? "…" : (lang === "en" ? "Send" : "Poslat")}
        </button>
      </div>
    </div>
  );
}

/* Paleta a větší tlačítka */
const colors = {
  primary: "#0f172a",
  primaryText: "#ffffff",
  outline: "#e5e7eb",
  chip: "#111827",
  chipText: "#ffffff",
  light: "#ffffff",
  lightText: "#111111",
};

const btnStyle = {
  padding: "12px 16px",
  borderRadius: 16,
  border: `1px solid ${colors.outline}`,
  background: colors.primary,
  color: colors.primaryText,
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 16,
  boxShadow: "0 4px 14px rgba(0,0,0,.08)"
};

const chipStyle = {
  padding: "12px 16px",
  borderRadius: 999,
  border: `1px solid ${colors.outline}`,
  background: colors.light,
  color: colors.lightText,
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 16,
  boxShadow: "0 4px 14px rgba(0,0,0,.06)"
};

const chipPrimary = { ...chipStyle, background: colors.chip, color: colors.chipText };
