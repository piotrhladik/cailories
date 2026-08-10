// ============================================================================
// storage.ts — niezawodne operacje na pamięci lokalnej (localStorage) z
// obsługą błędów (np. tryb prywatny / brak miejsca). Offline-First.
// ============================================================================

import type { StateStorage } from 'zustand/middleware';

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

/**
 * Adapter Zustand `persist` → bezpieczny localStorage.
 * - Nigdy nie rzuca: przy braku miejsca (QuotaExceededError) zapis DEGRADUJE się
 *   zamiast wywalać `addMeal` — ponawia zapis po odrzuceniu binarnych zdjęć.
 * - Klucz pozostaje bez prefiksu (kompatybilny z dotychczasowym 'nutriscan-meals').
 */
export function createSafeZustandStorage(): StateStorage {
  return {
    getItem: (name) => {
      try {
        return localStorage.getItem(name);
      } catch {
        return null;
      }
    },
    setItem: (name, value) => {
      try {
        localStorage.setItem(name, value);
      } catch {
        // Przepełnienie limitu (QuotaExceededError) — spróbuj bez zdjęć.
        try {
          const parsed = JSON.parse(value) as {
            state?: { mealsByDay?: Record<string, Array<{ image?: string }>> };
          };
          const days = parsed.state?.mealsByDay;
          if (days) {
            for (const list of Object.values(days)) {
              if (list) {
                for (const meal of list) delete meal.image;
              }
            }
          }
          localStorage.setItem(name, JSON.stringify(parsed));
        } catch {
          // dajemy za wygraną — brak zapisu, ale bez crasha
        }
      }
    },
    removeItem: (name) => {
      try {
        localStorage.removeItem(name);
      } catch {
        /* ignorujemy — brak dostępu do storage */
      }
    },
  };
}