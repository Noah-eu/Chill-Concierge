// netlify/functions/concierge.js
import OpenAI from "openai";
import { buildCuratedList } from "./data/places.js";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL  = process.env.OPENAI_MODEL || "gpt-4o-mini";

/** ====== LOKÁLNÍ NASTAVENÍ ====== */
const HOTEL = { address: "Sokolská 1614/64, Praha 2, 120 00" };
const NEARBY_RADIUS = 200;

/** ====== DATA ====== */
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
  "001": "3301", "101": "3302", "102": "3303", "103": "3304", "104": "3305", "105": "3306",
  "201": "3307", "202": "3308", "203": "3309", "204": "3310", "205": "3311",
  "301": "3312", "302": "3313", "303": "3314", "304": "3315", "305": "3316",
};

/** ====== BLOKACE (hand-off témat) ====== */
const FORBIDDEN_PATTERNS = [
  /parkován(í|i)|parking/i,
  /check[-\s]?in|self\s?check[-\s]?in|check[-\s]?out|late check[-\s]?out/i,
  /ubytován(í|i)|rezervac(e|i|í)/i,
  /(cena|price).*(pokoj|room)|platba za (ubytování|pokoj)/i,
];

/** ====== POMOCNÉ ====== */
const lastUser = (messages=[]) => [...messages].reverse().find(m=>m.role==="user")?.content || "";
const extractRoom = (text) => (text||"").match(/\b(00[1]|10[1-5]|20[1-5]|30[1-5])\b/)?.[1] || null;
const extractSSID = (text) => (text||"").match(/\b([A-Z0-9]{4})\b/)?.[1] || null;

function guessLang(t="") {
  t = (t||"").toLowerCase();
  if (/[ěščřžýáíéúůňťď]/.test(t)) return "cs";
  if (/\bhello|thanks|please|where|wifi|password\b/.test(t)) return "en";
  if (/[áéíóúñ¿¡]/.test(t) || /\bhola|gracias|dónde\b/.test(t)) return "es";
  if (/[àâçéèêëîïôùûüÿœ]/.test(t) || /\bbonjour|merci|où\b/.test(t)) return "fr";
  if (/[äöüß]/.test(t) || /\bhallo|danke|bitte\b/.test(t)) return "de";
  return "cs";
}
async function translateToUserLang(text, userText) {
  const lang = guessLang(userText);
  if (lang === "cs") return text; // české odpovědi nech v češtině
  try {
    const c = await client.chat.completions.create({
      model: MODEL, temperature: 0,
      messages: [
        { role: "system", content: `Translate ASSISTANT_MESSAGE into ${lang}, keep meaning, tone and formatting.` },
        { role: "user", content: `USER_MESSAGE:\n${userText}\n\nASSISTANT_MESSAGE:\n${text}` }
      ]
    });
    return c.choices?.[0]?.message?.content?.trim() || text;
  } catch {
    return text;
  }
}

/** ====== OBRÁZKY ====== */
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
  GATE_SWITCH: "/help/inside-gate-switch.jpg", // POZOR: název "switch"
  DOOR_BELLS: "/help/door-bells.jpg",
};

/** ====== TEXTY (pevné, bez modelu) ====== */
// Wi-Fi
const wifiByRoom = (room) => WIFI.find(w => w.room === room) || null;
const wifiBySsid  = (ssid) => WIFI.find(w => w.ssid === ssid) || null;
const buildWifiTroubleshoot = () => [
  "Pokud Wi-Fi nefunguje:",
  "1) Zkontrolujte kabely u routeru.",
  "2) Restartujte: vytáhněte napájení na 10 s, pak zapojte a vyčkejte 1–2 min.",
  "3) Pokud to nepomůže, napište, jakou **jinou Wi-Fi** vidíte – pošlu k ní heslo.",
  "👉 Pošlete **číslo apartmánu** nebo **SSID** (4 znaky) a pošlu přístup."
].join("\n");
const buildWifiCreds = (entry) => entry ? `**Wi-Fi:** SSID **${entry.ssid}**, heslo **${entry.pass}**.` : null;

// Technika / pravidla
const buildACHelp = () => [
  IMG(P.AC, "Režimy AC"),
  "U klimatizace zkontrolujte režim: ☀️ = topení, ❄️ = chlazení.",
  IMG(P.BALCONY, "AC vypínače – 2. patro / balkon"),
  "Pokud **zelená kontrolka bliká**, je potřeba restart: na **2. patře** na balkoně jsou **AC vypínače**. Vypněte svůj na ~30 s a pak zapněte."
].join("\n");

const buildPowerHelp = () => [
  "Pokud vypadne elektřina v apartmánu:",
  IMG(P.FUSE_IN_APT, "Jističe v apartmánu – malá bílá dvířka ve zdi"),
  "Nejdříve **zkontrolujte jističe v apartmánu**.",
  IMG(P.FUSE_APT, "Hlavní jistič u balkonu – větší troj-jističe"),
  "Může to být **hlavní jistič u balkonu** – pokud je **dole**, zvedněte ho nahoru."
].join("\n");

const buildHotWater = () =>
  "💧 **Nejde teplá voda**: prosím **počkejte až 20 minut**, než se v bojleru ohřeje nová. Pokud ani potom neteče, napište mi čas a apartmán.";

const buildInduction = () => [
  "🍳 **Indukce**:",
  "– „**L**“ = dětská pojistka → podržte **Child Lock** pár sekund, až zmizí.",
  "– „**F**“ = použijte **indukční nádobí** (magnetické dno, správný průměr).",
].join("\n");

const buildHood = () => "🔆 **Digestoř**: vysuňte ji dopředu; **tlačítka jsou vpravo** po vysunutí.";

const buildCoffee = () => [
  "☕ **Kávovar Tchibo**:",
  "– Nejčastěji je **plná nádoba na sedliny** → vyprázdnit.",
  "– Pokud nepomůže, **očistěte senzor nádoby** (uvnitř nad nádobou)."
].join("\n");

const buildFireAlarm = () => [
  "🔥 **Požární hlásič**:",
  "Pokud **nehoří** (jen se připálilo jídlo), na **přízemí za výtahem** je **dlouhá tyč**.",
  "Tou **zamáčkněte tlačítko uprostřed hlásiče** a vyvětrejte."
].join("\n");

const buildAccessibility = () => [
  "Do budovy vedou **dva schody**. Do apartmánu **001** je **jeden schod**.",
  "Jinak bez schodů a s **velkým výtahem**.",
  "Ve sprchách je cca **30 cm** vysoký okraj vaničky."
].join("\n");

const buildSmoking = () => [
  IMG(P.BALCONY, "Společný balkon pro kouření"),
  "Pro kouření využijte prosím **společné balkony** naproti výtahu.",
  "⚠️ **Neodklepávejte/neházejte** nedopalky z balkonu – používejte popelník."
].join("\n");

const buildPets = () => "🐾 Domácí mazlíčci / psi jsou **povoleni a zdarma**. Prosíme, aby **nelezli na postele a gauče**.";

const buildLaundry = () => [
  IMG(P.LAUNDRY, "Prádelna v suterénu"),
  "Prádelna je v **suterénu**, **non-stop** a **zdarma**. Prostředky i **žehlička** k dispozici."
].join("\n");

// Úschovna + náhradní klíč
const buildLuggageInfo = () => [
  "**Check-out do 11:00.**",
  IMG(P.CHECKOUT_BOX, "Check-out box na klíče"),
  "Nejprve prosím **vhoďte klíče do check-out boxu**.",
  IMG(P.LUGGAGE, "Vstup do úschovny zavazadel"),
  `Poté můžete **po 11:00** uložit zavazadla v **úschovně** v průjezdu (vedle boxu na klíče).`,
  `**Kód stejný jako brána: ${LUGGAGE_ROOM_CODE}**. Po uložení zavřete dveře.`
].join("\n");

const buildKeyHelp = (room) => {
  if (!room) {
    return [
      IMG(P.LUGGAGE, "Vstup do úschovny"),
      `Zapomenutý klíč:`,
      `1) Do **úschovny** vstupte kódem **${LUGGAGE_ROOM_CODE}**.`,
      `2) Napište mi prosím **číslo apartmánu** – pošlu kód k příslušnému boxu.`,
      `3) Po použití klíč **vrátit** a **zamíchat číselník**.`
    ].join("\n");
  }
  const code = KEYBOX[room];
  if (!code) return "Napište prosím platné číslo apartmánu (např. 001, 101, … 305).";
  return [
    IMG(P.SPARE_KEY, "Náhradní klíč – box s klíčem"),
    `Náhradní klíč k **${room}**:`,
    `1) Do **úschovny** vstupte kódem **${LUGGAGE_ROOM_CODE}**.`,
    `2) Otevřete box **${room}** – kód **${code}**.`,
    `3) Klíč po použití **vrátit** a číselník **zamíchat**.`
  ].join("\n");
};

// Další utility
const buildTrash = () => [
  IMG(P.GARBAGE, "Popelnice na dvoře"),
  "🗑️ **Popelnice** jsou **venku na dvoře**.",
  "Až vyndáte **plný pytel** z koše, **nový pytel** je **pod ním**."
].join("\n");

const buildGate = () => [
  IMG(P.GATE_SWITCH, "Tlačítko pro otevření brány zevnitř"),
  "🚪 **Brána**:",
  "– **Zevnitř**: tlačítkem v průchodu **hned vedle key-boxu**.",
  `– **Z ulice**: kód **${LUGGAGE_ROOM_CODE}** (stejný jako k úschovně).`
].join("\n");

const buildDoorbells = () => [
  IMG(P.DOOR_BELLS, "Domovní zvonky na začátku průchodu"),
  "🔔 **Zvonky na apartmány** jsou **na začátku průchodu z ulice**."
].join("\n");

const buildElevatorPhone = () => "🛗 **Výtah – servis/porucha**: volejte **+420 775 784 446** (Sokolská 64, Praha 2).";

const buildLinenTowels = () => [
  "🧺 **Povlečení / ručníky**:",
  "Na **každém patře** je **skříň**. Otevřete ji kódem **526** a vezměte jen potřebné množství."
].join("\n");

const buildDoctor = () => "👩‍⚕️ **Lékař 24/7**: **+420 603 433 833**, **+420 603 481 361** (uveďte adresu a apartmán).";

const buildSafe = () => [
  "🔐 **Trezor**:",
  "– Je-li zamčený a nevíte kód, kontaktujte prosím **Davida** (WhatsApp +420 733 439 733).",
  "– Pro nastavení: uvnitř dveří stiskněte **červené tlačítko**, zadejte kód (≥3 číslice), stiskněte **tlačítko zámku**, zavřete dveře."
].join("\n");

/** ====== INTENTY ====== */
function detectLocalSubtype(t="") {
  const s = t.toLowerCase();
  if (/(snídan|breakfast)/i.test(s)) return "breakfast";
  if (/(vegan|vegetari|veggie)/i.test(s)) return "veggie";
  if (/(česk|czech cuisine|local food)/i.test(s)) return "czech";
  if (/(supermarket|potravin|grocery|market)/i.test(s)) return "grocery";
  if (/(kavárn|kavarn|cafe|coffee)/i.test(s)) return "cafe";
  if (/(bakery|pekárn|pekarn)/i.test(s)) return "bakery";
  if (/(viet|vietnam)/i.test(s)) return "vietnam";
  if (/\b(bar|pub|drink)\b/i.test(s)) return "bar";
  if (/exchange|směn|smen/i.test(s)) return "exchange";
  if (/\batm\b|bankomat/i.test(s)) return "atm";
  if (/(pharm|lékar|lekarn)/i.test(s)) return "pharmacy";
  return null;
}

function detectIntent(t="") {
  const s = t.toLowerCase();

  // tech
  if (/\b(wi[-\s]?fi|wifi|internet|heslo|password|ssid)\b/i.test(s)) return "wifi";
  if (/\b(?:a\.?c\.?|ac)\b|klimatizace|klima|air ?conditioning/i.test(s)) return "ac";
  if (/(elektrin|elektrik|electric|electricity|jistič|jistice|proud|svetl|nesviti|no lights|power|fuse|breaker)/i.test(s)) return "power";
  if (/(tepl[áa]\s*voda|hot water)/i.test(s)) return "hot_water";
  if (/(indukc|varn[aá]\s*deska|cooktop|hob)/i.test(s)) return "induction";
  if (/(digesto[rř]|odsava[cč]|hood)/i.test(s)) return "hood";
  if (/(kávovar|kavovar|tchibo|coffee machine)/i.test(s)) return "coffee";
  if (/(požár|pozar|fire).*(alarm|hlasič|hlasics)/i.test(s)) return "fire_alarm";

  // house rules / amenities
  if (/(invalid|wheelchair|bezbar|schod)/i.test(s)) return "access";
  if (/(kouř|kour|kouřit|smok)/i.test(s)) return "smoking";
  if (/\b(pes|psi|dog|mazl[íi]č|pet)s?\b/i.test(s)) return "pets";
  if (/(prádeln|pradel|laund)/i.test(s)) return "laundry";
  if (/(úschovn|uschovn|batožin|batozin|luggage)/i.test(s)) return "luggage";
  if (/(klíč|klic|spare key|key).*(apartm|room)|\bnáhradn/i.test(s)) return "keys";

  // local
  if (/(restaurac|snídan|breakfast|restaurant|grocer|potravin|pharm|lékárn|lekarn|shop|store|\bbar\b|kavárn|kavarn|vegan|vegetari|czech|bistro|exchange|směn|smen|\batm\b|bankomat)/i.test(s)) {
    return "local";
  }

  // parkování / rezervace apod. se řeší až v mainu přes FORBIDDEN_PATTERNS
  return "general";
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
    const { messages = [] } = await req.json();
    const userText = lastUser(messages);

    // Hand-off (parkování, check-in/out, ceny…)
    if (FORBIDDEN_PATTERNS.some(r => r.test(userText))) {
      return ok(await translateToUserLang(
        'Tyto informace zde nevyřizuji. Napište prosím do hlavního chatu pro ubytování/parkování. Rád pomohu se vším ostatním (doporučení v okolí, doprava, technické potíže, potvrzení o pobytu, faktury, ztráty/nálezy, stížnosti).',
        userText
      ));
    }

    // Intent router (pevné odpovědi – žádný model)
    const intent = detectIntent(userText);

    // Wi-Fi
    if (intent === "wifi") {
      const room = extractRoom(userText);
      const ssid = extractSSID(userText);
      const entry = room ? wifiByRoom(room) : (ssid ? wifiBySsid(ssid) : null);
      if (entry) return ok(await translateToUserLang(buildWifiCreds(entry), userText));
      return ok(await translateToUserLang(buildWifiTroubleshoot(), userText));
    }

    // Technické / pravidla / utility
    if (intent === "power")         return ok(await translateToUserLang(buildPowerHelp(), userText));
    if (intent === "hot_water")     return ok(await translateToUserLang(buildHotWater(), userText));
    if (intent === "ac")            return ok(await translateToUserLang(buildACHelp(), userText));
    if (intent === "induction")     return ok(await translateToUserLang(buildInduction(), userText));
    if (intent === "hood")          return ok(await translateToUserLang(buildHood(), userText));
    if (intent === "coffee")        return ok(await translateToUserLang(buildCoffee(), userText));
    if (intent === "fire_alarm")    return ok(await translateToUserLang(buildFireAlarm(), userText));
    if (intent === "access")        return ok(await translateToUserLang(buildAccessibility(), userText));
    if (intent === "smoking")       return ok(await translateToUserLang(buildSmoking(), userText));
    if (intent === "pets")          return ok(await translateToUserLang(buildPets(), userText));
    if (intent === "laundry")       return ok(await translateToUserLang(buildLaundry(), userText));
    if (intent === "luggage")       return ok(await translateToUserLang(buildLuggageInfo(), userText));
    if (intent === "keys")          return ok(await translateToUserLang(buildKeyHelp(extractRoom(userText)), userText));
    if (intent === "trash")         return ok(await translateToUserLang(buildTrash(), userText));
    if (intent === "gate")          return ok(await translateToUserLang(buildGate(), userText));
    if (intent === "doorbells")     return ok(await translateToUserLang(buildDoorbells(), userText));
    if (intent === "elevator_phone")return ok(await translateToUserLang(buildElevatorPhone(), userText));
    if (intent === "linen_towels")  return ok(await translateToUserLang(buildLinenTowels(), userText));
    if (intent === "doctor")        return ok(await translateToUserLang(buildDoctor(), userText));
    if (intent === "safe")          return ok(await translateToUserLang(buildSafe(), userText));

    // Lokální doporučení → výhradně curated seznamy
    if (intent === "local") {
      const sub = detectLocalSubtype(userText);
      if (sub) {
        const lang = guessLang(userText);
        const labelMap = { cs: "Otevřít", en: "Open", de: "Öffnen", fr: "Ouvrir", es: "Abrir" };
        const out = buildCuratedList(sub, { max: 12, labelOpen: labelMap[lang] || "Open" });
        if (out) return ok(await translateToUserLang(out, userText));
        return ok(await translateToUserLang("Pro tuto kategorii teď nemám připravený seznam. Napište prosím jiný typ.", userText));
      }
      const ask = [
        `Jsme na **${HOTEL.address}** (držím se do ~${NEARBY_RADIUS} m).`,
        "Napište prosím typ: **snídaně / vegan / česká / supermarket / kavárna / pekárna / bar / směnárna / ATM / lékárna** – pošlu odkazy."
      ].join("\n");
      return ok(await translateToUserLang(ask, userText));
    }

    // Ostatní → krátká odpověď modelem (ale s tvrdým systém promtem)
    const completion = await client.chat.completions.create({
      model: MODEL, temperature: 0.2,
      messages: [
        { role: "system", content: `You are a helpful hotel concierge for CHILL Apartments.\nAlways mirror the user's language.\nLocation: ${HOTEL.address}.\nDo not handle parking/reservations/check-in/out/room assignment/prices/payments. If asked, reply exactly:\n"Tyto informace zde nevyřizuji. Napište prosím do hlavního chatu pro ubytování/parkování. Rád pomohu s ostatním."\nBe concise and practical.` },
        { role: "system", content: `Never invent local venues. If the user asks for venues, respond with a generic ask-for-category message; actual lists are served by curated data only.` },
        ...messages
      ]
    });
    const reply = completion.choices?.[0]?.message?.content?.trim() || "Rozumím.";
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
