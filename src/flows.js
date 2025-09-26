// src/flows.js
// Strom jednoduchých voleb. Každý uzel má label a buď children,
// nebo prompt (text, který odešleme jako user message na server).

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
        { label: "Elektrina nesvítí", prompt: "nejde mi proud v apartmánu" },
        { label: "Klimatizace (AC)", prompt: "nejde mi klimatizace" },
      ],
    },
    {
      label: "Užitečné informace",
      children: [
        { label: "Bagážovna & check-out", prompt: "kde je bagážovna po 11:00 a jak na check-out" },
        { label: "Náhradní klíč", prompt: "zapomněl jsem klíč v apartmánu" },
        { label: "Prádelna", prompt: "kde je prádelna" },
        { label: "Kouření / balkony", prompt: "kde mohu kouřit" },
        { label: "Bezbariérovost", prompt: "má budova schody a výtah" },
        { label: "Domácí mazlíčci", prompt: "mohu mít psa v apartmánu" },
      ],
    },
    {
      label: "Jídlo & okolí (do 200 m)",
      children: [
        { label: "Snídaně", prompt: "doporuč snídani v blízkém okolí" },
        { label: "Kavárna", prompt: "doporuč kavárnu do 200 m" },
        { label: "Supermarket", prompt: "kde je nejbližší supermarket" },
        { label: "Lékárna", prompt: "kde je nejbližší lékárna" },
        { label: "Česká kuchyně", prompt: "doporuč českou restauraci v blízkém okolí" },
        { label: "Veggie/Vegan", prompt: "doporuč vegetariánské nebo veganské podniky" },
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
        { label: "Luggage room & check-out", prompt: "where is the luggage room after 11:00 and how to check out" },
        { label: "Spare key", prompt: "I forgot the key in the apartment" },
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
        { label: "Cafe", prompt: "recommend a cafe within 200 m" },
        { label: "Supermarket", prompt: "where is the nearest supermarket" },
        { label: "Pharmacy", prompt: "where is the nearest pharmacy" },
        { label: "Czech food", prompt: "recommend Czech cuisine nearby" },
        { label: "Veggie/Vegan", prompt: "recommend vegetarian or vegan places" },
      ],
    },
  ],

  // pro jednoduchost zrcadlí EN; můžeš později lokalizovat
  es: null, de: null, fr: null,
};

for (const k of ["es","de","fr"]) FLOWS[k] = FLOWS.en;
