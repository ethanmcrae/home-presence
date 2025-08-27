import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

/**
 * Entry point for the Vite/React application. Vite will mount
 * this code into the index.html file. We import the global CSS
 * (which includes Tailwind directives) and render the root App
 * component into the #root element. In production this file is
 * bundled by Vite.
 */
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

// Create a React root and render the App. Using React 18's
// createRoot API enables concurrent features and better DX.
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);