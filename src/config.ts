// ============================================================================
// config.ts — centralna konfiguracja aplikacji (AdMob, domyślny model Gemini).
// UWAGA: Testowe identyfikatory AdMob pochodzą z dokumentacji Google.
// Przed publikacją w Google Play zamień je na własne, produkcyjne ID.
// ============================================================================

/** Domyślny model Gemini (fallback przed wyborem użytkownika). */
export const DEFAULT_MODEL = 'gemini-2.5-flash';

/** Identyfikator aplikacji AdMob (Android app id). */
export const ADMOB_APP_ID = 'ca-app-pub-3940256099942544~3347511713';

/** Testowy identyfikator bannera (zastąp własnym przed publikacją). */
export const BANNER_AD_UNIT_ID = 'ca-app-pub-3940256099942544/6300978111';

/** Testowy identyfikator reklamy interstitial. */
export const INTERSTITIAL_AD_UNIT_ID = 'ca-app-pub-3940256099942544/1033173712';

/** Nagłówek user-agent używany przez reklamy web. */
export const APP_VERSION = '1.0.0';

/** Czy włączone są reklamy na platformie web (PWA). */
export const WEB_ADS_ENABLED = true;