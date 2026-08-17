// ============================================================================
// AdBanner.tsx — pas reklamowy w FLOW (nie fixed), między treścią a BottomNav.
//
//  DLACZEGO W FLOW (nie `fixed`):
//  - `position:fixed` naklejało pas na wierzch przewijanej treści → na ekranach
//    scrollowalnych (Ustawienia, Postępy) przysłaniało interfejs. To błąd UX.
//  - Pas w normalnym przepływie (relative) zajmuje WŁASNE, stałe miejsce
//    między MAIN a NAV → NIE nakłada się na treść i NIE przysłania niczego.
//  - Layout jest stabilny: stała wysokość (96px) zarezerwowana zawsze, więc
//    przełączanie zakładek NIE rusza przycisków.
//
//  RODZAJE:
//   1. Natywny Android (APK): prawdziwy banner AdMob (SDK renderuje sam).
//   2. Web HTTPS (publiczna domena): prawdziwy Google AdSense.
//   3. Web HTTP/localhost/dev: elegancki pas demonstracyjny (spójny, stały).
//      AdSense NIE startuje na localhost (wstrzykiwał pusty slot → rozjeżdżał).
// ============================================================================

import { useEffect, useState } from 'react';
import {
  isNativePlatform,
  showBanner,
  hideBanner,
  removeBanner,
} from '../../services/admobService';
import { renderAdSense, canServeRealAds, isWebPlatform } from '../../services/adsenseService';

interface AdBannerProps {
  /** Wyświetlaj baner nawet gdy ads są wyłączone (debug). */
  force?: boolean;
}

export const BANNER_HEIGHT = 96;

export function AdBanner({ force = false }: AdBannerProps): JSX.Element | null {
  // true = jesteśmy na HTTPS i możemy próbować prawdziwe reklamy.
  const [realAdsEligible, setRealAdsEligible] = useState(false);

  // ---------- Platforma NATYWNA (Android APK): prawdziwy AdMob ----------
  useEffect(() => {
    if (!isNativePlatform()) return undefined;

    void showBanner();
    const handleBlur = (): void => {
      void hideBanner();
    };
    const handleFocus = (): void => {
      void showBanner();
    };
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      void removeBanner();
    };
  }, []);

  // Natywny banner renderuje SDK — nie pokazujemy kontenera HTML.
  if (isNativePlatform()) return null;

  // ---------- Platforma WEB ----------
  useEffect(() => {
    if (isNativePlatform()) {
      setRealAdsEligible(false);
      return;
    }
    const realEligible = canServeRealAds();
    setRealAdsEligible(realEligible);
    if (realEligible) {
      const t = setTimeout(() => renderAdSense(), 200);
      return () => clearTimeout(t);
    }
  }, [isNativePlatform]);

  if (!force) return null;

  // --- HTTPS (produkcja) → prawdziwy AdSense ---
  if (realAdsEligible && isWebPlatform()) {
    return (
      <div className="cai-ads-holder w-full shrink-0 px-3 py-1">
        <div
          className="cai-ad-real w-full overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/95"
        />
      </div>
    );
  }

  // --- localhost / HTTP / dev → elegancki pas demonstracyjny (w flow) ---
  return (
    <div className="w-full shrink-0 px-3">
      <div
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 px-4 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/95"
        style={{ height: BANNER_HEIGHT }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-lg font-bold text-white">
            C
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Sprawdź swoje kalorie
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-400">
              CaiLORIES — Twój asystent żywienia
            </p>
          </div>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          Reklama
        </span>
      </div>
    </div>
  );
}
