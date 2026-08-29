import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import { App } from "./ui/App";

// Verify cross-origin isolation in dev — hard requirement for WebContainers + Pyodide SABs.
if (import.meta.env.DEV && !crossOriginIsolated) {
  console.error(
    "[GitRun] crossOriginIsolated is false. " +
      "COOP/COEP headers are not being sent by the dev server. " +
      "WebContainers and Pyodide SharedArrayBuffers will not work."
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("Root element #root not found.");

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
