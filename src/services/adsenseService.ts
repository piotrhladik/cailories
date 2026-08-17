// ============================================================================
// adsenseService.ts — reklamy Web/PWA (Google AdSense).
//
// AdMob SDK działa TYLKO natywnie (Android APK). Na platformie web/PWA
// (w tym iPhone z "Dodaj do ekranu głównego") używa się Google AdSense.
// Ten serwis:
//   - dynamicznie wstrzykuje skrypt AdSense (https://pagead2.googlesyndication.com),
//   - renderuje slot reklamowy w kontenerze,
//   - dba o to, by brak reklamy (bloker, brak sieci, tryb lokalny) nie łamał UI
//     oraz nie renderował banera, jeśli środowisko nie jest w pełni produkcyjne.
//
// UWAGA: AdSense mierzy/odrzuca wyświetlenia w trybie lokalnym (localhost) oraz
// na niezatwierdzonych domenach. Realny przychód pojawia się dopiero na
// opublikowanej domenie HTTPS zatwierdzonej w panelu AdSense.
// ============================================================================

import { Capacitor } from '@capacitor/core';
import { ADSENSE_PUBLISHER_ID, ADSENSE_AD_SLOT, WEB_ADS_ENABLED } from '../config';

type AdSenseWindow = Window & {
  adsbygoogle?: unknown[];
};

/** Czy jesteśmy na platformie web (nie natywnej). */
export function isWebPlatform(): boolean {
  return !Capacitor.isNativePlatform();
}

/**
 * Czy środowisko nadaje się do REALNYCH reklam AdSense.
 * AdSense działa tylko na opublikowanej domenie HTTPS (nie na localhost/HTTP),
 * w przeciwnym razie wstrzykuje pusty slot, który psuje layout.
 */
export function canServeRealAds(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.protocol === 'https:';
}

/** Czy są warunki, by załadować AdSense (web + HTTPS + włączone + valid ID). */
export function canLoadWebAds(): boolean {
  return (
    isWebPlatform() &&
    WEB_ADS_ENABLED &&
    canServeRealAds() &&
    ADSENSE_PUBLISHER_ID.trim().length > 0 &&
    typeof window !== 'undefined'
  );
}

/** Dynamicznie dodajemy tag <script> AdSense do <head> (tylko raz). */
function ensureAdSenseScript(): void {
  const w = window as unknown as AdSenseWindow;
  if (!w.adsbygoogle) {
    // Zarejestruj globalny "bufor" dla push() — wymagany przez AdSense.
    w.adsbygoogle = [];
  }
  if (document.querySelector("script[src*='pagead2.googlesyndication.com']")) {
    return;
  }

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PUBLISHER_ID}`;
  script.crossOrigin = 'anonymous';
  // Błąd ładowania skryptu nie może wywalić aplikacji.
  script.onerror = () => {
    /* AdSense nieosiągalny — aplikacja działa dalej */
  };
  document.head.appendChild(script);
}

/**
 * Renderuje reklamę AdSense w kontenerze `.cai-ad-real` (HTTPS/produkcja).
 * @returns true, jeśli próbę wyświetlenia podjęto; false, gdy brak warunków.
 */
export function renderAdSense(): boolean {
  if (!canLoadWebAds()) return false;
  try {
    const container = document.querySelector<HTMLElement>('.cai-ad-real');
    if (!container) return false;

    ensureAdSenseScript();
    // Czyścimy tylko tutaj (kontener jest przeznaczony wyłącznie na slot).
    container.innerHTML = '';
    const ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.style.minWidth = '320px';
    ins.setAttribute('data-ad-client', ADSENSE_PUBLISHER_ID);
    ins.setAttribute('data-ad-slot', ADSENSE_AD_SLOT);
    ins.setAttribute('data-ad-format', 'auto');
    ins.setAttribute('data-full-width-responsive', 'true');
    container.appendChild(ins);

    // "odpal" reklamę przez globalny bufor.
    (window as unknown as AdSenseWindow).adsbygoogle?.push({});
    return true;
  } catch {
    return false;
  }
}
