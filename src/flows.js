// src/flows.js
// Strom klikacích voleb: jazyk → témata → podtémata → odešle prompt na server.

export const LANGS = {
  cs: "Čeština",
  en: "English",
  es: "Español",
  de: "Deutsch",
  fr: "Français",
};

export const FLOWS = {
  cs: [
    {
      label: "Technické potíže",
      children: [
        { label: "Wi-Fi", prompt: "mám problém s wifi" },
        { label: "Elektřina / nesvítí", prompt: "nejde mi proud v apartmánu" },
        { label: "Klimatizace (AC)", prompt: "nejde mi klimatizace" },
      ],
    },
    {
      label: "Užitečné informace",
      children: [
        { label: "Úschovna batožiny & check-out", prompt: "kde je úschovna batožiny po 11:00 a jak na check-out" },
        { label: "Náhradní klíč", prompt: "zapomněl jsem klíč v apartmánu, potřebuji náhradní klíč" },
        { label: "Prádelna", prompt: "kde je prádelna" },
        { label: "Kouření / balkony", prompt: "kde mohu kouřit" },
        { label: "Bezbariérovost", prompt: "má budova schody a výtah" },
        { label: "Domácí mazlíčci", prompt: "mohu mít psa v apartmánu" },
      ],
    },
    {
      label: "Jídlo & okolí (≤200 m)",
      children: [
        { label: "Snídaně", prompt: "doporuč snídani v blízkém okolí" },
        { label: "Kavárna / pekárna", prompt: "doporuč kavárnu nebo pekárnu do 200 m" },
        { label: "Vegan/vegetarian", prompt: "doporuč vegan/vegetarian podniky" },
        { label: "Česká kuchyně", prompt: "doporuč českou restauraci v blízkém okolí" },
        { label: "Viet bistro", prompt: "doporuč vietnamské bistro" },
        { label: "Bar / pub", prompt: "doporuč bar nebo pub" },
        { label: "Supermarket", prompt: "kde je nejbližší supermarket" },
        { label: "Lékárna", prompt: "kde je nejbližší lékárna" },
        { label: "Směnárna", prompt: "kde je směnárna" },
        { label: "Bankomat (ATM)", prompt: "kde je nejbližší bankomat" },
      ],
    },
  ],

  en: [
    {
      label: "Technical issues",
      children: [
        { label: "Wi-Fi", prompt: "I have a problem with the Wi-Fi" },
        { label: "Electricity / no lights", prompt: "I have a problem with the electricity in my apartment" },
        { label: "Air conditioning (AC)", prompt: "My AC is not working" },
      ],
    },
    {
      label: "Useful info",
      children: [
        { label: "Luggage storage & check-out", prompt: "where is the luggage storage after 11:00 and how to check out" },
        { label: "Spare key", prompt: "I forgot the key in the apartment, I need a spare key" },
        { label: "Laundry", prompt: "where is the laundry room" },
        { label: "Smoking / balconies", prompt: "where can I smoke" },
        { label: "Accessibility", prompt: "stairs and elevator information" },
        { label: "Pets", prompt: "can I have a dog in the apartment" },
      ],
    },
    {
      label: "Food & nearby (≤200 m)",
      children: [
        { label: "Breakfast", prompt: "recommend breakfast nearby" },
        { label: "Cafe / bakery", prompt: "recommend a cafe or bakery within 200 m" },
        { label: "Vegan/vegetarian", prompt: "recommend vegan/vegetarian places" },
        { label: "Czech food", prompt: "recommend Czech cuisine nearby" },
        { label: "Vietnamese bistro", prompt: "recommend a Vietnamese bistro" },
        { label: "Bar / pub", prompt: "recommend a bar or pub" },
        { label: "Supermarket", prompt: "where is the nearest supermarket" },
        { label: "Pharmacy", prompt: "where is the nearest pharmacy" },
        { label: "Exchange", prompt: "where can I exchange money" },
        { label: "ATM", prompt: "where is the nearest ATM" },
      ],
    },
  ],

  es: null, de: null, fr: null,
};
for (const k of ["es","de","fr"]) FLOWS[k] = FLOWS.en;
