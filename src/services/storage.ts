// ============================================================================
// storage.ts — niezawodne operacje na pamięci lokalnej (localStorage) z
// obsługą błędów (np. tryb prywatny / brak miejsca). Offline-First.
// ============================================================================

const PREFIX = 'nutriscan:';

/** Odczyt wartości JSON z localStorage (bezpiecznie). */
export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Zapis wartości JSON do localStorage (bezpiecznie, nie rzuca błędu). */
export function saveJSON<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/** Usunięcie klucza z localStorage. */
export function removeKey(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    /* ignorujemy — brak dostępu do storage */
  }
}

/** Obliczenie przybliżonego rozmiaru danych zajmowanych w pamięci. */
export function storageSizeBytes(): number {
  try {
    let size = 0;
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i);
      if (k) {
        size += k.length + (localStorage.getItem(k)?.length ?? 0);
      }
    }
    return size;
  } catch {
    return 0;
  }
}