// ============================================================================
// barcodeScanner.ts — skaner kodów kreskowych EAN działający na Web (PWA).
// Wykorzystuje natywne API BarcodeDetector (Chromium/Android). Jeśli nie jest
// dostępne, aplikacja przechodzi na ręczny wpis kodu (fallback).
// ============================================================================

/** Minimalny interfejs detektora (hermetyzacja n/API przeglądarki). */
interface BarcodeDetectorApi {
  detect(source: CanvasImageSource): Promise<Array<{ rawValue: string }>>;
  getSupportedFormats(): Promise<string[]>;
}

let detector: BarcodeDetectorApi | null = null;

/** Czy środowisko wspiera detektor kodów kreskowych. */
export function isBarcodeDetectorSupported(): boolean {
  return typeof (window as unknown as { BarcodeDetector?: unknown }).BarcodeDetector !== 'undefined';
}

/** Eager-zwrócenie detektora (lub null, gdy niedostępny). */
export function initDetector(): Promise<BarcodeDetectorApi | null> {
  if (detector) return Promise.resolve(detector);
  if (!isBarcodeDetectorSupported()) return Promise.resolve(null);
  try {
    const Ctor = (window as unknown as { BarcodeDetector: new (o?: object) => BarcodeDetectorApi }).BarcodeDetector;
    detector = new Ctor({ formats: ['ean_13', 'ean_8'] });
    return Promise.resolve(detector);
  } catch {
    detector = null;
    return Promise.resolve(null);
  }
}

/** Zatrzymanie kamery i strumieni. */
export function stopStream(stream: MediaStream | null): void {
  stream?.getTracks().forEach((t) => t.stop());
}

/** Uruchomienie kamery (getUserMedia), facingMode environment. */
export async function startCamera(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Ten urządzenie nie wspiera kamery (przeglądarka).');
  }
  return navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'environment', aspectRatio: { ideal: 1 } },
    audio: false,
  });
}

/** Skanuje klatkę wideo i zwraca pierwszy wykryty EAN (lub null). */
export async function detectBarcodeFromVideo(video: HTMLVideoElement): Promise<string | null> {
  const activeDetector = await initDetector();
  if (!activeDetector) return null;
  try {
    const codes = await activeDetector.detect(video);
    return codes[0]?.rawValue ?? null;
  } catch {
    return null;
  }
}