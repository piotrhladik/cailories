// ============================================================================
// imageCompressor.ts — kompresja zdjęć przed wysłaniem do Gemini API.
// Wymaganie wydajnościowe: max 1024 px (strona dłuższa), JPEG jakość 0.8.
// Dzięki temu wysyłamy mniej danych i zmniejszamy ryzyko limitów.
// ============================================================================

export interface CompressedImage {
  /** Data URL w formacie image/jpeg (base64, bez prefiksu jest w danym polu). */
  base64: string;
  /** Szerokość po kompresji. */
  width: number;
  /** Wysokość po kompresji. */
  height: number;
}

const MAX_DIMENSION = 1024;
const JPEG_QUALITY = 0.8;

/**
 * Kompresja obrazu (File/Blob) do max 1024 px w dłuższym boku i JPEG 0.8.
 * Zwraca base64 (bez prefiksu) gotowy do `inlineData` w Gemini API.
 */
export async function compressImage(file: Blob): Promise<CompressedImage> {
  // 1. Wczytanie obrazu jako element <img> przez obiekt URL.
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    // 2. Skalowanie w Canvas do maksymalnych wymiarów.
    const { width, height } = computeScaledSize(img.width, img.height);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Nie udało się utworzyć kontekstu 2D dla obrazu.');
    }
    ctx.drawImage(img, 0, 0, width, height);
    // 3. Eksport do JPEG o jakości 0.8.
    const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
    const base64 = dataUrl.split(',')[1] ?? '';
    return { base64, width, height };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Nie udało się odczytać obrazu.'));
    img.src = src;
  });
}

function computeScaledSize(w: number, h: number): { width: number; height: number } {
  const longest = Math.max(w, h);
  if (longest <= MAX_DIMENSION) {
    return { width: w, height: h };
  }
  const ratio = MAX_DIMENSION / longest;
  return { width: Math.round(w * ratio), height: Math.round(h * ratio) };
}

/** Odczyt wybranego pliku jako Blob z ukrytego inputa (helper dla UI). */
export function fileToBlob(file: File): Blob {
  return file;
}