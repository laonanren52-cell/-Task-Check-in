import React from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import './styles/visualAtmosphere.css'
import './styles/workspaceVisuals.css'
import App from './app/App'

// The desktop app loads bundled assets directly. Do not let a browser-installed
// PWA service worker replay an outdated asset cache after a desktop upgrade.
if ('__TAURI_INTERNALS__' in window && 'serviceWorker' in navigator) {
  void navigator.serviceWorker.getRegistrations().then(registrations => Promise.all(registrations.map(registration => registration.unregister())))
  void caches.keys().then(keys => Promise.all(keys.map(key => caches.delete(key))))
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>)
