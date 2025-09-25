// src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

// Vícejazyčný úvodní greeting (CZ/EN/ES/DE/FR)
const initialGreeting = [
  "Ahoj! Jak vám mohu pomoci dnes?",
  "Hello! How can I help you today?",
  "¡Hola! ¿En qué puedo ayudarte hoy?",
  "Hallo! Womit kann ich Ihnen heute helfen?",
  "Bonjour ! Comment puis-je vous aider aujourd'hui ?"
].join("\n");

// Předáme do App jako počáteční zprávy chatu
const initialMessages = [
  { role: "assistant", content: initialGreeting }
];

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App initialMessages={initialMessages} />
  </React.StrictMode>
);
