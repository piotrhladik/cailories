// ============================================================================
// useMealsStore — sklep Zustand z dziennikiem posiłków.
// Zapis w localStorage z podziałem na dni (historia). Offline-First.
// ============================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DailySummary, Meal, Macro } from '../types';

/** Utworzenie stabilnego identyfikatora wpisu. */
function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Data lokalna w formacie YYYY-MM-DD. */
export function dateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

interface MealsState {
  /** Wszystkie posiłki zapisane w historii (mapa data -> lista). */
  mealsByDay: Record<string, Meal[]>;

  /** Dodanie posiłku do wskazanego dnia. */
  addMeal: (meal: Omit<Meal, 'id' | 'createdAt'>, date?: string) => Meal;
  /** Usunięcie posiłku po id w danym dniu. */
  removeMeal: (mealId: string, date?: string) => void;
  /** Podsumowanie dzienne dla wskazanej daty. */
  getSummary: (date?: string) => DailySummary;
  /** Sortowanie wpisów malejąco po czasie. */
  getMeals: (date?: string) => Meal[];
  /** Usunięcie wszystkich danych (reset). */
  clearAll: () => void;
}

export const useMealsStore = create<MealsState>()(
  persist(
    (set, get) => ({
      mealsByDay: {},

      addMeal: (meal, date) => {
        const day = date ?? dateKey();
        const full: Meal = { ...meal, id: createId(), createdAt: new Date().toISOString() };
        set((state) => ({
          mealsByDay: {
            ...state.mealsByDay,
            [day]: [full, ...(state.mealsByDay[day] ?? [])],
          },
        }));
        return full;
      },

      removeMeal: (mealId, date) => {
        const day = date ?? dateKey();
        set((state) => ({
          mealsByDay: {
            ...state.mealsByDay,
            [day]: (state.mealsByDay[day] ?? []).filter((m) => m.id !== mealId),
          },
        }));
      },

      getMeals: (date) => {
        const day = date ?? dateKey();
        const list = get().mealsByDay[day] ?? [];
        return [...list].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      },

      getSummary: (date) => {
        const meals = get().getMeals(date);
        const macros: Macro = meals.reduce(
          (acc, m) => ({
            protein: acc.protein + m.macros.protein,
            carbs: acc.carbs + m.macros.carbs,
            fats: acc.fats + m.macros.fats,
          }),
          { protein: 0, carbs: 0, fats: 0 },
        );
        return {
          date: date ?? dateKey(),
          calories: meals.reduce((acc, m) => acc + m.calories, 0),
          macros,
          mealCount: meals.length,
        };
      },

      clearAll: () => set({ mealsByDay: {} }),
    }),
    {
      name: 'nutriscan-meals',
      version: 1,
    },
  ),
);