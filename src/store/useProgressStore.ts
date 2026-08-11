// ============================================================================
// useProgressStore — sklep Zustand z postępami użytkownika:
//  - wpisy wagi (A1) — serie pomiarów do wykresu SVG
//  - pomiary obwodów ciała (A5) — klatka/talia/biodra/ramiona/uda (cm)
//  - licznik wody (A2) — dzienny cel i spożycie kluczowane datą
// Trwały zapis w localStorage przez bezpieczny adapter createSafeZustandStorage.
// ============================================================================

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createSafeZustandStorage } from '../services/storage';
import { dateKey } from './useMealsStore';

/** Pojedynczy wpis masy ciała (kg). */
export interface WeightEntry {
  /** Data pomiaru YYYY-MM-DD. */
  date: string;
  /** Masa ciała w kilogramach. */
  weightKg: number;
}

/** Pomiary obwodów ciała w centymetrach (pola opcjonalne). */
export interface BodyMeasurement {
  /** Data pomiaru YYYY-MM-DD. */
  date: string;
  /** Obwód klatki piersiowej (cm). */
  chest?: number;
  /** Obwód talii (cm). */
  waist?: number;
  /** Obwód bioder (cm). */
  hips?: number;
  /** Obwód ramienia (cm). */
  arms?: number;
  /** Obwód uda (cm). */
  thighs?: number;
}

/** Zakres poprawności masy ciała (walidacja formularza). */
export const MIN_WEIGHT_KG = 20;
export const MAX_WEIGHT_KG = 400;

interface ProgressState {
  weightEntries: WeightEntry[];
  measurements: BodyMeasurement[];
  /** Dzienny cel wody w ml (domyślnie 2000). */
  waterGoalMl: number;
  /** Spożyta woda w ml kluczowana datą YYYY-MM-DD. */
  waterByDay: Record<string, number>;

  /** Dodaje/aktualizuje wpis wagi — data unikalna (jeden pomiar dziennie). */
  addWeight: (date: string, weightKg: number) => void;
  /** Usuwa wpis wagi o podanym indeksie. */
  removeWeight: (index: number) => void;
  /** Dodaje/aktualizuje pomiary — data unikalna. */
  addMeasurement: (m: BodyMeasurement) => void;
  /** Usuwa pomiary o podanym indeksie. */
  removeMeasurement: (index: number) => void;
  /** Ustawia dzienny cel wody (ml, min 1). */
  setWaterGoalMl: (ml: number) => void;
  /** Dodaje wypitą wodę (domyślnie dzisiaj). */
  addWater: (ml: number, date?: string) => void;
  /** Odejmuje wodę (nie schodzi poniżej 0; klucz z 0 jest usuwany). */
  removeWater: (ml: number, date?: string) => void;
  /** Zwraca wypitą wodę dla dnia (domyślnie dzisiaj). */
  getWaterForDay: (date?: string) => number;
  /** Czyści wszystkie postępy. */
  resetAll: () => void;
}

/** Sortowanie malejące wg daty — najnowsze wpisy na początku. */
function sortByDateDesc<T extends { date: string }>(arr: T[]): T[] {
  return [...arr].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      weightEntries: [],
      measurements: [],
      waterGoalMl: 2000,
      waterByDay: {},

      addWeight: (date, weightKg) =>
        set((state) => {
          const withoutDay = state.weightEntries.filter((e) => e.date !== date);
          return { weightEntries: sortByDateDesc([...withoutDay, { date, weightKg }]) };
        }),

      removeWeight: (index) =>
        set((state) => ({ weightEntries: state.weightEntries.filter((_, i) => i !== index) })),

      addMeasurement: (m) =>
        set((state) => {
          const withoutDay = state.measurements.filter((x) => x.date !== m.date);
          return { measurements: sortByDateDesc([...withoutDay, m]) };
        }),

      removeMeasurement: (index) =>
        set((state) => ({ measurements: state.measurements.filter((_, i) => i !== index) })),

      setWaterGoalMl: (ml) => set({ waterGoalMl: Math.max(1, ml) }),

      addWater: (ml, date = dateKey()) =>
        set((state) => ({
          waterByDay: { ...state.waterByDay, [date]: (state.waterByDay[date] ?? 0) + ml },
        })),

      removeWater: (ml, date = dateKey()) =>
        set((state) => {
          const current = state.waterByDay[date] ?? 0;
          const next = Math.max(0, current - ml);
          const waterByDay = { ...state.waterByDay };
          if (next <= 0) delete waterByDay[date];
          else waterByDay[date] = next;
          return { waterByDay };
        }),

      getWaterForDay: (date = dateKey()) => get().waterByDay[date] ?? 0,

      resetAll: () =>
        set({ weightEntries: [], measurements: [], waterGoalMl: 2000, waterByDay: {} }),
    }),
    {
      name: 'nutriscan-progress',
      version: 1,
      storage: createJSONStorage(createSafeZustandStorage),
    },
  ),
);
