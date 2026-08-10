// ============================================================================
// Wyliczanie zapotrzebowania kalorycznego BMR (Mifflin-St Jeor) oraz TDEE.
// Cele makro układasz proporcjonalnie do energii (kcal) wybranej diety.
// ============================================================================

import type { Gender, Macro } from '../types';

/** Obliczanie BMR wg wzoru Mifflin-St Jeor. */
export function calculateBMR(params: {
  weightKg: number;
  heightCm: number;
  age: number;
  gender: Gender;
}): number {
  const { weightKg, heightCm, age, gender } = params;
  // Mężczyźni: 10*W + 6.25*H - 5*A + 5
  // Kobiety:   10*W + 6.25*H - 5*A - 161
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === 'male' ? base + 5 : base - 161;
}

/** Obliczenie dziennego zapotrzebowania TDEE = BMR * współczynnik aktywności. */
export function calculateTDEE(params: {
  weightKg: number;
  heightCm: number;
  age: number;
  gender: Gender;
  activityLevel: number;
}): number {
  const bmr = calculateBMR(params);
  return Math.round(bmr * params.activityLevel);
}

/**
 * Ustalenie docelowych makroskładników (g) na podstawie celu kcal.
 * Domyślny rozkład energii: Białko 15%, Węglowodany 50%, Tłuszcze 35%.
 */
export function macrosFromCalories(
  calories: number,
  split?: { proteinPct: number; carbsPct: number; fatsPct: number },
): Macro {
  const s = split ?? { proteinPct: 0.15, carbsPct: 0.5, fatsPct: 0.35 };
  return {
    protein: Math.round((calories * s.proteinPct) / 4), // 4 kcal/g
    carbs: Math.round((calories * s.carbsPct) / 4), // 4 kcal/g
    fats: Math.round((calories * s.fatsPct) / 9), // 9 kcal/g
  };
}