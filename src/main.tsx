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

// Disable autocomplete for all inputs, selects, and textareas within dialogs
// This runs after the DOM is ready and sets up a mutation observer to handle dynamically added dialogs
if (typeof window !== 'undefined') {
  const disableAutocompleteInDialogs = () => {
    // Find all dialog content elements
    const dialogContents = document.querySelectorAll('[data-slot="dialog-content"]');
    dialogContents.forEach((dialog) => {
      // Find all form elements, inputs, selects, and textareas within the dialog
      const forms = dialog.querySelectorAll('form');
      const inputs = dialog.querySelectorAll('input');
      const selects = dialog.querySelectorAll('select');
      const textareas = dialog.querySelectorAll('textarea');
      
      forms.forEach((form) => {
        (form as HTMLFormElement).setAttribute('autocomplete', 'off');
      });
      inputs.forEach((input) => {
        (input as HTMLInputElement).setAttribute('autocomplete', 'off');
      });
      selects.forEach((select) => {
        (select as HTMLSelectElement).setAttribute('autocomplete', 'off');
      });
      textareas.forEach((textarea) => {
        (textarea as HTMLTextAreaElement).setAttribute('autocomplete', 'off');
      });
    });
  };

  // Run immediately
  setTimeout(disableAutocompleteInDialogs, 100);

  // Set up a mutation observer to watch for new dialogs
  const observer = new MutationObserver(() => {
    disableAutocompleteInDialogs();
  });

  // Observe the document body for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Also run when dialogs open (using Radix UI's data attributes)
  document.addEventListener('click', () => {
    setTimeout(disableAutocompleteInDialogs, 100);
  });
}

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
