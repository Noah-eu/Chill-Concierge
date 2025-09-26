// src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

// Aby se neukazoval dvojí pozdrav, nenačítejme žádné počáteční zprávy.
// (Multi-greeting případně úplně vyhoď z index.html – viz níže.)
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
