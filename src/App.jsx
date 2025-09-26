// src/App.jsx
import React, { useEffect, useRef, useState, useMemo } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";

/** ================== 70's CSS (vložený přímo sem) ================== */
const Style70s = () => (
  <style>{`
    :root{
      --bg-grad-1:#fff6ea;  /* cream */
      --bg-grad-2:#fde7cf;  /* pale peach */
      --card:#fffdf7;       /* warm paper */
      --border:#eadccd;
      --muted:#7b6e62;      /* taupe */
      --accent:#2a1f17;     /* coffee brown */
      --bot:#f6efe6;        /* assistant bubble */
      --me:#e8f2ef;         /* user bubble (sage tint) */

      /* Buttons */
      --btn-fill:#e78b2f;   /* burnt orange */
      --btn-fill-2:#c86a24; /* darker orange */
      --btn-text:#1a120d;
    }

    .row{display:flex;flex-direction:column;gap:10px}
    .scroller{max-height:70vh;overflow:auto;padding:8px;border-radius:12px;}
    .bubble{
      border-radius:16px;
      padding:14px 16px;
      line-height:1.55;
      width:fit-content;
      max-width:100%;
      white-space:pre-line;
      border:1px solid var(--border);
      box-shadow:0 6px 16px rgba(42,31,23,.06);
    }
    .me{background:var(--me);margin-left:auto}
    .bot{background:var(--bot)}
    .bot p{margin:.55em 0}
    .bot img{
      max-width:100%;height:auto;border-radius:14px;display:block;margin:10px 0;
      box-shadow:0 10px 26px rgba(42,31,23,.12);border:1px solid var(--border);
    }

    /* velká primární tlačítka (chips) */
    .chipPrimary {
      padding: 12px 16px;
      border-radius: 999px;
      border: 1px solid color-mix(in oklab, var(--btn-fill), black 14%);
      background: linear-gradient(180deg, var(--btn-fill), var(--btn-fill-2));
      color: #fff;
      font-weight: 800;
      letter-spacing: .2px;
      box-shadow: 0 10px 18px rgba(200,106,36,.25);
      cursor: pointer;
      transition: .18s transform ease, .18s box-shadow ease, .18s filter ease;
    }
    .chipPrimary:hover { transform: translateY(-1px); box-shadow: 0 14px 26px rgba(200,106,36,.28) }
    .chipPrimary:active { transform: translateY(0); filter: saturate(.95) }
    .chipPrimary:disabled { opacity: .6; cursor: not-allowed }

    /* sekundární „chip“ (skupiny/podtémata) */
    .chip {
      padding: 12px 16px;
      border-radius: 999px;
      border: 1px solid #ecc9a6;
      background: #fff6ec;
      color: var(--btn-text);
      font-weight: 700;
      box-shadow: 0 4px 14px rgba(0,0,0,.06);
      cursor: pointer;
    }

    /* Zpět */
    .backBtn {
      padding: 10px 14px;
      border-radius: 14px;
      border: 1px solid var(--border);
      background: #fff;
      color: var(--accent);
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 6px 12px rgba(0,0,0,.06);
    }
    .backBtn:hover { filter: saturate(1.05) }

    /* jazykové volby */
    .langPicker strong{display:block;margin-bottom:8px}
    .langRow{display:flex;flex-wrap:wrap;gap:12px;margin-top:6px}

    .cardBlock{display:inline-block;max-width:100%}
    .tips{color:var(--muted);font-size:13px;margin-top:8px}

    .input{
      display:flex;gap:12px;margin-top:12px;padding-top:12px;border-top:1px dashed var(--border);
    }
    textarea{
      flex:1;resize:vertical;min-height:56px;max-height:200px;
      padding:12px 14px;border-radius:14px;border:1px solid var(--border);outline:none;
      background:#fffdf9;
    }
    textarea:focus{border-color:#d2bba5;box-shadow:0 0 0 4px rgba(210,187,165,.35)}

    /* perzistentní kontakt */
    .contactBar{
      margin-top:10px;
      padding:10px 12px;
      border:1px dashed var(--border);
      border-radius:12px;
      background:#fffaf3;
      color:var(--accent);
      font-size:14px;
    }
  `}</style>
);

/** ================== i18n ================== */
const LANGS = {
  cs: "Čeština",
  en: "English",
  es: "Español",
  de: "Deutsch",
  fr: "Français",
};

const t = {
  cs: {
    chooseLang: "Zvolte jazyk",
    mainTitle: "Vyberte téma",
    back: "← Zpět",
    catFood: "Jídlo a okolí",
    catTech: "Technické potíže",
    catOther: "Ostatní",
    stillAsk: "Stále můžete napsat vlastní dotaz do pole níže.",
    contact: "Pokud jste nenašli, co potřebujete, napište Davidovi (WhatsApp +420 733 439 733).",
    send: "Poslat",
    type: "Napište dotaz…",
  },
  en: {
    chooseLang: "Choose a language",
    mainTitle: "Pick a topic",
    back: "← Back",
    catFood: "Food & Nearby",
    catTech: "Technical issues",
    catOther: "Other",
    stillAsk: "You can still type a custom question below.",
    contact: "If you can’t find what you need, message David (WhatsApp +420 733 439 733).",
    send: "Send",
    type: "Type your question…",
  },
  es: {
    chooseLang: "Elige idioma",
    mainTitle: "Elige un tema",
    back: "← Atrás",
    catFood: "Comida y alrededores",
    catTech: "Problemas técnicos",
    catOther: "Otros",
    stillAsk: "Aún puedes escribir tu pregunta abajo.",
    contact: "Si no encuentras lo que necesitas, escribe a David (WhatsApp +420 733 439 733).",
    send: "Enviar",
    type: "Escribe tu pregunta…",
  },
  de: {
    chooseLang: "Sprache wählen",
    mainTitle: "Thema wählen",
    back: "← Zurück",
    catFood: "Essen & Umgebung",
    catTech: "Technische Probleme",
    catOther: "Sonstiges",
    stillAsk: "Sie können unten weiterhin eine Frage eingeben.",
    contact: "Wenn etwas fehlt, schreiben Sie David (WhatsApp +420 733 439 733).",
    send: "Senden",
    type: "Frage eingeben…",
  },
  fr: {
    chooseLang: "Choisir la langue",
    mainTitle: "Choisir un sujet",
    back: "← Retour",
    catFood: "Restauration & alentours",
    catTech: "Problèmes techniques",
    catOther: "Autre",
    stillAsk: "Vous pouvez toujours écrire votre question ci-dessous.",
    contact: "Si besoin, contactez David (WhatsApp +420 733 439 733).",
    send: "Envoyer",
    type: "Écrivez votre question…",
  },
};

/** ================== Předdefinované prompty (pevné triggery) ==================
 * Navrženo tak, aby aktivovalo konkrétní intent v concierge.js (bez halucinací).
 * - Food & Nearby: čisté jedno/slovné triggery pro 'local' + subtyp.
 * - Technical: triggery přesná klíčová slova (wifi, power, hot water, ac, induction, hood, coffee, fire alarm, ...).
 */
function makeFlows(dict) {
  const FOOD = [
    { label: "🥐 Snídaně / Breakfast", prompt: "snídaně" },
    { label: "☕ Kavárna / Cafe",      prompt: "kavárna" },
    { label: "🥖 Pekárna / Bakery",    prompt: "pekárna" },
    { label: "🌿 Vegan / Veggie",      prompt: "vegan" },
    { label: "🇨🇿 Česká kuchyně",       prompt: "česká kuchyně" },
    { label: "🇻🇳 Viet / Bistro",       prompt: "viet" },
    { label: "🍷 Bar / Pub",           prompt: "bar" },
    { label: "🛒 Supermarket",         prompt: "supermarket" },
    { label: "💊 Lékárna / Pharmacy",  prompt: "lékárna" },
    { label: "💱 Směnárna / Exchange", prompt: "směnárna" },
    { label: "🏧 ATM",                 prompt: "atm" },
  ];

  const TECH = [
    { label: "📶 Wi-Fi",                prompt: "wifi heslo" },
    { label: "⚡ Elektřina",            prompt: "elektrina nejde proud jistič" },
    { label: "💧 Teplá voda",           prompt: "teplá voda nejde" },
    { label: "❄️ Klimatizace (AC)",    prompt: "klimatizace ac" },
    { label: "🍳 Indukční deska",       prompt: "indukce nefunguje" },
    { label: "🌀 Digestoř",             prompt: "digestoř" },
    { label: "☕ Kávovar Tchibo",       prompt: "kávovar tchibo" },
    { label: "🔥 Požární hlásič",       prompt: "požární hlásič" },
    { label: "🧺 Prádelna",             prompt: "prádelna kde je prádelna" },
    { label: "♿️ Bezbariérovost",       prompt: "bezbariérovost invalid" },
    { label: "🚭 Kouření",              prompt: "kouření kde mohu kouřit" },
    { label: "🎒 Úschovna zavazadel",   prompt: "úschovna batožiny" },
    { label: "🔑 Náhradní klíč",        prompt: "náhradní klíč" },
    { label: "🔔 Zvonky",               prompt: "zvonky na apartmány" },
    { label: "🚪 Brána (zevnitř)",      prompt: "otevírání brány" },
    { label: "🗑️ Odpadky / Popelnice",  prompt: "kde jsou popelnice odpadky" },
    { label: "🛗 Výtah – servis",       prompt: "výtah telefon servis porucha" },
    { label: "🔐 Trezor",               prompt: "trezor safe" },
    { label: "👩‍⚕️ Lékař 24/7",         prompt: "doktor lékař 24" },
    { label: "🧻 Povlečení / ručníky",  prompt: "povlečení ručníky kód skříň" },
  ];

  const OTHER = [
    { label: "ℹ️ Obecný dotaz",         prompt: "prosím o pomoc" },
  ];

  return [
    {
      label: dict.catFood,
      children: FOOD.map(i => ({ ...i })),
    },
    {
      label: dict.catTech,
      children: TECH.map(i => ({ ...i })),
    },
    {
      label: dict.catOther,
      children: OTHER.map(i => ({ ...i })),
    },
  ];
}

/** ================== App ================== */
export default function App() {
  const [lang, setLang] = useState(null);       // 'cs' | 'en' | ...
  const [stack, setStack] = useState([]);       // pro navigaci v menu
  const [chat, setChat] = useState([]);         // zprávy v chatu
  const [input, setInput] = useState("");       // textarea
  const [loading, setLoading] = useState(false);
  const scrollerRef = useRef(null);

  const dict = useMemo(() => t[lang || "cs"], [lang]);
  const FLOWS = useMemo(() => makeFlows(dict), [dict]);

  useEffect(() => {
    scrollerRef.current?.scrollTo(0, 9_999_999);
  }, [chat]);

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
    } catch {
      setChat([...next, { role: "assistant", content: "⚠️ Nelze se připojit k serveru. Zkuste to prosím znovu." }]);
    } finally {
      setLoading(false);
    }
  }

  function openNode(node) { setStack(s => [...s, node]); }
  function goBack() {
    setStack(s => s.slice(0, -1));
  }
  function resetToRoot() {
    setStack([]);
  }

  const currentChildren =
    !lang ? null :
    stack.length === 0 ? FLOWS :
    stack[stack.length - 1]?.children ?? FLOWS;

  return (
    <>
      <Style70s />
      <div className="row">
        <div className="scroller" ref={scrollerRef}>
          {/* Jazyková volba – první krok, žádné uvítací bubliny 2× */}
          {!lang && (
            <div className="bubble bot cardBlock">
              <div className="langPicker">
                <strong>{t.cs.chooseLang}</strong>
                <div className="langRow">
                  {Object.entries(LANGS).map(([code, label]) => (
                    <button key={code} className="chipPrimary" onClick={() => { setLang(code); resetToRoot(); }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="tips" style={{ marginTop: 10 }}>
                {/* malá univerzální nápověda */}
                CZ/EN/ES/DE/FR
              </div>
            </div>
          )}

          {/* Chat log */}
          {chat.map((m, i) =>
            m.role === "assistant"
              ? <div key={i}>{renderAssistant(m.content)}</div>
              : <div key={i} className="bubble me">{m.content}</div>
          )}

          {/* Menu po výběru jazyka */}
          {lang && currentChildren && (
            <div className="bubble bot cardBlock">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <strong style={{ marginBottom: 6 }}>
                  {stack.length === 0 ? t[lang].mainTitle : "Podtéma / Subtopic"}
                </strong>
                <div style={{ display: "flex", gap: 8 }}>
                  {stack.length > 0 && (
                    <button onClick={goBack} className="backBtn">{t[lang].back}</button>
                  )}
                  {/* změna jazyka */}
                  <button onClick={() => { setLang(null); setStack([]); }} className="backBtn">
                    🌐 {t[lang].chooseLang}
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 8 }}>
                {currentChildren.map((n, idx) =>
                  n.children ? (
                    <button key={idx} className="chip" onClick={() => openNode(n)}>{n.label}</button>
                  ) : (
                    <button
                      key={idx}
                      className="chipPrimary"
                      onClick={() => sendPrompt(n.prompt)}
                      disabled={loading}
                      title={n.prompt}
                    >
                      {n.label}
                    </button>
                  )
                )}
              </div>

              <div className="tips" style={{ marginTop: 8 }}>
                {t[lang].stillAsk}
              </div>
            </div>
          )}
        </div>

        {/* Perzistentní kontakt na Davida – vždy pod chatem */}
        <div className="contactBar">
          {t[lang || "cs"].contact}
        </div>

        {/* Vstupní pole */}
        <div className="input">
          <textarea
            placeholder={t[lang || "cs"].type}
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
            className="chipPrimary"
            disabled={loading || !input.trim()}
            onClick={() => { if (input.trim()) { sendPrompt(input.trim()); setInput(""); } }}
          >
            {loading ? "…" : t[lang || "cs"].send}
          </button>
        </div>
      </div>
    </>
  );
}
