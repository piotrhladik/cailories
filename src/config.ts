// ============================================================================
// config.ts — centralna konfiguracja aplikacji (AdMob, AdSense, domyślny model Gemini).
// ============================================================================

/** Domyślny model Gemini (fallback przed wyborem użytkownika). */
export const DEFAULT_MODEL = 'gemini-3.5-flash-lite';

// ============================ AdMob (APK / Android) ============================
export const ADMOB_APP_ID = 'ca-app-pub-462291723554126~4046873988';
export const BANNER_AD_UNIT_ID = 'ca-app-pub-462291723554126/9919619944';

// Testowe identyfikatory Google (sample) — do testów na emulatorze/urządzeniu.
export const TEST_APP_ID = 'ca-app-pub-3940256099942544~3347511713';
export const TEST_BANNER_AD_UNIT_ID = 'ca-app-pub-3940256099942544/6300978111';

/** Czy używać testowych (sample) jednostek AdMob. Ustaw FALSE przed publikacją. */
export const USE_TEST_ADS = false;

// Osobny ad-unit interstitial (NIE alias do banneru). Puste = bezpieczny no-op.
export const INTERSTITIAL_AD_UNIT_ID = '';

// ============================ AdSense (Web / PWA) ============================
/** Twoje Google AdSense Publisher ID (do reklam web/PWA, np. na iPhonie). */
export const ADSENSE_PUBLISHER_ID = 'pub-462291723554126';

/** ID jednostki reklamowej (ad slot) AdSense — wyświetlane na stronie. */
export const ADSENSE_AD_SLOT = '2301034709';

/** Czy włączone są reklamy web (AdSense) — wymaga valid Publisher ID. */
export const WEB_ADS_ENABLED = true;

// ================================ Pozostałe ==================================
/** Nagłówek user-agent używany przez reklamy web. */
export const APP_VERSION = '1.0.0';
