import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "@/src/app";

import "@/src/styles/globals.css";
import "@/src/styles/design-v2.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Hunta root element is missing.");
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
