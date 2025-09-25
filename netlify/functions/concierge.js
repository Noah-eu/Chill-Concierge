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
const NEARBY_RADIUS = 200; // max 200 m – požadavek

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

/** ====== PROMPT ====== */
const SYSTEM_PROMPT = `You are a helpful hotel concierge for CHILL Apartments.
- Always reply in the user's language (mirror the last user message).
- Location: ${HOTEL.address}. Keep suggestions very close (≤ ${NEARBY_RADIUS} m).
- Do NOT handle parking, reservation changes, check-in/out, room numbers assignment, prices for rooms, or payment for accommodation.
- If user asks about those, reply exactly:
"Tyto informace zde nevyřizuji. Napište prosím do hlavního chatu pro ubytování/parkování. Rád pomohu s ostatním (restaurace, doprava, doporučení v okolí, technické potíže mimo kódy, faktury, potvrzení o pobytu, ztráty a nálezy, hluční sousedé)."
- Otherwise be concise (~4 sentences), friendly, and practical.`;

const FORBIDDEN_PATTERNS = [
  /parkován(í|i)|parking/i,
  /check[-\s]?in|self\s?check[-\s]?in|check[-\s]?out|late check[-\s]?out/i,
  /ubytován(í|i)|rezervac(e|i|í)/i,
  /(cena|price).*(pokoj|room)|platba za (ubytování|pokoj)/i
];

/** ====== UTIL ====== */
const lastUser = (messages=[]) => [...messages].reverse().find(m=>m.role==="user")?.content || "";
const lastAssistant = (messages=[]) => [...messages].reverse().find(m=>m.role==="assistant")?.content || "";
const extractRoom = (text) => (text||"").match(/\b(00[1]|10[1-5]|20[1-5]|30[1-5])\b/)?.[1] || null;
const extractSSID = (text) => (text||"").match(/\b([A-Z0-9]{4})\b/)?.[1] || null;

function historyContainsWifi(messages = []) {
  const look = messages.slice(-6).map(m => (m.content || "").toLowerCase()).join(" ");
  return /(wi[-\s]?fi|wifi|ssid|router|heslo|password)/i.test(look);
}
function recentlySentWifiTroubleshoot(messages = []) {
  return /Pokud Wi-?Fi nefunguje:/i.test(lastAssistant(messages) || "");
}
function recentlySentGenericLocal(messages = []) {
  const a = lastAssistant(messages) || "";
  return /Sokolská 1614\/64/.test(a) && /do 200 m/.test(a);
}

function guessLang(userText = "") {
  const t = userText.trim();
  const hasCz = /[ěščřžýáíéúůňťď]/i.test(t);
  const isLikelyEn = !/[^\x00-\x7F]/.test(t) && /\b(i|you|we|the|and|or|have|need|wifi|problem|please|where|not|no)\b/i.test(t);
  if (hasCz) return "cs";
  if (isLikelyEn) return "en";
  return null;
}
async function translateToUserLang(text, userText) {
  const hint = guessLang(userText);
  let completion = await client.chat.completions.create({
    model: MODEL, temperature: 0.0,
    messages: [
      { role: "system", content: `Rewrite ASSISTANT_MESSAGE in the language used in USER_MESSAGE. Keep meaning, tone, formatting and emojis. Be concise.${hint ? ` TARGET_LANG=${hint}.` : ""}` },
      { role: "user", content: "USER_MESSAGE:\n" + (userText || "") + "\n\nASSISTANT_MESSAGE:\n" + (text || "") }
    ]
  });
  let out = completion.choices?.[0]?.message?.content?.trim() || text;
  if (hint === "en" && /[ěščřžýáíéúůňťď]/i.test(out)) {
    completion = await client.chat.completions.create({
      model: MODEL, temperature: 0.0,
      messages: [
        { role: "system", content: "Translate ASSISTANT_MESSAGE to English. Keep formatting; be concise." },
        { role: "user", content: text || "" }
      ]
    });
    out = completion.choices?.[0]?.message?.content?.trim() || out;
  }
  return out;
}

/** ====== IMG PATHS ====== */
const IMG = (src, alt) => `![${alt}](${src})`;
const P = {
  AC: "/help/AC.jpg",
  BALCONY: "/help/balcony.jpg",
  FUSE_APT: "/help/fuse-box-apartment.jpg",
  FUSE_IN_APT: "/help/fuse-box-in-the-apartment.jpg",
  LAUNDRY: "/help/laundry-room.jpg",
  LUGGAGE: "/help/luggage-room.jpg",          // <— doplň tenhle soubor do /public/help/
  CHECKOUT_BOX: "/help/check-out-box.jpg"      // <— doplň tenhle soubor do /public/help/
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
    "Nejdříve **kontrola jističů v apartmánu**. Jsou to **malé bílé plastové dvířka ve zdi**.",
    IMG(P.FUSE_APT, "Hlavní jistič u balkonu – větší troj-jističe"),
    "Pak by to mohl být **hlavní jistič apartmánu**, který je **ve zdi za kovovými dveřmi hned vedle balkonu**. Jsou to **větší troj jističe**.",
    "Pokud bude problém tam, bude **jako jediný dole**, ostatní nahoře – zvedněte ho nahoru."
  ].join("\n");
}
const buildAccessibility = () => [
  "Do budovy vedou **dva schody**. Do apartmánu **001** je **jeden schod**.",
  "Jinak bez schodů a s **velkým výtahem**.",
  "Ve sprchách je cca **30 cm** vysoký okraj vaničky."
].join("\n");
const buildSmoking = () => [
  IMG(P.BALCONY, "Společný balkon pro kouření"),
  "Pro kouření využijte prosím **společné balkony** na každém patře naproti výtahu."
].join("\n");
const buildPets = () => "Psi jsou vítáni a **neplatí se** za ně poplatek. Prosíme, aby **nelezli na postele a gauče**.";
const buildLaundry = () => [
  IMG(P.LAUNDRY, "Prádelna v suterénu"),
  "Prádelna je v **suterénu**, otevřena **non-stop** a **zdarma**. K dispozici jsou prostředky i **žehlička** (lze vzít na pokoj)."
].join("\n");

/** ====== BAGÁŽOVNA + CHECK-OUT ====== */
function buildLuggageInfo() {
  return [
    "**Check-out je do 11:00** (přijíždějí noví hosté).",
    IMG(P.CHECKOUT_BOX, "Check-out box na klíče"),
    "Nejprve prosím **vhoďte klíče do check-out boxu**.",
    IMG(P.LUGGAGE, "Vstup do bagážovny"),
    `Potom můžete **po 11:00** uložit zavazadla v **bagážovně** – je v průjezdu **vedle schránky na klíče**.`,
    `**Kód je stejný jako pro bránu: ${LUGGAGE_ROOM_CODE}**. Po uložení prosím **zkontrolujte, že jsou dveře zavřené**.`
  ].join("\n");
}

/** ====== LOKÁLNÍ DOPORUČENÍ (real-time do 200 m) ====== */
async function geocodeHotel() {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(HOTEL.address)}`;
  const r = await fetch(url, { headers: { "User-Agent": "ChillConcierge/1.0" }});
  const j = await r.json();
  const p = j?.[0];
  if (!p) throw new Error("Geocoding failed");
  return { lat: parseFloat(p.lat), lon: parseFloat(p.lon) };
}
async function overpassPlaces(lat, lon, radius, kinds) {
  const nodes = kinds.map(k => `node(around:${radius},${lat},${lon})[amenity=${k}];`).join("\n");
  const query = `
[out:json][timeout:25];
(
${nodes}
);
out center 20;`;
  const r = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "text/plain", "User-Agent": "ChillConcierge/1.0" },
    body: query
  });
  const j = await r.json();
  return (j.elements || [])
    .filter(e => e.tags && e.tags.name)
    .map(e => ({
      name: e.tags.name,
      lat: e.lat ?? e.center?.lat,
      lon: e.lon ?? e.center?.lon,
      street: e.tags["addr:street"],
      housenumber: e.tags["addr:housenumber"],
      cuisine: e.tags.cuisine,
      amenity: e.tags.amenity
    }))
    .filter(p => p.lat && p.lon);
}
function placesToMarkdown(places, limit = 5) {
  const items = places.slice(0, limit).map(p => {
    const q = encodeURIComponent(`${p.name} ${p.street ?? ""} ${p.housenumber ?? ""} Prague`);
    const gmaps = `https://www.google.com/maps/search/?api=1&query=${q}`;
    const osm   = `https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lon}#map=19/${p.lat}/${p.lon}`;
    const extra = p.cuisine ? ` — *${String(p.cuisine).replace(/_/g," ")}*` : "";
    return `- **${p.name}**${extra}\n  - [Google Maps](${gmaps}) · [OpenStreetMap](${osm})`;
  });
  return items.length ? items.join("\n") : "Do **200 m** teď nic vhodného nevidím. Napište typ kuchyně/čas – zkusím širší okruh.";
}
async function findNearbyBreakfastList() {
  const { lat, lon } = await geocodeHotel();
  const kinds = ["cafe","restaurant","bakery","fast_food"];
  const places = await overpassPlaces(lat, lon, NEARBY_RADIUS, kinds);
  return placesToMarkdown(places);
}

/** ====== LOKÁLNÍ LOGIKA ====== */
function detectLocalSubtype(t) {
  if (/(snídan|breakfast)/i.test(t)) return "breakfast";
  if (/(lékárn|lekarn|pharm)/i.test(t)) return "pharmacy";
  if (/(supermarket|potravin|grocery|market)/i.test(t)) return "grocery";
  if (/(kavárn|kavarn|cafe|coffee)/i.test(t)) return "cafe";
  if (/(bar|drink|pub)/i.test(t)) return "bar";
  if (/(česk|czech cuisine|local food)/i.test(t)) return "czech";
  if (/(vegetari|vegan)/i.test(t)) return "veggie";
  return null;
}
function wantsSitHotBreakfast(t) {
  return /(posadit|sednout|sit\s?down)/i.test(t) && /(tepl|hot|ham|hamenex|eggs|omelet(te)?)/i.test(t);
}
function buildLocalGeneric() {
  return [
    `Jsme na **${HOTEL.address}**.`,
    `Držím se **do ${NEARBY_RADIUS} m** (cca 3–5 min). Napište prosím přesně, co hledáte (snídaně, česká kuchyně, vegetarián, supermarket, lékárna, bar) + čas a rozpočet – upřesním.`
  ].join("\n");
}
const Local = {
  breakfast: () => "Pošlu **nejbližší místa na snídani do 200 m** s odkazy:",
  pharmacy:  () => "Najdu **lékárny do 200 m** a pošlu odkazy.",
  grocery:   () => "Pošlu **potraviny/supermarkety do 200 m** s odkazy.",
  cafe:      () => "Pošlu **kavárny do 200 m** s odkazy.",
  bar:       () => "Pošlu **bary do 200 m** s odkazy.",
  czech:     () => "Pošlu **české podniky do 200 m** s odkazy.",
  veggie:    () => "Pošlu **veg/vegan místa do 200 m** s odkazy."
};

/** Intent routing */
function detectIntent(text) {
  const t = (text || "").toLowerCase();
  if (/(wi[-\s]?fi|wifi|internet|heslo|password|ssid)/i.test(t)) return "wifi";
  if (/(ac|klimatizace|klima|air ?conditioning)/i.test(t)) return "ac";
  if (/(elektrin|elektrik|electric|electricity|jistič|jistice|proud|svetl|nesviti|nesvítí|no lights|power|fuse|breaker)/i.test(t)) return "power";
  if (/(invalid|wheelchair|bezbarier|schod)/i.test(t)) return "access";
  if (/(kouř|kouřit|smok)/i.test(t)) return "smoking";
  if (/(pes|psi|dog)/i.test(t)) return "pets";
  if (/(prádeln|laund)/i.test(t)) return "laundry";
  if (/(bagážovn|bagazovn|luggage|úschov)/i.test(t)) return "luggage";
  if (/(klíč|klic|key|zapomněl|ztratil|lost|forgot).*apartm|key ?box/i.test(t)) return "keys";
  if (/(restaurac|snídan|breakfast|restaurant|grocer|potravin|pharm|lékárn|lekarn|shop|store|bar|kavárn|kavarn|vegan|vegetari|czech)/i.test(t)) return "local";
  return "general";
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

    // Handoff
    if (FORBIDDEN_PATTERNS.some(r => r.test(userText))) {
      return ok(await translateToUserLang(
        "Tyto informace zde nevyřizuji. Napište prosím do hlavního chatu pro ubytování/parkování. Rád pomohu se vším ostatním (doporučení v okolí, doprava, technické potíže, potvrzení o pobytu, faktury, ztráty/nálezy, stížnosti).",
        userText
      ));
    }

    // Intent
    const intent = detectIntent(userText);
    const wifiContext = historyContainsWifi(messages);

    // Wi-Fi
    if (intent === "wifi" || (wifiContext && (extractRoom(userText) || extractSSID(userText)))) {
      const room = extractRoom(userText);
      const ssid = extractSSID(userText);
      const entry = room ? wifiByRoom(room) : (ssid ? wifiBySsid(ssid) : null);

      if (entry) {
        const creds = buildWifiCreds(entry);
        return ok(await translateToUserLang(creds, userText));
      }
      const reply = recentlySentWifiTroubleshoot(messages)
        ? "Napište prosím **číslo apartmánu** nebo **SSID** (4 znaky) – pošlu heslo."
        : buildWifiTroubleshoot();
      return ok(await translateToUserLang(reply, userText));
    }

    // Quick-help
    if (intent === "ac")      return ok(await translateToUserLang(buildACHelp(), userText));
    if (intent === "power")   return ok(await translateToUserLang(buildPowerHelp(), userText));
    if (intent === "access")  return ok(await translateToUserLang(buildAccessibility(), userText));
    if (intent === "smoking") return ok(await translateToUserLang(buildSmoking(), userText));
    if (intent === "pets")    return ok(await translateToUserLang(buildPets(), userText));
    if (intent === "laundry") return ok(await translateToUserLang(buildLaundry(), userText));
    if (intent === "luggage") return ok(await translateToUserLang(buildLuggageInfo(), userText));
    if (intent === "keys") {
      const room = extractRoom(userText);
      return ok(await translateToUserLang(buildKeyHelp(room), userText));
    }

    // Lokální → snídaně: vždy reálný list (do 200 m) + odkazy
    if (intent === "local") {
      const sub = detectLocalSubtype(userText);
      if (sub === "breakfast") {
        try {
          const list = await findNearbyBreakfastList();
          return ok(await translateToUserLang(list, userText));
        } catch {
          // nouzový fallback
          const msg = "Pošlu **nejbližší místa na snídani do 200 m**, ale teď se mi nedaří načíst mapová data. Zkuste to prosím znovu za chvíli nebo napište typ (kavárna/pekárna) a čas.";
          return ok(await translateToUserLang(msg, userText));
        }
      }
      // ostatní lokální typy – krátké intro; na požádání lze snadno doplnit i realtime listy stejně jako snídani
      const msg = sub
        ? Local[sub]()
        : recentlySentGenericLocal(messages)
          ? `Abych doporučil konkrétně **do ${NEARBY_RADIUS} m**: hledáte **snídani**, **lékárnu**, **supermarket**, **kavárnu**, **bar**, **českou kuchyni** nebo **vegetarián/vegan**? Napište i **čas** a **rozpočet**.`
          : buildLocalGeneric();
      return ok(await translateToUserLang(msg, userText));
    }

    // Obecné → model
    const completion = await client.chat.completions.create({
      model: MODEL, temperature: 0.3,
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
