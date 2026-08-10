// ============================================================================
// config.ts — centralna konfiguracja aplikacji (AdMob, domyślny model Gemini).
// ============================================================================

/** Domyślny model Gemini (fallback przed wyborem użytkownika). */
export const DEFAULT_MODEL = 'gemini-2.5-flash';

export const ADMOB_APP_ID = 'ca-app-pub-1761393785289872~7024057976';
export const BANNER_AD_UNIT_ID = 'ca-app-pub-1761393785289872/3751741383';
export const INTERSTITIAL_AD_UNIT_ID = 'ca-app-pub-1761393785289872/3751741383';

/** Nagłówek user-agent używany przez reklamy web. */
export const APP_VERSION = '1.0.0';

/** Czy włączone są reklamy na platformie web (PWA). */
export const WEB_ADS_ENABLED = true;

