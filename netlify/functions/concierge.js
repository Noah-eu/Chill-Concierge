// netlify/functions/concierge.js
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL  = process.env.OPENAI_MODEL || "gpt-4o-mini";

/** ====== LOKÁLNÍ DATA ====== */
const HOTEL = {
  address: "Sokolská 1614/64, Praha 2, 120 00",
  areaHints: [
    "I. P. Pavlova (3–5 min pěšky)",
    "Náměstí Míru (10–12 min pěšky / 1 stanice tram)",
    "Muzeum / Václavské náměstí (10–12 min pěšky)"
  ],
  maxRadiusMeters: 800
};

const WIFI = [
  { room: "001", ssid: "D384", pass: "07045318" },
  { room: "101", ssid: "CDEA", pass: "51725587" },
  { room: "102", ssid: "CF2A", pass: "09341791" },
  { room: "103", ssid: "93EO", pass: "25133820" },
  { room: "104", ssid: "D93A", pass: "10661734" },
  { room: "105", ssid: "D9E4", pass: "09464681" },
  { room: "201", ssid: "6A04", pass: "44791957" },
  { room: "202", ssid: "9B7A", pass: "65302361" },
  { room: "203", ssid: "1CF8", pass: "31284547" },
  { room: "204", ssid: "D8C4", pass: "73146230" },
  { room: "205", ssid: "CD9E", pass: "02420004" },
  { room: "301", ssid: "CF20", pass: "96995242" },
  { room: "302", ssid: "23F0", pass: "46893345" },
  { room: "303", ssid: "B4B4", pass: "07932908" },
  { room: "304", ssid: "DA4E", pass: "03274644" },
  { room: "305", ssid: "D5F6", pass: "45445804" },
];

const LUGGAGE_ROOM_CODE = "3142#";
const KEYBOX = {
  "001": "3301","101": "3302","102": "3303","103": "3304","104": "3305","105": "3306",
  "201": "3307","202": "3308","203": "3309","204": "3310","205": "3311",
  "301": "3312","302": "3313","303": "3314","304": "3315","305": "3316",
};

/** ====== PROMPT / ROUTER ====== */
const SYSTEM_PROMPT = `You are a helpful hotel concierge for CHILL Apartments.
- Always reply in the user's language (mirror the last user message). If unsure, default to Czech.
- Location: ${HOTEL.address}. Keep suggestions within about ${HOTEL.maxRadiusMeters} meters (~10 min walk). Prefer areas: ${HOTEL.areaHints.join(", ")}.
- Do NOT handle parking, reservation changes, check-in/out, room numbers assignment, prices for rooms, or payment for accommodation.
- If user asks about those, reply exactly:
"Tyto informace zde nevyřizuji. Napište prosím do hlavního chatu pro ubytování/parkování. Rád pomohu s ostatním (restaurace, doprava, doporučení v okolí, technické potíže mimo kódy, faktury, potvrzení o pobytu, ztráty a nálezy, hluční sousedé)."
- Otherwise be concise (~4 sentences), friendly, and practical.`;

const FORBIDDEN_PATTERNS = [
  /parkován(í|i)|parking/i,
  /check[-\s]?in|self\s?check[-\s]?in|check[-\s]?out|late check[-\s]?out/i,
  /ubytován(í|i)|rezervac(e|i|í)|pokoj|apartm(á|a)n (rezervace|změna|cena)/i,
  /platba za (ubytování|pokoj)|cena (pokoje|ubytování)/i
];

/** ====== UTIL ====== */
function detectLang(text = "") {
  const t = (text || "").toLowerCase();
  const czWords = ["ahoj","dobrý","prosím","děkuji","kde","wifi","heslo","pokoj","výtah","schody"];
  if (/[ěščřžýáíéúůňťď]/.test(t) || czWords.some(w => t.includes(w))) return "cs";
  const enWords = ["hello","hi","please","thanks","where","password","room"];
  if (enWords.some(w => t.includes(w))) return "en";
  return "cs";
}
const lastUser = (messages=[]) => [...messages].reverse().find(m=>m.role==="user")?.content || "";
const extractRoom = (text) => (text||"").match(/\b(00[1]|10[1-5]|20[1-5]|30[1-5])\b/)?.[1] || null;
const extractSSID = (text) => (text||"").match(/\b([A-Z0-9]{4})\b/)?.[1] || null;

async function translateToUserLang(text, userText) {
  const lang = detectLang(userText);
  if (lang === "cs") return text;
  const completion = await client.chat.completions.create({
    model: MODEL, temperature: 0.2,
    messages: [
      { role: "system", content: "Translate the assistant message to the language used in the user's last message. Keep formatting and emojis. Be concise." },
      { role: "user", content: "USER MESSAGE:\n" + userText + "\n\nASSISTANT MESSAGE TO TRANSLATE:\n" + text }
    ]
  });
  return completion.choices?.[0]?.message?.content?.trim() || text;
}

/** ====== IMG HELPERS – tvoje soubory ====== */
const IMG = (name, alt) => `![${alt}](${name})`;
const P = {
  AC: "/help/AC.jpg",
  BALCONY: "/help/balcony.jpg",
  FUSE: "/help/fuse-box-apartment.jpg",
  LAUNDRY: "/help/laundry-room.jpg",
  LUGGAGE: "/help/13.%20Luggage%20room.jpg" // mezery musí být %20
};

/** ====== INTENT HELPERS ====== */
function wifiByRoom(room){ return WIFI.find(w=>w.room===room)||null; }
function wifiBySsid(ssid){ return WIFI.find(w=>w.ssid===ssid)||null; }

function buildWifiHelp(entry) {
  const creds = entry ? `\n\n**Wi-Fi:** SSID **${entry.ssid}**, heslo **${entry.pass}**.` : "";
  return [
    // nemáme zatím router foto → vynecháno
    "Pokud Wi-Fi nefunguje:",
    "1) Zkontrolujte kabely u routeru.",
    "2) Restartujte: vytáhněte napájecí kabel na 10 sekund, poté zapojte a vyčkejte 1–2 minuty.",
    "3) Pokud to nepomůže, napište, jakou **jinou Wi-Fi** vidíte – pošlu k ní heslo.",
    creds
  ].filter(Boolean).join("\n");
}

function buildACHelp() {
  return [
    IMG(P.AC, "Režimy AC"),
    "U klimatizace zkontrolujte režim: ☀️ = topení, ❄️ = chlazení.",
    IMG(P.BALCONY, "AC vypínače – 2. patro / balkon"),
    "Pokud **zelená kontrolka bliká**, je potřeba restart: na **2. patře** na balkoně jsou **AC vypínače**. Vypněte svůj na ~30 s a pak zapněte.",
    "To obvykle problém vyřeší."
  ].join("\n");
}

function buildPowerHelp() {
  return [
    IMG(P.FUSE, "Jističe v apartmánu"),
    "1) Zkontrolujte jističe **v apartmánu** (malá bílá dvířka ve zdi).",
    IMG(P.BALCONY, "Hlavní jistič u balkonu"),
    "2) Pokud jsou v pořádku, zkontrolujte **hlavní jistič** u balkonu (větší troj-jističe).",
    "3) Pokud je problém tam, bude **jeden dole**, ostatní nahoře – zvedněte páčku nahoru."
  ].join("\n");
}

function buildAccessibility() {
  return [
    // nemáme fotku výtahu → textově
    "Do budovy vedou **dva schody**. Do apartmánu **001** je **jeden schod**.",
    "Jinak bez schodů a s **velkým výtahem**.",
    "Ve sprchách je cca **30 cm** vysoký okraj vaničky."
  ].join("\n");
}

function buildSmoking() {
  return [
    IMG(P.BALCONY, "Společný balkon"),
    "Pro kouření využijte prosím **společné balkony** na každém patře naproti výtahu."
  ].join("\n");
}

function buildPets() {
  return "Psi jsou vítáni a **neplatí se** za ně poplatek. Prosíme, aby **nelezli na postele a gauče**.";
}

function buildLaundry() {
  return [
    IMG(P.LAUNDRY, "Prádelna v suterénu"),
    "Prádelna je v **suterénu**, otevřena **non-stop** a **zdarma**. K dispozici jsou prostředky i **žehlička** (lze vzít na pokoj)."
  ].join("\n");
}

function buildKeyHelp(room) {
  if (!room) {
    return [
      IMG(P.LUGGAGE, "Dveře do bagážovny"),
      `Zapomenutý klíč:`,
      `1) Do **bagážovny** vstupte kódem **${LUGGAGE_ROOM_CODE}**.`,
      `2) Napište mi prosím **číslo apartmánu** – pošlu kód k příslušnému boxu.`,
      `3) Po použití klíč **vraťte** a **zamíchejte číselník**.`
    ].join("\n");
  }
  const code = KEYBOX[room];
  if (!code) return "Napište prosím platné číslo apartmánu (např. 001, 101, … 305).";
  return [
    IMG(P.LUGGAGE, "Vstup do bagážovny"),
    `Náhradní klíč k **${room}**:`,
    `1) Do **bagážovny** vstupte kódem **${LUGGAGE_ROOM_CODE}**.`,
    `2) Otevřete box **${room}** – kód **${code}**.`,
    `3) Po otevření apartmánu prosíme klíč **vrátit** a číselník **zamíchat**.`
  ].join("\n");
}

/** Intent routing */
function detectIntent(text) {
  const t = (text || "").toLowerCase();
  if (/(wi[-\s]?fi|wifi|internet|heslo|password|ssid)/i.test(t)) return "wifi";
  if (/(ac|klimatizace|klima|air ?conditioning)/i.test(t)) return "ac";
  if (/(elektrin|elektrik|jistič|jistice|power|fuse|breaker)/i.test(t)) return "power";
  if (/(invalid|wheelchair|bezbarier|schod)/i.test(t)) return "access";
  if (/(kouř|kouřit|smok)/i.test(t)) return "smoking";
  if (/(pes|psi|dog)/i.test(t)) return "pets";
  if (/(prádeln|laund)/i.test(t)) return "laundry";
  if (/(klíč|klic|key|zapomněl|ztratil|lost|forgot).*apartm|bagážovn|bagazovn|key ?box/i.test(t)) return "keys";
  if (/(restaurac|snídan|breakfast|restaurant|grocer|potravin|pharm|lékárn|lekarn|shop|store|bar|kavárn|kavarn)/i.test(t)) return "local";
  return "general";
}

function buildLocalGeneric() {
  return [
    `Jsme na **${HOTEL.address}** (u ${HOTEL.areaHints.join(", ")}).`,
    `Doporučení držím do ~${Math.round(HOTEL.maxRadiusMeters/80)} min chůze: kavárny/bistra u I. P. Pavlova, podniky směrem k Náměstí Míru a spodní Vinohrady, rychlé občerstvení na Legerově/Sokolské.`,
    `Napište prosím přesně, co hledáte (snídaně, česká kuchyně, vegetarián, supermarket, lékárna, bar) + čas a rozpočet – upřesním.`
  ].join("\n");
}

/** ====== MAIN HANDLER ====== */
export default async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  if (!process.env.OPENAI_API_KEY) {
    return new Response(JSON.stringify({ reply: "⚠️ Server nemá nastavený OPENAI_API_KEY." }), {
      status: 500, headers: { "content-type": "application/json" }
    });
  }

  try {
    const { messages = [] } = await req.json();
    const userText = lastUser(messages);

    // Handoff témata
    if (FORBIDDEN_PATTERNS.some(r => r.test(userText))) {
      return ok(await translateToUserLang(
        "Tyto informace zde nevyřizuji. Napište prosím do hlavního chatu pro ubytování/parkování. Rád pomohu se vším ostatním (doporučení v okolí, doprava, technické potíže, potvrzení o pobytu, faktury, ztráty/nálezy, stížnosti).",
        userText
      ));
    }

    // Deterministické intent odpovědi
    const intent = detectIntent(userText);

    if (intent === "wifi") {
      const room = extractRoom(userText);
      const ssid = extractSSID(userText);
      const entry = room ? wifiByRoom(room) : (ssid ? wifiBySsid(ssid) : null);
      let reply = buildWifiHelp(entry);
      if (!entry) reply += "\n\n👉 Pokud znáte **číslo apartmánu** nebo **SSID** (4 znaky), napište mi ho a pošlu heslo.";
      return ok(await translateToUserLang(reply, userText));
    }
    if (intent === "ac")      return ok(await translateToUserLang(buildACHelp(), userText));
    if (intent === "power")   return ok(await translateToUserLang(buildPowerHelp(), userText));
    if (intent === "access")  return ok(await translateToUserLang(buildAccessibility(), userText));
    if (intent === "smoking") return ok(await translateToUserLang(buildSmoking(), userText));
    if (intent === "pets")    return ok(await translateToUserLang(buildPets(), userText));
    if (intent === "laundry") return ok(await translateToUserLang(buildLaundry(), userText));
    if (intent === "keys") {
      const room = extractRoom(userText);
      return ok(await translateToUserLang(buildKeyHelp(room), userText));
    }
    if (intent === "local")   return ok(await translateToUserLang(buildLocalGeneric(), userText));

    // Obecné dotazy → model (s lokalitou)
    const completion = await client.chat.completions.create({
      model: MODEL, temperature: 0.3,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "system", content: `Address: ${HOTEL.address}. Keep suggestions within ~${HOTEL.maxRadiusMeters}m.` },
        ...messages
      ]
    });
    const reply = completion.choices?.[0]?.message?.content?.trim() ?? "Rozumím.";
    return ok(reply);

  } catch (e) {
    console.error(e);
    if (e?.code === "model_not_found" || /does not exist/i.test(e?.error?.message || e?.message || "")) {
      return ok("⚠️ Serverový model není dostupný. Zkuste prosím jiný model (např. gpt-4o-mini).");
    }
    return ok("Omlouvám se, nastala chyba. Zkuste to prosím znovu.");
  }

  function ok(reply) {
    return new Response(JSON.stringify({ reply }), {
      status: 200, headers: { "content-type": "application/json" }
    });
  }
};
