// app.jsx

import React, { useEffect, useMemo, useRef, useState } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";

/** ================== Konstanta: 3D Tour ================== */
const MATTERPORT_URL =
  "https://my.matterport.com/show/?m=PTEAUeUbMno&ss=53&sr=-1.6%2C1.05&tag=8hiaV2GWWhB&pin-pos=20.12%2C-3.85%2C8.94";

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

    .appHeader{
      position: sticky; top: 0; z-index: 1500;
      display: grid; grid-template-columns: 44px 1fr 44px; align-items:center;
      gap: 8px; padding: 10px 16px;
      background: linear-gradient(180deg,#ffffffcc,#fff);
      backdrop-filter: blur(6px);
      border-bottom:1px solid var(--border);
    }
    .appHeader .title{ text-align:center; font-weight:900; letter-spacing:.2px; }
    .appHeader img.logo{ height:38px; width:auto; object-fit:contain; }

    .row{display:flex;flex-direction:column;gap:12px;max-width:960px;margin:12px auto 24px;padding:0 16px}
    .scroller{
      max-height:70vh;overflow:auto;padding:8px;border-radius:14px;
      background: linear-gradient(180deg, color-mix(in oklab, var(--t-blue), white 70%) 0%, transparent 85%);
      scroll-behavior: auto;
    }

    .bubble{
      border-radius:16px;padding:12px 14px;line-height:1.35;width:fit-content;max-width:100%;white-space:pre-line;
      border:1px solid var(--border);box-shadow:0 6px 16px rgba(0,0,0,.06);background:#fff;
    }
    .me{background:linear-gradient(180deg, color-mix(in oklab, var(--t-blue), white 10%), color-mix(in oklab, var(--t-blue), white 0%));margin-left:auto;}
    .bot{background:linear-gradient(180deg, color-mix(in oklab, var(--t-yellow), white 8%), color-mix(in oklab, var(--t-yellow), white 0%));}

    .bot p{ margin:4px 0; }
    .bot ul, .bot ol{ margin:6px 0; padding-left:18px; }
    .bot li{ margin:2px 0; }
    .bot li p{ margin:0; }
    .bot li p + p{ margin-top:2px; }

    .bot img{max-width:100%;height:auto;border-radius:14px;display:block;margin:8px 0;box-shadow:0 10px 26px rgba(0,0,0,.10);border:1px solid var(--border);} 
    .bot a{display:inline-block;padding:8px 12px;border-radius:999px;border:1px solid color-mix(in oklab, var(--blue), black 15%);
      background:linear-gradient(180deg, color-mix(in oklab, var(--blue), white 8%), color-mix(in oklab, var(--blue), black 6%));
      color:#fff;text-decoration:none;font-weight:800;box-shadow:0 6px 16px rgba(66,133,244,.25);} 

    .grid{display:grid;grid-template-columns:repeat(auto-fit, minmax(160px, 1fr));gap:8px;width:100%;}
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

    .tips{color:var(--muted);font-size:13px;margin-top:4px}

    .shortcuts{ 
      border:1px solid var(--border);
      background:
        radial-gradient(800px 400px at 10% -40%, color-mix(in oklab, var(--t-yellow), white 20%) 0%, transparent 60%),
        radial-gradient(700px 380px at 100% -40%, color-mix(in oklab, var(--t-blue), white 20%) 0%, transparent 55%),
        linear-gradient(180deg, #fff, color-mix(in oklab, var(--t-yellow), white 6%));
      box-shadow:0 6px 16px rgba(0,0,0,.06);border-radius:16px;padding:12px 14px; 
      scroll-margin-top:12px;
    }
    .shortcutsHeader{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px;}

    .btnRow{display:flex;gap:8px;flex-wrap:wrap;}

    .contactBar{ 
      margin-top:4px;padding:10px 12px;border:1px dashed var(--border);border-radius:12px;
      background:linear-gradient(180deg, color-mix(in oklab, var(--t-yellow), white 10%), color-mix(in oklab, var(--t-yellow), white 2%));
      color:var(--accent);font-size:14px; 
    }

    .overlay{position:fixed;inset:0;background:rgba(0,0,0,.25);display:flex;align-items:flex-end;justify-content:center;padding:18px;z-index:2000;}
    .sheet{width:100%;max-width:700px;border-radius:18px;background:#fff;border:1px solid var(--border);box-shadow:0 18px 38px rgba(0,0,0,.20);padding:16px;}
    .sheet h4{margin:0 0 10px 0}

    .pillRow{display:flex;gap:8px;flex-wrap:wrap}
    .pill{ 
      padding:10px 14px;border-radius:999px;border:1px solid var(--border);
      background:#ffffff;color:var(--blue);
      cursor:pointer;font-weight:800;letter-spacing:.1px; 
    }
    .pill.active{ 
      border:1px solid color-mix(in oklab, var(--blue), black 18%);
      background:linear-gradient(180deg, color-mix(in oklab, var(--blue), white 6%), color-mix(in oklab, var(--blue), black 4%));
      color:#fff; 
    }

    .fabStack{ 
      position:fixed;left:50%;transform:translateX(-50%);
      bottom:18px;z-index:1100;display:flex;flex-direction:column;gap:10px; 
    }
    .fabAction{ 
      border:none;border-radius:999px;padding:12px 18px;font-weight:800;
      background:linear-gradient(180deg, color-mix(in oklab, var(--blue), white 6%), color-mix(in oklab, var(--blue), black 4%));
      color:#fff;box-shadow:0 10px 24px rgba(66,133,244,.35);cursor:pointer;min-width:220px;text-align:center; 
    }

    .fab{
      position:fixed;right:16px;bottom:90px;z-index:1000;border:none;border-radius:999px;padding:12px 14px;font-weight:800;
      box-shadow:0 10px 24px rgba(0,0,0,.25);cursor:pointer;
      color:#fff;
    }
    .fabBack{
      background:linear-gradient(180deg, color-mix(in oklab, var(--red), white 6%), color-mix(in oklab, var(--red), black 4%));
      border:1px solid color-mix(in oklab, var(--red), black 18%);
    }

    .langSingle{ display:flex; justify-content:center; margin-top:8px; }
    .langGrid2{ display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:8px; margin-top:8px; }

    @media (max-width:480px){
      .row{ padding-bottom:80px; }
    }
  `}</style>
);

/** ================== i18n ================== */
const LANGS = {
  cs:"Čeština", en:"English", es:"Español", de:"Deutsch", fr:"Français",
  ru:"Русский", uk:"Українська", nl:"Nederlands", it:"Italiano", da:"Dansk", pl:"Polski"
};

/* POZN.: předpokládám, že máš vyplněné překlady v tr.cs, tr.en a zároveň i v ostatních jazycích.
   Níže ponechávám skeleton; důležité je, že UI používá helper t(key), takže se správně přepne. */
const tr = {
  cs:{ chooseLang:"Zvolte jazyk", mainTitle:"Vyberte téma", subTitle:"Podtéma / Subtopic", back:"← Zpět",
       instructionsLabel:"📄 Instrukce k ubytování",
       catFood:"Jídlo a okolí", catTech:"Technické potíže", catOther:"Ostatní", catTransport:"Doprava", catAmenities:"Vybavení hotelu",
       tourLabel:"🧭 3D prohlídka hotelu", tourOpenMsg:"[Otevřít 3D prohlídku]("+MATTERPORT_URL+")",
       stillAsk:"Vyberte jednu z možností níže.",
       contact:"Pokud jste nenašli, co potřebujete, napište Davidovi (WhatsApp +420 733 439 733).",
       hide:"Skrýt",
       foodDelivery:"🛵 Jídlo domů", transportInfo:"🗺️ Doprava po Praze",
       diningLabel:"🍽️ Snídaně / Restaurace", bakeryLabel:"🥖 Pekárny",
       cafeBarGroupLabel:"☕/🍸 Caffè / Bar", cafeLabel:"☕ Kavárny", barLabel:"🍸 Bary",
       groceryLabel:"🛒 Obchody", pharmacyLabel:"💊 Lékárny",
       moneyGroupLabel:"💱 Směnárny / ATM", exchangeLabel:"💱 Směnárny", atmLabel:"🏧 ATM",
       wifiLabel:"📶 Wi-Fi", powerLabel:"⚡ Elektřina", hotWaterLabel:"💧 Teplá voda",
       acLabel:"❄️ Klimatizace (AC)", inductionLabel:"🍳 Indukční deska", hoodLabel:"🌀 Digestoř",
       coffeeLabel:"☕ Kávovar Tchibo", fireAlarmLabel:"🔥 Požární hlásič",
       elevatorPhoneLabel:"🛗 Výtah – servis", safeLabel:"🔐 Trezor",
       spareKeyLabel:"🔑 Náhradní klíč",
       laundryLabel:"🧺 Prádelna", accessLabel:"♿️ Bezbariérovost", smokingLabel:"🚭 Kouření",
       luggageLabel:"🎒 Úschovna zavazadel", doorbellsLabel:"🔔 Zvonky",
       gateLabel:"🚪 Brána (zevnitř)", trashLabel:"🗑️ Odpadky / Popelnice",
       doctorLabel:"👩‍⚕️ Lékař 24/7", linenLabel:"🧻 Povlečení / Ručníky",
       pickRoom:"Zvolte číslo apartmánu", floor:"Patro", room:"Pokoj", confirm:"Zobrazit", cancel:"Zavřít",
       wifiStatus:"Funguje Wi-Fi?", ok:"Funguje", notOk:"Nefunguje",
       pickSsid:"Vyberte SSID", showMyWifi:"Zobrazit moje heslo" },

  en:{ chooseLang:"Choose a language", mainTitle:"Pick a topic", subTitle:"Subtopic", back:"← Back",
       instructionsLabel:"📄 Check-in instructions",
       catFood:"Food & Nearby", catTech:"Technical issues", catOther:"Other", catTransport:"Transport", catAmenities:"Hotel amenities",
       tourLabel:"🧭 3D virtual tour", tourOpenMsg:"[Open the 3D tour]("+MATTERPORT_URL+")",
       stillAsk:"Pick one of the options below.",
       contact:"If you can’t find what you need, message David (WhatsApp +420 733 439 733).",
       hide:"Hide",
       foodDelivery:"🛵 Food delivery", transportInfo:"🗺️ Getting around Prague",
       diningLabel:"🍽️ Breakfast / Restaurants", bakeryLabel:"🥖 Bakeries",
       cafeBarGroupLabel:"☕/🍸 Caffè / Bar", cafeLabel:"☕ Cafés", barLabel:"🍸 Bars",
       groceryLabel:"🛒 Groceries", pharmacyLabel:"💊 Pharmacies",
       moneyGroupLabel:"💱 Exchanges / ATMs", exchangeLabel:"💱 Exchanges", atmLabel:"🏧 ATMs",
       wifiLabel:"📶 Wi-Fi", powerLabel:"⚡ Power", hotWaterLabel:"💧 Hot water",
       acLabel:"❄️ Air conditioning (AC)", inductionLabel:"🍳 Induction hob", hoodLabel:"🌀 Cooker hood",
       coffeeLabel:"☕ Tchibo coffee machine", fireAlarmLabel:"🔥 Fire alarm",
       elevatorPhoneLabel:"🛗 Elevator – service", safeLabel:"🔐 Safe",
       spareKeyLabel:"🔑 Spare key",
       laundryLabel:"🧺 Laundry", accessLabel:"♿️ Accessibility", smokingLabel:"🚭 Smoking",
       luggageLabel:"🎒 Luggage room", doorbellsLabel:"🔔 Doorbells",
       gateLabel:"🚪 Gate (inside)", trashLabel:"🗑️ Trash / bins",
       doctorLabel:"👩‍⚕️ Doctor 24/7", linenLabel:"🧻 Linen / towels",
       pickRoom:"Choose your apartment number", floor:"Floor", room:"Room", confirm:"Show", cancel:"Close",
       wifiStatus:"Is the Wi-Fi working?", ok:"Works", notOk:"Doesn’t work",
       pickSsid:"Pick the SSID", showMyWifi:"Show my password" },

  // ↓↓↓ vyplň si své překlady (máš je); UI je načte přes t(key)
  de:{ /* ... */ }, fr:{ /* ... */ }, es:{ /* ... */ }, ru:{ /* ... */ },
  uk:{ /* ... */ }, nl:{ /* ... */ }, it:{ /* ... */ }, da:{ /* ... */ }, pl:{ /* ... */ }
};

/** ===== helpery i18n ===== */
const getDict = (lang) => tr[lang] ?? tr.en ?? tr.cs;
// Fallback pořadí: vybraný jazyk → EN → CS → klíč
const makeT = (lang) => (key) =>
  (tr[lang] && tr[lang][key]) ?? (tr.en && tr.en[key]) ?? (tr.cs && tr.cs[key]) ?? key;

/** ================== barvy ============== */
const btnColorForIndex = (i) =>
  [ "var(--blue)", "var(--red)", "var(--yellow)", "var(--green)" ][i % 4];

/** ================== App ================== */
export default function App(){
  const [lang, setLang] = useState(null);
  const [stack, setStack] = useState([]);
  const [chat, setChat]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(true);

  // Overlays
  const [roomSheet, setRoomSheet] = useState({ open:false, floor:null, last:null });
  const [wifiRoomSheet, setWifiRoomSheet] = useState({ open:false, floor:null, last:null });
  const [wifiSsidSheet, setWifiSsidSheet] = useState({ open:false, ssid:null });

  // CTA
  const [showKeysCta, setShowKeysCta] = useState(false);
  const [wifiCtas, setWifiCtas] = useState({ showPassword:false, showNotOk:false });

  const scrollerRef = useRef(null);
  const shortcutsRef = useRef(null);

  const dict = useMemo(() => getDict(lang || "cs"), [lang]);
  const t    = useMemo(() => makeT(lang || "cs"), [lang]); // ← používejme všude v UI

  const scrollToShortcuts = () => {
    requestAnimationFrame(() => {
      shortcutsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  useEffect(() => {
    if (lang) document.body.classList.add("lang-selected"); else document.body.classList.remove("lang-selected");
  }, [lang]);

  // Autoscroll k poslední bublině bota
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const bots = scroller.querySelectorAll(".bubble.bot");
    const lastBot = bots[bots.length - 1];
    if (lastBot) {
      const top = lastBot.offsetTop - 8;
      scroller.scrollTo({ top, behavior: "auto" });
    } else {
      scroller.scrollTo({ top: scroller.scrollHeight, behavior: "auto" });
    }
  }, [chat]);

  // Po otevření zkratek skoč na ně
  useEffect(() => {
    if (lang && shortcutsOpen) scrollToShortcuts();
  }, [lang, shortcutsOpen]);

  /** ====== FLOWS ====== */
  function makeFlows(){
    const FOOD = [
      { label: t("diningLabel"),   control:{ intent:"local", sub:"dining" } },
      { label: t("bakeryLabel"),   control:{ intent:"local", sub:"bakery" } },
      { label: t("cafeBarGroupLabel"), children:[
        { label: t("cafeLabel"), control:{ intent:"local", sub:"cafe" } },
        { label: t("barLabel"),  control:{ intent:"local", sub:"bar"  } },
      ]},
      { label: t("groceryLabel"),  control:{ intent:"local", sub:"grocery" } },
      { label: t("pharmacyLabel"), control:{ intent:"local", sub:"pharmacy" } },
      { label: t("foodDelivery"),  control:{ intent:"tech",  sub:"food_delivery" } },
      { label: t("moneyGroupLabel"), children:[
        { label: t("exchangeLabel"), control:{ intent:"local", sub:"exchange" } },
        { label: t("atmLabel"),      control:{ intent:"local", sub:"atm" } },
      ]},
    ];

    const TECH = [
      { label: t("wifiLabel"),            control:{ intent:"tech", sub:"wifi", kind:"wifi" } },
      { label: t("powerLabel"),           control:{ intent:"tech", sub:"power" } },
      { label: t("hotWaterLabel"),        control:{ intent:"tech", sub:"hot_water" } },
      { label: t("acLabel"),              control:{ intent:"tech", sub:"ac" } },
      { label: t("inductionLabel"),       control:{ intent:"tech", sub:"induction" } },
      { label: t("hoodLabel"),            control:{ intent:"tech", sub:"hood" } },
      { label: t("coffeeLabel"),          control:{ intent:"tech", sub:"coffee" } },
      { label: t("fireAlarmLabel"),       control:{ intent:"tech", sub:"fire_alarm" } },
      { label: t("elevatorPhoneLabel"),   control:{ intent:"tech", sub:"elevator_phone" } },
      { label: t("safeLabel"),            control:{ intent:"tech", sub:"safe" } },
      { label: t("spareKeyLabel"),        control:{ intent:"tech", sub:"keys" } },
    ];

    const TRANSPORT = [
      { label: t("transportInfo"), control:{ intent:"tech", sub:"transport" } },
    ];

    const AMENITIES = [
      { label: t("aRooms"),   control:{ intent:"amenities", sub:"rooms" } },
      { label: t("aKitchen"), control:{ intent:"amenities", sub:"kitchen" } },
      { label: t("aBathroom"),control:{ intent:"amenities", sub:"bathroom" } },
      { label: t("aService"), control:{ intent:"amenities", sub:"service" } },
    ];

    const OTHER = [
      { label: t("laundryLabel"),     control:{ intent:"tech", sub:"laundry" } },
      { label: t("accessLabel"),      control:{ intent:"tech", sub:"access" } },
      { label: t("smokingLabel"),     control:{ intent:"tech", sub:"smoking" } },
      { label: t("luggageLabel"),     control:{ intent:"tech", sub:"luggage" } },
      { label: t("doorbellsLabel"),   control:{ intent:"tech", sub:"doorbells" } },
      { label: t("gateLabel"),        control:{ intent:"tech", sub:"gate" } },
      { label: t("trashLabel"),       control:{ intent:"tech", sub:"trash" } },
      { label: t("doctorLabel"),      control:{ intent:"tech", sub:"doctor" } },
      { label: t("linenLabel"),       control:{ intent:"tech", sub:"linen_towels" } },
    ];

    return [
      { label: t("instructionsLabel"), control:{ intent:"tech", sub:"stay_instructions" } },
      { label: t("tourLabel"), action:"tour" },
      { label: t("wifiLabel"), control:{ intent:"tech", sub:"wifi", kind:"wifi" } },
      { label: t("catFood"),      children:FOOD },
      { label: t("catTech"),      children:TECH },
      { label: t("catTransport"), children:TRANSPORT },
      { label: t("catAmenities"), children:AMENITIES },
      { label: t("catOther"),     children:OTHER },
    ];
  }
  const FLOWS = useMemo(() => makeFlows(), [t]); // ← závisí na t (na lang)

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

  function sendControl(promptText, control){
    const next = [...chat, { role:"user", content:promptText }];
    setChat(next);
    return callBackend({ messages: next, uiLang: lang, control });
  }
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

  const ALL_SSIDS = ["D384","CDEA","CF2A","93EO","D93A","D9E4","6A04","9B7A","1CF8","D8C4","CD9E","CF20","23F0","B4B4","DA4E","D5F6"];

  const onChipClick = (n) => {
    if (n.children) {
      setWifiCtas({ showPassword:false, showNotOk:false });
      return openNode(n);
    }

    if (n.action === "tour") {
      try { window.open(MATTERPORT_URL, "_blank", "noopener,noreferrer"); } catch {}
      setWifiCtas({ showPassword:false, showNotOk:false });
      setShortcutsOpen(false);
      setChat(c => [...c, { role:"assistant", content: dict.tourOpenMsg }]);
      return;
    }

    if (n.control?.kind === "wifi") {
      setShortcutsOpen(false);
      sendControl("Wi-Fi", { intent:"tech", sub:"wifi" });
      setWifiCtas({ showPassword:true, showNotOk:false });
      return;
    }

    if (n.control) {
      setShortcutsOpen(false);
      setWifiCtas({ showPassword:false, showNotOk:false });
      return sendControl(n.label, n.control);
    }
  };

  // interní (ponecháno)
  const floors = [0,1,2,3];
  const lasts  = ["01","02","03","04","05"];

  const confirmRoom = () => {
    const { floor, last } = roomSheet;
    if (floor === null || last === null) return;
    const room = `${floor}${last}`.padStart(3, "0");
    setRoomSheet({ open:false, floor:null, last:null });
    setShowKeysCta(false);
    return sendControl(`Náhradní klíč ${room}`, { intent:"tech", sub:"keys", room });
  };

  const confirmWifiRoom = () => {
    const { floor, last } = wifiRoomSheet;
    if (floor === null || last === null) return;
    const room = `${floor}${last}`.padStart(3, "0");
    setWifiRoomSheet({ open:false, floor:null, last:null });
    setWifiCtas({ showPassword:false, showNotOk:true });
    return sendText(room);
  };

  const confirmWifiSsid = () => {
    if (!wifiSsidSheet.ssid) return;
    const ssid = wifiSsidSheet.ssid;
    setWifiSsidSheet({ open:false, ssid:null });
    setWifiCtas({ showPassword:false, showNotOk:false });
    return sendText(ssid);
  };

  // Výběr jazyka (zůstává s českým nadpisem před volbou)
  const renderLangChooser = () => {
    const entries = Object.entries(LANGS);
    const first = entries.find(([code]) => code === "en");
    const rest = entries.filter(([code]) => code !== "en");

    return (
      <div className="bubble bot" style={{ display:"inline-block", maxWidth:"100%" }}>
        <strong>{tr.cs.chooseLang}</strong>

        <div className="langSingle">
          <button
            className="chipPrimary"
            style={{ ["--btn"]: "var(--blue)" }}
            onClick={() => {
              setLang("en");
              resetToRoot();
              setWifiCtas({ showPassword:false, showNotOk:false });
              setShortcutsOpen(true);
              scrollToShortcuts();
            }}
          >
            {first?.[1] || "English"}
          </button>
        </div>

        <div className="langGrid2">
          {rest.map(([code,label], i) => (
            <button
              key={code}
              className="chipPrimary"
              style={{ ["--btn"]: btnColorForIndex(i+1) }}
              onClick={() => {
                setLang(code);
                resetToRoot();
                setWifiCtas({ showPassword:false, showNotOk:false });
                setShortcutsOpen(true);
                scrollToShortcuts();
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="tips">
          {Object.keys(LANGS).map(k => k.toUpperCase()).join(" / ")}
        </div>
      </div>
    );
  };

  return (
    <>
      <GoogleStyle />

      {/* Header */}
      <header className="appHeader">
        <img className="logo" src="/help/chill1.jpg" alt="Chill Apartments" />
        <div className="title">Chill concierge</div>
        <img className="logo" src="/help/chill1.jpg" alt="Chill Apartments" />
      </header>

      <div className="row">
        {/* CHAT SCROLLER */}
        <div className="scroller" ref={scrollerRef}>
          {!lang && renderLangChooser()}

          {chat.map((m,i) =>
            m.role === "assistant"
              ? <div key={i}>{renderAssistant(m.content)}</div>
              : <div key={i} className="bubble me">{m.content}</div>
          )}
        </div>

        {/* ZKRATKY */}
        {lang && currentChildren && shortcutsOpen && (
          <div className="shortcuts" ref={shortcutsRef}>
            <div className="shortcutsHeader">
              <strong>{stack.length === 0 ? t("mainTitle") : t("subTitle")}</strong>
              <div className="btnRow">
                {stack.length > 0 && (
                  <button
                    className="backBtn"
                    onClick={() => {
                      goBack();
                      setWifiCtas({ showPassword:false, showNotOk:false });
                      scrollToShortcuts();
                    }}
                  >
                    {t("back")}
                  </button>
                )}
                <button className="backBtn" onClick={() => { setShortcutsOpen(false); }}>
                  {t("hide")}
                </button>
                <button
                  className="backBtn"
                  onClick={() => {
                    setLang(null);
                    setStack([]);
                    setWifiCtas({ showPassword:false, showNotOk:false });
                    setShortcutsOpen(false);
                    requestAnimationFrame(() => {
                      scrollerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
                    });
                  }}
                >
                  🌐 {t("chooseLang")}
                </button>
              </div>
            </div>

            <div className="grid">
              {currentChildren.map((n, idx) =>
                n.children ? (
                  <button
                    key={idx}
                    className="chip"
                    style={{ ["--btn"]: btnColorForIndex(idx) }}
                    onClick={() => onChipClick(n)}
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
                    title={n.control?.sub || n.action || ""}
                  >
                    {n.label}
                  </button>
                )
              )}
            </div>

            <div className="tips" style={{ marginTop:8 }}>{t("stillAsk")}</div>
          </div>
        )}

        {/* FAB: když jsou zkratky zavřené */}
        {!shortcutsOpen && lang && (
          <button
            className="fab fabBack"
            onClick={() => {
              setShortcutsOpen(true);
              requestAnimationFrame(() => {
                shortcutsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
              });
            }}
            title={t("back")}
          >
            {t("back")}
          </button>
        )}

        {/* Kontaktní lišta */}
        <div className="contactBar">{t("contact")}</div>
      </div>

      {/* ===== CTA STACK ===== */}
      <div className="fabStack" aria-live="polite">
        {showKeysCta && (
          <button className="fabAction" onClick={() => setRoomSheet({ open:true, floor:null, last:null })}>
            {t("pickRoom")}
          </button>
        )}
        {wifiCtas.showPassword && (
          <button className="fabAction" onClick={() => setWifiRoomSheet({ open:true, floor:null, last:null })}>
            {t("showMyWifi")}
          </button>
        )}
        {wifiCtas.showNotOk && (
          <button className="fabAction" onClick={() => setWifiSsidSheet({ open:true, ssid:null })}>
            {t("notOk")}
          </button>
        )}
      </div>

      {/* OVERLAY: Náhradní klíč – výběr pokoje */}
      {roomSheet.open && (
        <div className="overlay" onClick={()=>setRoomSheet(s=>({ ...s, open:false }))}>
          <div className="sheet" onClick={(e)=>e.stopPropagation()}>
            <h4>{t("pickRoom")}</h4>
            <div className="tips" style={{marginBottom:6}}>{t("floor")}</div>
            <div className="pillRow" style={{marginBottom:8}}>
              {[0,1,2,3].map(f=>(
                <button key={f} className={`pill ${roomSheet.floor===f?'active':''}`} onClick={()=>setRoomSheet(s=>({...s, floor:f}))}>
                  {f}
                </button>
              ))}
            </div>
            <div className="tips" style={{marginTop:6, marginBottom:6}}>{t("room")}</div>
            <div className="pillRow" style={{marginBottom:12}}>
              {["01","02","03","04","05"].map(l=>(
                <button key={l} className={`pill ${roomSheet.last===l?'active':''}`} onClick={()=>setRoomSheet(s=>({...s, last:l}))}>
                  {l}
                </button>
              ))}
            </div>
            <div className="pillRow">
              <button className="backBtn" onClick={()=>setRoomSheet({open:false,floor:null,last:null})}>{t("cancel")}</button>
              <button
                className="chipPrimary"
                style={{ ["--btn"]: "var(--blue)" }}
                disabled={roomSheet.floor===null || roomSheet.last===null}
                onClick={confirmRoom}
              >
                {t("confirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY: Wi-Fi – výběr pokoje */}
      {wifiRoomSheet.open && (
        <div className="overlay" onClick={()=>setWifiRoomSheet(s=>({ ...s, open:false }))}>
          <div className="sheet" onClick={(e)=>e.stopPropagation()}>
            <h4>{t("pickRoom")}</h4>
            <div className="tips" style={{marginBottom:6}}>{t("floor")}</div>
            <div className="pillRow" style={{marginBottom:8}}>
              {[0,1,2,3].map(f=>(
                <button key={f} className={`pill ${wifiRoomSheet.floor===f?'active':''}`} onClick={()=>setWifiRoomSheet(s=>({...s, floor:f}))}>
                  {f}
                </button>
              ))}
            </div>
            <div className="tips" style={{marginTop:6, marginBottom:6}}>{t("room")}</div>
            <div className="pillRow" style={{marginBottom:12}}>
              {["01","02","03","04","05"].map(l=>(
                <button key={l} className={`pill ${wifiRoomSheet.last===l?'active':''}`} onClick={()=>setWifiRoomSheet(s=>({...s, last:l}))}>
                  {l}
                </button>
              ))}
            </div>
            <div className="pillRow">
              <button className="backBtn" onClick={()=>setWifiRoomSheet({open:false,floor:null,last:null})}>{t("cancel")}</button>
              <button
                className="chipPrimary"
                style={{ ["--btn"]: "var(--blue)" }}
                disabled={wifiRoomSheet.floor===null || wifiRoomSheet.last===null}
                onClick={confirmWifiRoom}
              >
                {t("confirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY: Wi-Fi – výběr SSID */}
      {wifiSsidSheet.open && (
        <div className="overlay" onClick={()=>setWifiSsidSheet(s=>({ ...s, open:false }))}>
          <div className="sheet" onClick={(e)=>e.stopPropagation()}>
            <h4>{t("pickSsid")}</h4>
            <div className="pillRow" style={{marginBottom:12}}>
              {ALL_SSIDS.map(code=>(
                <button
                  key={code}
                  className={`pill ${wifiSsidSheet.ssid===code?'active':''}`}
                  onClick={()=>setWifiSsidSheet(s=>({...s, ssid:code}))}
                >
                  {code}
                </button>
              ))}
            </div>
            <div className="pillRow">
              <button className="backBtn" onClick={()=>setWifiSsidSheet({open:false, ssid:null})}>{t("cancel")}</button>
              <button
                className="chipPrimary"
                style={{ ["--btn"]: "var(--blue)" }}
                disabled={!wifiSsidSheet.ssid}
                onClick={confirmWifiSsid}
              >
                {t("confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
