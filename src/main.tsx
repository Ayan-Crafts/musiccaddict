import "@fontsource-variable/manrope";
import "@fontsource-variable/jetbrains-mono";
import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { applyTheme } from "./theme/runtime";
import { darkTheme } from "./theme/themes/dark";

// Paint default tokens before React mounts to avoid a flash of unstyled content.
applyTheme(darkTheme);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
