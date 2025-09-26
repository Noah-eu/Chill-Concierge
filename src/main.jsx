// src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

// žádné seedování chatu – necháme prázdné
const initialMessages = [];

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App initialMessages={initialMessages} />
  </React.StrictMode>
);
