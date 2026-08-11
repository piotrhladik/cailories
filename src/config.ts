// ============================================================================
// config.ts — centralna konfiguracja aplikacji (AdMob, domyślny model Gemini).
// ============================================================================

/** Domyślny model Gemini (fallback przed wyborem użytkownika). */
export const DEFAULT_MODEL = 'gemini-3.5-flash-lite';

export const ADMOB_APP_ID = 'ca-app-pub-1761393785289872~7024057976';
export const BANNER_AD_UNIT_ID = 'ca-app-pub-1761393785289872/3751741383';
// osobny ad-unit interstitial w konsoli AdMob (NIE alias do banneru)
// — póki nie jest skonfigurowany, operacje interstitial są bezpiecznie no-op
export const INTERSTITIAL_AD_UNIT_ID = '';

/** Nagłówek user-agent używany przez reklamy web. */
export const APP_VERSION = '1.0.0';

/** Czy włączone są reklamy na platformie web (PWA). */
export const WEB_ADS_ENABLED = true;

