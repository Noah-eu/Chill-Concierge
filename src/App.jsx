// src/App.jsx
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
      font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Arial, sans-serif;
      color:var(--accent);
    }
    .row{display:flex;flex-direction:column;gap:12px;max-width:940px;margin:0 auto;padding:0 16px 24px}

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
    .bot img{max-width:100%;height:auto;border-radius:14px;display:block;margin:10px 0;
      box-shadow:0 10px 26px rgba(0,0,0,.10);border:1px solid var(--border);}
    .bot a{
      display:inline-block;padding:8px 12px;border-radius:999px;
      border:1px solid color-mix(in oklab, var(--blue), black 15%);
      background:linear-gradient(180deg, color-mix(in oklab, var(--blue), white 8%), color-mix(in oklab, var(--blue), black 6%));
      color:#fff;text-decoration:none;font-weight:800;box-shadow:0 6px 16px rgba(66,133,244,.25);
    }

    .grid{display:grid;grid-template-columns:repeat(auto-fit, minmax(160px, 1fr));gap:10px;width:100%;}

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

    .chip{
      padding:12px 14px;border-radius:999px;border:1px solid var(--border);
      background:linear-gradient(180deg, color-mix(in oklab, var(--t-yellow), white 6%), color-mix(in oklab, var(--t-yellow), white 0%));
      color:#3b2f24;font-weight:700;box-shadow:0 4px 12px rgba(0,0,0,.05);
      cursor:pointer;text-align:center;
    }

    .hdrBtn{padding:10px 14px;border-radius:14px;border:1px solid var(--border);
      background:linear-gradient(180deg, #fff, color-mix(in oklab, var(--t-yellow), white 10%));
      color:var(--accent);font-weight:700;cursor:pointer;box-shadow:0 6px 12px rgba(0,0,0,.05);}
    .hdrBtn.blue{border-color:color-mix(in oklab, var(--blue), black 18%);
      background:linear-gradient(180deg, color-mix(in oklab, var(--blue), white 6%), color-mix(in oklab, var(--blue), black 4%)); color:#fff;}

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
      border-radius:12px;background:linear-gradient(180deg, color-mix(in oklab, var(--t-yellow), white 10%), color-mix(in oklab, var(--t-yellow), white 2%));
      color:var(--accent);font-size:14px;
    }

    .input{display:flex;gap:10px;margin-top:8px;padding-top:12px;border-top:1px dashed var(--border);
      background:linear-gradient(180deg, transparent, color-mix(in oklab, var(--t-blue), white 85%) 90%);border-radius:12px;}
    textarea{flex:1;resize:vertical;min-height:56px;max-height:200px;padding:12px 14px;border-radius:14px;border:1px solid var(--border);
      outline:none;background:linear-gradient(180deg, #fff, color-mix(in oklab, var(--t-blue), white 8%));}
    textarea:focus{border-color:color-mix(in oklab, var(--blue), #d2bba5 30%);box-shadow:0 0 0 4px color-mix(in oklab, var(--t-blue), transparent 60%)}

    .fab{position:fixed;right:16px;bottom:90px;z-index:1000;border:none;border-radius:999px;padding:12px 14px;font-weight:800;
      background:linear-gradient(180deg, color-mix(in oklab, var(--blue), white 6%), color-mix(in oklab, var(--blue), black 4%));
      color:#fff;box-shadow:0 10px 24px rgba(66,133,244,.35);cursor:pointer;}
  `}</style>
);

/** ================== i18n ================== */
const LANGS = {
  en:"English", cs:"Čeština", es:"Español", de:"Deutsch", fr:"Français",
  ru:"Русский", uk:"Українська", nl:"Nederlands", it:"Italiano", da:"Dansk", pl:"Polski"
};

/* krátký pozdrav v každém jazyce */
const GREET = {
  cs:"Dobrý den!", en:"Hello!", es:"¡Hola!", de:"Hallo!", fr:"Bonjour !",
  ru:"Привет!", uk:"Привіт!", nl:"Hallo!", it:"Ciao!", da:"Hej!", pl:"Cześć!"
};

const tr = {
  cs:{ chooseLang:"Zvolte jazyk", mainTitle:"Vyberte téma", subTitle:"Podtéma / Subtopic", back:"← Zpět",
       catFood:"Jídlo a okolí", catTech:"Technické potíže", catOther:"Ostatní",
       stillAsk:"Stále můžete napsat vlastní dotaz do pole níže.",
       contact:"Pokud jste nenašli, co potřebujete, napište Davidovi (WhatsApp +420 733 439 733).",
       send:"Poslat", type:"Napište dotaz…", shortcuts:"Zkratky", hide:"Skrýt", show:"⚡ Zkratky",
       labels:{
         food:{ dining:"🍽️ Snídaně / Restaurace", bakery:"🥖 Pekárny", grocery:"🛒 Obchody", pharmacy:"💊 Lékárny", exchange_atm:"💱 Směnárny / ATM", exchange:"💱 Směnárny", atm:"🏧 ATM" },
         tech:{ wifi:"📶 Wi-Fi", power:"⚡ Elektřina", hot_water:"💧 Teplá voda", ac:"❄️ Klimatizace (AC)", induction:"🔎 Indukční deska", hood:"🌀 Digestoř", coffee:"☕ Kávovar Tchibo", fire_alarm:"🔥 Požární hlásič", elevator_phone:"🛗 Výtah – servis", safe:"🔐 Trezor", keys:"🔑 Náhradní klíč" },
         other:{ laundry:"🧺 Prádelna", access:"♿️ Bezbariérovost", smoking:"🚭 Kouření", luggage:"🎒 Úschovna zavazadel", doorbells:"🔔 Zvonky", gate:"🚪 Brána (zevnitř)", trash:"🗑️ Odpadky / Popelnice", doctor:"👩‍⚕️ Lékař 24/7", linen_towels:"🧻 Povlečení / Ručníky", general:"ℹ️ Obecný dotaz" }
       }
  },
  en:{ chooseLang:"Choose a language", mainTitle:"Pick a topic", subTitle:"Subtopic", back:"← Back",
       catFood:"Food & Nearby", catTech:"Technical issues", catOther:"Other",
       stillAsk:"You can still type a custom question below.",
       contact:"If you can’t find what you need, message David (WhatsApp +420 733 439 733).",
       send:"Send", type:"Type your question…", shortcuts:"Shortcuts", hide:"Hide", show:"⚡ Shortcuts",
       labels:{
         food:{ dining:"🍽️ Breakfast / Restaurants", bakery:"🥖 Bakeries", grocery:"🛒 Shops", pharmacy:"💊 Pharmacies", exchange_atm:"💱 Exchange / ATM", exchange:"💱 Exchange", atm:"🏧 ATM" },
         tech:{ wifi:"📶 Wi-Fi", power:"⚡ Power", hot_water:"💧 Hot water", ac:"❄️ Air conditioning", induction:"🔎 Induction hob", hood:"🌀 Cooker hood", coffee:"☕ Tchibo coffee maker", fire_alarm:"🔥 Fire alarm", elevator_phone:"🛗 Elevator – service", safe:"🔐 Safe", keys:"🔑 Spare key" },
         other:{ laundry:"🧺 Laundry", access:"♿️ Accessibility", smoking:"🚭 Smoking", luggage:"🎒 Luggage room", doorbells:"🔔 Doorbells", gate:"🚪 Gate (inside)", trash:"🗑️ Trash / Bins", doctor:"👩‍⚕️ Doctor 24/7", linen_towels:"🧻 Linen / Towels", general:"ℹ️ General question" }
       }
  },
  es:{ chooseLang:"Elige idioma", mainTitle:"Elige un tema", subTitle:"Subtema", back:"← Atrás",
       catFood:"Comida y alrededores", catTech:"Problemas técnicos", catOther:"Otros",
       stillAsk:"Aún puedes escribir tu pregunta abajo.",
       contact:"Si no encuentras lo que necesitas, escribe a David (WhatsApp +420 733 439 733).",
       send:"Enviar", type:"Escribe tu pregunta…", shortcuts:"Atajos", hide:"Ocultar", show:"⚡ Atajos",
       labels:{
         food:{ dining:"🍽️ Desayuno / Restaurantes", bakery:"🥖 Panaderías", grocery:"🛒 Tiendas", pharmacy:"💊 Farmacias", exchange_atm:"💱 Cambio / Cajero", exchange:"💱 Cambio", atm:"🏧 Cajero" },
         tech:{ wifi:"📶 Wi-Fi", power:"⚡ Electricidad", hot_water:"💧 Agua caliente", ac:"❄️ Aire acondicionado", induction:"🔎 Placa de inducción", hood:"🌀 Campana extractora", coffee:"☕ Cafetera Tchibo", fire_alarm:"🔥 Alarma de incendio", elevator_phone:"🛗 Ascensor – servicio", safe:"🔐 Caja fuerte", keys:"🔑 Llave de repuesto" },
         other:{ laundry:"🧺 Lavandería", access:"♿️ Accesibilidad", smoking:"🚭 Fumar", luggage:"🎒 Consigna", doorbells:"🔔 Timbres", gate:"🚪 Portón (interior)", trash:"🗑️ Basura / Contenedores", doctor:"👩‍⚕️ Médico 24/7", linen_towels:"🧻 Ropa de cama / Toallas", general:"ℹ️ Pregunta general" }
       }
  },
  de:{ chooseLang:"Sprache wählen", mainTitle:"Thema wählen", subTitle:"Unterthema", back:"← Zurück",
       catFood:"Essen & Umgebung", catTech:"Technische Probleme", catOther:"Sonstiges",
       stillAsk:"Sie können unten weiterhin eine Frage eingeben.",
       contact:"Wenn etwas fehlt, schreiben Sie David (WhatsApp +420 733 439 733).",
       send:"Senden", type:"Frage eingeben…", shortcuts:"Kurzbefehle", hide:"Ausblenden", show:"⚡ Kurzbefehle",
       labels:{
         food:{ dining:"🍽️ Frühstück / Restaurants", bakery:"🥖 Bäckereien", grocery:"🛒 Geschäfte", pharmacy:"💊 Apotheken", exchange_atm:"💱 Wechselstube / ATM", exchange:"💱 Wechselstuben", atm:"🏧 ATM" },
         tech:{ wifi:"📶 Wi-Fi", power:"⚡ Strom", hot_water:"💧 Warmwasser", ac:"❄️ Klimaanlage (AC)", induction:"🔎 Induktionskochfeld", hood:"🌀 Dunstabzug", coffee:"☕ Tchibo-Kaffeemaschine", fire_alarm:"🔥 Rauchmelder", elevator_phone:"🛗 Aufzug – Service", safe:"🔐 Safe", keys:"🔑 Ersatzschlüssel" },
         other:{ laundry:"🧺 Wäscherei", access:"♿️ Barrierefreiheit", smoking:"🚭 Rauchen", luggage:"🎒 Gepäckraum", doorbells:"🔔 Klingeln", gate:"🚪 Tor (innen)", trash:"🗑️ Müll / Tonnen", doctor:"👩‍⚕️ Arzt 24/7", linen_towels:"🧻 Bettwäsche / Handtücher", general:"ℹ️ Allgemeine Frage" }
       }
  },
  fr:{ chooseLang:"Choisir la langue", mainTitle:"Choisir un sujet", subTitle:"Sous-thème", back:"← Retour",
       catFood:"Restauration & alentours", catTech:"Problèmes techniques", catOther:"Autre",
       stillAsk:"Vous pouvez toujours écrire votre question ci-dessous.",
       contact:"Si besoin, contactez David (WhatsApp +420 733 439 733).",
       send:"Envoyer", type:"Écrivez votre question…", shortcuts:"Raccourcis", hide:"Masquer", show:"⚡ Raccourcis",
       labels:{
         food:{ dining:"🍽️ Petit-déj / Restaurants", bakery:"🥖 Boulangeries", grocery:"🛒 Commerces", pharmacy:"💊 Pharmacies", exchange_atm:"💱 Change / DAB", exchange:"💱 Change", atm:"🏧 DAB" },
         tech:{ wifi:"📶 Wi-Fi", power:"⚡ Électricité", hot_water:"💧 Eau chaude", ac:"❄️ Climatisation", induction:"🔎 Plaque à induction", hood:"🌀 Hotte", coffee:"☕ Machine Tchibo", fire_alarm:"🔥 Détecteur incendie", elevator_phone:"🛗 Ascenseur – service", safe:"🔐 Coffre-fort", keys:"🔑 Clé de secours" },
         other:{ laundry:"🧺 Laverie", access:"♿️ Accessibilité", smoking:"🚭 Fumer", luggage:"🎒 Consigne", doorbells:"🔔 Sonnette", gate:"🚪 Porte cochère (int.)", trash:"🗑️ Poubelles", doctor:"👩‍⚕️ Médecin 24/7", linen_towels:"🧻 Linge / Serviettes", general:"ℹ️ Question générale" }
       }
  },
  ru:{ chooseLang:"Выберите язык", mainTitle:"Выберите тему", subTitle:"Подтема", back:"← Назад",
       catFood:"Еда и рядом", catTech:"Технические проблемы", catOther:"Другое",
       stillAsk:"Можете также написать свой вопрос ниже.",
       contact:"Если не нашли нужное, напишите Давиду (WhatsApp +420 733 439 733).",
       send:"Отправить", type:"Введите вопрос…", shortcuts:"Ярлыки", hide:"Скрыть", show:"⚡ Ярлыки",
       labels:{
         food:{ dining:"🍽️ Завтрак / Рестораны", bakery:"🥖 Пекарни", grocery:"🛒 Магазины", pharmacy:"💊 Аптеки", exchange_atm:"💱 Обмен / Банкомат", exchange:"💱 Обмен валют", atm:"🏧 Банкомат" },
         tech:{ wifi:"📶 Wi-Fi", power:"⚡ Электричество", hot_water:"💧 Горячая вода", ac:"❄️ Кондиционер", induction:"🔎 Индукционная плита", hood:"🌀 Вытяжка", coffee:"☕ Кофемашина Tchibo", fire_alarm:"🔥 Пожарная сигнализация", elevator_phone:"🛗 Лифт – сервис", safe:"🔐 Сейф", keys:"🔑 Запасной ключ" },
         other:{ laundry:"🧺 Прачечная", access:"♿️ Доступность", smoking:"🚭 Курение", luggage:"🎒 Камера хранения", doorbells:"🔔 Домофон/звонки", gate:"🚪 Ворота (изнутри)", trash:"🗑️ Мусор / баки", doctor:"👩‍⚕️ Врач 24/7", linen_towels:"🧻 Постель / полотенца", general:"ℹ️ Общий вопрос" }
       }
  },
  uk:{ chooseLang:"Оберіть мову", mainTitle:"Виберіть тему", subTitle:"Підтема", back:"← Назад",
       catFood:"Їжа та поруч", catTech:"Технічні питання", catOther:"Інше",
       stillAsk:"Можете також написати власне запитання нижче.",
       contact:"Якщо не знайшли потрібне, напишіть Давидові (WhatsApp +420 733 439 733).",
       send:"Надіслати", type:"Введіть запитання…", shortcuts:"Ярлики", hide:"Сховати", show:"⚡ Ярлики",
       labels:{
         food:{ dining:"🍽️ Сніданок / Ресторани", bakery:"🥖 Пекарні", grocery:"🛒 Магазини", pharmacy:"💊 Аптеки", exchange_atm:"💱 Обмін / Банкомат", exchange:"💱 Обмін", atm:"🏧 Банкомат" },
         tech:{ wifi:"📶 Wi-Fi", power:"⚡ Електрика", hot_water:"💧 Гаряча вода", ac:"❄️ Кондиціонер", induction:"🔎 Індукційна плита", hood:"🌀 Витяжка", coffee:"☕ Кавоварка Tchibo", fire_alarm:"🔥 Пожежна сигналізація", elevator_phone:"🛗 Ліфт – сервіс", safe:"🔐 Сейф", keys:"🔑 Запасний ключ" },
         other:{ laundry:"🧺 Пральня", access:"♿️ Доступність", smoking:"🚭 Паління", luggage:"🎒 Камера схову", doorbells:"🔔 Дзвінки", gate:"🚪 Ворота (зсередини)", trash:"🗑️ Сміття / баки", doctor:"👩‍⚕️ Лікар 24/7", linen_towels:"🧻 Білизна / рушники", general:"ℹ️ Загальне питання" }
       }
  },
  nl:{ chooseLang:"Kies een taal", mainTitle:"Kies een onderwerp", subTitle:"Subonderwerp", back:"← Terug",
       catFood:"Eten & in de buurt", catTech:"Technische problemen", catOther:"Overig",
       stillAsk:"Je kunt hieronder ook je eigen vraag typen.",
       contact:"Niet gevonden wat je zoekt? Stuur David een bericht (WhatsApp +420 733 439 733).",
       send:"Versturen", type:"Typ je vraag…", shortcuts:"Snelkoppelingen", hide:"Verbergen", show:"⚡ Snelkoppelingen",
       labels:{
         food:{ dining:"🍽️ Ontbijt / Restaurants", bakery:"🥖 Bakkerijen", grocery:"🛒 Winkels", pharmacy:"💊 Apotheken", exchange_atm:"💱 Wisselkantoor / Geldautomaat", exchange:"💱 Wisselkantoor", atm:"🏧 Geldautomaat" },
         tech:{ wifi:"📶 Wi-Fi", power:"⚡ Stroom", hot_water:"💧 Warm water", ac:"❄️ Airco", induction:"🔎 Inductiekookplaat", hood:"🌀 Afzuigkap", coffee:"☕ Tchibo-koffiezet", fire_alarm:"🔥 Brandalarm", elevator_phone:"🛗 Lift – service", safe:"🔐 Kluis", keys:"🔑 Reservesleutel" },
         other:{ laundry:"🧺 Wasserette", access:"♿️ Toegankelijkheid", smoking:"🚭 Roken", luggage:"🎒 Bagageruimte", doorbells:"🔔 Deurbellen", gate:"🚪 Poort (binnen)", trash:"🗑️ Afval / containers", doctor:"👩‍⚕️ Arts 24/7", linen_towels:"🧻 Beddengoed / handdoeken", general:"ℹ️ Algemene vraag" }
       }
  },
  it:{ chooseLang:"Scegli una lingua", mainTitle:"Scegli un argomento", subTitle:"Sottoargomento", back:"← Indietro",
       catFood:"Cibo e dintorni", catTech:"Problemi tecnici", catOther:"Altro",
       stillAsk:"Puoi comunque scrivere una domanda qui sotto.",
       contact:"Se non trovi ciò che ti serve, scrivi a David (WhatsApp +420 733 439 733).",
       send:"Invia", type:"Scrivi la tua domanda…", shortcuts:"Scorciatoie", hide:"Nascondi", show:"⚡ Scorciatoie",
       labels:{
         food:{ dining:"🍽️ Colazione / Ristoranti", bakery:"🥖 Panetterie", grocery:"🛒 Negozi", pharmacy:"💊 Farmacie", exchange_atm:"💱 Cambio / Bancomat", exchange:"💱 Cambio", atm:"🏧 Bancomat" },
         tech:{ wifi:"📶 Wi-Fi", power:"⚡ Elettricità", hot_water:"💧 Acqua calda", ac:"❄️ Aria condizionata", induction:"🔎 Piano a induzione", hood:"🌀 Cappa", coffee:"☕ Macchina Tchibo", fire_alarm:"🔥 Allarme antincendio", elevator_phone:"🛗 Ascensore – assistenza", safe:"🔐 Cassaforte", keys:"🔑 Chiave di scorta" },
         other:{ laundry:"🧺 Lavanderia", access:"♿️ Accessibilità", smoking:"🚭 Fumare", luggage:"🎒 Deposito bagagli", doorbells:"🔔 Campanelli", gate:"🚪 Cancello (interno)", trash:"🗑️ Rifiuti / bidoni", doctor:"👩‍⚕️ Medico 24/7", linen_towels:"🧻 Lenzuola / Asciugamani", general:"ℹ️ Domanda generica" }
       }
  },
  da:{ chooseLang:"Vælg sprog", mainTitle:"Vælg et emne", subTitle:"Undertema", back:"← Tilbage",
       catFood:"Mad og i nærheden", catTech:"Tekniske problemer", catOther:"Andet",
       stillAsk:"Du kan stadig skrive dit eget spørgsmål herunder.",
       contact:"Finder du ikke det, du skal bruge, så skriv til David (WhatsApp +420 733 439 733).",
       send:"Send", type:"Skriv dit spørgsmål…", shortcuts:"Genveje", hide:"Skjul", show:"⚡ Genveje",
       labels:{
         food:{ dining:"🍽️ Morgenmad / Restauranter", bakery:"🥖 Bagerier", grocery:"🛒 Butikker", pharmacy:"💊 Apoteker", exchange_atm:"💱 Veksel / Hæveautomat", exchange:"💱 Vekselkontor", atm:"🏧 Hæveautomat" },
         tech:{ wifi:"📶 Wi-Fi", power:"⚡ Strøm", hot_water:"💧 Varmt vand", ac:"❄️ Aircondition", induction:"🔎 Induktionsplade", hood:"🌀 Emhætte", coffee:"☕ Tchibo kaffemaskine", fire_alarm:"🔥 Brandalarm", elevator_phone:"🛗 Elevator – service", safe:"🔐 Pengeskab", keys:"🔑 Ekstra nøgle" },
         other:{ laundry:"🧺 Vaskeri", access:"♿️ Tilgængelighed", smoking:"🚭 Rygning", luggage:"🎒 Bagageopbevaring", doorbells:"🔔 Dørklokker", gate:"🚪 Port (indvendig)", trash:"🗑️ Affald / containere", doctor:"👩‍⚕️ Læge 24/7", linen_towels:"🧻 Sengetøj / Håndklæder", general:"ℹ️ Generelt spørgsmål" }
       }
  },
  pl:{ chooseLang:"Wybierz język", mainTitle:"Wybierz temat", subTitle:"Podtemat", back:"← Wstecz",
       catFood:"Jedzenie i okolica", catTech:"Problemy techniczne", catOther:"Inne",
       stillAsk:"Możesz też wpisać własne pytanie poniżej.",
       contact:"Jeśli nie znalazłeś informacji, napisz do Dawida (WhatsApp +420 733 439 733).",
       send:"Wyślij", type:"Wpisz pytanie…", shortcuts:"Skróty", hide:"Ukryj", show:"⚡ Skróty",
       labels:{
         food:{ dining:"🍽️ Śniadanie / Restauracje", bakery:"🥖 Piekarnie", grocery:"🛒 Sklepy", pharmacy:"💊 Apteki", exchange_atm:"💱 Kantor / Bankomat", exchange:"💱 Kantor", atm:"🏧 Bankomat" },
         tech:{ wifi:"📶 Wi-Fi", power:"⚡ Prąd", hot_water:"💧 Ciepła woda", ac:"❄️ Klimatyzacja", induction:"🔎 Płyta indukcyjna", hood:"🌀 Okap", coffee:"☕ Ekspres Tchibo", fire_alarm:"🔥 Czujnik dymu", elevator_phone:"🛗 Winda – serwis", safe:"🔐 Sejf", keys:"🔑 Klucz zapasowy" },
         other:{ laundry:"🧺 Pralnia", access:"♿️ Dostępność", smoking:"🚭 Palenie", luggage:"🎒 Przechowalnia bagażu", doorbells:"🔔 Dzwonki", gate:"🚪 Brama (od środka)", trash:"🗑️ Śmieci / kosze", doctor:"👩‍⚕️ Lekarz 24/7", linen_towels:"🧻 Pościel / Ręczniki", general:"ℹ️ Pytanie ogólne" }
       }
  },
};

/** ============= helpers ============= */
function makeFlows(dict){
  const L = dict.labels;

  const FOOD = [
    { label: L.food.dining,   prompt:"dining" },
    { label: L.food.bakery,   prompt:"pekárna" },
    { label: L.food.grocery,  prompt:"supermarket" },
    { label: L.food.pharmacy, prompt:"lékárna" },
    { label: L.food.exchange_atm, children:[
      { label: L.food.exchange, prompt:"směnárna" },
      { label: L.food.atm,      prompt:"atm" },
    ]},
  ];

  const TECH = [
    { label:L.tech.wifi,            prompt:"wifi heslo" },
    { label:L.tech.power,           prompt:"elektrina nejde proud jistič" },
    { label:L.tech.hot_water,       prompt:"teplá voda nejde" },
    { label:L.tech.ac,              prompt:"klimatizace ac" },
    { label:L.tech.induction,       prompt:"indukce nefunguje" },
    { label:L.tech.hood,            prompt:"digestoř" },
    { label:L.tech.coffee,          prompt:"kávovar tchibo" },
    { label:L.tech.fire_alarm,      prompt:"požární hlásič" },
    { label:L.tech.elevator_phone,  prompt:"výtah telefon servis porucha" },
    { label:L.tech.safe,            prompt:"trezor safe" },
    { label:L.tech.keys,            prompt:"náhradní klíč" },
  ];

  const OTHER = [
    { label:L.other.laundry,       prompt:"prádelna kde je prádelna" },
    { label:L.other.access,        prompt:"bezbariérovost invalid" },
    { label:L.other.smoking,       prompt:"kouření kde mohu kouřit" },
    { label:L.other.luggage,       prompt:"úschovna batožiny" },
    { label:L.other.doorbells,     prompt:"zvonky na apartmány" },
    { label:L.other.gate,          prompt:"otevírání brány" },
    { label:L.other.trash,         prompt:"kde jsou popelnice odpadky" },
    { label:L.other.doctor,        prompt:"doktor lékař 24" },
    { label:L.other.linen_towels,  prompt:"povlečení ručníky kód skříň" },
    { label:L.other.general,       prompt:"prosím o pomoc" },
  ];

  return [
    { label:dict.catFood, children:FOOD },
    { label:dict.catTech, children:TECH },
    { label:dict.catOther, children:OTHER },
  ];
}

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

  useEffect(() => {
    if (lang) document.body.classList.add("lang-selected"); else document.body.classList.remove("lang-selected");
  }, [lang]);

  useEffect(() => { scrollerRef.current?.scrollTo(0, 9_999_999); }, [chat, shortcutsOpen]);

  const dict  = useMemo(() => tr[lang || "cs"], [lang]);
  const FLOWS = useMemo(() => makeFlows(dict), [dict]);

  function renderAssistant(md=""){
    const raw = marked.parse(md, { breaks:true });
    const clean = DOMPurify.sanitize(raw);
    return <div className="bubble bot" dangerouslySetInnerHTML={{ __html: clean }} />;
  }

  async function sendPrompt(prompt, control = null){
    const next = [...chat, { role:"user", content:prompt }];
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

  const inFood = lang && stack.length > 0 && stack[stack.length - 1]?.label === tr[lang||"cs"].catFood;
  const inTech = lang && stack.length > 0 && stack[stack.length - 1]?.label === tr[lang||"cs"].catTech;

  const PLACE_SUB_MAP = {
    "dining":"dining", "pekárna":"bakery", "supermarket":"grocery", "lékárna":"pharmacy",
    "směnárna":"exchange", "atm":"atm",
  };
  const TECH_MAP = {
    "wifi heslo": "wifi", "elektrina nejde proud jistič": "power", "teplá voda nejde": "hot_water",
    "klimatizace ac": "ac", "indukce nefunguje": "induction", "digestoř": "hood",
    "kávovar tchibo": "coffee", "požární hlásič": "fire_alarm", "výtah telefon servis porucha": "elevator_phone",
    "trezor safe": "safe", "náhradní klíč": "keys",
  };

  const onChipClick = async (n) => {
    if (inFood) {
      const key = (n.prompt || "").toLowerCase();
      if (n.children) return openNode(n);
      const sub = PLACE_SUB_MAP[key];
      if (sub) {
        setShortcutsOpen(false);
        return sendPrompt(n.prompt, { intent: "local", sub });
      }
    }
    if (inTech) {
      const subTech = TECH_MAP[(n.prompt || "").toLowerCase()];
      if (subTech) {
        setShortcutsOpen(false);
        return sendPrompt(n.prompt, { intent: "tech", sub: subTech });
      }
    }
    setShortcutsOpen(false);
    return sendPrompt(n.prompt);
  };

  /* Language chooser with greetings */
  const LanguageChooser = () => {
    const others = Object.entries(LANGS).filter(([code]) => code !== "en");
    return (
      <div className="bubble bot" style={{ display:"inline-block", maxWidth:"100%" }}>
        <strong>{tr.cs.chooseLang}</strong>

        {/* krátké pozdravy */}
        <div style={{marginTop:8, marginBottom:8, fontWeight:600, lineHeight:1.6}}>
          {Object.entries(LANGS).map(([code,label]) => (
            <div key={code}>{GREET[code]} <span style={{opacity:.6}}>({label})</span></div>
          ))}
        </div>

        {/* English – samotné nahoře */}
        <div style={{marginTop:4, marginBottom:6}}>
          <button
            className="chipPrimary"
            style={{ ["--btn"]: "var(--blue)", width:"100%" }}
            onClick={() => { setLang("en"); resetToRoot(); }}
          >
            English
          </button>
        </div>

        {/* ostatní jazyky ve 2 sloupcích */}
        <div className="grid" style={{ gridTemplateColumns:"repeat(2, 1fr)" }}>
          {others.map(([code,label], i) => (
            <button
              key={code}
              className="chipPrimary"
              style={{ ["--btn"]: btnColorForIndex(i+1) }}
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
    );
  };

  const rootChipColor = (label) => {
    if (label === dict.catFood)   return "var(--red)";
    if (label === dict.catTech)   return "var(--yellow)";
    if (label === dict.catOther)  return "var(--green)";
    return "var(--blue)";
  };

  return (
    <>
      <GoogleStyle />
      <div className="row">

        <div className="scroller" ref={scrollerRef}>
          {!lang && <LanguageChooser />}

          {chat.map((m,i) =>
            m.role === "assistant"
              ? <div key={i}>{renderAssistant(m.content)}</div>
              : <div key={i} className="bubble me">{m.content}</div>
          )}
        </div>

        {lang && currentChildren && shortcutsOpen && (
          <div className="shortcuts">
            <div className="shortcutsHeader">
              <strong>{stack.length === 0 ? tr[lang||"cs"].mainTitle : tr[lang||"cs"].subTitle}</strong>
              <div className="btnRow">
                {stack.length > 0 && (
                  <button className="hdrBtn" onClick={goBack}>{tr[lang||"cs"].back}</button>
                )}
                <button className="hdrBtn blue" onClick={() => setShortcutsOpen(false)}>{tr[lang||"cs"].hide}</button>
                <button className="hdrBtn" onClick={() => { setLang(null); setStack([]); }}>🌐 {tr[lang||"cs"].chooseLang}</button>
              </div>
            </div>

            <div className="grid">
              {currentChildren.map((n, idx) => {
                const atRoot = stack.length === 0 && n.children;
                if (atRoot) {
                  return (
                    <button
                      key={idx}
                      className="chipPrimary"
                      style={{ ["--btn"]: rootChipColor(n.label) }}
                      onClick={() => openNode(n)}
                    >
                      {n.label}
                    </button>
                  );
                }
                return n.children ? (
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
                );
              })}
            </div>

            <div className="tips" style={{ marginTop:8 }}>{tr[lang||"cs"].stillAsk}</div>
          </div>
        )}

        {!shortcutsOpen && lang && (
          <button className="fab" onClick={() => setShortcutsOpen(true)} title={tr[lang||"cs"].shortcuts}>
            {tr[lang||"cs"].show}
          </button>
        )}

        <div className="contactBar">{tr[lang||"cs"].contact}</div>

        <div className="input">
          <textarea
            placeholder={tr[lang||"cs"].type}
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
            {loading ? "…" : tr[lang||"cs"].send}
          </button>
        </div>
      </div>
    </>
  );
}
