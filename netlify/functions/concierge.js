import OpenAI from "openai";
import { PLACES, buildCuratedList } from "./data/places.js";

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
const NEARBY_RADIUS = 200;

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

/** ====== HLÁŠKY ====== */
const HANDOFF_MSG =
  "Tyto informace zde nevyřizuji. Napište prosím do hlavního chatu pro ubytování/parkování. " +
  "Rád pomohu s ostatním (restaurace, doprava, doporučení v okolí, technické potíže mimo kódy, " +
  "faktury, potvrzení o pobytu, ztráty a nálezy, hluční sousedé).";

/** ====== PROMPT ====== */
const SYSTEM_PROMPT = `You are a helpful hotel concierge for CHILL Apartments.
- Always reply in the user's language (mirror the last user message).
- Location: ${HOTEL.address}. Keep suggestions very close (≤ ${NEARBY_RADIUS} m).
- Do NOT handle parking, reservation changes, check-in/out, room numbers assignment, prices for rooms, or payment for accommodation.
- If user asks about those, reply exactly:
"${HANDOFF_MSG}"
- Otherwise be concise (~4 sentences), friendly, and practical.`;

/** ====== BLOKACE TÉMAT ====== */
const FORBIDDEN_PATTERNS = [
  /parkován(í|i)|parking/i,
  /check[-\s]?in|self\s?check[-\s]?in|check[-\s]?out|late check[-\s]?out/i,
  /ubytován(í|i)|rezervac(e|i|í)/i,
  /(cena|price).*(pokoj|room)|platba za (ubytování|pokoj)/i
];

/** ====== UTIL ====== */
const lastUser = (messages=[]) => [...messages].reverse().find(m=>m.role==="user")?.content || "";
const lastAssistant = (messages=[]) => [...messages].reverse().find(m=>m.role==="assistant")?.content || "";

// tolerantní detekce čísla pokoje (apt/room/#/č.)
const extractRoom = (text = "") => {
  const m = String(text).toLowerCase()
    .match(/(?:room|apt|ap\.?|apartm[áa]n|pokoj|č\.)?\s*#?\s*(00[1]|10[1-5]|20[1-5]|30[1-5])\b/);
  return m?.[1] || null;
};
const extractSSID = (text="") => (text||"").match(/\b([A-Z0-9]{4})\b/)?.[1] || null;

function historyContainsWifi(messages = []) {
  const look = messages.slice(-6).map(m => (m.content || "").toLowerCase()).join(" ");
  return /(wi[-\s]?fi|wifi|ssid|router|heslo|password)/i.test(look);
}
function historyContainsKeys(messages = []) {
  const look = messages.slice(-6).map(m => (m.content || "").toLowerCase()).join(" ");
  return /(náhradn|spare\s+key|zapomenut[ýy]\s+kl[ií]č|key[-\s]?box|schránk)/i.test(look);
}
function recentlySentWifiTroubleshoot(messages = []) {
  return /Pokud Wi-?Fi nefunguje:/i.test(lastAssistant(messages) || "");
}

/** jazyková detekce + překlad */
function guessLang(userText = "") {
  const t = (userText || "").trim().toLowerCase();
  // cs/de/es/fr/en
  if (/[ěščřžýáíéúůňťď]/i.test(t)) return "cs";
  if (/[äöüß]/.test(t) || /\b(wie|hallo|bitte|danke|wo|ich|nicht)\b/.test(t)) return "de";
  if (/[áéíóúñ¿¡]/.test(t) || /\b(hola|gracias|dónde|por favor|no puedo)\b/.test(t)) return "es";
  if (/[àâçéèêëîïôùûüÿœ]/.test(t) || /\b(bonjour|merci|où|s'il vous plaît)\b/.test(t)) return "fr";
  if (/\b(hello|please|thanks|where|wifi|password|help)\b/.test(t)) return "en";
  // ru / uk (cyrilice)
  if (/[а-яё]/i.test(t)) return "ru";
  if (/[іїєґ]/i.test(t)) return "uk";
  // nl
  if (/\b(hallo|hoi|alsjeblieft|alstublieft|dank je|dank u|waar)\b/i.test(t)) return "nl";
  // it
  if (/[àèéìòù]/.test(t) || /\b(ciao|per favore|grazie|dove|aiuto)\b/i.test(t)) return "it";
  // da
  if (/[æøå]/i.test(t) || /\b(hej|venligst|tak|hvor)\b/i.test(t)) return "da";
  // pl
  if (/[ąćęłńóśźż]/i.test(t) || /\b(cześć|dzień dobry|proszę|dziękuję|gdzie)\b/i.test(t)) return "pl";
  return null;
}
async function translateToUserLang(text, userText, uiLang) {
  const hint = uiLang || guessLang(userText);
  if (hint === "cs" && /[ěščřžýáíéúůňťď]/i.test(text)) return text;

  const completion = await client.chat.completions.create({
    model: MODEL, temperature: 0.0,
    messages: [
      { role: "system", content: `Rewrite ASSISTANT_MESSAGE in TARGET_LANG. Keep meaning, tone, formatting and emojis. Preserve markdown links. Be concise. TARGET_LANG=${hint || "cs"}` },
      { role: "user", content: "ASSISTANT_MESSAGE:\n" + (text || "") }
    ]
  });
  return completion.choices?.[0]?.message?.content?.trim() || text;
}

/** ====== IMG PATHS ====== */
const IMG = (src, alt) => `![${alt}](${src})`;
const P = {
  AC: "/help/AC.jpg",
  BALCONY: "/help/balcony.jpg",
  FUSE_APT: "/help/fuse-box-apartment.jpg",
  FUSE_IN_APT: "/help/fuse-box-in-the-apartment.jpg",
  LAUNDRY: "/help/laundry-room.jpg",
  LUGGAGE: "/help/luggage-room.jpg",
  CHECKOUT_BOX: "/help/check-out-box.jpg",
  SPARE_KEY: "/help/spare-key.jpg",
  GARBAGE: "/help/garbage.jpg",
  GATE_SWITCH: "/help/inside-gate-switch.jpg",
  DOOR_BELLS: "/help/door-bells.jpg",
};

/** ====== WIFI ====== */
const wifiByRoom = (room)=> WIFI.find(w=>w.room===room)||null;
const wifiBySsid = (ssid)=> WIFI.find(w=>w.ssid===ssid)||null;

const buildWifiTroubleshoot = () => [
  "Pokud Wi-Fi nefunguje:",
  "1) Zkontrolujte kabely u routeru.",
  "2) Restartujte: vytáhněte napájecí kabel na 10 s, poté zapojte a vyčkejte 1–2 minuty.",
  "3) Pokud to nepomůže, napište, jakou **jinou Wi-Fi** vidíte – pošlu k ní heslo.",
  "👉 Pokud znáte **číslo apartmánu** nebo **SSID** (4 znaky), napište mi ho a pošlu heslo."
].join("\n");
const buildWifiCreds = (entry) => entry ? `**Wi-Fi:** SSID **${entry.ssid}**, heslo **${entry.pass}**.` : null;

/** ====== QUICK-HELP ====== */
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
    "Pokud vypadne elektřina v apartmánu:",
    IMG(P.FUSE_IN_APT, "Jističe v apartmánu – malá bílá dvířka ve zdi"),
    "Nejdříve **zkontrolujte jističe v apartmánu** (malá bílá dvířka ve zdi).",
    IMG(P.FUSE_APT, "Hlavní jistič u balkonu – větší troj-jističe"),
    "Může to být **hlavní jistič apartmánu** u balkonu – pokud je **dole**, zvedněte ho nahoru."
  ].join("\n");
}
const buildAccessibility = () => [
  "Do budovy vedou **dva schody**. Do apartmánu **001** je **jeden schod**.",
  "Jinak bez schodů a s **velkým výtahem**.",
  "Ve sprchách je cca **30 cm** vysoký okraj vaničky."
].join("\n");
const buildSmoking = () => [
  IMG(P.BALCONY, "Společný balkon pro kouření"),
  "Pro kouření využijte prosím **společné balkony** na každém patře naproti výtahu.",
  "⚠️ **Neodklepávejte a nevyhazujte** nedopalky z balkonu – používejte popelník."
].join("\n");
const buildPets = () =>
  "Domácí mazlíčci / psi jsou **vítáni a zdarma**. Prosíme, aby **nelezli na postele a gauče**.";
const buildLaundry = () => [
  IMG(P.LAUNDRY, "Prádelna v suterénu"),
  "Prádelna je v **suterénu**, otevřena **non-stop** a **zdarma**. K dispozici jsou prostředky i **žehlička** (lze vzít na pokoj)."
].join("\n");

/** ====== ÚSCHOVNA + KLÍČ ====== */
function buildLuggageInfo() {
  return [
    "**Check-out je do 11:00** (přijíždějí noví hosté).",
    IMG(P.CHECKOUT_BOX, "Check-out box na klíče"),
    "Nejprve prosím **vhoďte klíče do check-out boxu**.",
    IMG(P.LUGGAGE, "Vstup do úschovny batožiny"),
    `Potom můžete **po 11:00** uložit zavazadla v **úschovně batožiny** – je v průjezdu **vedle schránky na klíče**.`,
    `**Kód je stejný jako pro bránu: ${LUGGAGE_ROOM_CODE}**. Po uložení prosím **zkontrolujte, že jsou dveře zavřené**.`
  ].join("\n");
}
function buildKeyHelp(room) {
  if (!room) {
    return [
      IMG(P.LUGGAGE, "Vstup do úschovny batožiny"),
      `Zapomenutý klíč:`,
      `1) Do **úschovny batožiny** vstupte kódem **${LUGGAGE_ROOM_CODE}**.`,
      `2) Napište mi prosím **číslo apartmánu** – pošlu kód k příslušnému boxu.`,
      `3) Po použití klíč **vrátit** a **zamíchat číselník**.`
    ].join("\n");
  }
  const code = KEYBOX[room];
  if (!code) return "Napište prosím platné číslo apartmánu (např. 001, 101, … 305).";
  return [
    IMG(P.SPARE_KEY, "Náhradní klíč – box s klíčem"),
    `Náhradní klíč k **${room}**:`,
    `1) Do **úschovny batožiny** vstupte kódem **${LUGGAGE_ROOM_CODE}**.`,
    `2) Otevřete box **${room}** – kód **${code}**.`,
    `3) Po otevření apartmánu prosíme klíč **vrátit** a **zamíchat**.`
  ].join("\n");
}

/** ====== DALŠÍ INTERNÍ INFO ====== */
const buildTrash = () => [
  IMG(P.GARBAGE, "Popelnice na dvoře"),
  "🗑️ **Popelnice** jsou **venku na dvoře**.",
  "Až vyndáte **plný pytel** z vašeho odpadkového koše, **nový pytel** najdete **pod ním**."
].join("\n");
const buildGate = () => [
  IMG(P.GATE_SWITCH, "Tlačítko pro otevření brány zevnitř"),
  "🚪 **Otevírání brány**:",
  "– **Zevnitř**: tlačítkem v průchodu **hned vedle key-boxu**.",
  `– **Z ulice**: kód **${LUGGAGE_ROOM_CODE}** (stejný jako k úschovně).`
].join("\n");
const buildDoorbells = () => [
  IMG(P.DOOR_BELLS, "Domovní zvonky na začátku průchodu"),
  "🔔 **Zvonky na apartmány**: můžete zazvonit vašim blízkým domovními zvonky.",
  "Jsou **na začátku průchodu z ulice**."
].join("\n");
const buildElevatorPhone = () =>
  "🛗 **Výtah – servis/porucha**: zavolejte **00420 775 784 446** (uveďte Sokolská 64, Praha 2).";
const buildFireAlarm = () => [
  "🔥 **Požární hlásič**:",
  "Pokud **nehoří** (jen se připálilo jídlo), na **přízemí za výtahem** je **dlouhá tyč**.",
  "Tou **zamáčkněte tlačítko uprostřed hlásiče** a vyvětrejte."
].join("\n");
const buildLinenTowels = () => [
  "🧺 **Povlečení / ručníky**:",
  "Potřebujete-li **čisté prostěradlo/povlečení/ručník/toaletní papír**, na **každém patře** je **skříň**.",
  "Otevřete ji kódem **526** a vezměte jen potřebné množství."
].join("\n");
const buildDoctor = () =>
  "👩‍⚕️ **Lékař 24/7**: **+420 603 433 833**, **+420 603 481 361**. Uveďte adresu a apartmán.";
const buildCoffee = () => [
  "☕ **Kávovar Tchibo**:",
  "– Nejčastěji je **plná nádoba na sedliny** → vyprázdnit.",
  "– Pokud nepomůže, **očistěte senzor nádoby** (uvnitř nad nádobou). Stačí prstem lehce očistit.",
].join("\n");
const buildHotWater = () =>
  "💧 **Nejde teplá voda**: prosím **počkejte až 20 minut**, než se v bojleru ohřeje nová. Pokud ani potom neteče, napište mi čas a apartmán.";
const buildInduction = () => [
  "🍳 **Indukce**:",
  "– „**L**“ = dětská pojistka → podržte **Child Lock** (vedle Zap/Vyp) pár sekund, až zmizí.",
  "– „**F**“ = použijte **indukční nádobí** (magnetické dno, dostatečný průměr).",
].join("\n");
const buildHood = () =>
  "🔆 **Digestoř**: vysuňte ji dopředu; **tlačítka jsou vpravo** po vysunutí.";
const buildSafe = () => [
  "🔐 **Trezor**:",
  "– Je-li zamčený a nevíte kód, kontaktujte prosím **Davida** (WhatsApp +420 733 439 733).",
  "– Pro nastavení: uvnitř dveří stiskněte **červené tlačítko**, zadejte kód (≥3 číslice), stiskněte **tlačítko zámku**, zavřete dveře.",
].join("\n");

/** ====== NOVÉ SEKCÍ – DOPRAVA & JÍDLO DOMŮ ====== */
const buildTransport = () => [
  "🗺️ **Doprava po Praze**",
  "– Většinu míst zvládnete **pěšky**. Na **Staroměstské náměstí ~15 min**, na **Pražský hrad ~1 hod** pěšky.",
  "– **Hlavní nádraží** je asi **10 min** chůzí.",
  "– **Jízdenku** koupíte **bezkontaktní kartou** přímo **u prostředních dveří** tramvaje.",
  "– Na **Pražský hrad** jede **tram 22** z **I. P. Pavlova** (cca **100 m** od nás)."
].join("\n");

const buildFoodDelivery = () => [
  "🛵 **Jídlo domů**",
  "Můžete si objednat přímo na apartmán přes **Foodora** nebo **Wolt**.",
  "- [Foodora](https://www.foodora.cz/)\n- [Wolt](https://wolt.com/)"
].join("\n");

/** ====== INTENTY ====== */
function detectLocalSubtype(t) {
  const s = (t || "").toLowerCase();
  if (/(snídan|snidan|breakfast)/i.test(s)) return "breakfast";
  if (/(lékárn|lekárn|lekarn|pharm|pharmacy)/i.test(s)) return "pharmacy";
  if (/(supermarket|potravin|grocery|market)/i.test(s)) return "grocery";
  if (/(kavárn|kavarn|cafe|coffee|káva|kava)/i.test(s)) return "cafe";
  if (/(bakery|pekárn|pekarn|pekárna)/i.test(s)) return "bakery";
  if (/(vegan|vegetari)/i.test(s)) return "veggie";
  if (/(viet|vietnam)/i.test(s)) return "vietnam";
  if (/(česk|cesk|czech cuisine|local food)/i.test(s)) return "czech";
  if (/\b(bar|pub|drink|pivo)\b/i.test(s)) return "bar";
  if (/exchange|směn|smen/i.test(s)) return "exchange";
  if (/\batm\b|bankomat/i.test(s)) return "atm";
  return null;
}

function detectIntent(text) {
  const t = (text || "").toLowerCase();

  // tech
  if (/\b(wi[-\s]?fi|wifi|internet|heslo|password|ssid)\b/i.test(t)) return "wifi";
  if (/\b(?:a\.?c\.?|ac)\b|klimatizace|klima|air ?conditioning/i.test(t)) return "ac";
  if (/(elektrin|elektrik|electric|electricity|jistič|jistice|proud|svetl|nesviti|no lights|power|fuse|breaker)/i.test(t)) return "power";

  // house rules / amenities
  if (/(invalid|wheelchair|bezbar(i|í|í)?er|bez\s?bari|schod|bezbariér|bezbariérov|bezbarierov)/i.test(t)) return "access";
  if (/(kouř|kour|kouřit|smok)/i.test(t)) return "smoking";
  if (/\b(pes|psi|dog|mazl(í|i)č|pets?)\b/i.test(t)) return "pets";
  if (/(prádeln|pradel|laund)/i.test(t)) return "laundry";
  if (/(úschovn|uschovn|batožin|batozin|zavazadel|luggage)/i.test(t)) return "luggage";

  // keys
  if (/\b(náhradn[íy]|spare\s+key)\b/i.test(t)) return "keys";
  if (/(kl[ií]č|klic|key).{0,30}(apartm|pokoj|room)/i.test(t)) return "keys";

  // utility
  if (/popelnic|odpad|trash|bin/i.test(t)) return "trash";
  if (/(brán|branu|gate|vstup)/i.test(t)) return "gate";
  if (/(zvonk|bell|doorbell)/i.test(t)) return "doorbells";
  if (/(výtah|vytah|elevator).*(telefon|phone|servis|service|porucha)?/i.test(t)) return "elevator_phone";
  if (/(požár|pozar|fire).*(alarm|hlasič|hlasics)/i.test(t)) return "fire_alarm";
  if (/(povlečen|povleceni|ručník|rucnik|hand ?towel|linen)/i.test(t)) return "linen_towels";
  if (/(doktor|lékař|lekar|doctor|medical|24)/i.test(t)) return "doctor";
  if (/(kávovar|kavovar|tchibo|coffee machine)/i.test(t)) return "coffee";
  if (/(tepl[áa] voda|hot water)/i.test(t)) return "hot_water";
  if (/(indukc|varn[aá] deska|cooktop|hob)/i.test(t)) return "induction";
  if (/(digesto[rř]|odsava[cč]|hood)/i.test(t)) return "hood";
  if (/(trezor|safe)/i.test(t)) return "safe";

  // local → curated only
  if (/(restaurac|snídan|snidan|breakfast|restaurant|grocer|potravin|pharm|lékárn|lekarn|shop|store|\bbar\b|kavárn|kavarn|vegan|vegetari|czech|cesk|bistro|exchange|směn|smen|\batm\b|bankomat)/i.test(t)) {
    return "local";
  }

  return "general";
}

/** ====== Pomocný sloučený výpis pro „dining“ ====== */
function buildMergedCuratedList(keys = [], { max = 12, labelOpen = "Otevřít" } = {}) {
  const seen = new Set();
  const items = [];
  keys.forEach(k => {
    (PLACES[k] || []).forEach(p => {
      if (!seen.has(p.name)) {
        seen.add(p.name);
        items.push(p);
      }
    });
  });
  const list = items.slice(0, max);
  if (!list.length) return null;
  return list.map(p =>
    `- **${p.name}**${p.tags?.length ? ` — *${p.tags.join(", ")}*` : ""}\n  - [${labelOpen}](${p.url})`
  ).join("\n\n");
}

/** ====== MAIN ====== */
export default async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  if (!process.env.OPENAI_API_KEY) {
    return new Response(JSON.stringify({ reply: "⚠️ Server nemá nastavený OPENAI_API_KEY." }), {
      status: 500, headers: { "content-type": "application/json" }
    });
  }

  try {
    const body = await req.json();
    const { messages = [], uiLang = null, control = null } = body || {};
    const userText = lastUser(messages);

    // 0) Follow-up: číslo pokoje po „Náhradní klíč“
    const roomOnly = extractRoom(userText);
    if (roomOnly && historyContainsKeys(messages)) {
      return ok(await translateToUserLang(buildKeyHelp(roomOnly), userText, uiLang));
    }

    // 1) CONTROL – pevná tlačítka (bez modelu)
    if (control) {
      // a) Lokální curated seznamy
      if (control.intent === "local") {
        const sub = String(control.sub || "").toLowerCase();
        const labelMap = {
          cs:"Otevřít", en:"Open", de:"Öffnen", fr:"Ouvrir", es:"Abrir",
          ru:"Открыть", uk:"Відкрити", nl:"Openen", it:"Apri", da:"Åbn", pl:"Otwórz"
        };
        const valid = new Set(["dining","breakfast","cafe","bakery","veggie","czech","bar","vietnam","grocery","pharmacy","exchange","atm"]);
        if (!valid.has(sub)) {
          return ok(await translateToUserLang(HANDOFF_MSG, userText || sub, uiLang));
        }

        let curated;
        if (sub === "dining") {
          curated = buildMergedCuratedList(["breakfast","czech"], { max: 12, labelOpen: labelMap[uiLang || "cs"] || "Open" });
        } else {
          curated = buildCuratedList(sub, { max: 12, labelOpen: labelMap[uiLang || "cs"] || "Open" });
        }

        const reply = curated || HANDOFF_MSG;
        return ok(await translateToUserLang(reply, userText || sub, uiLang));
      }

      // b) Technické / interní – vracíme naše markdowny + fotky
      if (control.intent === "tech") {
        const sub = String(control.sub || "").toLowerCase();
        const map = {
          wifi: buildWifiTroubleshoot,
          power: buildPowerHelp,
          ac: buildACHelp,
          hot_water: buildHotWater,
          induction: buildInduction,
          hood: buildHood,
          coffee: buildCoffee,
          fire_alarm: buildFireAlarm,
          elevator_phone: buildElevatorPhone,
          luggage: buildLuggageInfo,
          keys: () => buildKeyHelp(control.room || null),
          gate: buildGate,
          doorbells: buildDoorbells,
          trash: buildTrash,
          laundry: buildLaundry,
          access: buildAccessibility,
          smoking: buildSmoking,
          pets: buildPets,
          linen_towels: buildLinenTowels,
          doctor: buildDoctor,
          safe: buildSafe,
          transport: buildTransport,        // NEW
          food_delivery: buildFoodDelivery, // NEW
        };
        const fn = map[sub];
        const text = fn ? fn() : HANDOFF_MSG;
        return ok(await translateToUserLang(text, userText || sub, uiLang));
      }
    }

    // 2) Handoff (parkování apod.)
    if (FORBIDDEN_PATTERNS.some(r => r.test(userText))) {
      return ok(await translateToUserLang(HANDOFF_MSG, userText, uiLang));
    }

    // 3) Intent z volného textu (fallback – když by přeci jen přišel text)
    const intent = detectIntent(userText);
    const wifiContext = historyContainsWifi(messages);

    if (intent === "wifi" || (wifiContext && (extractRoom(userText) || extractSSID(userText)))) {
      const room = extractRoom(userText);
      const ssid = extractSSID(userText);
      const entry = room ? wifiByRoom(room) : (ssid ? wifiBySsid(ssid) : null);

      if (entry) return ok(await translateToUserLang(buildWifiCreds(entry), userText, uiLang));
      const reply = recentlySentWifiTroubleshoot(messages)
        ? "Napište prosím **číslo apartmánu** nebo **SSID** (4 znaky) – pošlu heslo."
        : buildWifiTroubleshoot();
      return ok(await translateToUserLang(reply, userText, uiLang));
    }

    if (intent === "ac")               return ok(await translateToUserLang(buildACHelp(), userText, uiLang));
    if (intent === "power")            return ok(await translateToUserLang(buildPowerHelp(), userText, uiLang));
    if (intent === "access")           return ok(await translateToUserLang(buildAccessibility(), userText, uiLang));
    if (intent === "smoking")          return ok(await translateToUserLang(buildSmoking(), userText, uiLang));
    if (intent === "pets")             return ok(await translateToUserLang(buildPets(), userText, uiLang));
    if (intent === "laundry")          return ok(await translateToUserLang(buildLaundry(), userText, uiLang));
    if (intent === "luggage")          return ok(await translateToUserLang(buildLuggageInfo(), userText, uiLang));
    if (intent === "keys") {
      const room = extractRoom(userText);
      return ok(await translateToUserLang(buildKeyHelp(room), userText, uiLang));
    }
    if (intent === "trash")            return ok(await translateToUserLang(buildTrash(), userText, uiLang));
    if (intent === "gate")             return ok(await translateToUserLang(buildGate(), userText, uiLang));
    if (intent === "doorbells")        return ok(await translateToUserLang(buildDoorbells(), userText, uiLang));
    if (intent === "elevator_phone")   return ok(await translateToUserLang(buildElevatorPhone(), userText, uiLang));
    if (intent === "fire_alarm")       return ok(await translateToUserLang(buildFireAlarm(), userText, uiLang));
    if (intent === "linen_towels")     return ok(await translateToUserLang(buildLinenTowels(), userText, uiLang));
    if (intent === "doctor")           return ok(await translateToUserLang(buildDoctor(), userText, uiLang));
    if (intent === "coffee")           return ok(await translateToUserLang(buildCoffee(), userText, uiLang));
    if (intent === "hot_water")        return ok(await translateToUserLang(buildHotWater(), userText, uiLang));
    if (intent === "induction")        return ok(await translateToUserLang(buildInduction(), userText, uiLang));
    if (intent === "hood")             return ok(await translateToUserLang(buildHood(), userText, uiLang));
    if (intent === "safe")             return ok(await translateToUserLang(buildSafe(), userText, uiLang));

    if (intent === "local") {
      let sub = detectLocalSubtype(userText);
      if (!sub) return ok(await translateToUserLang(HANDOFF_MSG, userText, uiLang));
      const labelMap = {
        cs:"Otevřít", en:"Open", de:"Öffnen", fr:"Ouvrir", es:"Abrir",
        ru:"Открыть", uk:"Відкрити", nl:"Openen", it:"Apri", da:"Åbn", pl:"Otwórz"
      };
      const curated = buildCuratedList(sub, { max: 12, labelOpen: labelMap[uiLang || "cs"] || "Open" });
      const reply = curated || HANDOFF_MSG;
      return ok(await translateToUserLang(reply, userText, uiLang));
    }

    // 4) Obecné → model (zůstává jako nouzový fallback)
    const completion = await client.chat.completions.create({
      model: MODEL, temperature: 0.2,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "system", content: `Address: ${HOTEL.address}. Keep suggestions within ~${NEARBY_RADIUS}m.` },
        ...messages
      ]
    });
    const reply = completion.choices?.[0]?.message?.content?.trim() ?? "Rozumím.";
    return ok(reply);

  } catch (e) {
    console.error(e);
    return ok("Omlouvám se, nastala chyba. Zkuste to prosím znovu.");
  }

  function ok(reply) {
    return new Response(JSON.stringify({ reply }), {
      status: 200, headers: { "content-type": "application/json" }
    });
  }
};
