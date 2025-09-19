

import React from 'react';
import ReactDOM from 'react-dom/client';
// FIX: Added .tsx extension to the import path to fix module resolution error.
import App from './App.tsx';
import { initializeI18n } from './services/i18n.ts';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

/**
 * Initializes required services (like i18n) and then renders the application.
 */
const startApp = async () => {
    // Wait for translations to be fetched and loaded before rendering the app
    await initializeI18n();

    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
};

startApp();
