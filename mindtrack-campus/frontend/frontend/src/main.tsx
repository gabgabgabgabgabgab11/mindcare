// Suppress known Chrome DevTools internal Live Metrics / Soft Navigation bug (reportAllChanges / startTime)
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (event.message?.includes("reading 'startTime'")) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
