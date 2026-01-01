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
import ErrorBoundary from "./components/ErrorBoundary.tsx";
import "./index.css";
import "./styles/dialog.css";
import "./styles/dashboard.css";

// Flush all caches before application starts
if (typeof window !== 'undefined') {
  try {
    // Clear localStorage
    localStorage.clear();
    console.log('✓ localStorage cleared');
    
    // Clear sessionStorage
    sessionStorage.clear();
    console.log('✓ sessionStorage cleared');
    
    // Clear IndexedDB (if any)
    if ('indexedDB' in window) {
      indexedDB.databases().then(databases => {
        databases.forEach(db => {
          if (db.name) {
            indexedDB.deleteDatabase(db.name);
            console.log(`✓ IndexedDB database "${db.name}" deleted`);
          }
        });
      }).catch(err => {
        console.warn('Error clearing IndexedDB:', err);
      });
    }
    
    // Clear service worker cache (if any)
    if ('serviceWorker' in navigator && 'caches' in window) {
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            console.log(`✓ Cache "${cacheName}" deleted`);
            return caches.delete(cacheName);
          })
        );
      }).catch(err => {
        console.warn('Error clearing service worker cache:', err);
      });
    }
    
    // Clear HTTP cache headers (browser will handle this on reload)
    // Force a hard reload if needed
    if (import.meta.env.DEV) {
      console.log('✓ All caches flushed - Application starting fresh');
    }
  } catch (err) {
    console.error('Error flushing cache:', err);
  }
}

// Log timezone configuration in development
if (import.meta.env.DEV) {
  import('./config/timezone').then(({ DEFAULT_TIMEZONE, IST_OFFSET_STRING }) => {
    console.log('🌏 Application Timezone:', DEFAULT_TIMEZONE, `(${IST_OFFSET_STRING})`);
    console.log('📅 All dates and times are in Indian Standard Time (IST)');
    console.log('💡 Use ISTDatePicker component and IST utilities from src/utils/timeUtils.ts');
  });
}

// Disable autocomplete/autofill for all inputs, selects, textareas, and forms across the entire website
// This runs after the DOM is ready and sets up a mutation observer to handle dynamically added elements
if (typeof window !== 'undefined') {
  const disableAutocompleteGlobally = () => {
    // Find all form elements, inputs, selects, and textareas in the entire document
    const forms = document.querySelectorAll('form');
    const inputs = document.querySelectorAll('input');
    const selects = document.querySelectorAll('select');
    const textareas = document.querySelectorAll('textarea');
    
    // Disable autocomplete on all forms
    forms.forEach((form) => {
      (form as HTMLFormElement).setAttribute('autocomplete', 'off');
    });
    
    // Disable autocomplete on all inputs
    inputs.forEach((input) => {
      const inputElement = input as HTMLInputElement;
      inputElement.setAttribute('autocomplete', 'off');
      // Additional attributes to prevent autofill
      inputElement.setAttribute('data-lpignore', 'true');
      inputElement.setAttribute('data-form-type', 'other');
    });
    
    // Disable autocomplete on all selects
    selects.forEach((select) => {
      (select as HTMLSelectElement).setAttribute('autocomplete', 'off');
    });
    
    // Disable autocomplete on all textareas
    textareas.forEach((textarea) => {
      (textarea as HTMLTextAreaElement).setAttribute('autocomplete', 'off');
    });
  };

  // Run immediately when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(disableAutocompleteGlobally, 100);
    });
  } else {
    setTimeout(disableAutocompleteGlobally, 100);
  }

  // Set up a mutation observer to watch for dynamically added elements
  const observer = new MutationObserver(() => {
    disableAutocompleteGlobally();
  });

  // Observe the document body for changes (including dynamically added elements)
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Also run on user interactions to catch any elements added after interactions
  document.addEventListener('click', () => {
    setTimeout(disableAutocompleteGlobally, 100);
  });
  
  document.addEventListener('focusin', (e) => {
    // When an input receives focus, ensure autocomplete is disabled
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') {
      (target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).setAttribute('autocomplete', 'off');
      if (target.tagName === 'INPUT') {
        (target as HTMLInputElement).setAttribute('data-lpignore', 'true');
        (target as HTMLInputElement).setAttribute('data-form-type', 'other');
      }
    }
  });
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <ErrorBoundary>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ErrorBoundary>
);
