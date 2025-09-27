// netlify/functions/data/places.js
// Kurátorovaný seznam míst s odkazy (blízko Sokolská 64).

export const PLACES = {
  // SNÍDANĚ
  breakfast: [
    { name: "La Mouka", url: "https://lamouka.cz/", tags: ["breakfast","bakery","cafe"] },
    { name: "Cafe Purkyně", url: "https://cafepurkyne.cz", tags: ["breakfast","cafe"] },
    { name: "Paul (Muzeum)", url: "https://www.paul-cz.com", tags: ["bakery","breakfast"] },
    { name: "Zrno Zrnko", url: "https://www.zrnozrnko.cz", tags: ["bakery","coffee","breakfast"] },
  ],

  // VEGAN
  veggie: [
    { name: "Palo Verde Bistro", url: "https://www.paloverdebistro.cz/", tags: ["vegan","vegetarian","bistro"] },
  ],

  // KAVÁRNY / PEKÁRNY
  cafe: [
    { name: "Gregorian Bakery (Anglická)", url: "https://anglicka.matokapraha.cz/", tags: ["bakery","cafe","breakfast"] },
    { name: "Paul (Muzeum)", url: "https://www.paul-cz.com", tags: ["bakery","cafe"] },
    { name: "Zrno Zrnko", url: "https://www.zrnozrnko.cz", tags: ["roastery","coffee"] },
  ],
  bakery: [
    { name: "Gregorian Bakery (Anglická)", url: "https://anglicka.matokapraha.cz/", tags: ["bakery"] },
    { name: "Paul (Muzeum)", url: "https://www.paul-cz.com", tags: ["bakery"] },
    { name: "Zrno Zrnko", url: "https://www.zrnozrnko.cz", tags: ["bakery"] },
  ],

  // ČESKÁ KUCHYNĚ
  czech: [
    { name: "U Graffů", url: "https://www.restaurant-graff.cz/", tags: ["czech","restaurant"] },
    { name: "Vytopna (Václavské nám.)", url: "https://www.vytopna.cz", tags: ["czech","beer"] },
    { name: "Husinec", url: "https://www.husinecrestaurace.cz", tags: ["czech"] },
    { name: "Pivovarský dům", url: "https://www.pivo-dum.cz", tags: ["czech","brewery"] },
  ],

  // VIETNAM
  vietnam: [
    { name: "Bistro Bao Bao", url: "https://www.bistrobaobao.cz", tags: ["vietnamese","bistro"] },
  ],

  // BAR / PUB
  bar: [
    { name: "Šenkovna Pub / Wine Bar", url: "https://www.senkovnapub.cz", tags: ["bar","wine","pub"] },
  ],

  // SUPERMARKET
  grocery: [
    { name: "Tesco (Vocelova 11)", url: "https://www.itesco.cz/prodejny/praha/vocelova-11", tags: ["supermarket"] },
    { name: "Albert (Václavské nám. 812/59)", url: "https://www.google.com/maps/search/?api=1&query=Albert%20V%C3%A1clavsk%C3%A9%20n%C3%A1m%C4%9Bst%C3%AD%20812%2F59", tags: ["supermarket"] },
  ],

  // LÉKÁRNY
  pharmacy: [
    { name: "BENU – Jugoslávská", url: "https://www.benu.cz/lekarna-benu-praha-2-jugoslavska", tags: ["pharmacy"] },
    { name: "Dr. Max – Bělehradská 4", url: "https://www.drmax.cz/lekarny/praha-2-vinohrady-belehradska-4", tags: ["pharmacy"] },
  ],

  // SMĚNÁRNY
  exchange: [
    { name: "Xchange Grossmann", url: "https://www.xchangegrossmann.cz", tags: ["exchange"] },
    { name: "Směnárna Praha 1", url: "https://smenarna-praha-1.cz", tags: ["exchange"] },
  ],

  // BANKOMAT
  atm: [
    { name: "ATM – Bělehradská 222/128", url: "https://www.google.com/maps/search/?api=1&query=ATM%20B%C4%9Blehradsk%C3%A1%20222%2F128%20Praha", tags: ["atm"] },
  ],
};

// Markdown výpis (kompaktní, s i18n štítkem)
export function buildCuratedList(category, opts = {}) {
  const { max = 12, labelOpen = "Otevřít" } = opts;
  const list = (PLACES[category] || []).slice(0, max);
  if (!list.length) return null;

  const ensureHttp = (u="") => /^https?:\/\//i.test(u) ? u : `https://${u.replace(/^\/+/, "")}`;

  return list.map(p => {
    const name = String(p.name || "").trim();
    const url = ensureHttp(String(p.url || "").trim());
    const tags = Array.isArray(p.tags) ? p.tags.map(t=>String(t).trim()).filter(Boolean) : null;
    return `- **${name}**${tags?.length ? ` — *${tags.join(", ")}*` : ""}\n  - [${labelOpen}](${url})`;
  }).join("\n\n");
}
