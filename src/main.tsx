// ============================================================================
// main.tsx — punkt wejścia aplikacji React (Reaktywny komponent korzeń).
// Rejestrujemy service worker PWA oprócz odtwarzania aplikacji.
// ============================================================================

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { initializeAdMob } from './services/admobService';
import './index.css';
import { App } from './App';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Brak kontenera #root w document.');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Inicjalizujemy AdMob na samym starcie aplikacji
void initializeAdMob();

// Service worker PWA (auto-update dla offline).
registerSW({ immediate: true });
