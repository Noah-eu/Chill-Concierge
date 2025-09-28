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
       catFood:"Jídlo a okolí", catTech:"Technické potíže", catOther:"Ostatní", catTransport:"Doprava", catAmenities:"Vybavení hotelu",
       stillAsk:"Vyberte jednu z možností níže.",
       contact:"Pokud jste nenašli, co potřebujete, napište Davidovi (WhatsApp +420 733 439 733).",
       shortcuts:"Zkratky", hide:"Skrýt", show:"⚡ Zkratky",
       foodDelivery:"🛵 Jídlo domů", transportInfo:"🗺️ Doprava po Praze",
       diningLabel:"🍽️ Snídaně / Restaurace", bakeryLabel:"🥖 Pekárny",
       groceryLabel:"🛒 Obchody", pharmacyLabel:"💊 Lékárny",
       moneyGroupLabel:"💱 Směnárny / ATM", exchangeLabel:"💱 Směnárny", atmLabel:"🏧 ATM",
       wifiLabel:"📶 Wi‑Fi", powerLabel:"⚡ Elektřina", hotWaterLabel:"💧 Teplá voda",
       acLabel:"❄️ Klimatizace (AC)", inductionLabel:"🍳 Indukční deska", hoodLabel:"🌀 Digestoř",
       coffeeLabel:"☕ Kávovar Tchibo", fireAlarmLabel:"🔥 Požární hlásič",
       elevatorPhoneLabel:"🛗 Výtah – servis", safeLabel:"🔐 Trezor",
       // spareKeyLabel intentionally kept for i18n consistency but hidden in UI
       spareKeyLabel:"🔑 Náhradní klíč",
       laundryLabel:"🧺 Prádelna", accessLabel:"♿️ Bezbariérovost", smokingLabel:"🚭 Kouření",
       luggageLabel:"🎒 Úschovna zavazadel", doorbellsLabel:"🔔 Zvonky",
       gateLabel:"🚪 Brána (zevnitř)", trashLabel:"🗑️ Odpadky / Popelnice",
       doctorLabel:"👩‍⚕️ Lékař 24/7", linenLabel:"🧻 Povlečení / Ručníky",
       pickRoom:"Zvolte číslo apartmánu", floor:"Patro", room:"Pokoj", confirm:"Zobrazit", cancel:"Zavřít",
       wifiStatus:"Funguje Wi‑Fi?", ok:"Funguje", notOk:"Nefunguje",
       pickSsid:"Vyberte SSID, které na vašem zařízení svítí nejsilněji",
       showMyWifi:"Zobrazit moje heslo",
       // Amenities
       aRooms:"🛏️ Pokoje", aKitchen:"🍳 Kuchyň", aBathroom:"🛁 Koupelna", aService:"🧰 Prádelna, úschovna, odpadky" },

  en:{ chooseLang:"Choose a language", mainTitle:"Pick a topic", subTitle:"Subtopic", back:"← Back",
       catFood:"Food & Nearby", catTech:"Technical issues", catOther:"Other", catTransport:"Transport", catAmenities:"Hotel amenities",
       stillAsk:"Pick one of the options below.",
       contact:"If you can’t find what you need, message David (WhatsApp +420 733 439 733).",
       shortcuts:"Shortcuts", hide:"Hide", show:"⚡ Shortcuts",
       foodDelivery:"🛵 Food delivery", transportInfo:"🗺️ Getting around Prague",
       diningLabel:"🍽️ Breakfast / Restaurants", bakeryLabel:"🥖 Bakeries",
       groceryLabel:"🛒 Groceries", pharmacyLabel:"💊 Pharmacies",
       moneyGroupLabel:"💱 Exchanges / ATMs", exchangeLabel:"💱 Exchanges", atmLabel:"🏧 ATMs",
       wifiLabel:"📶 Wi‑Fi", powerLabel:"⚡ Power", hotWaterLabel:"💧 Hot water",
       acLabel:"❄️ Air conditioning (AC)", inductionLabel:"🍳 Induction hob", hoodLabel:"🌀 Cooker hood",
       coffeeLabel:"☕ Tchibo coffee machine", fireAlarmLabel:"🔥 Fire alarm",
       elevatorPhoneLabel:"🛗 Elevator – service", safeLabel:"🔐 Safe",
       spareKeyLabel:"🔑 Spare key",
       laundryLabel:"🧺 Laundry", accessLabel:"♿️ Accessibility", smokingLabel:"🚭 Smoking",
       luggageLabel:"🎒 Luggage room", doorbellsLabel:"🔔 Doorbells",
       gateLabel:"🚪 Gate (inside)", trashLabel:"🗑️ Trash / bins",
       doctorLabel:"👩‍⚕️ Doctor 24/7", linenLabel:"🧻 Linen / towels",
       pickRoom:"Choose your apartment number", floor:"Floor", room:"Room", confirm:"Show", cancel:"Close",
       wifiStatus:"Is the Wi‑Fi working?", ok:"Works", notOk:"Doesn’t work",
       pickSsid:"Pick the SSID that appears strongest on your device",
       showMyWifi:"Show my password",
       aRooms:"🛏️ Rooms", aKitchen:"🍳 Kitchen", aBathroom:"🛁 Bathroom", aService:"🧰 Laundry, luggage, trash" },

  de:{ chooseLang:"Sprache wählen", mainTitle:"Thema wählen", subTitle:"Unterthema", back:"← Zurück",
       catFood:"Essen & Umgebung", catTech:"Technische Probleme", catOther:"Sonstiges", catTransport:"Verkehr", catAmenities:"Hotelausstattung",
       stillAsk:"Wählen Sie unten eine Option.",
       contact:"Wenn etwas fehlt, schreiben Sie David (WhatsApp +420 733 439 733).",
       shortcuts:"Kurzbefehle", hide:"Ausblenden", show:"⚡ Kurzbefehle",
       foodDelivery:"🛵 Essen nach Hause", transportInfo:"🗺️ Unterwegs in Prag",
       diningLabel:"🍽️ Frühstück / Restaurants", bakeryLabel:"🥖 Bäckereien",
       groceryLabel:"🛒 Lebensmittel", pharmacyLabel:"💊 Apotheken",
       moneyGroupLabel:"💱 Wechselstuben / Geldautomaten", exchangeLabel:"💱 Wechselstuben", atmLabel:"🏧 Geldautomaten",
       wifiLabel:"📶 WLAN", powerLabel:"⚡ Strom", hotWaterLabel:"💧 Warmwasser",
       acLabel:"❄️ Klimaanlage (AC)", inductionLabel:"🍳 Induktionskochfeld", hoodLabel:"🌀 Dunstabzug",
       coffeeLabel:"☕ Tchibo‑Kaffeemaschine", fireAlarmLabel:"🔥 Rauchmelder",
       elevatorPhoneLabel:"🛗 Aufzug – Service", safeLabel:"🔐 Safe",
       spareKeyLabel:"🔑 Ersatzschlüssel",
       laundryLabel:"🧺 Wäscherei", accessLabel:"♿️ Barrierefreiheit", smokingLabel:"🚭 Rauchen",
       luggageLabel:"🎒 Gepäckaufbewahrung", doorbellsLabel:"🔔 Klingeln",
       gateLabel:"🚪 Tor (innen)", trashLabel:"🗑️ Müll / Tonnen",
       doctorLabel:"👩‍⚕️ Arzt 24/7", linenLabel:"🧻 Bettwäsche / Handtücher",
       pickRoom:"Wohnungsnummer wählen", floor:"Etage", room:"Zimmer", confirm:"Anzeigen", cancel:"Schließen",
       wifiStatus:"Funktioniert das WLAN?", ok:"Funktioniert", notOk:"Funktioniert nicht",
       pickSsid:"Wählen Sie die SSID mit dem stärksten Signal",
       showMyWifi:"Mein Passwort anzeigen",
       aRooms:"🛏️ Zimmer", aKitchen:"🍳 Küche", aBathroom:"🛁 Bad", aService:"🧰 Wäscherei, Gepäck, Müll" },

  fr:{ chooseLang:"Choisir la langue", mainTitle:"Choisir un sujet", subTitle:"Sous‑thème", back:"← Retour",
       catFood:"Restauration & alentours", catTech:"Problèmes techniques", catOther:"Autre", catTransport:"Transports", catAmenities:"Équipements de l’hôtel",
       stillAsk:"Choisissez une option ci‑dessous.",
       contact:"Si besoin, contactez David (WhatsApp +420 733 439 733).",
       shortcuts:"Raccourcis", hide:"Masquer", show:"⚡ Raccourcis",
       foodDelivery:"🛵 Livraison de repas", transportInfo:"🗺️ Se déplacer à Prague",
       diningLabel:"🍽️ Petit‑déjeuner / Restaurants", bakeryLabel:"🥖 Boulangeries",
       groceryLabel:"🛒 Épiceries", pharmacyLabel:"💊 Pharmacies",
       moneyGroupLabel:"💱 Bureaux de change / DAB", exchangeLabel:"💱 Change", atmLabel:"🏧 DAB",
       wifiLabel:"📶 Wi‑Fi", powerLabel:"⚡ Électricité", hotWaterLabel:"💧 Eau chaude",
       acLabel:"❄️ Climatisation (AC)", inductionLabel:"🍳 Plaque à induction", hoodLabel:"🌀 Hotte",
       coffeeLabel:"☕ Machine à café Tchibo", fireAlarmLabel:"🔥 Alarme incendie",
       elevatorPhoneLabel:"🛗 Ascenseur – service", safeLabel:"🔐 Coffre‑fort",
       spareKeyLabel:"🔑 Clé de rechange",
       laundryLabel:"🧺 Laverie", accessLabel:"♿️ Accessibilité", smokingLabel:"🚭 Fumer",
       luggageLabel:"🎒 Consigne à bagages", doorbellsLabel:"🔔 Sonnette",
       gateLabel:"🚪 Portail (intérieur)", trashLabel:"🗑️ Poubelles",
       doctorLabel:"👩‍⚕️ Médecin 24/7", linenLabel:"🧻 Linge / serviettes",
       pickRoom:"Choisissez votre numéro d’appartement", floor:"Étage", room:"Appartement", confirm:"Afficher", cancel:"Fermer",
       wifiStatus:"Le Wi‑Fi fonctionne‑t‑il ?", ok:"Oui", notOk:"Non",
       pickSsid:"Choisissez le SSID le plus fort sur votre appareil",
       showMyWifi:"Afficher mon mot de passe",
       aRooms:"🛏️ Chambres", aKitchen:"🍳 Cuisine", aBathroom:"🛁 Salle de bain", aService:"🧰 Laverie, consigne, déchets" },

  es:{ chooseLang:"Elige idioma", mainTitle:"Elige un tema", subTitle:"Subtema", back:"← Atrás",
       catFood:"Comida y alrededores", catTech:"Problemas técnicos", catOther:"Otros", catTransport:"Transporte", catAmenities:"Servicios del hotel",
       stillAsk:"Elige una opción abajo.",
       contact:"Si no encuentras lo que necesitas, escribe a David (WhatsApp +420 733 439 733).",
       shortcuts:"Atajos", hide:"Ocultar", show:"⚡ Atajos",
       foodDelivery:"🛵 Comida a domicilio", transportInfo:"🗺️ Transporte por Praga",
       diningLabel:"🍽️ Desayuno / Restaurantes", bakeryLabel:"🥖 Panaderías",
       groceryLabel:"🛒 Supermercados", pharmacyLabel:"💊 Farmacias",
       moneyGroupLabel:"💱 Casas de cambio / Cajeros", exchangeLabel:"💱 Casas de cambio", atmLabel:"🏧 Cajeros",
       wifiLabel:"📶 Wi‑Fi", powerLabel:"⚡ Electricidad", hotWaterLabel:"💧 Agua caliente",
       acLabel:"❄️ Aire acondicionado (AC)", inductionLabel:"🍳 Placa de inducción", hoodLabel:"🌀 Campana extractora",
       coffeeLabel:"☕ Cafetera Tchibo", fireAlarmLabel:"🔥 Alarma de incendio",
       elevatorPhoneLabel:"🛗 Ascensor – servicio", safeLabel:"🔐 Caja fuerte",
       spareKeyLabel:"🔑 Llave de repuesto",
       laundryLabel:"🧺 Lavandería", accessLabel:"♿️ Accesibilidad", smokingLabel:"🚭 Fumar",
       luggageLabel:"🎒 Consigna", doorbellsLabel:"🔔 Timbres",
       gateLabel:"🚪 Portón (interior)", trashLabel:"🗑️ Basura / contenedores",
       doctorLabel:"👩‍⚕️ Médico 24/7", linenLabel:"🧻 Ropa de cama / toallas",
       pickRoom:"Elige tu número de apartamento", floor:"Planta", room:"Habitación", confirm:"Mostrar", cancel:"Cerrar",
       wifiStatus:"¿Funciona el Wi‑Fi?", ok:"Funciona", notOk:"No funciona",
       pickSsid:"Elige el SSID con la señal más fuerte",
       showMyWifi:"Mostrar mi contraseña",
       aRooms:"🛏️ Habitaciones", aKitchen:"🍳 Cocina", aBathroom:"🛁 Baño", aService:"🧰 Lavandería, consigna, basura" },

  ru:{ chooseLang:"Выберите язык", mainTitle:"Выберите тему", subTitle:"Подтема", back:"← Назад",
       catFood:"Еда и рядом", catTech:"Технические проблемы", catOther:"Другое", catTransport:"Транспорт", catAmenities:"Удобства отеля",
       stillAsk:"Выберите один из вариантов ниже.",
       contact:"Если не нашли нужное, напишите Давиду (WhatsApp +420 733 439 733).",
       shortcuts:"Ярлыки", hide:"Скрыть", show:"⚡ Ярлыки",
       foodDelivery:"🛵 Доставка еды", transportInfo:"🗺️ Как передвигаться по Праге",
       diningLabel:"🍽️ Завтрак / Рестораны", bakeryLabel:"🥖 Пекарни",
       groceryLabel:"🛒 Продукты", pharmacyLabel:"💊 Аптеки",
       moneyGroupLabel:"💱 Обмен / Банкоматы", exchangeLabel:"💱 Обмен валют", atmLabel:"🏧 Банкоматы",
       wifiLabel:"📶 Wi‑Fi", powerLabel:"⚡ Электричество", hotWaterLabel:"💧 Горячая вода",
       acLabel:"❄️ Кондиционер (AC)", inductionLabel:"🍳 Индукционная плита", hoodLabel:"🌀 Вытяжка",
       coffeeLabel:"☕ Кофемашина Tchibo", fireAlarmLabel:"🔥 Пожарная сигнализация",
       elevatorPhoneLabel:"🛗 Лифт – сервис", safeLabel:"🔐 Сейф",
       spareKeyLabel:"🔑 Запасной ключ",
       laundryLabel:"🧺 Прачечная", accessLabel:"♿️ Доступность", smokingLabel:"🚭 Курение",
       luggageLabel:"🎒 Камера хранения", doorbellsLabel:"🔔 Домофоны",
       gateLabel:"🚪 Ворота (изнутри)", trashLabel:"🗑️ Мусор / баки",
       doctorLabel:"👩‍⚕️ Врач 24/7", linenLabel:"🧻 Постель / полотенца",
       pickRoom:"Выберите номер апартамента", floor:"Этаж", room:"Номер", confirm:"Показать", cancel:"Закрыть",
       wifiStatus:"Работает ли Wi‑Fi?", ok:"Работает", notOk:"Не работает",
       pickSsid:"Выберите SSID с самым сильным сигналом",
       showMyWifi:"Показать мой пароль",
       aRooms:"🛏️ Номера", aKitchen:"🍳 Кухня", aBathroom:"🛁 Ванная", aService:"🧰 Прачечная, багаж, мусор" },

  uk:{ chooseLang:"Оберіть мову", mainTitle:"Виберіть тему", subTitle:"Підтема", back:"← Назад",
       catFood:"Їжа та поруч", catTech:"Технічні питання", catOther:"Інше", catTransport:"Транспорт", catAmenities:"Зручності готелю",
       stillAsk:"Оберіть один із варіантів нижче.",
       contact:"Якщо не знайшли потрібне, напишіть Давидові (WhatsApp +420 733 439 733).",
       shortcuts:"Ярлики", hide:"Сховати", show:"⚡ Ярлики",
       foodDelivery:"🛵 Їжа додому", transportInfo:"🗺️ Пересування по Празі",
       diningLabel:"🍽️ Сніданок / Ресторани", bakeryLabel:"🥖 Пекарні",
       groceryLabel:"🛒 Продукти", pharmacyLabel:"💊 Аптеки",
       moneyGroupLabel:"💱 Обмін / Банкомати", exchangeLabel:"💱 Обмін валют", atmLabel:"🏧 Банкомати",
       wifiLabel:"📶 Wi‑Fi", powerLabel:"⚡ Електрика", hotWaterLabel:"💧 Гаряча вода",
       acLabel:"❄️ Кондиціонер (AC)", inductionLabel:"🍳 Індукційна плита", hoodLabel:"🌀 Витяжка",
       coffeeLabel:"☕ Кавоварка Tchibo", fireAlarmLabel:"🔥 Пожежна сигналізація",
       elevatorPhoneLabel:"🛗 Ліфт – сервіс", safeLabel:"🔐 Сейф",
       spareKeyLabel:"🔑 Запасний ключ",
       laundryLabel:"🧺 Пральня", accessLabel:"♿️ Доступність", smokingLabel:"🚭 Куріння",
       luggageLabel:"🎒 Камера схову", doorbellsLabel:"🔔 Дзвінки",
       gateLabel:"🚪 Ворота (зсередини)", trashLabel:"🗑️ Сміття / баки",
       doctorLabel:"👩‍⚕️ Лікар 24/7", linenLabel:"🧻 Постіль / рушники",
       pickRoom:"Оберіть номер апартаментів", floor:"Поверх", room:"Кімната", confirm:"Показати", cancel:"Закрити",
       wifiStatus:"Працює Wi‑Fi?", ok:"Працює", notOk:"Не працює",
       pickSsid:"Виберіть SSID з найсильнішим сигналом",
       showMyWifi:"Показати мій пароль",
       aRooms:"🛏️ Кімнати", aKitchen:"🍳 Кухня", aBathroom:"🛁 Ванна", aService:"🧰 Пральня, багаж, сміття" },

  nl:{ chooseLang:"Kies een taal", mainTitle:"Kies een onderwerp", subTitle:"Subonderwerp", back:"← Terug",
       catFood:"Eten & in de buurt", catTech:"Technische problemen", catOther:"Overig", catTransport:"Vervoer", catAmenities:"Hotelvoorzieningen",
       stillAsk:"Kies hieronder een optie.",
       contact:"Niet gevonden wat je zoekt? Stuur David een bericht (WhatsApp +420 733 439 733).",
       shortcuts:"Snelkoppelingen", hide:"Verbergen", show:"⚡ Snelkoppelingen",
       foodDelivery:"🛵 Eten bestellen", transportInfo:"🗺️ Rondreizen in Praag",
       diningLabel:"🍽️ Ontbijt / Restaurants", bakeryLabel:"🥖 Bakkerijen",
       groceryLabel:"🛒 Boodschappen", pharmacyLabel:"💊 Apotheken",
       moneyGroupLabel:"💱 Wisselkantoren / Geldautomaten", exchangeLabel:"💱 Wisselkantoren", atmLabel:"🏧 Geldautomaten",
       wifiLabel:"📶 Wi‑Fi", powerLabel:"⚡ Stroom", hotWaterLabel:"💧 Warm water",
       acLabel:"❄️ Airconditioning (AC)", inductionLabel:"🍳 Inductiekookplaat", hoodLabel:"🌀 Afzuigkap",
       coffeeLabel:"☕ Tchibo‑koffiemachine", fireAlarmLabel:"🔥 Brandalarm",
       elevatorPhoneLabel:"🛗 Lift – service", safeLabel:"🔐 Kluis",
       spareKeyLabel:"🔑 Reservesleutel",
       laundryLabel:"🧺 Wasserette", accessLabel:"♿️ Toegankelijkheid", smokingLabel:"🚭 Roken",
       luggageLabel:"🎒 Bagageruimte", doorbellsLabel:"🔔 Deurbellen",
       gateLabel:"🚪 Poort (binnen)", trashLabel:"🗑️ Afval / containers",
       doctorLabel:"👩‍⚕️ Arts 24/7", linenLabel:"🧻 Beddengoed / handdoeken",
       pickRoom:"Kies je appartementnummer", floor:"Verdieping", room:"Kamer", confirm:"Tonen", cancel:"Sluiten",
       wifiStatus:"Werkt de Wi‑Fi?", ok:"Werkt", notOk:"Werkt niet",
       pickSsid:"Kies de SSID met het sterkste signaal",
       showMyWifi:"Toon mijn wachtwoord",
       aRooms:"🛏️ Kamers", aKitchen:"🍳 Keuken", aBathroom:"🛁 Badkamer", aService:"🧰 Wasruimte, bagage, afval" },

  it:{ chooseLang:"Scegli una lingua", mainTitle:"Scegli un argomento", subTitle:"Sottoargomento", back:"← Indietro",
       catFood:"Cibo e dintorni", catTech:"Problemi tecnici", catOther:"Altro", catTransport:"Trasporti", catAmenities:"Servizi dell’hotel",
       stillAsk:"Scegli una delle opzioni sotto.",
       contact:"Se non trovi ciò che ti serve, scrivi a David (WhatsApp +420 733 439 733).",
       shortcuts:"Scorciatoie", hide:"Nascondi", show:"⚡ Scorciatoie",
       foodDelivery:"🛵 Cibo a domicilio", transportInfo:"🗺️ Muoversi a Praga",
       diningLabel:"🍽️ Colazione / Ristoranti", bakeryLabel:"🥖 Panetterie",
       groceryLabel:"🛒 Alimentari", pharmacyLabel:"💊 Farmacie",
       moneyGroupLabel:"💱 Cambi / Bancomat", exchangeLabel:"💱 Cambi", atmLabel:"🏧 Bancomat",
       wifiLabel:"📶 Wi‑Fi", powerLabel:"⚡ Elettricità", hotWaterLabel:"💧 Acqua calda",
       acLabel:"❄️ Aria condizionata (AC)", inductionLabel:"🍳 Piano a induzione", hoodLabel:"🌀 Cappa",
       coffeeLabel:"☕ Macchina Tchibo", fireAlarmLabel:"🔥 Allarme antincendio",
       elevatorPhoneLabel:"🛗 Ascensore – assistenza", safeLabel:"🔐 Cassaforte",
       spareKeyLabel:"🔑 Chiave di riserva",
       laundryLabel:"🧺 Lavanderia", accessLabel:"♿️ Accessibilità", smokingLabel:"🚭 Fumo",
       luggageLabel:"🎒 Deposito bagagli", doorbellsLabel:"🔔 Campanelli",
       gateLabel:"🚪 Cancello (interno)", trashLabel:"🗑️ Spazzatura / bidoni",
       doctorLabel:"👩‍⚕️ Medico 24/7", linenLabel:"🧻 Lenzuola / asciugamani",
       pickRoom:"Scegli il numero dell’appartamento", floor:"Piano", room:"Camera", confirm:"Mostra", cancel:"Chiudi",
       wifiStatus:"Il Wi‑Fi funziona?", ok:"Sì", notOk:"No",
       pickSsid:"Seleziona l’SSID con il segnale più forte",
       showMyWifi:"Mostra la mia password",
       aRooms:"🛏️ Camere", aKitchen:"🍳 Cucina", aBathroom:"🛁 Bagno", aService:"🧰 Lavanderia, bagagli, rifiuti" },

  da:{ chooseLang:"Vælg sprog", mainTitle:"Vælg et emne", subTitle:"Undertema", back:"← Tilbage",
       catFood:"Mad og i nærheden", catTech:"Tekniske problemer", catOther:"Andet", catTransport:"Transport", catAmenities:"Hoteludstyr",
       stillAsk:"Vælg en mulighed herunder.",
       contact:"Finder du ikke det, du skal bruge, så skriv til David (WhatsApp +420 733 439 733).",
       shortcuts:"Genveje", hide:"Skjul", show:"⚡ Genveje",
       foodDelivery:"🛵 Madlevering", transportInfo:"🗺️ Rundt i Prag",
       diningLabel:"🍽️ Morgenmad / Restauranter", bakeryLabel:"🥖 Bagerier",
       groceryLabel:"🛒 Dagligvarer", pharmacyLabel:"💊 Apoteker",
       moneyGroupLabel:"💱 Vekselkontorer / Hæveautomater", exchangeLabel:"💱 Vekselkontorer", atmLabel:"🏧 Hæveautomater",
       wifiLabel:"📶 Wi‑Fi", powerLabel:"⚡ Strøm", hotWaterLabel:"💧 Varmt vand",
       acLabel:"❄️ Aircondition (AC)", inductionLabel:"🍳 Induktionskomfur", hoodLabel:"🌀 Emhætte",
       coffeeLabel:"☕ Tchibo‑kaffemaskine", fireAlarmLabel:"🔥 Brandalarm",
       elevatorPhoneLabel:"🛗 Elevator – service", safeLabel:"🔐 Pengeskab",
       spareKeyLabel:"🔑 Ekstranøgle",
       laundryLabel:"🧺 Vaskeri", accessLabel:"♿️ Tilgængelighed", smokingLabel:"🚭 Rygning",
       luggageLabel:"🎒 Bagageopbevaring", doorbellsLabel:"🔔 Dørklokker",
       gateLabel:"🚪 Port (indefra)", trashLabel:"🗑️ Affald / containere",
       doctorLabel:"👩‍⚕️ Læge 24/7", linenLabel:"🧻 Sengetøj / håndklæder",
       pickRoom:"Vælg værelsesnummer", floor:"Etage", room:"Værelse", confirm:"Vis", cancel:"Luk",
       wifiStatus:"Virker Wi‑Fi?", ok:"Virker", notOk:"Virker ikke",
       pickSsid:"Vælg den SSID, der er stærkest på enheden",
       showMyWifi:"Vis min adgangskode",
       aRooms:"🛏️ Værelser", aKitchen:"🍳 Køkken", aBathroom:"🛁 Badeværelse", aService:"🧰 Vaskeri, bagage, affald" },

  pl:{ chooseLang:"Wybierz język", mainTitle:"Wybierz temat", subTitle:"Podtemat", back:"← Wstecz",
       catFood:"Jedzenie i okolica", catTech:"Problemy techniczne", catOther:"Inne", catTransport:"Transport", catAmenities:"Udogodnienia hotelowe",
       stillAsk:"Wybierz jedną z opcji poniżej.",
       contact:"Jeśli nie znalazłeś informacji, napisz do Dawida (WhatsApp +420 733 439 733).",
       shortcuts:"Skróty", hide:"Ukryj", show:"⚡ Skróty",
       foodDelivery:"🛵 Jedzenie do domu", transportInfo:"🗺️ Poruszanie się po Pradze",
       diningLabel:"🍽️ Śniadanie / Restauracje", bakeryLabel:"🥖 Piekarnie",
       groceryLabel:"🛒 Sklepy", pharmacyLabel:"💊 Apteki",
       moneyGroupLabel:"💱 Kantory / Bankomaty", exchangeLabel:"💱 Kantory", atmLabel:"🏧 Bankomaty",
       wifiLabel:"📶 Wi‑Fi", powerLabel:"⚡ Prąd", hotWaterLabel:"💧 Ciepła woda",
       acLabel:"❄️ Klimatyzacja (AC)", inductionLabel:"🍳 Płyta indukcyjna", hoodLabel:"🌀 Okap",
       coffeeLabel:"☕ Ekspres Tchibo", fireAlarmLabel:"🔥 Czujnik pożaru",
       elevatorPhoneLabel:"🛗 Winda – serwis", safeLabel:"🔐 Sejf",
       spareKeyLabel:"🔑 Zapasowy klucz",
       laundryLabel:"🧺 Pralnia", accessLabel:"♿️ Dostępność", smokingLabel:"🚭 Palenie",
       luggageLabel:"🎒 Przechowalnia bagażu", doorbellsLabel:"🔔 Dzwonki",
       gateLabel:"🚪 Brama (od środka)", trashLabel:"🗑️ Śmieci / kosze",
       doctorLabel:"👩‍⚕️ Lekarz 24/7", linenLabel:"🧻 Pościel / ręczniki",
       pickRoom:"Wybierz numer apartamentu", floor:"Piętro", room:"Pokój", confirm:"Pokaż", cancel:"Zamknij",
       wifiStatus:"Czy Wi‑Fi działa?", ok:"Działa", notOk:"Nie działa",
       pickSsid:"Wybierz SSID z najsilniejszym sygnałem",
       showMyWifi:"Pokaż moje hasło",
       aRooms:"🛏️ Pokoje", aKitchen:"🍳 Kuchnia", aBathroom:"🛁 Łazienka", aService:"🧰 Pralnia, bagaż, śmieci" }
};

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
  const [roomSheet, setRoomSheet] = useState({ open:false, floor:null, last:null }); // keys
  const [wifiRoomSheet, setWifiRoomSheet] = useState({ open:false, floor:null, last:null });
  const [wifiSsidSheet, setWifiSsidSheet] = useState({ open:false, ssid:null });

  // CTA tlačítka pod bublinou
  const [showKeysCta, setShowKeysCta] = useState(false); // ❗ hidden flow – we keep state but never show entry point
  const [wifiCtas, setWifiCtas] = useState({ showPassword:false, showNotOk:false });

  const scrollerRef = useRef(null);

  useEffect(() => {
    if (lang) document.body.classList.add("lang-selected"); else document.body.classList.remove("lang-selected");
  }, [lang]);

  useEffect(() => { scrollerRef.current?.scrollTo(0, 9_999_999); }, [chat, shortcutsOpen, showKeysCta, wifiCtas]);

  const dict  = useMemo(() => tr[lang || "cs"], [lang]);

  /** ====== FLOWS ====== */
  function makeFlows(dict){
    const FOOD = [
      { label: dict.diningLabel,   control:{ intent:"local", sub:"dining" } },
      { label: dict.bakeryLabel,   control:{ intent:"local", sub:"bakery" } },
      { label: dict.groceryLabel,  control:{ intent:"local", sub:"grocery" } },
      { label: dict.pharmacyLabel, control:{ intent:"local", sub:"pharmacy" } },
      { label: dict.foodDelivery,  control:{ intent:"tech",  sub:"food_delivery" } },
      { label: dict.moneyGroupLabel, children:[
        { label: dict.exchangeLabel, control:{ intent:"local", sub:"exchange" } },
        { label: dict.atmLabel,      control:{ intent:"local", sub:"atm" } },
      ]},
    ];

    const TECH = [
      { label: dict.wifiLabel,            control:{ intent:"tech", sub:"wifi", kind:"wifi" } },
      { label: dict.powerLabel,           control:{ intent:"tech", sub:"power" } },
      { label: dict.hotWaterLabel,        control:{ intent:"tech", sub:"hot_water" } },
      { label: dict.acLabel,              control:{ intent:"tech", sub:"ac" } },
      { label: dict.inductionLabel,       control:{ intent:"tech", sub:"induction" } },
      { label: dict.hoodLabel,            control:{ intent:"tech", sub:"hood" } },
      { label: dict.coffeeLabel,          control:{ intent:"tech", sub:"coffee" } },
      { label: dict.fireAlarmLabel,       control:{ intent:"tech", sub:"fire_alarm" } },
      { label: dict.elevatorPhoneLabel,   control:{ intent:"tech", sub:"elevator_phone" } },
      { label: dict.safeLabel,            control:{ intent:"tech", sub:"safe" } },
      // 🔑 Spare key flow is kept on backend but **not listed** in UI
      // { label: dict.spareKeyLabel,    control:{ intent:"tech", sub:"keys", needsRoom:true } },
    ];

    const TRANSPORT = [
      { label: dict.transportInfo, control:{ intent:"tech", sub:"transport" } },
    ];

    const AMENITIES = [
      { label: dict.aRooms,   control:{ intent:"amenities", sub:"rooms" } },
      { label: dict.aKitchen, control:{ intent:"amenities", sub:"kitchen" } },
      { label: dict.aBathroom,control:{ intent:"amenities", sub:"bathroom" } },
      { label: dict.aService, control:{ intent:"amenities", sub:"service" } },
    ];

    const OTHER = [
      { label: dict.laundryLabel,     control:{ intent:"tech", sub:"laundry" } },
      { label: dict.accessLabel,      control:{ intent:"tech", sub:"access" } },
      { label: dict.smokingLabel,     control:{ intent:"tech", sub:"smoking" } },
      { label: dict.luggageLabel,     control:{ intent:"tech", sub:"luggage" } },
      { label: dict.doorbellsLabel,   control:{ intent:"tech", sub:"doorbells" } },
      { label: dict.gateLabel,        control:{ intent:"tech", sub:"gate" } },
      { label: dict.trashLabel,       control:{ intent:"tech", sub:"trash" } },
      { label: dict.doctorLabel,      control:{ intent:"tech", sub:"doctor" } },
      { label: dict.linenLabel,       control:{ intent:"tech", sub:"linen_towels" } },
    ];

    return [
      { label:dict.catFood,      children:FOOD },
      { label:dict.catTech,      children:TECH },
      { label:dict.catTransport, children:TRANSPORT },
      { label:dict.catAmenities, children:AMENITIES },
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

  // pevná tlačítka → backend
  function sendControl(promptText, control){
    const next = [...chat, { role:"user", content:promptText }];
    setChat(next);
    return callBackend({ messages: next, uiLang: lang, control });
  }
  // čistý text (např. číslo pokoje / SSID)
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

  // SSID seznam (pro „Nefunguje“)
  const ALL_SSIDS = ["D384","CDEA","CF2A","93EO","D93A","D9E4","6A04","9B7A","1CF8","D8C4","CD9E","CF20","23F0","B4B4","DA4E","D5F6"];

  // handler kliků
  const onChipClick = (n) => {
    if (n.children) return openNode(n);

    // Wi‑Fi: instrukce → CTA „Zobrazit moje heslo“
    if (n.control?.kind === "wifi") {
      setShortcutsOpen(false);
      sendControl("Wi‑Fi", { intent:"tech", sub:"wifi" });
      setWifiCtas({ showPassword:true, showNotOk:false });
      return;
    }

    // Náhradní klíč: (flow existuje v backendu) – UI vstup NEZOBRAZUJEME
    if (n.control?.needsRoom) {
      return; // intentionally noop – guarded
    }

    if (n.control) {
      setShortcutsOpen(false);
      return sendControl(n.label, n.control);
    }
  };

  // -------- Keys: potvrzení výběru --------
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

  // -------- Wi‑Fi: potvrzení výběru pokoje → heslo + „Nefunguje“ --------
  const confirmWifiRoom = () => {
    const { floor, last } = wifiRoomSheet;
    if (floor === null || last === null) return;
    const room = `${floor}${last}`.padStart(3, "0");
    setWifiRoomSheet({ open:false, floor:null, last:null });
    setWifiCtas({ showPassword:false, showNotOk:true });
    return sendText(room); // backend vrátí heslo k dané Wi‑Fi
  };

  const confirmWifiSsid = () => {
    if (!wifiSsidSheet.ssid) return;
    const ssid = wifiSsidSheet.ssid;
    setWifiSsidSheet({ open:false, ssid:null });
    setWifiCtas({ showPassword:false, showNotOk:false });
    return sendText(ssid); // backend pošle heslo pro zvolenou SSID
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
                    style={{ ["--btn"]: btnColorForIndex(idx) }}
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

      {/* ===== CTA STACK ===== */}
      <div className="fabStack" aria-live="polite">
        {/* Spare key CTA intentionally hidden unless triggered programmatically */}
        {showKeysCta && (
          <button className="fabAction" onClick={() => setRoomSheet({ open:true, floor:null, last:null })}>
            {tr[lang||"cs"].pickRoom}
          </button>
        )}
        {wifiCtas.showPassword && (
          <button className="fabAction" onClick={() => setWifiRoomSheet({ open:true, floor:null, last:null })}>
            {tr[lang||"cs"].showMyWifi}
          </button>
        )}
        {wifiCtas.showNotOk && (
          <button className="fabAction" onClick={() => setWifiSsidSheet({ open:true, ssid:null })}>
            {tr[lang||"cs"].notOk}
          </button>
        )}
      </div>

      {/* OVERLAY: Náhradní klíč – výběr pokoje (flow exists, UI entry hidden) */}
      {roomSheet.open && (
        <div className="overlay" onClick={()=>setRoomSheet(s=>({ ...s, open:false }))}>
          <div className="sheet" onClick={(e)=>e.stopPropagation()}>
            <h4>{dict.pickRoom}</h4>
            <div className="tips" style={{marginBottom:6}}>{dict.floor}</div>
            <div className="pillRow" style={{marginBottom:8}}>
              {[0,1,2,3].map(f=>(
                <button key={f} className={`pill ${roomSheet.floor===f?'active':''}`} onClick={()=>setRoomSheet(s=>({...s, floor:f}))}>
                  {f}
                </button>
              ))}
            </div>
            <div className="tips" style={{marginTop:6, marginBottom:6}}>{dict.room}</div>
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

      {/* OVERLAY: Wi‑Fi – výběr pokoje */}
      {wifiRoomSheet.open && (
        <div className="overlay" onClick={()=>setWifiRoomSheet(s=>({ ...s, open:false }))}>
          <div className="sheet" onClick={(e)=>e.stopPropagation()}>
            <h4>{dict.pickRoom}</h4>
            <div className="tips" style={{marginBottom:6}}>{dict.floor}</div>
            <div className="pillRow" style={{marginBottom:8}}>
              {[0,1,2,3].map(f=>(
                <button key={f} className={`pill ${wifiRoomSheet.floor===f?'active':''}`} onClick={()=>setWifiRoomSheet(s=>({...s, floor:f}))}>
                  {f}
                </button>
              ))}
            </div>
            <div className="tips" style={{marginTop:6, marginBottom:6}}>{dict.room}</div>
            <div className="pillRow" style={{marginBottom:12}}>
              {["01","02","03","04","05"].map(l=>(
                <button key={l} className={`pill ${wifiRoomSheet.last===l?'active':''}`} onClick={()=>setWifiRoomSheet(s=>({...s, last:l}))}>
                  {l}
                </button>
              ))}
            </div>
            <div className="pillRow">
              <button className="backBtn" onClick={()=>setWifiRoomSheet({open:false,floor:null,last:null})}>{tr[lang||"cs"].cancel}</button>
              <button
                className="chipPrimary"
                style={{ ["--btn"]: "var(--blue)" }}
                disabled={wifiRoomSheet.floor===null || wifiRoomSheet.last===null}
                onClick={confirmWifiRoom}
              >
                {tr[lang||"cs"].confirm}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY: Wi‑Fi – výběr SSID (pro „Nefunguje“) */}
      {wifiSsidSheet.open && (
        <div className="overlay" onClick={()=>setWifiSsidSheet(s=>({ ...s, open:false }))}>
          <div className="sheet" onClick={(e)=>e.stopPropagation()}>
            <h4>{tr[lang||"cs"].pickSsid}</h4>
            <div className="pillRow" style={{marginBottom:12}}>
              {["D384","CDEA","CF2A","93EO","D93A","D9E4","6A04","9B7A","1CF8","D8C4","CD9E","CF20","23F0","B4B4","DA4E","D5F6"].map(code=>(
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
              <button className="backBtn" onClick={()=>setWifiSsidSheet({open:false, ssid:null})}>{tr[lang||"cs"].cancel}</button>
              <button
                className="chipPrimary"
                style={{ ["--btn"]: "var(--blue)" }}
                disabled={!wifiSsidSheet.ssid}
                onClick={confirmWifiSsid}
              >
                {tr[lang||"cs"].confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
