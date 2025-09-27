import React, { useEffect, useMemo, useRef, useState } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";

/** ================== Google palette + UI (inline CSS) ================== */
const GoogleStyle = () => (
  <style>{`
    :root{
      --blue:#4285F4; --red:#EA4335; --yellow:#FBBC05; --green:#34A853;
      --t-blue:   color-mix(in oklab, var(--blue),   white 40%);
      --t-red:    color-mix(in oklab, var(--red),    white 40%);
      --t-yellow: color-mix(in oklab, var(--yellow), white 70%);
      --t-green:  color-mix(in oklab, var(--green),  white 40%);
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
      margin:0;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, Inter, Arial;
      color:var(--accent);
    }

    .row{display:flex;flex-direction:column;gap:12px;max-width:960px;margin:24px auto;padding:0 16px}
    .scroller{max-height:70vh;overflow:auto;padding:8px;border-radius:14px;
      background: linear-gradient(180deg, color-mix(in oklab, var(--t-blue), white 70%) 0%, transparent 85%);}

    .bubble{
      border-radius:16px;padding:14px 16px;line-height:1.55;width:fit-content;max-width:100%;white-space:pre-line;
      border:1px solid var(--border);box-shadow:0 6px 16px rgba(0,0,0,.06);background:#fff;
    }
    .me{background:linear-gradient(180deg, color-mix(in oklab, var(--t-blue), white 10%), color-mix(in oklab, var(--t-blue), white 0%));margin-left:auto;}
    .bot{background:linear-gradient(180deg, color-mix(in oklab, var(--t-yellow), white 8%), color-mix(in oklab, var(--t-yellow), white 0%));}
    .bot img{max-width:100%;height:auto;border-radius:14px;display:block;margin:10px 0;box-shadow:0 10px 26px rgba(0,0,0,.10);border:1px solid var(--border);}
    .bot a{display:inline-block;padding:8px 12px;border-radius:999px;border:1px solid color-mix(in oklab, var(--blue), black 15%);
      background:linear-gradient(180deg, color-mix(in oklab, var(--blue), white 8%), color-mix(in oklab, var(--blue), black 6%));
      color:#fff;text-decoration:none;font-weight:800;box-shadow:0 6px 16px rgba(66,133,244,.25);}

    .grid{display:grid;grid-template-columns:repeat(auto-fit, minmax(160px, 1fr));gap:10px;width:100%;}
    /* Primární „barevné“ tlačítko – přijímá --btn (blue/red/yellow/green) */
    .chipPrimary{
      --btn: var(--blue);
      padding:12px 14px;border-radius:999px;border:1px solid color-mix(in oklab, var(--btn), black 18%);
      background:linear-gradient(180deg, color-mix(in oklab, var(--btn), white 6%), color-mix(in oklab, var(--btn), black 4%));
      color:#fff;font-weight:800;letter-spacing:.15px;box-shadow:0 8px 16px color-mix(in oklab, var(--btn), transparent 80%);
      cursor:pointer;transition:.18s transform ease,.18s box-shadow ease,.18s filter ease;text-align:center;
    }
    .chipPrimary:hover{transform:translateY(-1px);box-shadow:0 12px 22px color-mix(in oklab, var(--btn), transparent 75%)}
    .chipPrimary:active{transform:translateY(0);filter:saturate(.96)}
    .chipPrimary:disabled{opacity:.6;cursor:not-allowed}

    /* Sekundární „kategorie“ – nově také přijímá --btn (aby šly do 4 barev) */
    .chip{
      --btn: var(--yellow);
      padding:12px 14px;border-radius:999px;border:1px solid color-mix(in oklab, var(--btn), black 18%);
      background:linear-gradient(180deg, color-mix(in oklab, var(--btn), white 38%), color-mix(in oklab, var(--btn), white 20%));
      color:#1c130f;font-weight:800;letter-spacing:.1px;box-shadow:0 4px 12px rgba(0,0,0,.05);
      cursor:pointer;text-align:center;
    }

    .backBtn{
      padding:10px 14px;border-radius:14px;border:1px solid var(--border);
      background:linear-gradient(180deg, #fff, color-mix(in oklab, var(--t-yellow), white 10%));
      color:var(--accent);font-weight:700;cursor:pointer;box-shadow:0 6px 12px rgba(0,0,0,.05);
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
      margin-top:4px;padding:10px 12px;border:1px dashed var(--border);border-radius:12px;
      background:linear-gradient(180deg, color-mix(in oklab, var(--t-yellow), white 10%), color-mix(in oklab, var(--t-yellow), white 2%));
      color:var(--accent);font-size:14px;
    }

    /* Overlay (výběry) */
    .overlay{position:fixed;inset:0;background:rgba(0,0,0,.25);display:flex;align-items:flex-end;justify-content:center;padding:18px;z-index:2000;}
    .sheet{width:100%;max-width:700px;border-radius:18px;background:#fff;border:1px solid var(--border);box-shadow:0 18px 38px rgba(0,0,0,.20);padding:16px;}
    .sheet h4{margin:0 0 10px 0}

    .pillRow{display:flex;gap:8px;flex-wrap:wrap}
    .pill{
      padding:10px 14px;border-radius:999px;border:1px solid var(--border);
      background:#ffffff;color:var(--blue); /* bílé pozadí, MODRÝ text */
      cursor:pointer;font-weight:800;letter-spacing:.1px;
    }
    .pill.active{
      border:1px solid color-mix(in oklab, var(--blue), black 18%);
      background:linear-gradient(180deg, color-mix(in oklab, var(--blue), white 6%), color-mix(in oklab, var(--blue), black 4%));
      color:#fff; /* invert po kliknutí */
    }

    .fab{
      position:fixed;right:16px;bottom:90px;z-index:1000;border:none;border-radius:999px;padding:12px 14px;font-weight:800;
      background:linear-gradient(180deg, color-mix(in oklab, var(--blue), white 6%), color-mix(in oklab, var(--blue), black 4%));
      color:#fff;box-shadow:0 10px 24px rgba(66,133,244,.35);cursor:pointer;
    }
  `}</style>
);

/** ================== i18n ================== */
const LANGS = {
  cs:"Čeština", en:"English", es:"Español", de:"Deutsch", fr:"Français",
  ru:"Русский", uk:"Українська", nl:"Nederlands", it:"Italiano", da:"Dansk", pl:"Polski"
};

const tr = {
  cs:{ chooseLang:"Zvolte jazyk", mainTitle:"Vyberte téma", subTitle:"Podtéma / Subtopic", back:"← Zpět",
       catFood:"Jídlo a okolí", catTech:"Technické potíže", catOther:"Ostatní", catTransport:"Doprava",
       stillAsk:"Vyberte jednu z možností níže.",
       contact:"Pokud jste nenašli, co potřebujete, napište Davidovi (WhatsApp +420 733 439 733).",
       shortcuts:"Zkratky", hide:"Skrýt", show:"⚡ Zkratky",
       foodDelivery:"🛵 Jídlo domů", transportInfo:"🗺️ Doprava po Praze",
       pickRoom:"Zvolte číslo apartmánu", floor:"Patro", room:"Pokoj", confirm:"Zobrazit", cancel:"Zavřít",
       wifiStatus:"Funguje Wi-Fi?", ok:"Funguje", notOk:"Nefunguje",
       pickSsid:"Vyberte SSID, které na vašem zařízení svítí nejsilněji",
       showMyWifi:"Zobrazit moje heslo" },
  en:{ chooseLang:"Choose a language", mainTitle:"Pick a topic", subTitle:"Subtopic", back:"← Back",
       catFood:"Food & Nearby", catTech:"Technical issues", catOther:"Other", catTransport:"Transport",
       stillAsk:"Pick one of the options below.",
       contact:"If you can’t find what you need, message David (WhatsApp +420 733 439 733).",
       shortcuts:"Shortcuts", hide:"Hide", show:"⚡ Shortcuts",
       foodDelivery:"🛵 Food delivery", transportInfo:"🗺️ Getting around Prague",
       pickRoom:"Choose your apartment number", floor:"Floor", room:"Room", confirm:"Show", cancel:"Close",
       wifiStatus:"Is the Wi-Fi working?", ok:"Works", notOk:"Doesn’t work",
       pickSsid:"Pick the SSID that appears strongest on your device",
       showMyWifi:"Show my password" },
  // (ostatní jazyky ponechány stejné jako dřív; zkráceno)
  de:{ chooseLang:"Sprache wählen", mainTitle:"Thema wählen", subTitle:"Unterthema", back:"← Zurück",
       catFood:"Essen & Umgebung", catTech:"Technische Probleme", catOther:"Sonstiges", catTransport:"Verkehr",
       stillAsk:"Wählen Sie unten eine Option.", contact:"Wenn etwas fehlt, schreiben Sie David (WhatsApp +420 733 439 733).",
       shortcuts:"Kurzbefehle", hide:"Ausblenden", show:"⚡ Kurzbefehle",
       foodDelivery:"🛵 Essen nach Hause", transportInfo:"🗺️ Unterwegs in Prag",
       pickRoom:"Wohnungsnummer wählen", floor:"Etage", room:"Zimmer", confirm:"Anzeigen", cancel:"Schließen",
       wifiStatus:"Funktioniert das WLAN?", ok:"Funktioniert", notOk:"Funktioniert nicht",
       pickSsid:"Wählen Sie die SSID mit dem stärksten Signal", showMyWifi:"Mein Passwort anzeigen" },
  fr:{ chooseLang:"Choisir la langue", mainTitle:"Choisir un sujet", subTitle:"Sous-thème", back:"← Retour",
       catFood:"Restauration & alentours", catTech:"Problèmes techniques", catOther:"Autre", catTransport:"Transports",
       stillAsk:"Choisissez une option ci-dessous.", contact:"Si besoin, contactez David (WhatsApp +420 733 439 733).",
       shortcuts:"Raccourcis", hide:"Masquer", show:"⚡ Raccourcis",
       foodDelivery:"🛵 Livraison de repas", transportInfo:"🗺️ Se déplacer à Prague",
       pickRoom:"Choisissez votre numéro d’appartement", floor:"Étage", room:"Appartement", confirm:"Afficher", cancel:"Fermer",
       wifiStatus:"Le Wi-Fi fonctionne-t-il ?", ok:"Oui", notOk:"Non",
       pickSsid:"Choisissez le SSID le plus fort sur votre appareil", showMyWifi:"Afficher mon mot de passe" },
  es:{ chooseLang:"Elige idioma", mainTitle:"Elige un tema", subTitle:"Subtema", back:"← Atrás",
       catFood:"Comida y alrededores", catTech:"Problemas técnicos", catOther:"Otros", catTransport:"Transporte",
       stillAsk:"Elige una opción abajo.", contact:"Si no encuentras lo que necesitas, escribe a David (WhatsApp +420 733 439 733).",
       shortcuts:"Atajos", hide:"Ocultar", show:"⚡ Atajos",
       foodDelivery:"🛵 Comida a domicilio", transportInfo:"🗺️ Transporte por Praga",
       pickRoom:"Elige tu número de apartamento", floor:"Planta", room:"Habitación", confirm:"Mostrar", cancel:"Cerrar",
       wifiStatus:"¿Funciona el Wi-Fi?", ok:"Funciona", notOk:"No funciona",
       pickSsid:"Elige el SSID que ves con más señal", showMyWifi:"Mostrar mi contraseña" }
};

/** ================== pomocné barvy ============== */
const COLORS = { blue:"var(--blue)", red:"var(--red)", yellow:"var(--yellow)", green:"var(--green)" };
const btnColorForIndex = (i) => [COLORS.blue, COLORS.red, COLORS.yellow, COLORS.green][i % 4];
/* pevné barvy pro „kategorie“ (dětské uzly) */
const colorForCategory = (label) => {
  const L = (label||"").toLowerCase();
  if (L.includes("jídlo") || L.includes("food")) return COLORS.red;
  if (L.includes("techn") || L.includes("technical")) return COLORS.yellow;
  if (L.includes("dopr") || L.includes("transport")) return COLORS.blue;
  return COLORS.green; // „Ostatní“
};

/** ================== App ================== */
export default function App(){
  const [lang, setLang] = useState(null);
  const [stack, setStack] = useState([]);
  const [chat, setChat]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(true);

  // Overlays
  const [roomSheet, setRoomSheet] = useState({ open:false, floor:null, last:null });         // keys
  const [wifiSheet, setWifiSheet] = useState({ open:false, step:0, floor:null, last:null, ssid:null }); // wifi

  const scrollerRef = useRef(null);

  useEffect(() => {
    if (lang) document.body.classList.add("lang-selected"); else document.body.classList.remove("lang-selected");
  }, [lang]);

  useEffect(() => { scrollerRef.current?.scrollTo(0, 9_999_999); }, [chat, shortcutsOpen]);

  const dict  = useMemo(() => tr[lang || "cs"], [lang]);

  /** ====== FLOWS (použijeme dict) ====== */
  function makeFlows(dict){
    const FOOD = [
      { label:"🍽️ Snídaně / Restaurace", control:{ intent:"local", sub:"dining" } },
      { label:"🥖 Pekárny",               control:{ intent:"local", sub:"bakery" } },
      { label:"🛒 Obchody",               control:{ intent:"local", sub:"grocery" } },
      { label:"💊 Lékárny",               control:{ intent:"local", sub:"pharmacy" } },
      { label: dict.foodDelivery,         control:{ intent:"tech",  sub:"food_delivery" } },
      { label:"💱 Směnárny / ATM", children:[
        { label:"💱 Směnárny", control:{ intent:"local", sub:"exchange" } },
        { label:"🏧 ATM",      control:{ intent:"local", sub:"atm" } },
      ]},
    ];

    const TECH = [
      { label:"📶 Wi-Fi",               control:{ intent:"tech", sub:"wifi", kind:"wifi" } },
      { label:"⚡ Elektřina",           control:{ intent:"tech", sub:"power" } },
      { label:"💧 Teplá voda",          control:{ intent:"tech", sub:"hot_water" } },
      { label:"❄️ Klimatizace (AC)",    control:{ intent:"tech", sub:"ac" } },
      { label:"🍳 Indukční deska",      control:{ intent:"tech", sub:"induction" } },
      { label:"🌀 Digestoř",            control:{ intent:"tech", sub:"hood" } },
      { label:"☕ Kávovar Tchibo",      control:{ intent:"tech", sub:"coffee" } },
      { label:"🔥 Požární hlásič",      control:{ intent:"tech", sub:"fire_alarm" } },
      { label:"🛗 Výtah – servis",      control:{ intent:"tech", sub:"elevator_phone" } },
      { label:"🔐 Trezor",              control:{ intent:"tech", sub:"safe" } },
      { label:"🔑 Náhradní klíč",       control:{ intent:"tech", sub:"keys", needsRoom:true } },
    ];

    const TRANSPORT = [
      { label: dict.transportInfo,      control:{ intent:"tech", sub:"transport" } },
    ];

    const OTHER = [
      { label:"🧺 Prádelna",            control:{ intent:"tech", sub:"laundry" } },
      { label:"♿️ Bezbariérovost",      control:{ intent:"tech", sub:"access" } },
      { label:"🚭 Kouření",             control:{ intent:"tech", sub:"smoking" } },
      { label:"🎒 Úschovna zavazadel",  control:{ intent:"tech", sub:"luggage" } },
      { label:"🔔 Zvonky",              control:{ intent:"tech", sub:"doorbells" } },
      { label:"🚪 Brána (zevnitř)",     control:{ intent:"tech", sub:"gate" } },
      { label:"🗑️ Odpadky / Popelnice", control:{ intent:"tech", sub:"trash" } },
      { label:"👩‍⚕️ Lékař 24/7",        control:{ intent:"tech", sub:"doctor" } },
      { label:"🧻 Povlečení / Ručníky", control:{ intent:"tech", sub:"linen_towels" } },
    ];

    return [
      { label:dict.catFood,      children:FOOD },
      { label:dict.catTech,      children:TECH },
      { label:dict.catTransport, children:TRANSPORT },
      { label:dict.catOther,     children:OTHER },
    ];
  }
  const FLOWS = useMemo(() => makeFlows(dict), [dict]);

  function renderAssistant(md=""){
    const raw = marked.parse(md, { breaks:true });
    const clean = DOMPurify.sanitize(raw);
    return <div className="bubble bot" dangerouslySetInnerHTML={{ __html: clean }} />;
  }

  async function callBackend(payload){
    setLoading(true);
    try{
      const r = await fetch("/.netlify/functions/concierge", {
        method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(payload)
      });
      const data = await r.json();
      setChat(c => [...c, { role:"assistant", content:data.reply }]);
    }catch{
      setChat(c => [...c, { role:"assistant", content:"⚠️ Nelze se připojit k serveru. Zkuste to prosím znovu." }]);
    }finally{ setLoading(false); }
  }

  // „kontrolované“ tlačítko (bez volného textu)
  function sendControl(promptText, control){
    const next = [...chat, { role:"user", content:promptText }];
    setChat(next);
    return callBackend({ messages: next, uiLang: lang, control });
  }
  // čistý text (pro Wi-Fi – posíláme číslo pokoje/SSID, backend vrátí heslo)
  function sendText(text){
    const next = [...chat, { role:"user", content:text }];
    setChat(next);
    return callBackend({ messages: next, uiLang: lang });
  }

  const openNode = (node) => setStack(s => [...s, node]);
  const goBack   = () => setStack(s => s.slice(0, -1));
  const resetToRoot = () => setStack([]);

  const currentChildren =
    !lang ? null :
    stack.length === 0 ? FLOWS :
    stack[stack.length - 1]?.children ?? FLOWS;

  // === SSID list (pro krok „Nefunguje“) – pouze 4-znakové kódy
  const ALL_SSIDS = ["D384","CDEA","CF2A","93EO","D93A","D9E4","6A04","9B7A","1CF8","D8C4","CD9E","CF20","23F0","B4B4","DA4E","D5F6"];

  // handler kliků
  const onChipClick = (n) => {
    if (n.children) return openNode(n);

    // Wi-Fi průvodce:
    if (n.control?.kind === "wifi") {
      setShortcutsOpen(false);
      // 1) pošli návod (troubleshoot) jako bublinu
      sendControl("Wi-Fi", { intent:"tech", sub:"wifi" });
      // 2) otevři overlay se 2 kroky: (a) ZOBRAZIT MOJE HESLO → výběr pokoje → heslo do chatu; (b) Nefunguje → výběr SSID
      setWifiSheet({ open:true, step:0, floor:null, last:null, ssid:null });
      return;
    }

    // Náhradní klíč: nejdřív pošli instrukce (s fotkou), hned poté otevři výběr
    if (n.control?.needsRoom) {
      setShortcutsOpen(false);
      sendControl("Náhradní klíč – instrukce", { intent:"tech", sub:"keys" });
      setRoomSheet({ open:true, floor:null, last:null });
      return;
    }

    if (n.control) {
      setShortcutsOpen(false);
      return sendControl(n.label, n.control);
    }
  };

  // -------- Keys overlay --------
  const floors = [0,1,2,3];
  const lasts  = ["01","02","03","04","05"];

  const confirmRoom = () => {
    const { floor, last } = roomSheet;
    if (floor === null || last === null) return;
    const room = `${floor}${last}`.padStart(3, "0");
    setRoomSheet({ open:false, floor:null, last:null });
    return sendControl(`Náhradní klíč ${room}`, { intent:"tech", sub:"keys", room });
  };

  // -------- Wi-Fi overlay logic --------
  // step 0: tlačítko „Zobrazit moje heslo“ → výběr pokoje → po potvrzení pošleme číslo pokoje (heslo přijde do chatu)
  const sendWifiPasswordForRoom = () => {
    const { floor, last } = wifiSheet;
    if (floor === null || last === null) return;
    const room = `${floor}${last}`.padStart(3, "0");
    sendText(room); // backend vrátí "**Wi-Fi:** SSID ABCD, heslo 1234"
    setWifiSheet(s => ({ ...s, step:1 })); // krok s tlačítkem „Nefunguje“
  };

  const sendWifiPasswordForSSID = () => {
    if (!wifiSheet.ssid) return;
    sendText(wifiSheet.ssid); // backend rozpozná 4-znak. SSID a pošle heslo
    setWifiSheet({ open:false, step:0, floor:null, last:null, ssid:null });
  };

  return (
    <>
      <GoogleStyle />
      <div className="row">
        {/* CHAT SCROLLER */}
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
              <div className="tips">
                {Object.keys(LANGS).map(k => k.toUpperCase()).join(" / ")}
              </div>
            </div>
          )}

          {chat.map((m,i) =>
            m.role === "assistant"
              ? <div key={i}>{renderAssistant(m.content)}</div>
              : <div key={i} className="bubble me">{m.content}</div>
          )}
        </div>

        {/* ZKRATKY */}
        {lang && currentChildren && shortcutsOpen && (
          <div className="shortcuts">
            <div className="shortcutsHeader">
              <strong>{stack.length === 0 ? tr[lang||"cs"].mainTitle : tr[lang||"cs"].subTitle}</strong>
              <div className="btnRow">
                {stack.length > 0 && (
                  <button className="backBtn" onClick={goBack}>{tr[lang||"cs"].back}</button>
                )}
                <button className="backBtn" onClick={() => setShortcutsOpen(false)}>{tr[lang||"cs"].hide}</button>
                <button className="backBtn" onClick={() => { setLang(null); setStack([]); }}>🌐 {tr[lang||"cs"].chooseLang}</button>
              </div>
            </div>

            <div className="grid">
              {currentChildren.map((n, idx) =>
                n.children ? (
                  <button
                    key={idx}
                    className="chip"
                    style={{ ["--btn"]: colorForCategory(n.label) }}
                    onClick={() => openNode(n)}
                  >
                    {n.label}
                  </button>
                ) : (
                  <button
                    key={idx}
                    className="chipPrimary"
                    style={{ ["--btn"]: btnColorForIndex(idx) }}
                    onClick={() => onChipClick(n)}
                    disabled={loading}
                    title={n.control?.sub || ""}
                  >
                    {n.label}
                  </button>
                )
              )}
            </div>

            <div className="tips" style={{ marginTop:8 }}>{tr[lang||"cs"].stillAsk}</div>
          </div>
        )}

        {!shortcutsOpen && lang && (
          <button className="fab" onClick={() => setShortcutsOpen(true)} title={tr[lang||"cs"].shortcuts}>
            {tr[lang||"cs"].show}
          </button>
        )}

        {/* Kontaktní lišta */}
        <div className="contactBar">{tr[lang||"cs"].contact}</div>
      </div>

      {/* OVERLAY: Náhradní klíč (po instrukci) */}
      {roomSheet.open && (
        <div className="overlay" onClick={()=>setRoomSheet(s=>({ ...s, open:false }))}>
          <div className="sheet" onClick={(e)=>e.stopPropagation()}>
            <h4>{tr[lang||"cs"].pickRoom}</h4>
            <div className="tips" style={{marginBottom:6}}>{tr[lang||"cs"].floor}</div>
            <div className="pillRow" style={{marginBottom:8}}>
              {[0,1,2,3].map(f=>(
                <button key={f} className={`pill ${roomSheet.floor===f?'active':''}`} onClick={()=>setRoomSheet(s=>({...s, floor:f}))}>
                  {f}
                </button>
              ))}
            </div>
            <div className="tips" style={{marginTop:6, marginBottom:6}}>{tr[lang||"cs"].room}</div>
            <div className="pillRow" style={{marginBottom:12}}>
              {["01","02","03","04","05"].map(l=>(
                <button key={l} className={`pill ${roomSheet.last===l?'active':''}`} onClick={()=>setRoomSheet(s=>({...s, last:l}))}>
                  {l}
                </button>
              ))}
            </div>
            <div className="pillRow">
              <button className="backBtn" onClick={()=>setRoomSheet({open:false,floor:null,last:null})}>{tr[lang||"cs"].cancel}</button>
              <button
                className="chipPrimary"
                style={{ ["--btn"]: "var(--blue)" }}
                disabled={roomSheet.floor===null || roomSheet.last===null}
                onClick={confirmRoom}
              >
                {tr[lang||"cs"].confirm}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY: Wi-Fi průvodce */}
      {wifiSheet.open && (
        <div className="overlay" onClick={()=>setWifiSheet(s=>({ ...s, open:false }))}>
          <div className="sheet" onClick={(e)=>e.stopPropagation()}>
            {/* Krok 0 – tlačítko „Zobrazit moje heslo“ + výběr pokoje */}
            {wifiSheet.step === 0 && (
              <>
                <h4>📶 Wi-Fi</h4>
                <div className="pillRow" style={{marginBottom:8}}>
                  <button
                    className="chipPrimary"
                    style={{ ["--btn"]: "var(--blue)" }}
                    onClick={()=>setWifiSheet(s=>({...s, step:10}))}
                  >
                    {tr[lang||"cs"].showMyWifi}
                  </button>
                </div>
                {/* volitelně tip: heslo se zobrazí v chatu */}
              </>
            )}

            {/* Krok 10 – výběr pokoje pro zobrazení hesla */}
            {wifiSheet.step === 10 && (
              <>
                <h4>{tr[lang||"cs"].pickRoom}</h4>
                <div className="tips" style={{marginBottom:6}}>{tr[lang||"cs"].floor}</div>
                <div className="pillRow" style={{marginBottom:8}}>
                  {[0,1,2,3].map(f=>(
                    <button key={f} className={`pill ${wifiSheet.floor===f?'active':''}`} onClick={()=>setWifiSheet(s=>({...s, floor:f}))}>
                      {f}
                    </button>
                  ))}
                </div>
                <div className="tips" style={{marginTop:6, marginBottom:6}}>{tr[lang||"cs"].room}</div>
                <div className="pillRow" style={{marginBottom:12}}>
                  {["01","02","03","04","05"].map(l=>(
                    <button key={l} className={`pill ${wifiSheet.last===l?'active':''}`} onClick={()=>setWifiSheet(s=>({...s, last:l}))}>
                      {l}
                    </button>
                  ))}
                </div>
                <div className="pillRow">
                  <button className="backBtn" onClick={()=>setWifiSheet({open:false, step:0, floor:null, last:null, ssid:null})}>{tr[lang||"cs"].cancel}</button>
                  <button
                    className="chipPrimary"
                    style={{ ["--btn"]: "var(--blue)" }}
                    disabled={wifiSheet.floor===null || wifiSheet.last===null}
                    onClick={sendWifiPasswordForRoom}
                  >
                    {tr[lang||"cs"].confirm}
                  </button>
                </div>
              </>
            )}

            {/* Krok 1 – po zobrazení hesla: dotaz, zda funguje / možnost „Nefunguje“ */}
            {wifiSheet.step === 1 && (
              <>
                <h4>{tr[lang||"cs"].wifiStatus}</h4>
                <div className="pillRow" style={{marginBottom:12}}>
                  <button className="pill active" onClick={()=>setWifiSheet({open:false,step:0,floor:null,last:null,ssid:null})}>{tr[lang||"cs"].ok}</button>
                  <button className="pill" onClick={()=>setWifiSheet(s=>({...s, step:2}))}>{tr[lang||"cs"].notOk}</button>
                </div>
              </>
            )}

            {/* Krok 2 – výběr SSID (seznam všech) */}
            {wifiSheet.step === 2 && (
              <>
                <h4>{tr[lang||"cs"].pickSsid}</h4>
                <div className="pillRow" style={{marginBottom:12}}>
                  {ALL_SSIDS.map(code=>(
                    <button
                      key={code}
                      className={`pill ${wifiSheet.ssid===code?'active':''}`}
                      onClick={()=>setWifiSheet(s=>({...s, ssid:code}))}
                    >
                      {code}
                    </button>
                  ))}
                </div>
                <div className="pillRow">
                  <button className="backBtn" onClick={()=>setWifiSheet(s=>({...s, step:1, ssid:null}))}>{tr[lang||"cs"].back}</button>
                  <button
                    className="chipPrimary"
                    style={{ ["--btn"]: "var(--blue)" }}
                    disabled={!wifiSheet.ssid}
                    onClick={sendWifiPasswordForSSID}
                  >
                    {tr[lang||"cs"].confirm}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
