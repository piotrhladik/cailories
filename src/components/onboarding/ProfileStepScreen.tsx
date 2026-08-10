// ============================================================================
// ProfileStepScreen — krok profilu w onboardingu (waga, wzrost, wiek, płeć,
// aktywność). Oblicza żywo TDEE i cele makro, potem wywołuje onDone.
// ============================================================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator } from 'lucide-react';
import { calculateTDEE, macrosFromCalories } from '../../utils/bmr';
import type { Gender } from '../../types';

/** Pola profilu przekazywane dalej przez onDone. */
export interface ProfileStepInput {
  heightCm: number;
  weightKg: number;
  age: number;
  gender: Gender;
  activityLevel: number;
}

interface Props {
  /** Wartości startowe (np. z domyślnego profilu). */
  initial?: ProfileStepInput;
  /** Zakończenie kroku profilu z uzupełnionymi danymi. */
  onDone: (data: ProfileStepInput) => void;
}

const ACTIVITY_OPTIONS: Array<{ v: number; label: string }> = [
  { v: 1.2, label: 'Brak aktywności' },
  { v: 1.375, label: 'Lekka (1-3 dni/tydz.)' },
  { v: 1.55, label: 'Umiarkowana (3-5 dni/tydz.)' },
  { v: 1.725, label: 'Wysoka (6-7 dni/tydz.)' },
  { v: 1.9, label: 'Bardzo wysoka (praca fizyczna/sport)' },
];

export default function ProfileStepScreen({ initial, onDone }: Props) {
  const def = initial ?? { heightCm: 175, weightKg: 75, age: 30, gender: 'female' as Gender, activityLevel: 1.375 };
  const [heightCm, setHeightCm] = useState(String(def.heightCm));
  const [weightKg, setWeightKg] = useState(String(def.weightKg));
  const [age, setAge] = useState(String(def.age));
  const [gender, setGender] = useState<Gender>(def.gender);
  const [activityLevel, setActivityLevel] = useState(def.activityLevel);

  const toNum = (s: string): number | null => {
    const n = Number(s);
    return Number.isFinite(n) && n > 0 ? n : null;
  };
  const h = toNum(heightCm);
  const w = toNum(weightKg);
  const a = toNum(age);
  const valid = h !== null && w !== null && a !== null;

  const preview = valid ? calculateTDEE({ heightCm: h as number, weightKg: w as number, age: a as number, gender, activityLevel }) : null;
  const macros = preview ? macrosFromCalories(preview) : null;

  const handleDone = (): void => {
    if (!valid) return;
    onDone({ heightCm: h as number, weightKg: w as number, age: a as number, gender, activityLevel });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center text-foreground">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <h1 className="mb-3 flex items-center justify-center gap-2 text-3xl font-bold">
          <Calculator className="text-primary" aria-hidden="true" /> Twój profil
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Na tej podstawie oszacujemy Twoje dzienne zapotrzebowanie kaloryczne (TDEE).
        </p>

        <div className="space-y-3 text-left">
          <div>
            <label className="label">Wzrost (cm)</label>
            <input className="input" inputMode="numeric" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} />
          </div>
          <div>
            <label className="label">Waga (kg)</label>
            <input className="input" inputMode="numeric" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
          </div>
          <div>
            <label className="label">Wiek</label>
            <input className="input" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} />
          </div>
          <div>
            <label className="label">Płeć</label>
            <select className="input" value={gender} onChange={(e) => setGender(e.target.value as Gender)}>
              <option value="female">Kobieta</option>
              <option value="male">Mężczyzna</option>
            </select>
          </div>
          <div>
            <label className="label">Aktywność fizyczna</label>
            <select className="input" value={activityLevel} onChange={(e) => setActivityLevel(Number(e.target.value))}>
              {ACTIVITY_OPTIONS.map((o) => (
                <option key={o.v} value={o.v}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {preview && macros && (
            <p className="rounded-xl bg-secondary p-3 text-center text-sm text-muted-foreground">
              Twoje dzienne zapotrzebowanie: <b className="text-foreground">{preview} kcal</b>
              <br />
              B {macros.protein}g · W {macros.carbs}g · T {macros.fats}g
            </p>
          )}

          <button
            onClick={handleDone}
            disabled={!valid}
            className="w-full rounded-full bg-primary px-8 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            Zakończ konfigurację
          </button>
        </div>
      </motion.div>
    </div>
  );
}