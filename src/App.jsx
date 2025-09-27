// src/App.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";

/** ================== Google palette + UI (inline CSS) ================== */
const GoogleStyle = () => (
  <style>{`
    :root{
      /* Primární (beze změny) – pro barevná tlačítka */
      --blue:#4285F4; --red:#EA4335; --yellow:#FBBC05; --green:#34A853;

      /* Jemné odstíny pro plochy / bubliny */
      --t-blue:   color-mix(in oklab, var(--blue),   white 40%);
      --t-red:    color-mix(in oklab, var(--red),    white 40%);
      --t-yellow: color-mix(in oklab, var(--yellow), white 70%);
      --t-green:  color-mix(in oklab, var(--green),  white 40%);

      /* Neutrály / rámečky */
      --bg-1:#fffefb; --bg-2:#fbf7ef;
      --border:color-mix(in oklab, #c9b9a6, white 30%);
      --muted:#6b645c; --accent:#1f1b16;
    }

    body{
      background:
        radial-gradient(1200px 700px at 12% -6%, var(--t-yellow) 0%, transparent 50%),
        radial-gradient(1100px 650px at 100% -10%, var(--t-blue) 0%, transparent 50%),
        radial-gradient(900px 600px at 40% 120%, var(--t-green) 0%, transparent 50%),
        linear-gradient(180deg, var(--bg-1), var(--bg-2) 35%);
      background-attachment: fixed;
    }

    .row{display:flex;flex-direction:column;gap:12px}

    .scroller{
      max-height:70vh;overflow:auto;padding:8px;border-radius:14px;
      background: linear-gradient(180deg, color-mix(in oklab, var(--t-blue), white 70%) 0%, transparent 85%);
    }

    .bubble{
      border-radius:16px;padding:14px 16px;line-height:1.55;width:fit-content;max-width:100%;white-space:pre-line;
      border:1px solid var(--border);
      box-shadow:0 6px 16px rgba(0,0,0,.06);
      background:#fff;
    }
    .me{
      background:linear-gradient(180deg, color-mix(in oklab, var(--t-blue), white 10%), color-mix(in oklab, var(--t-blue), white 0%));
      margin-left:auto;
    }
    .bot{
      background:linear-gradient(180deg, color-mix(in oklab, var(--t-yellow), white 8%), color-mix(in oklab, var(--t-yellow), white 0%));
    }
    .bot img{
      max-width:100%;height:auto;border-radius:14px;display:block;margin:10px 0;
      box-shadow:0 10px 26px rgba(0,0,0,.10);border:1px solid var(--border);
    }

    .bot a{
      display:inline-block;padding:8px 12px;border-radius:999px;
      border:1px solid color-mix(in oklab, var(--blue), black 15%);
      background:linear-gradient(180deg, color-mix(in oklab, var(--blue), white 8%), color-mix(in oklab, var(--blue), black 6%));
      color:#fff;text-decoration:none;font-weight:800;box-shadow:0 6px 16px rgba(66,133,244,.25);
    }
    .bot a:hover{filter:saturate(1.02) brightness(1.02)}
    .bot a:active{transform:translateY(1px)}

    /* GRIDy */
    .grid{display:grid;grid-template-columns:repeat(auto-fit, minmax(160px, 1fr));gap:10px;width:100%;}
    .gridLang2{display:grid;grid-template-columns:repeat(2, minmax(140px,1fr));gap:10px;width:100%;}
    .gridLang2 .chipPrimary{padding:10px 12px}

    /* Barevné pilulky (primární) */
    .chipPrimary{
      --btn: var(--blue);
      padding:12px 14px;border-radius:999px;border:1px solid color-mix(in oklab, var(--btn), black 18%);
      background:linear-gradient(180deg, color-mix(in oklab, var(--btn), white 6%), color-mix(in oklab, var(--btn), black 4%));
      color:#fff;font-weight:800;letter-spacing:.15px;
      box-shadow:0 8px 16px color-mix(in oklab, var(--btn), transparent 80%);
      cursor:pointer;transition:.18s transform ease,.18s box-shadow ease,.18s filter ease;text-align:center;
    }
    .chipPrimary:hover{transform:translateY(-1px);box-shadow:0 12px 22px color-mix(in oklab, var(--btn), transparent 75%)}
    .chipPrimary:active{transform:translateY(0);filter:saturate(.96)}
    .chipPrimary:disabled{opacity:.6;cursor:not-allowed}

    /* Sekundární (kategoriální) pilulky */
    .chip{
      padding:12px 14px;border-radius:999px;border:1px solid var(--border);
      background:linear-gradient(180deg, color-mix(in oklab, var(--t-yellow), white 6%), color-mix(in oklab, var(--t-yellow), white 0%));
      color:#3b2f24;font-weight:700;box-shadow:0 4px 12px rgba(0,0,0,.05);
      cursor:pointer;text-align:center;
    }

    .backBtn{
      padding:10px 14px;border-radius:14px;border:1px solid var(--border);
      background:linear-gradient(180deg, #fff, color-mix(in oklab, var(--t-yellow), white 10%));
      color:var(--accent);font-weight:700;cursor:pointer;
      box-shadow:0 6px 12px rgba(0,0,0,.05);
    }

    .tips{color:var(--muted);font-size:13px;margin-top:8px}

    .shortcuts{
      border:1px solid var(--border);
      background:
        radial-gradient(800px 400px at 10% -40%, color-mix(in oklab, var(--t-yellow), white 20%) 0%, transparent 60%),
        radial-gradient(700px 380px at 100% -40%, color-mix(in oklab, var(--t-blue), white 20%) 0%, transparent 55%),
        linear-gradient(180deg, #fff, color-mix(in oklab, var(--t-yellow), white 6%));
      box-shadow:0 6px 16px rgba(0,0,0,.06);border-radius:16px;padding:12px 14px;
    }
    .shortcutsHeader{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap;}
    .btnRow{display:flex;gap:8px;flex-wrap:wrap;}

    .contactBar{
      margin-top:4px;padding:10px 12px;border:1px dashed var(--border);
      border-radius:12px;
      background:linear-gradient(180deg, color-mix(in oklab, var(--t-yellow), white 10%), color-mix(in oklab, var(--t-yellow), white 2%));
      color:var(--accent);font-size:14px;
    }

    .input{
      display:flex;gap:10px;margin-top:8px;padding-top:12px;border-top:1px dashed var(--border);
      background:linear-gradient(180deg, transparent, color-mix(in oklab, var(--t-blue), white 85%) 90%);
      border-radius:12px;
    }
    textarea{
      flex:1;resize:vertical;min-height:56px;max-height:200px;padding:12px 14px;border-radius:14px;border:1px solid var(--border);
      outline:none;background:linear-gradient(180deg, #fff, color-mix(in oklab, var(--t-blue), white 8%));
    }
    textarea:focus{border-color:color-mix(in oklab, var(--blue), #d2bba5 30%);box-shadow:0 0 0 4px color-mix(in oklab, var(--t-blue), transparent 60%)}

    .fab{
      position:fixed;right:16px;bottom:90px;z-index:1000;border:none;border-radius:999px;padding:12px 14px;font-weight:800;
      background:linear-gradient(180deg, color-mix(in oklab, var(--blue), white 6%), color-mix(in oklab, var(--blue), black 4%));
      color:#fff;box-shadow:0 10px 24px rgba(66,133,244,.35);cursor:pointer;
    }
  `}</style>
);

/** ================== i18n ================== */
const LANGS = {
  en:"English", cs:"Čeština", es:"Español", de:"Deutsch", fr:"Français",
  ru:"Русский", uk:"Українська", nl:"Nederlands", it:"Italiano", da:"Dansk", pl:"Polski"
};

/* UI texty + názvy sekcí/položek (přeloženo) */
const tr = {
  /* ... (ponecháno beze změn; tvé překlady) ... */
  /* Kvůli stručnosti sem nevkládám celé tr – použij totožný obsah, který jsi poslal v poslední verzi. */
};

/** ====== util ====== */
const btnColorForIndex = (i) => {
  const mod = i % 4;
  return mod === 0 ? "var(--blue)" : mod === 1 ? "var(--red)" : mod === 2 ? "var(--yellow)" : "var(--green)";
};

/** Barva pro kořenové kategorie (jen na první úrovni) */
function catColor(label, dict){
  if (label === dict.catFood) return "var(--red)";
  if (label === dict.catTech) return "var(--yellow)";
  if (label === dict.catOther) return "var(--green)";
  return null;
}

/** ====== sestavení struktur pro UI (labely z tr, sub-klíče v angličtině) ====== */
function makeFlows(dict){
  /* ... (beze změn) ... */
  const FOOD = [
    { label:dict.dining,    sub:"dining",    kind:"local" },
    { label:dict.bakery,    sub:"bakery",    kind:"local" },
    { label:dict.grocery,   sub:"grocery",   kind:"local" },
    { label:dict.pharmacy,  sub:"pharmacy",  kind:"local" },
    { label:dict.exchAtm,   children:[
      { label:dict.exchange, sub:"exchange", kind:"local" },
      { label:dict.atm,      sub:"atm",      kind:"local" },
    ]},
  ];
  const TECH = [
    { label:dict.wifi, sub:"wifi", kind:"tech" },
    { label:dict.power, sub:"power", kind:"tech" },
    { label:dict.hot_water, sub:"hot_water", kind:"tech" },
    { label:dict.ac, sub:"ac", kind:"tech" },
    { label:dict.induction, sub:"induction", kind:"tech" },
    { label:dict.hood, sub:"hood", kind:"tech" },
    { label:dict.coffee, sub:"coffee", kind:"tech" },
    { label:dict.fire_alarm, sub:"fire_alarm", kind:"tech" },
    { label:dict.elevator_phone, sub:"elevator_phone", kind:"tech" },
    { label:dict.safe, sub:"safe", kind:"tech" },
    { label:dict.keys, sub:"keys", kind:"tech" },
  ];
  const OTHER = [
    { label:dict.laundry, sub:"laundry", kind:"tech" },
    { label:dict.access, sub:"access", kind:"tech" },
    { label:dict.smoking, sub:"smoking", kind:"tech" },
    { label:dict.luggage, sub:"luggage", kind:"tech" },
    { label:dict.doorbells, sub:"doorbells", kind:"tech" },
    { label:dict.gate, sub:"gate", kind:"tech" },
    { label:dict.trash, sub:"trash", kind:"tech" },
    { label:dict.doctor, sub:"doctor", kind:"tech" },
    { label:dict.linen_towels, sub:"linen_towels", kind:"tech" },
    { label:dict.general, prompt:"help", kind:"free" },
  ];
  return [
    { label:dict.catFood, children:FOOD },
    { label:dict.catTech, children:TECH },
    { label:dict.catOther, children:OTHER },
  ];
}

/** ================== App ================== */
export default function App(){
  const [lang, setLang] = useState(null);
  const [stack, setStack] = useState([]);
  const [chat, setChat]   = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(true);
  const scrollerRef = useRef(null);

  useEffect(() => {
    if (lang) document.body.classList.add("lang-selected"); else document.body.classList.remove("lang-selected");
  }, [lang]);

  useEffect(() => { scrollerRef.current?.scrollTo(0, 9_999_999); }, [chat, shortcutsOpen]);

  const dict  = useMemo(() => tr[lang || "en"], [lang]);   // EN = výchozí
  const FLOWS = useMemo(() => makeFlows(dict), [dict]);

  function renderAssistant(md=""){
    const raw = marked.parse(md, { breaks:true });
    const clean = DOMPurify.sanitize(raw);
    return <div className="bubble bot" dangerouslySetInnerHTML={{ __html: clean }} />;
  }

  async function sendPrompt(displayText, control = null){
    const next = [...chat, { role:"user", content:displayText }];
    setChat(next); setLoading(true);
    try{
      const r = await fetch("/.netlify/functions/concierge", {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ messages: next, uiLang: lang, control })
      });
      const data = await r.json();
      setChat([...next, { role:"assistant", content:data.reply }]);
    }catch{
      setChat([...next, { role:"assistant", content:"⚠️ Nelze se připojit k serveru. Zkuste to prosím znovu." }]);
    }finally{ setLoading(false); }
  }

  const openNode = (node) => setStack(s => [...s, node]);
  const goBack   = () => setStack(s => s.slice(0, -1));
  const resetToRoot = () => setStack([]);

  const currentChildren =
    !lang ? null :
    stack.length === 0 ? FLOWS :
    stack[stack.length - 1]?.children ?? FLOWS;

  const onChipClick = async (n) => {
    if (n.children) return openNode(n);

    if (n.kind === "local") {
      setShortcutsOpen(false);
      return sendPrompt(n.label, { intent:"local", sub:n.sub });
    }
    if (n.kind === "tech") {
      setShortcutsOpen(false);
      return sendPrompt(n.label, { intent:"tech", sub:n.sub });
    }
    setShortcutsOpen(false);
    return sendPrompt(n.label || "Help");
  };

  // Greeting blok (vícejazyčný výpis) – zkrácen kvůli prostoru
  const Greeting = () => (
    <div className="bubble bot" style={{ display:"inline-block", maxWidth:"100%" }}>
      <div style={{marginBottom:10}}>
        <strong>{tr.en.greet[0]}</strong>
        <br/>{tr.cs.greet[0]}<br/>{tr.es.greet[0]}<br/>{tr.de.greet[0]}<br/>{tr.fr.greet[0]}
        <br/>{tr.ru.greet[0]}<br/>{tr.uk.greet[0]}<br/>{tr.nl.greet[0]}<br/>{tr.it.greet[0]}<br/>{tr.da.greet[0]}<br/>{tr.pl.greet[0]}
      </div>
      <div style={{marginBottom:8}}>
        <button
          className="chipPrimary"
          style={{ ["--btn"]: "var(--blue)", width:"100%" }}
          onClick={() => { setLang("en"); resetToRoot(); }}
        >
          {LANGS.en}
        </button>
      </div>
      <div className="gridLang2">
        {Object.entries(LANGS)
          .filter(([code]) => code !== "en")
          .map(([code,label], i) => (
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
      <div className="tips" style={{marginTop:8}}>
        {Object.keys(LANGS).map(k => k.toUpperCase()).join(" / ")}
      </div>
    </div>
  );

  return (
    <>
      <GoogleStyle />
      <div className="row">

        {/* CHAT SCROLLER */}
        <div className="scroller" ref={scrollerRef}>
          {!lang && <Greeting />}

          {chat.map((m,i) =>
            m.role === "assistant"
              ? <div key={i}>{renderAssistant(m.content)}</div>
              : <div key={i} className="bubble me">{m.content}</div>
          )}
        </div>

        {/* ZKRATKY – mimo scroller */}
        {lang && currentChildren && shortcutsOpen && (
          <div className="shortcuts">
            <div className="shortcutsHeader">
              <strong>{stack.length === 0 ? tr[lang||"en"].mainTitle : tr[lang||"en"].subTitle}</strong>
              <div className="btnRow">
                {stack.length > 0 && (
                  <button className="backBtn" onClick={goBack}>{tr[lang||"en"].back}</button>
                )}
                {/* Skrýt → MODRÁ */}
                <button
                  className="chipPrimary"
                  style={{ ["--btn"]: "var(--blue)" }}
                  onClick={() => setShortcutsOpen(false)}
                >
                  {tr[lang||"en"].hide}
                </button>
                {/* Zvolte jazyk → beze změny */}
                <button className="backBtn" onClick={() => { setLang(null); setStack([]); }}>
                  🌐 {tr[lang||"en"].chooseLang}
                </button>
              </div>
            </div>

            <div className="grid">
              {currentChildren.map((n, idx) => {
                // Root kategorie barevně, ostatní „rodiče“ krémově
                if (n.children) {
                  const root = stack.length === 0;
                  const col = root ? catColor(n.label, tr[lang||"en"]) : null;
                  if (col) {
                    return (
                      <button
                        key={idx}
                        className="chipPrimary"
                        style={{ ["--btn"]: col }}
                        onClick={() => openNode(n)}
                      >
                        {n.label}
                      </button>
                    );
                  }
                  return (
                    <button key={idx} className="chip" onClick={() => openNode(n)}>
                      {n.label}
                    </button>
                  );
                }
                return (
                  <button
                    key={idx}
                    className="chipPrimary"
                    style={{ ["--btn"]: btnColorForIndex(idx) }}
                    onClick={() => onChipClick(n)}
                    disabled={loading}
                    title={n.sub || ""}
                  >
                    {n.label}
                  </button>
                );
              })}
            </div>

            <div className="tips" style={{ marginTop:8 }}>{tr[lang||"en"].stillAsk}</div>
          </div>
        )}

        {!shortcutsOpen && lang && (
          <button className="fab" onClick={() => setShortcutsOpen(true)} title={tr[lang||"en"].shortcuts}>
            {tr[lang||"en"].show}
          </button>
        )}

        {/* Kontaktní lišta */}
        <div className="contactBar">{tr[lang||"en"].contact}</div>

        {/* Vstup + odeslání */}
        <div className="input">
          <textarea
            placeholder={tr[lang||"en"].type}
            value={input}
            onChange={(e)=>setInput(e.target.value)}
            onKeyDown={(e)=>{
              if(e.key==="Enter" && !e.shiftKey){
                e.preventDefault();
                if(input.trim()){
                  setShortcutsOpen(false);
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
            {loading ? "…" : tr[lang||"en"].send}
          </button>
        </div>
      </div>
    </>
  );
}
