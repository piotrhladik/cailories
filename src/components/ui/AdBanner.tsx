// ============================================================================
// AdBanner.tsx — miejsce zarezerwowane pod reklamę (placeholder).
// Na web/PWA pokazujemy neutralny kontener informujący o reklamie; na platformie
// natywnej Capacitor wyświetlane są prawdziwe reklamy z AdMob.
// ============================================================================

import { useEffect } from 'react';
import { isNativePlatform, showBanner } from '../../services/admobService';

interface AdBannerProps {
  /** Wyświetlaj placeholder nawet gdy ads są wyłączone (debug). */
  force?: boolean;
}

export function AdBanner({ force = false }: AdBannerProps): JSX.Element | null {
  useEffect(() => {
    if (isNativePlatform()) {
      void showBanner();
      return;
    }
  }, []);

  // Native roda reklamę globalnie — komponent nie renderuje dodatkowego miejsca.
  if (isNativePlatform()) return null;

  if (!force) return null;

  return (
    <div className="mx-auto my-2 flex h-14 w-full max-w-app items-center justify-center rounded-2xl border border-dashed border-slate-300 text-xs text-slate-400 dark:border-slate-600 dark:text-slate-400">
      Reklama (AdMob) — miejsce na baner
    </div>
  );
}