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
       pickSsid:"Vyberte SSID", showMyWifi:"Zobrazit moje heslo",
       aRooms:"🛏️ Pokoje", aKitchen:"🍳 Kuchyň", aBathroom:"🛁 Koupelna", aService:"🧰 Prádelna, úschovna, odpadky" },

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
       pickSsid:"Pick the SSID", showMyWifi:"Show my password",
       aRooms:"🛏️ Rooms", aKitchen:"🍳 Kitchen", aBathroom:"🛁 Bathroom", aService:"🧰 Laundry, luggage, trash" },

  // Další jazyky – UI bere přesně zvolený jazyk:
  es:{ chooseLang:"Elige un idioma", mainTitle:"Elige un tema", subTitle:"Subtema", back:"← Atrás",
       instructionsLabel:"📄 Instrucciones de check-in",
       catFood:"Comida y alrededores", catTech:"Problemas técnicos", catOther:"Otros", catTransport:"Transporte", catAmenities:"Servicios del hotel",
       tourLabel:"🧭 Tour virtual 3D", tourOpenMsg:"[Abrir el tour 3D]("+MATTERPORT_URL+")",
       stillAsk:"Elige una de las opciones abajo.",
       contact:"Si no encuentras lo que necesitas, escribe a David (WhatsApp +420 733 439 733).",
       hide:"Ocultar",
       foodDelivery:"🛵 Delivery de comida", transportInfo:"🗺️ Moverse por Praga",
       diningLabel:"🍽️ Desayuno / Restaurantes", bakeryLabel:"🥖 Panaderías",
       cafeBarGroupLabel:"☕/🍸 Café / Bar", cafeLabel:"☕ Cafés", barLabel:"🍸 Bares",
       groceryLabel:"🛒 Supermercados", pharmacyLabel:"💊 Farmacias",
       moneyGroupLabel:"💱 Casas de cambio / Cajeros", exchangeLabel:"💱 Casas de cambio", atmLabel:"🏧 Cajeros automáticos",
       wifiLabel:"📶 Wi-Fi", powerLabel:"⚡ Electricidad", hotWaterLabel:"💧 Agua caliente",
       acLabel:"❄️ Aire acondicionado (AC)", inductionLabel:"🍳 Placa de inducción", hoodLabel:"🌀 Campana extractora",
       coffeeLabel:"☕ Cafetera Tchibo", fireAlarmLabel:"🔥 Detector de humo",
       elevatorPhoneLabel:"🛗 Ascensor – servicio", safeLabel:"🔐 Caja fuerte",
       spareKeyLabel:"🔑 Llave de repuesto",
       laundryLabel:"🧺 Lavandería", accessLabel:"♿️ Accesibilidad", smokingLabel:"🚭 Fumar",
       luggageLabel:"🎒 Consigna de equipaje", doorbellsLabel:"🔔 Timbres",
       gateLabel:"🚪 Puerta (interior)", trashLabel:"🗑️ Basura / contenedores",
       doctorLabel:"👩‍⚕️ Médico 24/7", linenLabel:"🧻 Ropa de cama / Toallas",
       pickRoom:"Elige el número de apartamento", floor:"Planta", room:"Habitación", confirm:"Mostrar", cancel:"Cerrar",
       wifiStatus:"¿Funciona el Wi-Fi?", ok:"Funciona", notOk:"No funciona",
       pickSsid:"Elige el SSID", showMyWifi:"Mostrar mi contraseña",
       aRooms:"🛏️ Habitaciones", aKitchen:"🍳 Cocina", aBathroom:"🛁 Baño", aService:"🧰 Lavandería, consigna, basura" },

  de:{ chooseLang:"Sprache auswählen", mainTitle:"Thema wählen", subTitle:"Unterthema", back:"← Zurück",
       instructionsLabel:"📄 Check-in-Anleitung",
       catFood:"Essen & Umgebung", catTech:"Technische Probleme", catOther:"Sonstiges", catTransport:"Transport", catAmenities:"Hotelausstattung",
       tourLabel:"🧭 3D-Rundgang", tourOpenMsg:"[3D-Rundgang öffnen]("+MATTERPORT_URL+")",
       stillAsk:"Wähle eine Option unten.",
       contact:"Falls Sie nicht finden, was Sie brauchen, schreiben Sie David (WhatsApp +420 733 439 733).",
       hide:"Ausblenden",
       foodDelivery:"🛵 Essen liefern lassen", transportInfo:"🗺️ Unterwegs in Prag",
       diningLabel:"🍽️ Frühstück / Restaurants", bakeryLabel:"🥖 Bäckereien",
       cafeBarGroupLabel:"☕/🍸 Café / Bar", cafeLabel:"☕ Cafés", barLabel:"🍸 Bars",
       groceryLabel:"🛒 Supermärkte", pharmacyLabel:"💊 Apotheken",
       moneyGroupLabel:"💱 Wechselstuben / Geldautomaten", exchangeLabel:"💱 Wechselstuben", atmLabel:"🏧 Geldautomaten",
       wifiLabel:"📶 Wi-Fi", powerLabel:"⚡ Strom", hotWaterLabel:"💧 Warmwasser",
       acLabel:"❄️ Klimaanlage (AC)", inductionLabel:"🍳 Induktionskochfeld", hoodLabel:"🌀 Dunstabzug",
       coffeeLabel:"☕ Tchibo-Kaffeemaschine", fireAlarmLabel:"🔥 Rauchmelder",
       elevatorPhoneLabel:"🛗 Aufzug – Service", safeLabel:"🔐 Safe",
       spareKeyLabel:"🔑 Ersatzschlüssel",
       laundryLabel:"🧺 Wäscherei", accessLabel:"♿️ Barrierefreiheit", smokingLabel:"🚭 Rauchen",
       luggageLabel:"🎒 Gepäckaufbewahrung", doorbellsLabel:"🔔 Klingeln",
       gateLabel:"🚪 Tor (innen)", trashLabel:"🗑️ Müll / Tonnen",
       doctorLabel:"👩‍⚕️ Arzt 24/7", linenLabel:"🧻 Bettwäsche / Handtücher",
       pickRoom:"Apartmentnummer auswählen", floor:"Stockwerk", room:"Zimmer", confirm:"Anzeigen", cancel:"Schließen",
       wifiStatus:"Funktioniert das Wi-Fi?", ok:"Funktioniert", notOk:"Funktioniert nicht",
       pickSsid:"SSID auswählen", showMyWifi:"Mein Passwort anzeigen",
       aRooms:"🛏️ Zimmer", aKitchen:"🍳 Küche", aBathroom:"🛁 Badezimmer", aService:"🧰 Wäscherei, Gepäck, Müll" },

  fr:{ chooseLang:"Choisissez la langue", mainTitle:"Choisissez un sujet", subTitle:"Sous-sujet", back:"← Retour",
       instructionsLabel:"📄 Instructions de check-in",
       catFood:"Nourriture & alentours", catTech:"Problèmes techniques", catOther:"Autres", catTransport:"Transport", catAmenities:"Services de l’hôtel",
       tourLabel:"🧭 Visite virtuelle 3D", tourOpenMsg:"[Ouvrir la visite 3D]("+MATTERPORT_URL+")",
       stillAsk:"Choisissez une option ci-dessous.",
       contact:"Si vous ne trouvez pas ce qu’il vous faut, contactez David (WhatsApp +420 733 439 733).",
       hide:"Masquer",
       foodDelivery:"🛵 Livraison de repas", transportInfo:"🗺️ Se déplacer à Prague",
       diningLabel:"🍽️ Petit-déjeuner / Restaurants", bakeryLabel:"🥖 Boulangeries",
       cafeBarGroupLabel:"☕/🍸 Café / Bar", cafeLabel:"☕ Cafés", barLabel:"🍸 Bars",
       groceryLabel:"🛒 Épiceries", pharmacyLabel:"💊 Pharmacies",
       moneyGroupLabel:"💱 Bureaux de change / DAB", exchangeLabel:"💱 Bureaux de change", atmLabel:"🏧 Distributeurs",
       wifiLabel:"📶 Wi-Fi", powerLabel:"⚡ Électricité", hotWaterLabel:"💧 Eau chaude",
       acLabel:"❄️ Climatisation (AC)", inductionLabel:"🍳 Plaque à induction", hoodLabel:"🌀 Hotte",
       coffeeLabel:"☕ Machine à café Tchibo", fireAlarmLabel:"🔥 Détecteur de fumée",
       elevatorPhoneLabel:"🛗 Ascenseur – service", safeLabel:"🔐 Coffre-fort",
       spareKeyLabel:"🔑 Clé de secours",
       laundryLabel:"🧺 Laverie", accessLabel:"♿️ Accessibilité", smokingLabel:"🚭 Fumer",
       luggageLabel:"🎒 Consigne à bagages", doorbellsLabel:"🔔 Sonnette",
       gateLabel:"🚪 Portail (intérieur)", trashLabel:"🗑️ Poubelles / déchets",
       doctorLabel:"👩‍⚕️ Médecin 24/7", linenLabel:"🧻 Linge / Serviettes",
       pickRoom:"Choisissez votre numéro d’appartement", floor:"Étage", room:"Pièce", confirm:"Afficher", cancel:"Fermer",
       wifiStatus:"Le Wi-Fi fonctionne ?", ok:"Fonctionne", notOk:"Ne fonctionne pas",
       pickSsid:"Choisir le SSID", showMyWifi:"Afficher mon mot de passe",
       aRooms:"🛏️ Chambres", aKitchen:"🍳 Cuisine", aBathroom:"🛁 Salle de bain", aService:"🧰 Laverie, bagages, déchets" },

  ru:{ chooseLang:"Выберите язык", mainTitle:"Выберите тему", subTitle:"Подтема", back:"← Назад",
       instructionsLabel:"📄 Инструкции по заселению",
       catFood:"Еда и поблизости", catTech:"Технические вопросы", catOther:"Другое", catTransport:"Транспорт", catAmenities:"Удобства отеля",
       tourLabel:"🧭 3D-тур по отелю", tourOpenMsg:"[Открыть 3D-тур]("+MATTERPORT_URL+")",
       stillAsk:"Выберите один из вариантов ниже.",
       contact:"Если вы не нашли нужную информацию, напишите Давиду (WhatsApp +420 733 439 733).",
       hide:"Скрыть",
       foodDelivery:"🛵 Доставка еды", transportInfo:"🗺️ Как передвигаться по Праге",
       diningLabel:"🍽️ Завтрак / Рестораны", bakeryLabel:"🥖 Пекарни",
       cafeBarGroupLabel:"☕/🍸 Кафе / Бар", cafeLabel:"☕ Кафе", barLabel:"🍸 Бары",
       groceryLabel:"🛒 Супермаркеты", pharmacyLabel:"💊 Аптеки",
       moneyGroupLabel:"💱 Обмен / Банкоматы", exchangeLabel:"💱 Обменные пункты", atmLabel:"🏧 Банкоматы",
       wifiLabel:"📶 Wi-Fi", powerLabel:"⚡ Электричество", hotWaterLabel:"💧 Горячая вода",
       acLabel:"❄️ Кондиционер (AC)", inductionLabel:"🍳 Индукционная плита", hoodLabel:"🌀 Вытяжка",
       coffeeLabel:"☕ Кофемашина Tchibo", fireAlarmLabel:"🔥 Пожарный датчик",
       elevatorPhoneLabel:"🛗 Лифт – сервис", safeLabel:"🔐 Сейф",
       spareKeyLabel:"🔑 Запасной ключ",
       laundryLabel:"🧺 Прачечная", accessLabel:"♿️ Безбарьерность", smokingLabel:"🚭 Курение",
       luggageLabel:"🎒 Камера хранения", doorbellsLabel:"🔔 Домофоны",
       gateLabel:"🚪 Ворота (изнутри)", trashLabel:"🗑️ Мусор / контейнеры",
       doctorLabel:"👩‍⚕️ Врач 24/7", linenLabel:"🧻 Постель / Полотенца",
       pickRoom:"Выберите номер апартамента", floor:"Этаж", room:"Комната", confirm:"Показать", cancel:"Закрыть",
       wifiStatus:"Работает ли Wi-Fi?", ok:"Работает", notOk:"Не работает",
       pickSsid:"Выберите SSID", showMyWifi:"Показать мой пароль",
       aRooms:"🛏️ Комнаты", aKitchen:"🍳 Кухня", aBathroom:"🛁 Ванная", aService:"🧰 Прачечная, багаж, мусор" },

  uk:{ chooseLang:"Оберіть мову", mainTitle:"Оберіть тему", subTitle:"Підтема", back:"← Назад",
       instructionsLabel:"📄 Інструкції поселення",
       catFood:"Їжа та поруч", catTech:"Технічні питання", catOther:"Інше", catTransport:"Транспорт", catAmenities:"Зручності готелю",
       tourLabel:"🧭 3D-тур готелем", tourOpenMsg:"[Відкрити 3D-тур]("+MATTERPORT_URL+")",
       stillAsk:"Виберіть один із варіантів нижче.",
       contact:"Якщо не знайшли потрібну інформацію, напишіть Давиду (WhatsApp +420 733 439 733).",
       hide:"Приховати",
       foodDelivery:"🛵 Доставка їжі", transportInfo:"🗺️ Пересування Прагою",
       diningLabel:"🍽️ Сніданок / Ресторани", bakeryLabel:"🥖 Пекарні",
       cafeBarGroupLabel:"☕/🍸 Кав’ярня / Бар", cafeLabel:"☕ Кав’ярні", barLabel:"🍸 Бари",
       groceryLabel:"🛒 Супермаркети", pharmacyLabel:"💊 Аптеки",
       moneyGroupLabel:"💱 Обмін / Банкомати", exchangeLabel:"💱 Обмін валют", atmLabel:"🏧 Банкомати",
       wifiLabel:"📶 Wi-Fi", powerLabel:"⚡ Електрика", hotWaterLabel:"💧 Гаряча вода",
       acLabel:"❄️ Кондиціонер (AC)", inductionLabel:"🍳 Індукційна плита", hoodLabel:"🌀 Витяжка",
       coffeeLabel:"☕ Кавоварка Tchibo", fireAlarmLabel:"🔥 Пожежний датчик",
       elevatorPhoneLabel:"🛗 Ліфт – сервіс", safeLabel:"🔐 Сейф",
       spareKeyLabel:"🔑 Запасний ключ",
       laundryLabel:"🧺 Пральня", accessLabel:"♿️ Безбар’єрність", smokingLabel:"🚭 Паління",
       luggageLabel:"🎒 Камера зберігання", doorbellsLabel:"🔔 Дзвінки",
       gateLabel:"🚪 Ворота (зсередини)", trashLabel:"🗑️ Сміття / контейнери",
       doctorLabel:"👩‍⚕️ Лікар 24/7", linenLabel:"🧻 Постіль / Рушники",
       pickRoom:"Оберіть номер апартаменту", floor:"Поверх", room:"Кімната", confirm:"Показати", cancel:"Закрити",
       wifiStatus:"Працює Wi-Fi?", ok:"Працює", notOk:"Не працює",
       pickSsid:"Оберіть SSID", showMyWifi:"Показати мій пароль",
       aRooms:"🛏️ Кімнати", aKitchen:"🍳 Кухня", aBathroom:"🛁 Ванна", aService:"🧰 Пральня, багаж, сміття" },

  nl:{ chooseLang:"Kies een taal", mainTitle:"Kies een onderwerp", subTitle:"Subonderwerp", back:"← Terug",
       instructionsLabel:"📄 Check-in instructies",
       catFood:"Eten & in de buurt", catTech:"Technische problemen", catOther:"Overig", catTransport:"Vervoer", catAmenities:"Hotelfaciliteiten",
       tourLabel:"🧭 3D-tour", tourOpenMsg:"[3D-tour openen]("+MATTERPORT_URL+")",
       stillAsk:"Kies een optie hieronder.",
       contact:"Kun je niet vinden wat je zoekt? Stuur David een bericht (WhatsApp +420 733 439 733).",
       hide:"Verbergen",
       foodDelivery:"🛵 Maaltijdbezorging", transportInfo:"🗺️ Reizen door Praag",
       diningLabel:"🍽️ Ontbijt / Restaurants", bakeryLabel:"🥖 Bakkerijen",
       cafeBarGroupLabel:"☕/🍸 Café / Bar", cafeLabel:"☕ Cafés", barLabel:"🍸 Bars",
       groceryLabel:"🛒 Supermarkten", pharmacyLabel:"💊 Apotheken",
       moneyGroupLabel:"💱 Wisselkantoren / Geldautomaten", exchangeLabel:"💱 Wisselkantoren", atmLabel:"🏧 Geldautomaten",
       wifiLabel:"📶 Wi-Fi", powerLabel:"⚡ Elektriciteit", hotWaterLabel:"💧 Warm water",
       acLabel:"❄️ Airconditioning (AC)", inductionLabel:"🍳 Inductiekookplaat", hoodLabel:"🌀 Afzuigkap",
       coffeeLabel:"☕ Tchibo-koffiemachine", fireAlarmLabel:"🔥 Brandmelder",
       elevatorPhoneLabel:"🛗 Lift – service", safeLabel:"🔐 Kluis",
       spareKeyLabel:"🔑 Reservésleutel",
       laundryLabel:"🧺 Wasserij", accessLabel:"♿️ Toegankelijkheid", smokingLabel:"🚭 Roken",
       luggageLabel:"🎒 Bagageopslag", doorbellsLabel:"🔔 Deurbellen",
       gateLabel:"🚪 Poort (binnenzijde)", trashLabel:"🗑️ Afval / containers",
       doctorLabel:"👩‍⚕️ Arts 24/7", linenLabel:"🧻 Beddengoed / Handdoeken",
       pickRoom:"Kies je appartementnummer", floor:"Verdieping", room:"Kamer", confirm:"Weergeven", cancel:"Sluiten",
       wifiStatus:"Werkt de Wi-Fi?", ok:"Werkt", notOk:"Werkt niet",
       pickSsid:"Kies de SSID", showMyWifi:"Mijn wachtwoord tonen",
       aRooms:"🛏️ Kamers", aKitchen:"🍳 Keuken", aBathroom:"🛁 Badkamer", aService:"🧰 Wasserij, bagage, afval" },

  it:{ chooseLang:"Scegli la lingua", mainTitle:"Scegli un argomento", subTitle:"Sottoargomento", back:"← Indietro",
       instructionsLabel:"📄 Istruzioni di check-in",
       catFood:"Cibo e dintorni", catTech:"Problemi tecnici", catOther:"Altro", catTransport:"Trasporti", catAmenities:"Servizi dell’hotel",
       tourLabel:"🧭 Tour 3D", tourOpenMsg:"[Apri il tour 3D]("+MATTERPORT_URL+")",
       stillAsk:"Scegli una delle opzioni sotto.",
       contact:"Se non trovi ciò che ti serve, scrivi a David (WhatsApp +420 733 439 733).",
       hide:"Nascondi",
       foodDelivery:"🛵 Consegna di cibo", transportInfo:"🗺️ Muoversi a Praga",
       diningLabel:"🍽️ Colazione / Ristoranti", bakeryLabel:"🥖 Panetterie",
       cafeBarGroupLabel:"☕/🍸 Caffè / Bar", cafeLabel:"☕ Caffetterie", barLabel:"🍸 Bar",
       groceryLabel:"🛒 Supermercati", pharmacyLabel:"💊 Farmacie",
       moneyGroupLabel:"💱 Cambio / Bancomat", exchangeLabel:"💱 Cambiavalute", atmLabel:"🏧 Bancomat",
       wifiLabel:"📶 Wi-Fi", powerLabel:"⚡ Elettricità", hotWaterLabel:"💧 Acqua calda",
       acLabel:"❄️ Aria condizionata (AC)", inductionLabel:"🍳 Piano a induzione", hoodLabel:"🌀 Cappa aspirante",
       coffeeLabel:"☕ Macchina da caffè Tchibo", fireAlarmLabel:"🔥 Rilevatore di fumo",
       elevatorPhoneLabel:"🛗 Ascensore – assistenza", safeLabel:"🔐 Cassaforte",
       spareKeyLabel:"🔑 Chiave di riserva",
       laundryLabel:"🧺 Lavanderia", accessLabel:"♿️ Accessibilità", smokingLabel:"🚭 Fumo",
       luggageLabel:"🎒 Deposito bagagli", doorbellsLabel:"🔔 Campanelli",
       gateLabel:"🚪 Cancello (interno)", trashLabel:"🗑️ Rifiuti / bidoni",
       doctorLabel:"👩‍⚕️ Medico 24/7", linenLabel:"🧻 Lenzuola / Asciugamani",
       pickRoom:"Scegli il numero dell’appartamento", floor:"Piano", room:"Camera", confirm:"Mostra", cancel:"Chiudi",
       wifiStatus:"Il Wi-Fi funziona?", ok:"Funziona", notOk:"Non funziona",
       pickSsid:"Scegli l’SSID", showMyWifi:"Mostra la mia password",
       aRooms:"🛏️ Camere", aKitchen:"🍳 Cucina", aBathroom:"🛁 Bagno", aService:"🧰 Lavanderia, deposito, rifiuti" },

  da:{ chooseLang:"Vælg sprog", mainTitle:"Vælg et emne", subTitle:"Underemne", back:"← Tilbage",
       instructionsLabel:"📄 Check-in instruktioner",
       catFood:"Mad og nærområde", catTech:"Tekniske problemer", catOther:"Andet", catTransport:"Transport", catAmenities:"Hotelfaciliteter",
       tourLabel:"🧭 3D-rundtur", tourOpenMsg:"[Åbn 3D-rundturen]("+MATTERPORT_URL+")",
       stillAsk:"Vælg en af mulighederne herunder.",
       contact:"Hvis du ikke finder det, du har brug for, så skriv til David (WhatsApp +420 733 439 733).",
       hide:"Skjul",
       foodDelivery:"🛵 Madudbringning", transportInfo:"🗺️ Rundt i Prag",
       diningLabel:"🍽️ Morgenmad / Restauranter", bakeryLabel:"🥖 Bagerier",
       cafeBarGroupLabel:"☕/🍸 Café / Bar", cafeLabel:"☕ Caféer", barLabel:"🍸 Barer",
       groceryLabel:"🛒 Dagligvarebutikker", pharmacyLabel:"💊 Apoteker",
       moneyGroupLabel:"💱 Veksling / Hæveautomater", exchangeLabel:"💱 Vekselkontorer", atmLabel:"🏧 Hæveautomater",
       wifiLabel:"📶 Wi-Fi", powerLabel:"⚡ Strøm", hotWaterLabel:"💧 Varmt vand",
       acLabel:"❄️ Aircondition (AC)", inductionLabel:"🍳 Induktionskogeplade", hoodLabel:"🌀 Emhætte",
       coffeeLabel:"☕ Tchibo kaffemaskine", fireAlarmLabel:"🔥 Røgalarm",
       elevatorPhoneLabel:"🛗 Elevator – service", safeLabel:"🔐 Pengeskab",
       spareKeyLabel:"🔑 Ekstra nøgle",
       laundryLabel:"🧺 Vaskeri", accessLabel:"♿️ Tilgængelighed", smokingLabel:"🚭 Rygning",
       luggageLabel:"🎒 Bagageopbevaring", doorbellsLabel:"🔔 Dørklokker",
       gateLabel:"🚪 Port (indvendig)", trashLabel:"🗑️ Affald / beholdere",
       doctorLabel:"👩‍⚕️ Læge 24/7", linenLabel:"🧻 Sengetøj / Håndklæder",
       pickRoom:"Vælg dit lejlighedsnummer", floor:"Etage", room:"Værelse", confirm:"Vis", cancel:"Luk",
       wifiStatus:"Virker Wi-Fi'en?", ok:"Virker", notOk:"Virker ikke",
       pickSsid:"Vælg SSID", showMyWifi:"Vis min adgangskode",
       aRooms:"🛏️ Værelser", aKitchen:"🍳 Køkken", aBathroom:"🛁 Badeværelse", aService:"🧰 Vaskeri, bagage, affald" },

  pl:{ chooseLang:"Wybierz język", mainTitle:"Wybierz temat", subTitle:"Podtemat", back:"← Wstecz",
       instructionsLabel:"📄 Instrukcje zameldowania",
       catFood:"Jedzenie i okolica", catTech:"Problemy techniczne", catOther:"Inne", catTransport:"Transport", catAmenities:"Udogodnienia hotelu",
       tourLabel:"🧭 Wirtualna wycieczka 3D", tourOpenMsg:"[Otwórz wycieczkę 3D]("+MATTERPORT_URL+")",
       stillAsk:"Wybierz jedną z opcji poniżej.",
       contact:"Jeśli nie znajdziesz potrzebnych informacji, napisz do Davida (WhatsApp +420 733 439 733).",
       hide:"Ukryj",
       foodDelivery:"🛵 Dostawa jedzenia", transportInfo:"🗺️ Poruszanie się po Pradze",
       diningLabel:"🍽️ Śniadania / Restauracje", bakeryLabel:"🥖 Piekarnie",
       cafeBarGroupLabel:"☕/🍸 Kawiarnia / Bar", cafeLabel:"☕ Kawiarnie", barLabel:"🍸 Bary",
       groceryLabel:"🛒 Sklepy spożywcze", pharmacyLabel:"💊 Apteki",
       moneyGroupLabel:"💱 Kantory / Bankomaty", exchangeLabel:"💱 Kantory", atmLabel:"🏧 Bankomaty",
       wifiLabel:"📶 Wi-Fi", powerLabel:"⚡ Prąd", hotWaterLabel:"💧 Ciepła woda",
       acLabel:"❄️ Klimatyzacja (AC)", inductionLabel:"🍳 Płyta indukcyjna", hoodLabel:"🌀 Okap",
       coffeeLabel:"☕ Ekspres Tchibo", fireAlarmLabel:"🔥 Czujnik dymu",
       elevatorPhoneLabel:"🛗 Winda – serwis", safeLabel:"🔐 Sejf",
       spareKeyLabel:"🔑 Zapasowy klucz",
       laundryLabel:"🧺 Pralnia", accessLabel:"♿️ Dostępność", smokingLabel:"🚭 Palenie",
       luggageLabel:"🎒 Przechowalnia bagażu", doorbellsLabel:"🔔 Dzwonki",
       gateLabel:"🚪 Brama (od środka)", trashLabel:"🗑️ Śmieci / kosze",
       doctorLabel:"👩‍⚕️ Lekarz 24/7", linenLabel:"🧻 Pościel / Ręczniki",
       pickRoom:"Wybierz numer apartamentu", floor:"Piętro", room:"Pokój", confirm:"Pokaż", cancel:"Zamknij",
       wifiStatus:"Czy Wi-Fi działa?", ok:"Działa", notOk:"Nie działa",
       pickSsid:"Wybierz SSID", showMyWifi:"Pokaż moje hasło",
       aRooms:"🛏️ Pokoje", aKitchen:"🍳 Kuchnia", aBathroom:"🛁 Łazienka", aService:"🧰 Pralnia, bagaż, śmieci" }
};

/** ===== helper bez fallbacku ===== */
// Použij vždy JEN aktivní jazyk; pokud klíč chybí, vrať název klíče (aby se chyba odhalila).
const t = (lang, key) => (tr[lang] && tr[lang][key]) ?? key;

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
  const [roomSheet, setRoomSheet] = useState({ open:false, floor:null, last:null }); // keys (interní)
  const [wifiRoomSheet, setWifiRoomSheet] = useState({ open:false, floor:null, last:null });
  const [wifiSsidSheet, setWifiSsidSheet] = useState({ open:false, ssid:null });

  // CTA tlačítka pod bublinou
  const [showKeysCta, setShowKeysCta] = useState(false);
  const [wifiCtas, setWifiCtas] = useState({ showPassword:false, showNotOk:false });

  const scrollerRef = useRef(null);
  const shortcutsRef = useRef(null);

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
  function makeFlows(activeLang){
    const FOOD = [
      { label: t(activeLang,"diningLabel"),   control:{ intent:"local", sub:"dining" } },
      { label: t(activeLang,"bakeryLabel"),   control:{ intent:"local", sub:"bakery" } },
      { label: t(activeLang,"cafeBarGroupLabel"), children:[
        { label: t(activeLang,"cafeLabel"), control:{ intent:"local", sub:"cafe" } },
        { label: t(activeLang,"barLabel"),  control:{ intent:"local", sub:"bar"  } },
      ]},
      { label: t(activeLang,"groceryLabel"),  control:{ intent:"local", sub:"grocery" } },
      { label: t(activeLang,"pharmacyLabel"), control:{ intent:"local", sub:"pharmacy" } },
      { label: t(activeLang,"foodDelivery"),  control:{ intent:"tech",  sub:"food_delivery" } },
      { label: t(activeLang,"moneyGroupLabel"), children:[
        { label: t(activeLang,"exchangeLabel"), control:{ intent:"local", sub:"exchange" } },
        { label: t(activeLang,"atmLabel"),      control:{ intent:"local", sub:"atm" } },
      ]},
    ];

    const TECH = [
      { label: t(activeLang,"wifiLabel"),            control:{ intent:"tech", sub:"wifi", kind:"wifi" } },
      { label: t(activeLang,"powerLabel"),           control:{ intent:"tech", sub:"power" } },
      { label: t(activeLang,"hotWaterLabel"),        control:{ intent:"tech", sub:"hot_water" } },
      { label: t(activeLang,"acLabel"),              control:{ intent:"tech", sub:"ac" } },
      { label: t(activeLang,"inductionLabel"),       control:{ intent:"tech", sub:"induction" } },
      { label: t(activeLang,"hoodLabel"),            control:{ intent:"tech", sub:"hood" } },
      { label: t(activeLang,"coffeeLabel"),          control:{ intent:"tech", sub:"coffee" } },
      { label: t(activeLang,"fireAlarmLabel"),       control:{ intent:"tech", sub:"fire_alarm" } },
      { label: t(activeLang,"elevatorPhoneLabel"),   control:{ intent:"tech", sub:"elevator_phone" } },
      { label: t(activeLang,"safeLabel"),            control:{ intent:"tech", sub:"safe" } },
      { label: t(activeLang,"spareKeyLabel"),        control:{ intent:"tech", sub:"keys" } },
    ];

    const TRANSPORT = [
      { label: t(activeLang,"transportInfo"), control:{ intent:"tech", sub:"transport" } },
    ];

    const AMENITIES = [
      { label: t(activeLang,"aRooms"),   control:{ intent:"amenities", sub:"rooms" } },
      { label: t(activeLang,"aKitchen"), control:{ intent:"amenities", sub:"kitchen" } },
      { label: t(activeLang,"aBathroom"),control:{ intent:"amenities", sub:"bathroom" } },
      { label: t(activeLang,"aService"), control:{ intent:"amenities", sub:"service" } },
    ];

    const OTHER = [
      { label: t(activeLang,"laundryLabel"),     control:{ intent:"tech", sub:"laundry" } },
      { label: t(activeLang,"accessLabel"),      control:{ intent:"tech", sub:"access" } },
      { label: t(activeLang,"smokingLabel"),     control:{ intent:"tech", sub:"smoking" } },
      { label: t(activeLang,"luggageLabel"),     control:{ intent:"tech", sub:"luggage" } },
      { label: t(activeLang,"doorbellsLabel"),   control:{ intent:"tech", sub:"doorbells" } },
      { label: t(activeLang,"gateLabel"),        control:{ intent:"tech", sub:"gate" } },
      { label: t(activeLang,"trashLabel"),       control:{ intent:"tech", sub:"trash" } },
      { label: t(activeLang,"doctorLabel"),      control:{ intent:"tech", sub:"doctor" } },
      { label: t(activeLang,"linenLabel"),       control:{ intent:"tech", sub:"linen_towels" } },
    ];

    return [
      { label: t(activeLang,"instructionsLabel"), control:{ intent:"tech", sub:"stay_instructions" } },
      { label: t(activeLang,"tourLabel"), action:"tour" },
      { label: t(activeLang,"wifiLabel"), control:{ intent:"tech", sub:"wifi", kind:"wifi" } },
      { label: t(activeLang,"catFood"),      children:FOOD },
      { label: t(activeLang,"catTech"),      children:TECH },
      { label: t(activeLang,"catTransport"), children:TRANSPORT },
      { label: t(activeLang,"catAmenities"), children:AMENITIES },
      { label: t(activeLang,"catOther"),     children:OTHER },
    ];
  }
  const FLOWS = useMemo(() => (lang ? makeFlows(lang) : []), [lang]);

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
      // tourOpenMsg ber jen z vybraného jazyka
      setChat(c => [...c, { role:"assistant", content: tr[lang]?.tourOpenMsg || "Link" }]);
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
    setWifiCtas({ showPassword:false, showNotOk:true }); // po odeslání pokoje zobraz „Nefunguje“
    return sendText(room);
  };

  const confirmWifiSsid = () => {
    if (!wifiSsidSheet.ssid) return;
    const ssid = wifiSsidSheet.ssid;
    setWifiSsidSheet({ open:false, ssid:null });
    setWifiCtas({ showPassword:false, showNotOk:false });
    return sendText(ssid);
  };

  // Pomocné: výběr jazyka – EN první, ostatní ve dvojicích
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
              <strong>{stack.length === 0 ? t(lang,"mainTitle") : t(lang,"subTitle")}</strong>
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
                    {t(lang,"back")}
                  </button>
                )}
                <button className="backBtn" onClick={() => { setShortcutsOpen(false); }}>
                  {t(lang,"hide")}
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
                  🌐 {t(lang || "cs","chooseLang")}
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

            <div className="tips" style={{ marginTop:8 }}>{t(lang,"stillAsk")}</div>
          </div>
        )}

        {/* FAB: když jsou zkratky zavřené → červené tlačítko „← Zpět“ (jen znovu otevře menu) */}
        {!shortcutsOpen && lang && (
          <button
            className="fab fabBack"
            onClick={() => {
              setShortcutsOpen(true);
              requestAnimationFrame(() => {
                shortcutsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
              });
            }}
            title={t(lang,"back")}
          >
            {t(lang,"back")}
          </button>
        )}

        {/* Kontaktní lišta */}
        <div className="contactBar">{t(lang,"contact")}</div>
      </div>

      {/* ===== CTA STACK ===== */}
      <div className="fabStack" aria-live="polite">
        {showKeysCta && (
          <button className="fabAction" onClick={() => setRoomSheet({ open:true, floor:null, last:null })}>
            {t(lang,"pickRoom")}
          </button>
        )}
        {wifiCtas.showPassword && (
          <button className="fabAction" onClick={() => setWifiRoomSheet({ open:true, floor:null, last:null })}>
            {t(lang,"showMyWifi")}
          </button>
        )}
        {wifiCtas.showNotOk && (
          <button className="fabAction" onClick={() => setWifiSsidSheet({ open:true, ssid:null })}>
            {t(lang,"notOk")}
          </button>
        )}
      </div>

      {/* OVERLAY: Náhradní klíč – výběr pokoje */}
      {roomSheet.open && (
        <div className="overlay" onClick={()=>setRoomSheet(s=>({ ...s, open:false }))}>
          <div className="sheet" onClick={(e)=>e.stopPropagation()}>
            <h4>{t(lang,"pickRoom")}</h4>
            <div className="tips" style={{marginBottom:6}}>{t(lang,"floor")}</div>
            <div className="pillRow" style={{marginBottom:8}}>
              {[0,1,2,3].map(f=>(
                <button key={f} className={`pill ${roomSheet.floor===f?'active':''}`} onClick={()=>setRoomSheet(s=>({...s, floor:f}))}>
                  {f}
                </button>
              ))}
            </div>
            <div className="tips" style={{marginTop:6, marginBottom:6}}>{t(lang,"room")}</div>
            <div className="pillRow" style={{marginBottom:12}}>
              {["01","02","03","04","05"].map(l=>(
                <button key={l} className={`pill ${roomSheet.last===l?'active':''}`} onClick={()=>setRoomSheet(s=>({...s, last:l}))}>
                  {l}
                </button>
              ))}
            </div>
            <div className="pillRow">
              <button className="backBtn" onClick={()=>setRoomSheet({open:false,floor:null,last:null})}>{t(lang,"cancel")}</button>
              <button
                className="chipPrimary"
                style={{ ["--btn"]: "var(--blue)" }}
                disabled={roomSheet.floor===null || roomSheet.last===null}
                onClick={confirmRoom}
              >
                {t(lang,"confirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY: Wi-Fi – výběr pokoje */}
      {wifiRoomSheet.open && (
        <div className="overlay" onClick={()=>setWifiRoomSheet(s=>({ ...s, open:false }))}>
          <div className="sheet" onClick={(e)=>e.stopPropagation()}>
            <h4>{t(lang,"pickRoom")}</h4>
            <div className="tips" style={{marginBottom:6}}>{t(lang,"floor")}</div>
            <div className="pillRow" style={{marginBottom:8}}>
              {[0,1,2,3].map(f=>(
                <button key={f} className={`pill ${wifiRoomSheet.floor===f?'active':''}`} onClick={()=>setWifiRoomSheet(s=>({...s, floor:f}))}>
                  {f}
                </button>
              ))}
            </div>
            <div className="tips" style={{marginTop:6, marginBottom:6}}>{t(lang,"room")}</div>
            <div className="pillRow" style={{marginBottom:12}}>
              {["01","02","03","04","05"].map(l=>(
                <button key={l} className={`pill ${wifiRoomSheet.last===l?'active':''}`} onClick={()=>setWifiRoomSheet(s=>({...s, last:l}))}>
                  {l}
                </button>
              ))}
            </div>
            <div className="pillRow">
              <button className="backBtn" onClick={()=>setWifiRoomSheet({open:false,floor:null,last:null})}>{t(lang,"cancel")}</button>
              <button
                className="chipPrimary"
                style={{ ["--btn"]: "var(--blue)" }}
                disabled={wifiRoomSheet.floor===null || wifiRoomSheet.last===null}
                onClick={confirmWifiRoom}
              >
                {t(lang,"confirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY: Wi-Fi – výběr SSID */}
      {wifiSsidSheet.open && (
        <div className="overlay" onClick={()=>setWifiSsidSheet(s=>({ ...s, open:false }))}>
          <div className="sheet" onClick={(e)=>e.stopPropagation()}>
            <h4>{t(lang,"pickSsid")}</h4>
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
              <button className="backBtn" onClick={()=>setWifiSsidSheet({open:false, ssid:null})}>{t(lang,"cancel")}</button>
              <button
                className="chipPrimary"
                style={{ ["--btn"]: "var(--blue)" }}
                disabled={!wifiSsidSheet.ssid}
                onClick={confirmWifiSsid}
              >
                {t(lang,"confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
