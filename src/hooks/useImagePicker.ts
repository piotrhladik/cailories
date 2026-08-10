// ============================================================================
// useImagePicker.ts — wybór/zrobienie zdjęcia posiłku.
//  - Natywny Capacitor Camera (Android/iOS) — przez plugin.
//  - Web/PWA — input[type=file] z capture (kamera) lub bez (galeria).
// Zdjęcie jest zawsze kompresowane (max 1024 px, JPEG 0.8).
// ============================================================================

import { useCallback, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraSource, CameraResultType } from '@capacitor/camera';
import { compressImage } from '../services/imageCompressor';

export interface PickedImage {
  /** Zakodowane base64 (bez prefiksu) w JPEG — gotowe dla Gemini. */
  base64: string;
  /** Pełny Data URL (do podglądu w UI). */
  dataUrl: string;
}

export interface UseImagePickerResult {
  picking: boolean;
  /** Pobranie obrazu z kamery (fromCamera=true) lub galerii (false). */
  pick: (fromCamera: boolean) => Promise<PickedImage | null>;
  /** Wyczyść stan błędu. */
  resetError: () => void;
  lastError: string | null;
}

export function useImagePicker(): UseImagePickerResult {
  const [picking, setPicking] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const pick = useCallback(async (fromCamera: boolean): Promise<PickedImage | null> => {
    setLastError(null);
    setPicking(true);
    try {
      // Ścieżka natywna (Capacitor).
      if (Capacitor.isNativePlatform()) {
        const photo = await Camera.getPhoto({
          resultType: CameraResultType.Base64,
          source: fromCamera ? CameraSource.Camera : CameraSource.Photos,
          quality: 80,
          allowEditing: false,
        });
        if (!photo.base64String) {
          return null;
        }
        // Konwersja na Blob i kompresja (brak pola mimeType w typach — JPEG).
        const blob = base64ToBlob(photo.base64String, 'image/jpeg');
        const compressed = await compressImage(blob);
        return {
          base64: compressed.base64,
          dataUrl: `data:image/jpeg;base64,${compressed.base64}`,
        };
      }

      // Ścieżka webowa — input[type=file].
      const data: PickedImage | null = await pickFromWebInput(fromCamera);

      if (!data) {
        setPicking(false);
        return null;
      }
      return data;
    } catch {
      setLastError('Nie udało się pobrać obrazu. Sprawdź uprawnienia kamery.');
      return null;
    } finally {
      setPicking(false);
      // posprzątanie
      if (fileRef.current) {
        fileRef.current.value = '';
      }
    }
  }, []);

  const resetError = useCallback(() => setLastError(null), []);

  return { picking, pick, resetError, lastError };
}

/** Otwarcie natywnego wybieraka plików (web/PWA) z gwarancją zakończenia.
 *  Promise rozwiązuje się ZAWSZE — także po anulowaniu okna wyboru — dzięki
 *  czemu stan `picking` nie zostaje zablokowany na stałe (stary bug). */
function pickFromWebInput(fromCamera: boolean): Promise<PickedImage | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = fromCamera ? 'image/*;capture=camera' : 'image/*';

    let settled = false;
    const inputHasPendingFile = (): boolean => {
      try {
        return Boolean(input.files?.length);
      } catch {
        return false;
      }
    };
    const finish = (result: PickedImage | null): void => {
      if (settled) return;
      settled = true;
      window.removeEventListener('focus', onFocusRefocus);
      window.clearTimeout(safetyTimer);
      input.remove();
      resolve(result);
    };
    // Anulowanie okna wyboru zwraca focus do dokumentu (a nie do inputa).
    const onFocusRefocus = (): void => {
      if (document.activeElement !== input && !inputHasPendingFile()) {
        finish(null);
      }
    };
    // Bezpiecznik: nawet jeśli żadne zdarzenie nie nadejdzie, Promise się rozwiąże.
    const safetyTimer = window.setTimeout(() => finish(null), 120_000);

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        finish(null);
        return;
      }
      try {
        const compressed = await compressImage(file);
        finish({ base64: compressed.base64, dataUrl: `data:image/jpeg;base64,${compressed.base64}` });
      } catch {
        finish(null);
      }
    };
    input.oncancel = () => finish(null);
    window.addEventListener('focus', onFocusRefocus);
    input.click();
  });
}

/** Konwersja base64 na Blob (do kompresji). */
function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteChars = atob(base64);
  const bytes = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i += 1) {
    bytes[i] = byteChars.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}