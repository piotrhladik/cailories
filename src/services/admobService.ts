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
      initializeForTesting: true, // zmień na false dla produkcji
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
      isTesting: true, // zmień na false dla produkcji
    });
  } catch {
    /* brak bannera nie przerywa działania */
  }
}

/** Usunięcie bannera z ekranu. */
export async function removeBanner(): Promise<void> {
  if (!isNativePlatform()) return;
  try {
    await AdMob.removeBanner();
  } catch {
    /* puste */
  }
}

/** Przygotowanie reklamy interstitial (ładowanie w tle). */
export async function prepareInterstitial(): Promise<void> {
  if (!isNativePlatform()) return;
  try {
    await AdMob.prepareInterstitial({
      adId: INTERSTITIAL_AD_UNIT_ID,
      isTesting: true,
    });
  } catch {
    /* puste */
  }
}

/** Wyświetlenie reklamy interstitial (if ready — rzuca, jeśli nie gotowa). */
export async function showInterstitial(): Promise<void> {
  if (!isNativePlatform()) return;
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