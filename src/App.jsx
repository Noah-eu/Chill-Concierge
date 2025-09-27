// src/App.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";

/** ================== Google palette + UI (inline CSS) ================== */
const GoogleStyle = () => (
  <style>{`
    :root{
      /* Google-like palette */
      --blue:#4285F4;
      --red:#EA4335;
      --yellow:#FBBC05;
      --green:#34A853;

      /* neutrals */
      --bg-1:#fffdf9;
      --bg-2:#faf7ef;
      --card:#ffffff;
      --border:#eadccd;
      --muted:#6b645c;
      --accent:#1f1b16;

      /* bubbles */
      --bot:#f7f3ea;
      --me:#eef4ff;
    }

    body{
      background: linear-gradient(180deg, var(--bg-1), var(--bg-2) 60%);
      background-attachment: fixed;
    }

    .row{display:flex;flex-direction:column;gap:12px}

    .scroller{
      max-height:70vh;overflow:auto;padding:8px;border-radius:12px;
      background:transparent;
    }

    .bubble{
      border-radius:16px;padding:14px 16px;line-height:1.55;
      width:fit-content;max-width:100%;white-space:pre-line;
      border:1px solid var(--border);box-shadow:0 6px 16px rgba(0,0,0,.06);
      background:var(--card);
    }
    .me{background:var(--me);margin-left:auto}
    .bot{background:var(--bot)}
    .bot img{
      max-width:100%;height:auto;border-radius:14px;display:block;margin:10px 0;
      box-shadow:0 10px 26px rgba(0,0,0,.10);border:1px solid var(--border);
    }

    /* GRID pro tlačítka – drží je pohromadě i na mobilu */
    .grid{
      display:grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap:10px;
      width:100%;
    }

    .chipPrimary{
      --btn: var(--blue);
      padding:12px 14px;border-radius:999px;border:1px solid color-mix(in oklab, var(--btn), black 18%);
      background: linear-gradient(180deg, color-mix(in oklab, var(--btn), white 6%), color-mix(in oklab, var(--btn), black 4%));
      color:#fff;font-weight:800;letter-spacing:.15px;
      box-shadow:0 8px 16px color-mix(in oklab, var(--btn), transparent 80%);
      cursor:pointer;transition:.18s transform ease,.18s box-shadow ease,.18s filter ease;
      text-align:center;
    }
    .chipPrimary:hover{transform:translateY(-1px);box-shadow:0 12px 22px color-mix(in oklab, var(--btn), transparent 75%)}
    .chipPrimary:active{transform:translateY(0);filter:saturate(.96)}
    .chipPrimary:disabled{opacity:.6;cursor:not-allowed}

    .chip{
      padding:12px 14px;border-radius:999px;border:1px solid #e7e0d5;
      background:#fff6e8;color:#3b2f24;font-weight:700;box-shadow:0 4px 12px rgba(0,0,0,.05);
      cursor:pointer;text-align:center;
    }

    .backBtn{
      padding:10px 14px;border-radius:14px;border:1px solid var(--border);
      background:#fff;color:var(--accent);font-weight:700;cursor:pointer;
      box-shadow:0 6px 12px rgba(0,0,0,.05);
    }

    .tips{color:var(--muted);font-size:13px;margin-top:8px}

    .contactBar{
      margin-top:4px;padding:10px 12px;border:1px dashed var(--border);
      border-radius:12px;background:#fffaf3;color:var(--accent);font-size:14px;
    }

    .input{
      display:flex;gap:10px;margin-top:8px;padding-top:12px;border-top:1px dashed var(--border);
    }
    textarea{
      flex:1;resize:vertical;min-height:56px;max-height:200px;
      padding:12px 14px;border-radius:14px;border:1px solid var(--border);outline:none;background:#fffdf9;
    }
    textarea:focus{border-color:#d2bba5;box-shadow:0 0 0 4px rgba(210,187,165,.30)}

    /* Shortcuts box (mimo scroller) */
    .shortcuts{
      border:1px solid var(--border);background:#fff;box-shadow:0 6px 16px rgba(0,0,0,.06);
      border-radius:16px;padding:12px 14px;
    }
    .shortcutsHeader{
      display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px;
    }

    /* FAB pro rychlé zobrazení zkratek */
    .fab{
      position:fixed;right:16px;bottom:90px; /* nad vstupem */
      z-index:1000;border:none;border-radius:999px;padding:12px 14px;font-weight:800;
      background:linear-gradient(180deg, color-mix(in oklab, var(--blue), white 6%), color-mix(in oklab, var(--blue), black 4%));
      color:#fff;box-shadow:0 10px 24px rgba(66,133,244,.35);cursor:pointer;
    }
  `}</style>
);

/** ================== i18n ================== */
const LANGS = { cs:"Čeština", en:"English", es:"Español", de:"Deutsch", fr:"Français" };

const tr = {
  cs:{ chooseLang:"Zvolte jazyk", mainTitle:"Vyberte téma", subTitle:"Podtéma / Subtopic", back:"← Zpět",
       catFood:"Jídlo a okolí", catTech:"Technické potíže", catOther:"Ostatní",
       stillAsk:"Stále můžete napsat vlastní dotaz do pole níže.",
       contact:"Pokud jste nenašli, co potřebujete, napište Davidovi (WhatsApp +420 733 439 733).",
       send:"Poslat", type:"Napište dotaz…", shortcuts:"Zkratky", hide:"Skrýt", show:"⚡ Zkratky" },
  en:{ chooseLang:"Choose a language", mainTitle:"Pick a topic", subTitle:"Subtopic", back:"← Back",
       catFood:"Food & Nearby", catTech:"Technical issues", catOther:"Other",
       stillAsk:"You can still type a custom question below.",
       contact:"If you can’t find what you need, message David (WhatsApp +420 733 439 733).",
       send:"Send", type:"Type your question…", shortcuts:"Shortcuts", hide:"Hide", show:"⚡ Shortcuts" },
  es:{ chooseLang:"Elige idioma", mainTitle:"Elige un tema", subTitle:"Subtema", back:"← Atrás",
       catFood:"Comida y alrededores", catTech:"Problemas técnicos", catOther:"Otros",
       stillAsk:"Aún puedes escribir tu pregunta abajo.",
       contact:"Si no encuentras lo que necesitas, escribe a David (WhatsApp +420 733 439 733).",
       send:"Enviar", type:"Escribe tu pregunta…", shortcuts:"Atajos", hide:"Ocultar", show:"⚡ Atajos" },
  de:{ chooseLang:"Sprache wählen", mainTitle:"Thema wählen", subTitle:"Unterthema", back:"← Zurück",
       catFood:"Essen & Umgebung", catTech:"Technische Probleme", catOther:"Sonstiges",
       stillAsk:"Sie können unten weiterhin eine Frage eingeben.",
       contact:"Wenn etwas fehlt, schreiben Sie David (WhatsApp +420 733 439 733).",
       send:"Senden", type:"Frage eingeben…", shortcuts:"Kurzbefehle", hide:"Ausblenden", show:"⚡ Kurzbefehle" },
  fr:{ chooseLang:"Choisir la langue", mainTitle:"Choisir un sujet", subTitle:"Sous-thème", back:"← Retour",
       catFood:"Restauration & alentours", catTech:"Problèmes techniques", catOther:"Autre",
       stillAsk:"Vous pouvez toujours écrire votre question ci-dessous.",
       contact:"Si besoin, contactez David (WhatsApp +420 733 439 733).",
       send:"Envoyer", type:"Écrivez votre question…", shortcuts:"Raccourcis", hide:"Masquer", show:"⚡ Raccourcis" },
};

/** ================== prompty pro tlačítka (aktivují přesné intent v concierge.js) ================== */
function makeFlows(dict){
  const FOOD = [
    { label:"🥐 Snídaně / Breakfast", prompt:"snídaně" },
    { label:"☕ Kavárna / Cafe",      prompt:"kavárna" },
    { label:"🥖 Pekárna / Bakery",    prompt:"pekárna" },
    { label:"🌿 Vegan / Veggie",      prompt:"vegan" },
    { label:"🇨🇿 Česká kuchyně",       prompt:"česká kuchyně" },
    { label:"🇻🇳 Viet / Bistro",       prompt:"viet" },
    { label:"🍷 Bar / Pub",           prompt:"bar" },
    { label:"🛒 Supermarket",         prompt:"supermarket" },
    { label:"💊 Lékárna / Pharmacy",  prompt:"lékárna" },
    { label:"💱 Směnárna / Exchange", prompt:"směnárna" },
    { label:"🏧 ATM",                 prompt:"atm" },
  ];
  const TECH = [
    { label:"📶 Wi-Fi",               prompt:"wifi heslo" },
    { label:"⚡ Elektřina",           prompt:"elektrina nejde proud jistič" },
    { label:"💧 Teplá voda",          prompt:"teplá voda nejde" },
    { label:"❄️ Klimatizace (AC)",    prompt:"klimatizace ac" },
    { label:"🍳 Indukční deska",      prompt:"indukce nefunguje" },
    { label:"🌀 Digestoř",            prompt:"digestoř" },
    { label:"☕ Kávovar Tchibo",      prompt:"kávovar tchibo" },
    { label:"🔥 Požární hlásič",      prompt:"požární hlásič" },
    { label:"🧺 Prádelna",            prompt:"prádelna kde je prádelna" },
    { label:"♿️ Bezbariérovost",      prompt:"bezbariérovost invalid" },
    { label:"🚭 Kouření",             prompt:"kouření kde mohu kouřit" },
    { label:"🎒 Úschovna zavazadel",  prompt:"úschovna batožiny" },
    { label:"🔑 Náhradní klíč",       prompt:"náhradní klíč" },
    { label:"🔔 Zvonky",              prompt:"zvonky na apartmány" },
    { label:"🚪 Brána (zevnitř)",     prompt:"otevírání brány" },
    { label:"🗑️ Odpadky / Popelnice", prompt:"kde jsou popelnice odpadky" },
    { label:"🛗 Výtah – servis",      prompt:"výtah telefon servis porucha" },
    { label:"🔐 Trezor",              prompt:"trezor safe" },
    { label:"👩‍⚕️ Lékař 24/7",        prompt:"doktor lékař 24" },
    { label:"🧻 Povlečení / ručníky", prompt:"povlečení ručníky kód skříň" },
  ];
  const OTHER = [{ label:"ℹ️ Obecný dotaz", prompt:"prosím o pomoc" }];

  return [
    { label:dict.catFood, children:FOOD },
    { label:dict.catTech, children:TECH },
    { label:dict.catOther, children:OTHER },
  ];
}

/** pomocná funkce pro střídání barev tlačítek (blue/red/yellow/green) */
const btnColorForIndex = (i) => {
  const mod = i % 4;
  return mod === 0 ? "var(--blue)"
       : mod === 1 ? "var(--red)"
       : mod === 2 ? "var(--yellow)"
       : "var(--green)";
};

/** ================== App ================== */
export default function App(){
  const [lang, setLang] = useState(null);
  const [stack, setStack] = useState([]);
  const [chat, setChat]   = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(true);

  const scrollerRef = useRef(null);

  // skrytí multi-greeting v index.html (třída na <body>)
  useEffect(() => {
    if (lang) document.body.classList.add("lang-selected"); else document.body.classList.remove("lang-selected");
  }, [lang]);

  // auto-scroll na konec při nové zprávě nebo při znovuotevření zkratek
  useEffect(() => { scrollerRef.current?.scrollTo(0, 9_999_999); }, [chat, shortcutsOpen]);

  const dict  = useMemo(() => tr[lang || "cs"], [lang]);
  const FLOWS = useMemo(() => makeFlows(dict), [dict]);

  function renderAssistant(md=""){
    const raw = marked.parse(md, { breaks:true });
    const clean = DOMPurify.sanitize(raw);
    return <div className="bubble bot" dangerouslySetInnerHTML={{ __html: clean }} />;
  }

  // odeslání zprávy (+ volitelný control objekt pro deterministické odpovědi)
  async function sendPrompt(prompt, control = null){
    const next = [...chat, { role:"user", content:prompt }];
    setChat(next); setLoading(true);
    try{
      const r = await fetch("/.netlify/functions/concierge", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ messages: next, uiLang: lang, control })
      });
      const data = await r.json();
      setChat([...next, { role:"assistant", content:data.reply }]);
    }catch{
      setChat([...next, { role:"assistant", content:"⚠️ Nelze se připojit k serveru. Zkuste to prosím znovu." }]);
    }finally{
      setLoading(false);
    }
  }

  const openNode = (node) => setStack(s => [...s, node]);
  const goBack   = () => setStack(s => s.slice(0, -1));
  const resetToRoot = () => setStack([]);

  const currentChildren =
    !lang ? null :
    stack.length === 0 ? FLOWS :
    stack[stack.length - 1]?.children ?? FLOWS;

  const inFood = lang && stack.length > 0 && stack[stack.length - 1]?.label === dict.catFood;
  const inTech = lang && stack.length > 0 && stack[stack.length - 1]?.label === dict.catTech;

  // Mapování textu promptu → klíč v PLACES (sub-kategorie pro curated výpis)
  const PLACE_SUB_MAP = {
    "snídaně":"breakfast",
    "kavárna":"cafe",
    "pekárna":"bakery",
    "vegan":"veggie",
    "česká kuchyně":"czech",
    "viet":"vietnam",
    "bar":"bar",
    "supermarket":"grocery",
    "lékárna":"pharmacy",
    "směnárna":"exchange",
    "atm":"atm",
  };

  // Mapování TECH promptů → backend sub klíče
  const TECH_MAP = {
    "wifi heslo": "wifi",
    "elektrina nejde proud jistič": "power",
    "teplá voda nejde": "hot_water",
    "klimatizace ac": "ac",
    "indukce nefunguje": "induction",
    "digestoř": "hood",
    "kávovar tchibo": "coffee",
    "požární hlásič": "fire_alarm",
    "výtah telefon servis porucha": "elevator_phone",
    "úschovna batožiny": "luggage",
    "náhradní klíč": "keys",
    "otevírání brány": "gate",
    "zvonky na apartmány": "doorbells",
    "kde jsou popelnice odpadky": "trash",
    "bezbariérovost invalid": "access",
    "kouření kde mohu kouřit": "smoking",
    "prádelna kde je prádelna": "laundry",
    "povlečení ručníky kód skříň": "linen_towels",
    "doktor lékař 24": "doctor",
    "trezor safe": "safe",
  };

  // Pomocná – klik na chip
  const onChipClick = (n) => {
    // FOOD → curated places
    if (inFood) {
      const subKey = PLACE_SUB_MAP[(n.prompt || "").toLowerCase()];
      if (subKey) {
        setShortcutsOpen(false); // po kliku schovat zkratky
        return sendPrompt(n.prompt, { intent: "local", sub: subKey });
      }
    }
    // TECH → deterministické markdowny
    if (inTech) {
      const subTech = TECH_MAP[(n.prompt || "").toLowerCase()];
      if (subTech) {
        setShortcutsOpen(false); // po kliku schovat zkratky
        return sendPrompt(n.prompt, { intent: "tech", sub: subTech });
      }
    }
    // Ostatní → standardně
    setShortcutsOpen(false);
    return sendPrompt(n.prompt);
  };

  return (
    <>
      <GoogleStyle />
      <div className="row">

        {/* CHAT SCROLLER – jen historie chatu */}
        <div className="scroller" ref={scrollerRef}>
          {!lang && (
            <div className="bubble bot" style={{ display:"inline-block", maxWidth:"100%" }}>
              <strong>{tr.cs.chooseLang}</strong>
              <div className="grid" style={{ marginTop:8 }}>
                {Object.entries(LANGS).map(([code,label], i) => (
                  <button
                    key={code}
                    className="chipPrimary"
                    style={{ ["--btn"]: btnColorForIndex(i) }}
                    onClick={() => { setLang(code); resetToRoot(); }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="tips">CZ / EN / ES / DE / FR</div>
            </div>
          )}

          {chat.map((m,i) =>
            m.role === "assistant"
              ? <div key={i}>{renderAssistant(m.content)}</div>
              : <div key={i} className="bubble me">{m.content}</div>
          )}
        </div>

        {/* ZKRATKY (Chipy) – mimo scroller */}
        {lang && currentChildren && (
          shortcutsOpen ? (
            <div className="shortcuts">
              <div className="shortcutsHeader">
                <strong>{stack.length === 0 ? dict.mainTitle : dict.subTitle}</strong>
                <div style={{ display:"flex", gap:8 }}>
                  {stack.length > 0 && (
                    <button className="backBtn" onClick={goBack}>{dict.back}</button>
                  )}
                  <button className="backBtn" onClick={() => setShortcutsOpen(false)}>
                    {dict.hide}
                  </button>
                  <button className="backBtn" onClick={() => { setLang(null); setStack([]); }}>
                    🌐 {dict.chooseLang}
                  </button>
                </div>
              </div>

              <div className="grid">
                {currentChildren.map((n, idx) =>
                  n.children ? (
                    <button key={idx} className="chip" onClick={() => openNode(n)}>{n.label}</button>
                  ) : (
                    <button
                      key={idx}
                      className="chipPrimary"
                      style={{ ["--btn"]: btnColorForIndex(idx) }}
                      onClick={() => onChipClick(n)}
                      disabled={loading}
                      title={n.prompt}
                    >
                      {n.label}
                    </button>
                  )
                )}
              </div>

              <div className="tips" style={{ marginTop:8 }}>{dict.stillAsk}</div>
            </div>
          ) : (
            // FAB pro rychlé otevření zkratek
            <button className="fab" onClick={() => setShortcutsOpen(true)} title={dict.shortcuts}>
              {dict.show}
            </button>
          )
        )}

        {/* Jediná (překládající se) kontaktní lišta */}
        <div className="contactBar">{dict.contact}</div>

        {/* Vstup + odeslání */}
        <div className="input">
          <textarea
            placeholder={dict.type}
            value={input}
            onChange={(e)=>setInput(e.target.value)}
            onKeyDown={(e)=>{
              if(e.key==="Enter" && !e.shiftKey){
                e.preventDefault();
                if(input.trim()){
                  setShortcutsOpen(false); // při psaní schovej, ať je vstup hned nahoře
                  sendPrompt(input.trim());
                  setInput("");
                }
              }
            }}
          />
          <button
            className="chipPrimary"
            style={{ ["--btn"]: "var(--blue)" }}
            disabled={loading || !input.trim()}
            onClick={()=>{
              if(input.trim()){
                setShortcutsOpen(false);
                sendPrompt(input.trim());
                setInput("");
              }
            }}
          >
            {loading ? "…" : dict.send}
          </button>
        </div>
      </div>
    </>
  );
}
