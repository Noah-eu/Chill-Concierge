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
  en:{ chooseLang:"Choose a language", mainTitle:"Pick a topic", subTitle:"Subtopic", back:"← Back",
       catFood:"Food & Nearby", catTech:"Technical issues", catOther:"Other",
       stillAsk:"You can still type a custom question below.",
       contact:"If you can’t find what you need, message David (WhatsApp +420 733 439 733).",
       send:"Send", type:"Type your question…", shortcuts:"Shortcuts", hide:"Hide", show:"⚡ Shortcuts",
       greet:[
        "Hello! How can I help you today? (English)"
       ],
       /* item labels */
       dining:"🍽️ Breakfast / Restaurants", bakery:"🥖 Bakeries", grocery:"🛒 Groceries",
       pharmacy:"💊 Pharmacies", exchAtm:"💱 Exchanges / ATM", exchange:"💱 Exchanges", atm:"🏧 ATM",
       wifi:"📶 Wi-Fi", power:"⚡ Electricity", hot_water:"💧 Hot water", ac:"❄️ Air conditioning (AC)",
       induction:"🍳 Induction hob", hood:"🌀 Cooker hood", coffee:"☕ Tchibo coffee machine",
       fire_alarm:"🔥 Fire alarm", elevator_phone:"🛗 Lift – service", safe:"🔐 Safe", keys:"🔑 Spare key",
       laundry:"🧺 Laundry", access:"♿️ Accessibility", smoking:"🚭 Smoking",
       luggage:"🎒 Luggage room", doorbells:"🔔 Doorbells", gate:"🚪 Gate (inside)", trash:"🗑️ Trash / Bins",
       doctor:"👩‍⚕️ Doctor 24/7", linen_towels:"🧻 Linen / Towels", general:"ℹ️ General question"
  },

  cs:{ chooseLang:"Zvolte jazyk", mainTitle:"Vyberte téma", subTitle:"Podtéma / Subtopic", back:"← Zpět",
       catFood:"Jídlo a okolí", catTech:"Technické potíže", catOther:"Ostatní",
       stillAsk:"Stále můžete napsat vlastní dotaz do pole níže.",
       contact:"Pokud jste nenašli, co potřebujete, napište Davidovi (WhatsApp +420 733 439 733).",
       send:"Poslat", type:"Napište dotaz…", shortcuts:"Zkratky", hide:"Skrýt", show:"⚡ Zkratky",
       greet:[
        "Ahoj! Jak vám mohu pomoci dnes? (čeština)"
       ],
       dining:"🍽️ Snídaně / Restaurace", bakery:"🥖 Pekárny", grocery:"🛒 Obchody",
       pharmacy:"💊 Lékárny", exchAtm:"💱 Směnárny / ATM", exchange:"💱 Směnárny", atm:"🏧 ATM",
       wifi:"📶 Wi-Fi", power:"⚡ Elektřina", hot_water:"💧 Teplá voda", ac:"❄️ Klimatizace (AC)",
       induction:"🍳 Indukční deska", hood:"🌀 Digestoř", coffee:"☕ Kávovar Tchibo",
       fire_alarm:"🔥 Požární hlásič", elevator_phone:"🛗 Výtah – servis", safe:"🔐 Trezor", keys:"🔑 Náhradní klíč",
       laundry:"🧺 Prádelna", access:"♿️ Bezbariérovost", smoking:"🚭 Kouření",
       luggage:"🎒 Úschovna zavazadel", doorbells:"🔔 Zvonky", gate:"🚪 Brána (zevnitř)", trash:"🗑️ Odpadky / Popelnice",
       doctor:"👩‍⚕️ Lékař 24/7", linen_towels:"🧻 Povlečení / Ručníky", general:"ℹ️ Obecný dotaz"
  },

  es:{ chooseLang:"Elige idioma", mainTitle:"Elige un tema", subTitle:"Subtema", back:"← Atrás",
       catFood:"Comida y alrededores", catTech:"Problemas técnicos", catOther:"Otros",
       stillAsk:"Aún puedes escribir tu pregunta abajo.",
       contact:"Si no encuentras lo que necesitas, escribe a David (WhatsApp +420 733 439 733).",
       send:"Enviar", type:"Escribe tu pregunta…", shortcuts:"Atajos", hide:"Ocultar", show:"⚡ Atajos",
       greet:[
        "¡Hola! ¿Cómo puedo ayudarte hoy? (español)"
       ],
       dining:"🍽️ Desayuno / Restaurantes", bakery:"🥖 Panaderías", grocery:"🛒 Supermercados",
       pharmacy:"💊 Farmacias", exchAtm:"💱 Casas de cambio / ATM", exchange:"💱 Casas de cambio", atm:"🏧 Cajeros",
       wifi:"📶 Wi-Fi", power:"⚡ Electricidad", hot_water:"💧 Agua caliente", ac:"❄️ Aire acondicionado (AC)",
       induction:"🍳 Placa de inducción", hood:"🌀 Campana extractora", coffee:"☕ Cafetera Tchibo",
       fire_alarm:"🔥 Alarma contra incendios", elevator_phone:"🛗 Ascensor – servicio", safe:"🔐 Caja fuerte", keys:"🔑 Llave de repuesto",
       laundry:"🧺 Lavandería", access:"♿️ Accesibilidad", smoking:"🚭 Fumar",
       luggage:"🎒 Consigna", doorbells:"🔔 Timbres", gate:"🚪 Portón (interior)", trash:"🗑️ Basura",
       doctor:"👩‍⚕️ Médico 24/7", linen_towels:"🧻 Ropa de cama / Toallas", general:"ℹ️ Pregunta general"
  },

  de:{ chooseLang:"Sprache wählen", mainTitle:"Thema wählen", subTitle:"Unterthema", back:"← Zurück",
       catFood:"Essen & Umgebung", catTech:"Technische Probleme", catOther:"Sonstiges",
       stillAsk:"Sie können unten weiterhin eine Frage eingeben.",
       contact:"Wenn etwas fehlt, schreiben Sie David (WhatsApp +420 733 439 733).",
       send:"Senden", type:"Frage eingeben…", shortcuts:"Kurzbefehle", hide:"Ausblenden", show:"⚡ Kurzbefehle",
       greet:[
        "Hallo! Wie kann ich Ihnen heute helfen? (Deutsch)"
       ],
       dining:"🍽️ Frühstück / Restaurants", bakery:"🥖 Bäckereien", grocery:"🛒 Supermärkte",
       pharmacy:"💊 Apotheken", exchAtm:"💱 Wechselstuben / ATM", exchange:"💱 Wechselstuben", atm:"🏧 Geldautomaten",
       wifi:"📶 WLAN", power:"⚡ Strom", hot_water:"💧 Warmwasser", ac:"❄️ Klimaanlage (AC)",
       induction:"🍳 Induktionskochfeld", hood:"🌀 Dunstabzug", coffee:"☕ Tchibo Kaffeemaschine",
       fire_alarm:"🔥 Feuermelder", elevator_phone:"🛗 Aufzug – Service", safe:"🔐 Safe", keys:"🔑 Ersatzschlüssel",
       laundry:"🧺 Waschraum", access:"♿️ Barrierefreiheit", smoking:"🚭 Rauchen",
       luggage:"🎒 Gepäckraum", doorbells:"🔔 Klingeln", gate:"🚪 Tor (innen)", trash:"🗑️ Müll",
       doctor:"👩‍⚕️ Arzt 24/7", linen_towels:"🧻 Bettwäsche / Handtücher", general:"ℹ️ Allgemeine Frage"
  },

  fr:{ chooseLang:"Choisir la langue", mainTitle:"Choisir un sujet", subTitle:"Sous-thème", back:"← Retour",
       catFood:"Restauration & alentours", catTech:"Problèmes techniques", catOther:"Autre",
       stillAsk:"Vous pouvez toujours écrire votre question ci-dessous.",
       contact:"Si besoin, contactez David (WhatsApp +420 733 439 733).",
       send:"Envoyer", type:"Écrivez votre question…", shortcuts:"Raccourcis", hide:"Masquer", show:"⚡ Raccourcis",
       greet:[
        "Bonjour ! Comment puis-je vous aider aujourd’hui ? (français)"
       ],
       dining:"🍽️ Petit-déjeuner / Restaurants", bakery:"🥖 Boulangeries", grocery:"🛒 Épiceries",
       pharmacy:"💊 Pharmacies", exchAtm:"💱 Bureaux de change / DAB", exchange:"💱 Bureaux de change", atm:"🏧 DAB",
       wifi:"📶 Wi-Fi", power:"⚡ Électricité", hot_water:"💧 Eau chaude", ac:"❄️ Climatisation (AC)",
       induction:"🍳 Plaque à induction", hood:"🌀 Hotte", coffee:"☕ Machine à café Tchibo",
       fire_alarm:"🔥 Détecteur d’incendie", elevator_phone:"🛗 Ascenseur – service", safe:"🔐 Coffre-fort", keys:"🔑 Clé de rechange",
       laundry:"🧺 Laverie", access:"♿️ Accessibilité", smoking:"🚭 Fumer",
       luggage:"🎒 Consigne", doorbells:"🔔 Sonnette", gate:"🚪 Portail (int.)", trash:"🗑️ Poubelles",
       doctor:"👩‍⚕️ Médecin 24/7", linen_towels:"🧻 Linge / Serviettes", general:"ℹ️ Question générale"
  },

  ru:{ chooseLang:"Выберите язык", mainTitle:"Выберите тему", subTitle:"Подтема", back:"← Назад",
       catFood:"Еда и рядом", catTech:"Технические проблемы", catOther:"Другое",
       stillAsk:"Можете также написать свой вопрос ниже.",
       contact:"Если не нашли нужное, напишите Давиду (WhatsApp +420 733 439 733).",
       send:"Отправить", type:"Введите вопрос…", shortcuts:"Ярлыки", hide:"Скрыть", show:"⚡ Ярлыки",
       greet:[
        "Привет! Чем могу помочь вам сегодня? (русский)"
       ],
       dining:"🍽️ Завтрак / Рестораны", bakery:"🥖 Пекарни", grocery:"🛒 Магазины",
       pharmacy:"💊 Аптеки", exchAtm:"💱 Обмен / Банкоматы", exchange:"💱 Обмен валюты", atm:"🏧 Банкоматы",
       wifi:"📶 Wi-Fi", power:"⚡ Электричество", hot_water:"💧 Горячая вода", ac:"❄️ Кондиционер (AC)",
       induction:"🍳 Индукционная плита", hood:"🌀 Вытяжка", coffee:"☕ Кофемашина Tchibo",
       fire_alarm:"🔥 Пожарная сигнализация", elevator_phone:"🛗 Лифт – сервис", safe:"🔐 Сейф", keys:"🔑 Запасной ключ",
       laundry:"🧺 Прачечная", access:"♿️ Доступность", smoking:"🚭 Курение",
       luggage:"🎒 Камера хранения", doorbells:"🔔 Домофоны", gate:"🚪 Ворота (изнутри)", trash:"🗑️ Мусор",
       doctor:"👩‍⚕️ Врач 24/7", linen_towels:"🧻 Постель / Полотенца", general:"ℹ️ Общий вопрос"
  },

  uk:{ chooseLang:"Оберіть мову", mainTitle:"Виберіть тему", subTitle:"Підтема", back:"← Назад",
       catFood:"Їжа та поруч", catTech:"Технічні питання", catOther:"Інше",
       stillAsk:"Можете також написати власне запитання нижче.",
       contact:"Якщо не знайшли потрібне, напишіть Давидові (WhatsApp +420 733 439 733).",
       send:"Надіслати", type:"Введіть запитання…", shortcuts:"Ярлики", hide:"Сховати", show:"⚡ Ярлики",
       greet:[
        "Привіт! Чим я можу вам допомогти сьогодні? (українська)"
       ],
       dining:"🍽️ Сніданок / Ресторани", bakery:"🥖 Пекарні", grocery:"🛒 Магазини",
       pharmacy:"💊 Аптеки", exchAtm:"💱 Обмін / Банкомати", exchange:"💱 Обмін валют", atm:"🏧 Банкомати",
       wifi:"📶 Wi-Fi", power:"⚡ Електрика", hot_water:"💧 Гаряча вода", ac:"❄️ Кондиціонер (AC)",
       induction:"🍳 Індукційна плита", hood:"🌀 Витяжка", coffee:"☕ Кавоварка Tchibo",
       fire_alarm:"🔥 Пожежний датчик", elevator_phone:"🛗 Ліфт – сервіс", safe:"🔐 Сейф", keys:"🔑 Запасний ключ",
       laundry:"🧺 Пральня", access:"♿️ Доступність", smoking:"🚭 Паління",
       luggage:"🎒 Камера схову", doorbells:"🔔 Дзвінки", gate:"🚪 Ворота (зсередини)", trash:"🗑️ Сміття",
       doctor:"👩‍⚕️ Лікар 24/7", linen_towels:"🧻 Постіль / Рушники", general:"ℹ️ Загальне запитання"
  },

  nl:{ chooseLang:"Kies een taal", mainTitle:"Kies een onderwerp", subTitle:"Subonderwerp", back:"← Terug",
       catFood:"Eten & in de buurt", catTech:"Technische problemen", catOther:"Overig",
       stillAsk:"Je kunt hieronder ook je eigen vraag typen.",
       contact:"Niet gevonden wat je zoekt? Stuur David een bericht (WhatsApp +420 733 439 733).",
       send:"Versturen", type:"Typ je vraag…", shortcuts:"Snelkoppelingen", hide:"Verbergen", show:"⚡ Snelkoppelingen",
       greet:[
        "Hallo! Hoe kan ik u vandaag helpen? (Nederlands)"
       ],
       dining:"🍽️ Ontbijt / Restaurants", bakery:"🥖 Bakkerijen", grocery:"🛒 Supermarkten",
       pharmacy:"💊 Apotheken", exchAtm:"💱 Wisselkantoren / ATM", exchange:"💱 Wisselkantoren", atm:"🏧 Geldautomaten",
       wifi:"📶 Wi-Fi", power:"⚡ Stroom", hot_water:"💧 Warm water", ac:"❄️ Airco (AC)",
       induction:"🍳 Inductie-kookplaat", hood:"🌀 Afzuigkap", coffee:"☕ Tchibo-koffiemachine",
       fire_alarm:"🔥 Brandmelder", elevator_phone:"🛗 Lift – service", safe:"🔐 Kluis", keys:"🔑 Reservesleutel",
       laundry:"🧺 Wasruimte", access:"♿️ Toegankelijkheid", smoking:"🚭 Roken",
       luggage:"🎒 Bagageruimte", doorbells:"🔔 Deurbellen", gate:"🚪 Poort (binnen)", trash:"🗑️ Afval",
       doctor:"👩‍⚕️ Arts 24/7", linen_towels:"🧻 Beddengoed / Handdoeken", general:"ℹ️ Algemene vraag"
  },

  it:{ chooseLang:"Scegli una lingua", mainTitle:"Scegli un argomento", subTitle:"Sottoargomento", back:"← Indietro",
       catFood:"Cibo e dintorni", catTech:"Problemi tecnici", catOther:"Altro",
       stillAsk:"Puoi comunque scrivere una domanda qui sotto.",
       contact:"Se non trovi ciò che ti serve, scrivi a David (WhatsApp +420 733 439 733).",
       send:"Invia", type:"Scrivi la tua domanda…", shortcuts:"Scorciatoie", hide:"Nascondi", show:"⚡ Scorciatoie",
       greet:[
        "Ciao! Come posso aiutarti oggi? (italiano)"
       ],
       dining:"🍽️ Colazione / Ristoranti", bakery:"🥖 Panetterie", grocery:"🛒 Supermercati",
       pharmacy:"💊 Farmacie", exchAtm:"💱 Cambio / ATM", exchange:"💱 Cambiavalute", atm:"🏧 Bancomat",
       wifi:"📶 Wi-Fi", power:"⚡ Elettricità", hot_water:"💧 Acqua calda", ac:"❄️ Aria condizionata (AC)",
       induction:"🍳 Piano a induzione", hood:"🌀 Cappa", coffee:"☕ Macchina Tchibo",
       fire_alarm:"🔥 Allarme antincendio", elevator_phone:"🛗 Ascensore – servizio", safe:"🔐 Cassaforte", keys:"🔑 Chiave di scorta",
       laundry:"🧺 Lavanderia", access:"♿️ Accessibilità", smoking:"🚭 Fumo",
       luggage:"🎒 Deposito bagagli", doorbells:"🔔 Campanelli", gate:"🚪 Cancello (interno)", trash:"🗑️ Rifiuti",
       doctor:"👩‍⚕️ Medico 24/7", linen_towels:"🧻 Lenzuola / Asciugamani", general:"ℹ️ Domanda generale"
  },

  da:{ chooseLang:"Vælg sprog", mainTitle:"Vælg et emne", subTitle:"Undertema", back:"← Tilbage",
       catFood:"Mad og i nærheden", catTech:"Tekniske problemer", catOther:"Andet",
       stillAsk:"Du kan stadig skrive dit eget spørgsmål herunder.",
       contact:"Finder du ikke det, du skal bruge, så skriv til David (WhatsApp +420 733 439 733).",
       send:"Send", type:"Skriv dit spørgsmål…", shortcuts:"Genveje", hide:"Skjul", show:"⚡ Genveje",
       greet:[
        "Hej! Hvordan kan jeg hjælpe dig i dag? (dansk)"
       ],
       dining:"🍽️ Morgenmad / Restauranter", bakery:"🥖 Bagerier", grocery:"🛒 Supermarkeder",
       pharmacy:"💊 Apoteker", exchAtm:"💱 Vekselkontorer / ATM", exchange:"💱 Vekselkontorer", atm:"🏧 Hæveautomater",
       wifi:"📶 Wi-Fi", power:"⚡ Strøm", hot_water:"💧 Varmt vand", ac:"❄️ Aircondition (AC)",
       induction:"🍳 Induktionskomfur", hood:"🌀 Emhætte", coffee:"☕ Tchibo kaffemaskine",
       fire_alarm:"🔥 Brandalarm", elevator_phone:"🛗 Elevator – service", safe:"🔐 Pengeskab", keys:"🔑 Ekstra nøgle",
       laundry:"🧺 Vaskeri", access:"♿️ Tilgængelighed", smoking:"🚭 Rygning",
       luggage:"🎒 Bagagerum", doorbells:"🔔 Dørklokker", gate:"🚪 Port (indvendigt)", trash:"🗑️ Affald",
       doctor:"👩‍⚕️ Læge 24/7", linen_towels:"🧻 Sengetøj / Håndklæder", general:"ℹ️ Generelt spørgsmål"
  },

  pl:{ chooseLang:"Wybierz język", mainTitle:"Wybierz temat", subTitle:"Podtemat", back:"← Wstecz",
       catFood:"Jedzenie i okolica", catTech:"Problemy techniczne", catOther:"Inne",
       stillAsk:"Możesz też wpisać własne pytanie poniżej.",
       contact:"Jeśli nie znalazłeś informacji, napisz do Dawida (WhatsApp +420 733 439 733).",
       send:"Wyślij", type:"Wpisz pytanie…", shortcuts:"Skróty", hide:"Ukryj", show:"⚡ Skróty",
       greet:[
        "Cześć! Jak mogę ci dziś pomóc? (polski)"
       ],
       dining:"🍽️ Śniadanie / Restauracje", bakery:"🥖 Piekarnie", grocery:"🛒 Sklepy",
       pharmacy:"💊 Apteki", exchAtm:"💱 Kantory / Bankomaty", exchange:"💱 Kantory", atm:"🏧 Bankomaty",
       wifi:"📶 Wi-Fi", power:"⚡ Prąd", hot_water:"💧 Ciepła woda", ac:"❄️ Klimatyzacja (AC)",
       induction:"🍳 Płyta indukcyjna", hood:"🌀 Okap", coffee:"☕ Ekspres Tchibo",
       fire_alarm:"🔥 Czujnik pożaru", elevator_phone:"🛗 Winda – serwis", safe:"🔐 Sejf", keys:"🔑 Klucz zapasowy",
       laundry:"🧺 Pralnia", access:"♿️ Dostępność", smoking:"🚭 Palenie",
       luggage:"🎒 Przechowalnia bagażu", doorbells:"🔔 Dzwonki", gate:"🚪 Brama (od środka)", trash:"🗑️ Śmieci",
       doctor:"👩‍⚕️ Lekarz 24/7", linen_towels:"🧻 Pościel / Ręczniki", general:"ℹ️ Pytanie ogólne"
  },
};

/** ====== util ====== */
const btnColorForIndex = (i) => {
  const mod = i % 4;
  return mod === 0 ? "var(--blue)" : mod === 1 ? "var(--red)" : mod === 2 ? "var(--yellow)" : "var(--green)";
};

/** ====== sestavení struktur pro UI (labely z tr, sub-klíče v angličtině) ====== */
function makeFlows(dict){
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
    { label:dict.wifi,            sub:"wifi",            kind:"tech" },
    { label:dict.power,           sub:"power",           kind:"tech" },
    { label:dict.hot_water,       sub:"hot_water",       kind:"tech" },
    { label:dict.ac,              sub:"ac",              kind:"tech" },
    { label:dict.induction,       sub:"induction",       kind:"tech" },
    { label:dict.hood,            sub:"hood",            kind:"tech" },
    { label:dict.coffee,          sub:"coffee",          kind:"tech" },
    { label:dict.fire_alarm,      sub:"fire_alarm",      kind:"tech" },
    { label:dict.elevator_phone,  sub:"elevator_phone",  kind:"tech" },
    { label:dict.safe,            sub:"safe",            kind:"tech" },
    { label:dict.keys,            sub:"keys",            kind:"tech" },
  ];

  const OTHER = [
    { label:dict.laundry,        sub:"laundry",       kind:"tech" },
    { label:dict.access,         sub:"access",        kind:"tech" },
    { label:dict.smoking,        sub:"smoking",       kind:"tech" },
    { label:dict.luggage,        sub:"luggage",       kind:"tech" },
    { label:dict.doorbells,      sub:"doorbells",     kind:"tech" },
    { label:dict.gate,           sub:"gate",          kind:"tech" },
    { label:dict.trash,          sub:"trash",         kind:"tech" },
    { label:dict.doctor,         sub:"doctor",        kind:"tech" },
    { label:dict.linen_towels,   sub:"linen_towels",  kind:"tech" },
    { label:dict.general,        prompt:"help",       kind:"free" },
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

  const rootFood = lang && stack.length > 0 && stack[stack.length - 1]?.label === tr[lang||"en"].catFood;
  const rootTech = lang && stack.length > 0 && stack[stack.length - 1]?.label === tr[lang||"en"].catTech;

  const onChipClick = async (n) => {
    if (n.children) return openNode(n);

    // posíláme uživateli zobrazený text, ale do controlu dáváme anglický sub + intent
    if (n.kind === "local") {
      setShortcutsOpen(false);
      return sendPrompt(n.label, { intent:"local", sub:n.sub });
    }
    if (n.kind === "tech") {
      setShortcutsOpen(false);
      return sendPrompt(n.label, { intent:"tech", sub:n.sub });
    }
    // volný text (fallback)
    setShortcutsOpen(false);
    return sendPrompt(n.label || "Help");
  };

  // Greeting blok (vícejazyčný výpis)
  const Greeting = () => (
    <div className="bubble bot" style={{ display:"inline-block", maxWidth:"100%" }}>
      {/* Pozdravy: EN nahoře + ostatní řádky */}
      <div style={{marginBottom:10}}>
        <strong>{tr.en.greet[0]}</strong>
        <br/>{tr.cs.greet[0]}
        <br/>{tr.es.greet[0]}
        <br/>{tr.de.greet[0]}
        <br/>{tr.fr.greet[0]}
        <br/>{tr.ru.greet[0]}
        <br/>{tr.uk.greet[0]}
        <br/>{tr.nl.greet[0]}
        <br/>{tr.it.greet[0]}
        <br/>{tr.da.greet[0]}
        <br/>{tr.pl.greet[0]}
      </div>

      {/* Angličtina – samostatně (větší) */}
      <div style={{marginBottom:8}}>
        <button
          className="chipPrimary"
          style={{ ["--btn"]: "var(--blue)", width:"100%" }}
          onClick={() => { setLang("en"); resetToRoot(); }}
        >
          {LANGS.en}
        </button>
      </div>

      {/* Ostatní jazyky – po dvojicích */}
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
                <button className="backBtn" onClick={() => setShortcutsOpen(false)}>{tr[lang||"en"].hide}</button>
                <button className="backBtn" onClick={() => { setLang(null); setStack([]); }}>🌐 {tr[lang||"en"].chooseLang}</button>
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
                    title={n.sub || ""}
                  >
                    {n.label}
                  </button>
                )
              )}
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
