// netlify/functions/concierge.js
import OpenAI from "openai";
import { buildCuratedList } from "./data/places.js";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL  = process.env.OPENAI_MODEL || "gpt-4o-mini";

/** ====== LOKÁLNÍ DATA ====== */
const HOTEL = {
  address: "Sokolská 1614/64, Praha 2, 120 00",
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

/** ====== PROMPT ====== */
const SYSTEM_PROMPT = `You are a helpful hotel concierge for CHILL Apartments.
- Always reply in the user's language (mirror the last user message).
- Location: ${HOTEL.address}.
- Do NOT handle parking, reservations, check-in/out, room assignment, prices, or accommodation payments.
- If user asks about those, reply exactly:
"Tyto informace zde nevyřizuji. Napište prosím do hlavního chatu pro ubytování/parkování. Rád pomohu s ostatním."
- Otherwise be concise, friendly, and practical.`;

/** ====== UTIL ====== */
const lastUser = (messages=[]) => [...messages].reverse().find(m=>m.role==="user")?.content || "";
const extractRoom = (text) => (text||"").match(/\b(00[1]|10[1-5]|20[1-5]|30[1-5])\b/)?.[1] || null;

function guessLang(t=""){ 
  t=t.toLowerCase();
  if (/[ěščřžýáíéúůňťď]/.test(t)) return "cs";
  if (/\bhello|thanks|please\b/.test(t)) return "en";
  if (/\bhola|gracias|dónde\b/.test(t)) return "es";
  if (/\bbonjour|merci|où\b/.test(t)) return "fr";
  if (/\bwie|danke|hallo\b/.test(t)) return "de";
  return "cs";
}
async function translateToUserLang(text, userText) {
  const hint = guessLang(userText);
  if (hint==="cs") return text;
  const c = await client.chat.completions.create({
    model: MODEL, temperature:0,
    messages:[
      {role:"system",content:`Translate ASSISTANT_MESSAGE into ${hint}, keep meaning/formatting.`},
      {role:"user",content:`USER_MESSAGE:\n${userText}\n\nASSISTANT_MESSAGE:\n${text}`}
    ]
  });
  return c.choices?.[0]?.message?.content?.trim() || text;
}

/** ====== IMG PATHS ====== */
const IMG=(src,alt)=>`![${alt}](${src})`;
const P={
  AC:"/help/AC.jpg",
  BALCONY:"/help/balcony.jpg",
  FUSE_APT:"/help/fuse-box-apartment.jpg",
  FUSE_IN_APT:"/help/fuse-box-in-the-apartment.jpg",
  LAUNDRY:"/help/laundry-room.jpg",
  LUGGAGE:"/help/luggage-room.jpg",
  CHECKOUT_BOX:"/help/check-out-box.jpg",
  SPARE_KEY:"/help/spare-key.jpg",
  GARBAGE:"/help/garbage.jpg",
  GATE_SWITCH:"/help/inside-gate-switch.jpg",
  DOOR_BELLS:"/help/door-bells.jpg",
};

/** ====== QUICK HELP ====== */
const buildPowerHelp=()=>[
  "Pokud vypadne elektřina v apartmánu:",
  IMG(P.FUSE_IN_APT,"Jističe v apartmánu"),
  "Zkontrolujte jističe v apartmánu.",
  IMG(P.FUSE_APT,"Hlavní jistič u balkonu"),
  "Pokud je páčka dole, zvedněte ji nahoru."
].join("\n");

const buildElevatorPhone=()=> "🛗 **Výtah – servis/porucha**: volejte +420 775 784 446 (Sokolská 64).";

const buildLuggageInfo=()=>[
  "**Check-out do 11:00.**",
  IMG(P.CHECKOUT_BOX,"Check-out box"),
  "Nejprve vhoďte klíče do boxu.",
  IMG(P.LUGGAGE,"Úschovna batožiny"),
  `Po 11:00 můžete uložit zavazadla do úschovny. Kód: **${LUGGAGE_ROOM_CODE}**.`,
].join("\n");

const buildKeyHelp=(room)=>{
  if(!room) return "Napište prosím číslo apartmánu (např. 101) – pošlu kód.";
  const code=KEYBOX[room];
  return [
    IMG(P.SPARE_KEY,"Náhradní klíč"),
    `Apartmán ${room}: box s kódem **${code}**.`
  ].join("\n");
};

const buildPets=()=> "🐾 Domácí mazlíčci jsou **povoleni a zdarma**. Jen prosíme, aby **neskáklali na postele/gauče**.";
const buildTrash=()=>[
  IMG(P.GARBAGE,"Popelnice"),
  "🗑️ Popelnice jsou venku na dvoře."
].join("\n");
const buildGate=()=>[
  IMG(P.GATE_SWITCH,"Vypínač brány"),
  `Z ulice: kód **${LUGGAGE_ROOM_CODE}**. Zevnitř: tlačítko vedle key-boxu.`
].join("\n");
const buildSafe=()=>[
  "🔐 **Trezor**:",
  "– Je-li zamčený a nevíte kód, kontaktujte **Davida** (+420 733 439 733).",
  "– Pro nastavení: červené tlačítko uvnitř dveří → kód ≥3 číslice → tlačítko zámku → zavřít."
].join("\n");

/** ====== INTENTY ====== */
function detectIntent(t){
  t=t.toLowerCase();
  if(/wifi|ssid|internet/.test(t)) return "wifi";
  if(/ac|klima/.test(t)) return "ac";
  if(/elektr/.test(t)) return "power";
  if(/výtah|elevator/.test(t)) return "elevator";
  if(/úschovn|luggage|batožin/.test(t)) return "luggage";
  if(/klíč|spare/.test(t)) return "keys";
  if(/pet|mazlíč/.test(t)) return "pets";
  if(/trash|odpad|popeln/.test(t)) return "trash";
  if(/gate|brán/.test(t)) return "gate";
  if(/trezor|safe/.test(t)) return "safe";
  if(/snídan|breakfast|vegan|česk|czech|supermarket|grocer|restaurant|atm|pharm|exchange|cafe|bakery|bar|viet/i.test(t))
    return "local";
  return "general";
}

/** ====== MAIN ====== */
export default async (req)=>{
  if(req.method!=="POST") return new Response("Method Not Allowed",{status:405});
  if(!process.env.OPENAI_API_KEY) return new Response(JSON.stringify({reply:"⚠️ Chybí OPENAI_API_KEY"}),{status:500});

  try{
    const {messages=[]}=await req.json();
    const userText=lastUser(messages);
    const intent=detectIntent(userText);
    const lang=guessLang(userText);

    if(intent==="power") return ok(await translateToUserLang(buildPowerHelp(),userText));
    if(intent==="elevator") return ok(await translateToUserLang(buildElevatorPhone(),userText));
    if(intent==="luggage") return ok(await translateToUserLang(buildLuggageInfo(),userText));
    if(intent==="keys") return ok(await translateToUserLang(buildKeyHelp(extractRoom(userText)),userText));
    if(intent==="pets") return ok(await translateToUserLang(buildPets(),userText));
    if(intent==="trash") return ok(await translateToUserLang(buildTrash(),userText));
    if(intent==="gate") return ok(await translateToUserLang(buildGate(),userText));
    if(intent==="safe") return ok(await translateToUserLang(buildSafe(),userText));

    if(intent==="local"){
      const sub=detectIntent(userText); // reuse
      const labelMap={cs:"Otevřít",en:"Open",de:"Öffnen",fr:"Ouvrir",es:"Abrir"};
      const curated=buildCuratedList(sub,{labelOpen:labelMap[lang]||"Open"});
      return ok(await translateToUserLang(curated||"Nemám seznam pro tuto kategorii.",userText));
    }

    // fallback → model
    const c=await client.chat.completions.create({
      model:MODEL,temperature:0.2,
      messages:[{role:"system",content:SYSTEM_PROMPT},...messages]
    });
    return ok(c.choices?.[0]?.message?.content?.trim()||"Rozumím.");

  }catch(e){
    console.error(e);
    return ok("⚠️ Došlo k chybě, zkuste to znovu.");
  }

  function ok(reply){return new Response(JSON.stringify({reply}),{status:200,headers:{"content-type":"application/json"}});}
};
