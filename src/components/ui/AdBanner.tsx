// ============================================================================
// AdBanner.tsx — miejsce reklamy AdMob z obsługą cyklu życia.
// Na platformie natywnej (Capacitor/Android) wyświetlamy prawdziwy banner AdMob;
// cykl życia (ukrycie w tle / ponowne pokazanie na foreground) realizujemy przez
// zdarzenia `window` focus/blur. Na web/PWA pokazujemy elegancki placeholder.
// ============================================================================

import { useEffect } from 'react';
import {
  isNativePlatform,
  showBanner,
  hideBanner,
  removeBanner,
} from '../../services/admobService';

interface AdBannerProps {
  /** Wyświetlaj placeholder nawet gdy ads są wyłączone (debug). */
  force?: boolean;
}

export function AdBanner({ force = false }: AdBannerProps): JSX.Element | null {
  useEffect(() => {
    if (!isNativePlatform()) return;

    void showBanner();

    // Cykl życia: ukryj banner gdy aplikacja traci fokus (tło), pokaż na powrót.
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

  // Na natywnej platformie banner renderowany jest natywnie — komponent nie
  // pokazuje dodatkowego kontenera.
  if (isNativePlatform()) return null;

  if (!force) return null;

  return (
    <div className="mx-auto my-2 flex h-14 w-full max-w-app items-center justify-center rounded-2xl border border-dashed border-slate-300 text-xs text-slate-400 dark:border-slate-600 dark:text-slate-500">
      Reklama (AdMob)
    </div>
  );
}