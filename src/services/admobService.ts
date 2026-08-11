// ============================================================================
// admobService.ts — zintegrowany, wyizolowany moduł Google AdMob (Capacitor).
//
// Architektura:
//  - Na platformie natywnej (Android) korzystamy z @capacitor-community/admob.
//  - Na web/PWA reklamy są graceful-bound (wymagają konfiguracji AdSense);
//    serwis po prostu nie wykonuje operacji poza środowiskiem natywnym.
//  - Całość jest bezpieczna: żadna awaria AdMob nie przerywa pracy aplikacji.
// ============================================================================

import { Capacitor } from '@capacitor/core';
import {
  AdMob,
  BannerAdPosition,
  BannerAdSize,
  MaxAdContentRating,
} from '@capacitor-community/admob';
import { BANNER_AD_UNIT_ID, INTERSTITIAL_AD_UNIT_ID } from '../config';

/** Czy jesteśmy w środowisku natywnym Capacitor (Android). */
export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

/** Inicjalizacja AdMob — tylko na platformie natywnej. */
export async function initializeAdMob(): Promise<void> {
  if (!isNativePlatform()) return;
  try {
    await AdMob.initialize({
      initializeForTesting: false, // produkcja: prawdziwe reklamy
      maxAdContentRating: MaxAdContentRating.ParentalGuidance,
    });
  } catch {
    /* aplikacja działa bez reklam */
  }
}

/** Wyświetlenie bannera na dole ekranu. */
export async function showBanner(): Promise<void> {
  if (!isNativePlatform()) return;
  try {
    await AdMob.showBanner({
      adId: BANNER_AD_UNIT_ID,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      isTesting: false, // produkcja
    });
  } catch {
    /* brak bannera nie przerywa działania */
  }
}

/** Ukrycie bannera z ekranu (bez usuwania instancji — lepsze dla lifecycle). */
export async function hideBanner(): Promise<void> {
  if (!isNativePlatform()) return;
  try {
    await AdMob.hideBanner();
  } catch {
    /* puste */
  }
}

/** Całkowite usunięcie bannera z ekranu. */
export async function removeBanner(): Promise<void> {
  if (!isNativePlatform()) return;
  try {
    await AdMob.removeBanner();
  } catch {
    /* puste */
  }
}

/** Czy wskazano ad-unit interstitial (bezpieczny no-op, gdy puste). */
function hasInterstitialUnit(): boolean {
  return INTERSTITIAL_AD_UNIT_ID.trim().length > 0;
}

/** Przygotowanie reklamy interstitial (ładowanie w tle). Brak ad-unitu → no-op. */
export async function prepareInterstitial(): Promise<void> {
  if (!isNativePlatform()) return;
  if (!hasInterstitialUnit()) return; // bezpieczny no-op: brak osobnego ad-unitu
  try {
    await AdMob.prepareInterstitial({
      adId: INTERSTITIAL_AD_UNIT_ID,
      isTesting: false, // produkcja
    });
  } catch {
    /* puste */
  }
}

/** Wyświetlenie reklamy interstitial (if ready — rzuca, jeśli nie gotowa). */
export async function showInterstitial(): Promise<void> {
  if (!isNativePlatform()) return;
  if (!hasInterstitialUnit()) return; // bezpieczny no-op: brak osobnego ad-unitu
  try {
    await AdMob.showInterstitial();
  } catch {
    /* brak gotowej reklamy — nie blokujemy użytkownika */
  }
}

/** Diagnostyka: tryb natywny vs web-placeholder. */
export function getAdmobCapability(): 'native' | 'web-placeholder' {
  return isNativePlatform() ? 'native' : 'web-placeholder';
}