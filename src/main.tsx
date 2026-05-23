import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Register streaming Service Worker immediately on load
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('ForgifyNest ServiceWorker registered successfully: ', registration.scope);
      })
      .catch((error) => {
        console.error('ForgifyNest ServiceWorker registration failed: ', error);
      });
  });
}
