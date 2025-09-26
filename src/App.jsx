// src/App.jsx
import React, { useEffect, useRef, useState } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";

export default function App({ initialMessages = [] }) {
  const [chat, setChat] = useState(
    initialMessages.length
      ? initialMessages
      : [{ role: "assistant", content: "👋 Vítejte v CHILL Concierge! Vyberte si z možností níže." }]
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollerRef = useRef(null);

  // auto scroll po každé změně chatu
  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: 9_999_999, behavior: "smooth" });
  }, [chat]);

  // helper: rendruje markdown od asistenta bezpečně
  function renderAssistant(md = "") {
    const raw = marked.parse(md, { breaks: true });
    const clean = DOMPurify.sanitize(raw);
    return <div className="bubble bot" dangerouslySetInnerHTML={{ __html: clean }} />;
  }

  async function sendPrompt(promptText) {
    if (!promptText?.trim()) return;
    const next = [...chat, { role: "user", content: promptText.trim() }];
    setChat(next);
    setLoading(true);
    try {
      const r = await fetch("/.netlify/functions/concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next })
      });
      const data = await r.json();
      setChat([...next, { role: "assistant", content: data.reply || "…" }]);
    } catch {
      setChat([...next, { role: "assistant", content: "⚠️ Nelze se připojit k serveru. Zkuste to prosím znovu." }]);
    } finally {
      setLoading(false);
    }
  }

  // kontrolní volání pro curated seznamy (bez modelu)
  async function sendControl(control) {
    const label = control?.sub ? `[${control.intent}:${control.sub}]` : `[${control?.intent || "local"}]`;
    const next = [...chat, { role: "user", content: label }];
    setChat(next);
    setLoading(true);
    try {
      const r = await fetch("/.netlify/functions/concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ control })
      });
      const data = await r.json();
      setChat([...next, { role: "assistant", content: data.reply || "…" }]);
    } catch {
      setChat([...next, { role: "assistant", content: "⚠️ Nelze se připojit k serveru. Zkuste to prosím znovu." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="row">
      <div className="scroller" ref={scrollerRef}>
        {chat.map((m, i) =>
          m.role === "assistant" ? (
            <div key={i}>{renderAssistant(m.content)}</div>
          ) : (
            <div key={i} className="bubble me">{m.content}</div>
          )
        )}
        {loading && <div className="bubble bot">⏳ Načítám…</div>}
      </div>

      {/* Ovládací panel */}
      <div className="bubble bot" style={{ display: "inline-block", maxWidth: "100%" }}>
        <strong style={{ display: "block", marginBottom: 8 }}>🍽 Jídlo & okolí (kurátorované, bez halucinací)</strong>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
          <button onClick={() => sendControl({ intent: "local", sub: "breakfast" })}>Snídaně</button>
          <button onClick={() => sendControl({ intent: "local", sub: "veggie" })}>Vegan</button>
          <button onClick={() => sendControl({ intent: "local", sub: "czech" })}>Česká kuchyně</button>
          <button onClick={() => sendControl({ intent: "local", sub: "grocery" })}>Supermarket</button>
          <button onClick={() => sendControl({ intent: "local", sub: "pharmacy" })}>Lékárna</button>
          <button onClick={() => sendControl({ intent: "local", sub: "exchange" })}>Směnárna</button>
          <button onClick={() => sendControl({ intent: "local", sub: "atm" })}>ATM</button>
          {/* případně další: cafe, bakery, bar, vietnam */}
          <button onClick={() => sendControl({ intent: "local", sub: "cafe" })}>Kavárny</button>
          <button onClick={() => sendControl({ intent: "local", sub: "bakery" })}>Pekárny</button>
          <button onClick={() => sendControl({ intent: "local", sub: "bar" })}>Bar / Pub</button>
          <button onClick={() => sendControl({ intent: "local", sub: "vietnam" })}>Vietnam</button>
        </div>

        <strong style={{ display: "block", margin: "8px 0" }}>🛠 Technické potíže</strong>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
          <button onClick={() => sendPrompt("Wi-Fi")}>Wi-Fi</button>
          <button onClick={() => sendPrompt("Elektřina")}>Elektřina</button>
          <button onClick={() => sendPrompt("Teplá voda")}>Teplá voda</button>
          <button onClick={() => sendPrompt("Klimatizace")}>Klimatizace</button>
          <button onClick={() => sendPrompt("Indukční deska")}>Indukční deska</button>
          <button onClick={() => sendPrompt("Digestoř")}>Digestoř</button>
          <button onClick={() => sendPrompt("Kávovar")}>Kávovar</button>
          <button onClick={() => sendPrompt("Požární hlásič")}>Požární hlásič</button>
        </div>

        <strong style={{ display: "block", margin: "8px 0" }}>🏠 Ostatní</strong>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <button onClick={() => sendPrompt("Úschovna zavazadel")}>Úschovna zavazadel</button>
          <button onClick={() => sendPrompt("Náhradní klíč")}>Náhradní klíč</button>
          <button onClick={() => sendPrompt("Domácí mazlíčci")}>Domácí mazlíčci</button>
          <button onClick={() => sendPrompt("Odpadky")}>Odpadky</button>
          <button onClick={() => sendPrompt("Otevírání brány")}>Otevírání brány</button>
          <button onClick={() => sendPrompt("Zvonky na apartmány")}>Zvonky</button>
          <button onClick={() => sendPrompt("Výtah")}>Výtah</button>
          <button onClick={() => sendPrompt("Povlečení / ručníky")}>Povlečení / ručníky</button>
          <button onClick={() => sendPrompt("Trezor")}>Trezor</button>
          <button onClick={() => sendPrompt("Bezbariérovost")}>Bezbariérovost</button>
          <button onClick={() => sendPrompt("Kouření")}>Kouření</button>
          <button onClick={() => sendPrompt("Prádelna")}>Prádelna</button>
        </div>
      </div>

      {/* trvalá kontaktní lišta – místo původního „Tip“ */}
      <div className="muted" style={{
        borderTop: "1px dashed var(--border)",
        paddingTop: 10,
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap"
      }}>
        <span>❓ Pokud jste nenašli informace, obraťte se na <strong>Davida</strong> — WhatsApp: <strong>+420&nbsp;733&nbsp;439&nbsp;733</strong></span>
      </div>

      {/* volitelný volný dotaz */}
      <div className="input">
        <textarea
          placeholder="Napište dotaz…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (input.trim()) {
                sendPrompt(input.trim());
                setInput("");
              }
            }
          }}
        />
        <button
          disabled={loading || !input.trim()}
          onClick={() => { sendPrompt(input.trim()); setInput(""); }}
        >
          {loading ? "…" : "Poslat"}
        </button>
      </div>
    </div>
  );
}
