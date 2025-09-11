import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import "@/styles/premium.css";

/* Overlay d’erreurs en dev (anti-écran blanc) */
if (import.meta.env.DEV) {
  const show = (msg) => {
    let pre = document.getElementById("core-dev-error");
    if (!pre) {
      pre = document.createElement("pre");
      pre.id = "core-dev-error";
      pre.style.cssText =
        "position:fixed;left:8px;right:8px;bottom:8px;max-height:40vh;overflow:auto;padding:12px;background:#111;color:#fff;border:1px solid #f66;border-radius:8px;z-index:99999;font-size:12px;white-space:pre-wrap";
      document.body.appendChild(pre);
    }
    pre.textContent = String(msg || "");
  };
  window.addEventListener("error", (e) => show(e.error?.stack || e.message));
  window.addEventListener("unhandledrejection", (e) =>
    show(e.reason?.stack || e.reason)
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
