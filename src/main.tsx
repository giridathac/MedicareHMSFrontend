/**
 * Application Entry Point
 * 
 * Default Timezone: Indian Standard Time (IST) - UTC+5:30
 * Timezone configuration: src/config/timezone.ts
 * All date/time operations should use IST utilities from src/utils/timeUtils.ts
 */

import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";
import "./styles/dialog.css";
import "./styles/dashboard.css";

// Log timezone configuration in development
if (import.meta.env.DEV) {
  import('./config/timezone').then(({ DEFAULT_TIMEZONE, IST_OFFSET_STRING }) => {
    console.log('Application Timezone:', DEFAULT_TIMEZONE, `(${IST_OFFSET_STRING})`);
  });
}

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
