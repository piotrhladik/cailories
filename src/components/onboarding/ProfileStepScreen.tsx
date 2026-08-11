// ============================================================================
// ProfileStepScreen — krok profilu w onboardingu (waga, wzrost, wiek, płeć,
// aktywność). Oblicza żywo TDEE i cele makro. Dodatkowo daje ręczne cele
// (custom goals) z priorytetem nad wyliczonymi. Po uzupełnieniu → onDone.
// ============================================================================

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  Bed,
  Bike,
  Calculator,
  Flame,
  Footprints,
  type LucideIcon,
  SlidersHorizontal,
} from 'lucide-react';
import { calculateTDEE, macrosFromCalories } from '../../utils/bmr';
import { pressable, revealItem, staggerContainer } from '../../utils/motion';
import type { Gender, Macro } from '../../types';

/** Pola profilu przekazywane dalej przez onDone. */
export interface ProfileStepInput {
  heightCm: number;
  weightKg: number;
  age: number;
  gender: Gender;
  activityLevel: number;
  /** Wyliczony cel kaloryczny (TDEE) — fallback, gdy brak ręcznych celów. */
  dailyCaloriesGoal: number;
  /** Wyliczone makroskładniki — fallback. */
  macrosGoal: Macro;
  /** Ręcznie ustawione cele — mają priorytet, gdy >0. */
  customCalories?: number;
  customProtein?: number;
  customCarbs?: number;
  customFats?: number;
}

interface Props {
  /** Wartości startowe (np. z domyślnego profilu). */
  initial?: Omit<ProfileStepInput, 'dailyCaloriesGoal' | 'macrosGoal' | 'customCalories' | 'customProtein' | 'customCarbs' | 'customFats'>;
  /** Zakończenie kroku profilu z uzupełnionymi danymi. */
  onDone: (data: ProfileStepInput) => void;
}

const ACTIVITY_OPTIONS: Array<{ v: number; icon: LucideIcon; label: string }> = [
  { v: 1.2, icon: Bed, label: 'Brak' },
  { v: 1.375, icon: Footprints, label: 'Lekka' },
  { v: 1.55, icon: Activity, label: 'Umiark.' },
  { v: 1.725, icon: Bike, label: 'Wysoka' },
  { v: 1.9, icon: Flame, label: 'Bardzo wysoka' },
];

const GENDER_OPTIONS: Array<{ v: Gender; label: string }> = [
  { v: 'female', label: 'Kobieta' },
  { v: 'male', label: 'Mężczyzna' },
];

/** Parsuje liczbę dodatnią; rozróżnia pole puste od wartości błędnej. */
interface ParsedNum {
  n: number | null;
  error: string | null;
}
const parseNum = (s: string, msg: string): ParsedNum => {
  if (s.trim() === '') return { n: null, error: null };
  const n = Number(s);
  if (!Number.isFinite(n) || n <= 0) return { n: null, error: msg };
  return { n, error: null };
};

export default function ProfileStepScreen({ initial, onDone }: Props) {
  const def = initial ?? { heightCm: 175, weightKg: 75, age: 30, gender: 'female' as Gender, activityLevel: 1.375 };

  const [heightCm, setHeightCm] = useState(String(def.heightCm));
  const [weightKg, setWeightKg] = useState(String(def.weightKg));
  const [age, setAge] = useState(String(def.age));
  const [gender, setGender] = useState<Gender>(def.gender);
  const [activityLevel, setActivityLevel] = useState(def.activityLevel);

  // Ręczne cele (custom goals).
  const [customOn, setCustomOn] = useState(false);
  const [cCal, setCCal] = useState('');
  const [cPro, setCPro] = useState('');
  const [cCar, setCCar] = useState('');
  const [cFat, setCFat] = useState('');

  const h = parseNum(heightCm, 'Podaj wzrost — liczba większa od 0.');
  const w = parseNum(weightKg, 'Podaj wagę — liczba większa od 0.');
  const a = parseNum(age, 'Podaj wiek — liczba większa od 0.');
  const baseValid = h.n !== null && w.n !== null && a.n !== null;

  const target = { heightCm: h.n ?? 0, weightKg: w.n ?? 0, age: a.n ?? 0, gender, activityLevel };
  const preview = baseValid ? calculateTDEE(target) : null;
  const macros = preview !== null ? macrosFromCalories(preview) : null;

  const custom: ParsedNum[] = [
    parseNum(cCal, 'Podaj kalorie — liczba większa od 0.'),
    parseNum(cPro, 'Podaj białko (g) — liczba większa od 0.'),
    parseNum(cCar, 'Podaj węglowodany (g) — liczba większa od 0.'),
    parseNum(cFat, 'Podaj tłuszcze (g) — liczba większa od 0.'),
  ];
  const customInvalid = customOn && custom.some((f) => f.error !== null);
  const customCaloriesValid = customOn && cCal.trim() !== '' && custom[0].n !== null;
  const customValid = customOn && !customInvalid && customCaloriesValid;
  // Kalorie wymagane, makro opcjonalne — ale każde wpisane musi być poprawne.
  const valid = baseValid && (customOn ? customValid : true);

  // Aktywne cele do podglądu: ręczne mają priorytet, reszta uzupełniona z TDEE.
  const activeCalories = customOn && custom[0].n !== null ? custom[0].n : preview;
  const activeMacros =
    customOn && (custom[1].n !== null || custom[2].n !== null || custom[3].n !== null)
      ? {
          protein: custom[1].n ?? macros?.protein ?? 0,
          carbs: custom[2].n ?? macros?.carbs ?? 0,
          fats: custom[3].n ?? macros?.fats ?? 0,
        }
      : macros;

  const handleDone = (): void => {
    if (!valid || h.n === null || w.n === null || a.n === null || preview === null || macros === null) return;
    const base: ProfileStepInput = {
      heightCm: h.n,
      weightKg: w.n,
      age: a.n,
      gender,
      activityLevel,
      dailyCaloriesGoal: preview,
      macrosGoal: macros,
    };
    // Dołącz ręczne cele, gdy użytkownik je wpisał — inaczej zostają wyliczone (fallback).
    if (customOn) {
      if (custom[0].n !== null) base.customCalories = custom[0].n;
      if (custom[1].n !== null) base.customProtein = custom[1].n;
      if (custom[2].n !== null) base.customCarbs = custom[2].n;
      if (custom[3].n !== null) base.customFats = custom[3].n;
    }
    onDone(base);
  };

  return (
    <div className="paper-layer flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center text-foreground">
      <motion.div
        variants={staggerContainer()}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md"
      >
        <motion.h1 variants={revealItem} className="mb-3 flex items-center justify-center gap-2 text-3xl font-bold">
          <Calculator className="text-primary" aria-hidden="true" /> Twój profil
        </motion.h1>
        <motion.p variants={revealItem} className="mb-6 text-sm text-muted-foreground">
          Na tej podstawie oszacujemy Twoje dzienne zapotrzebowanie kaloryczne (TDEE).
        </motion.p>

        <div className="space-y-4 text-left">
          {/* Dane ciała */}
          <motion.div variants={revealItem} className="paper-card space-y-3 p-4">
            <div>
              <label htmlFor="prof-height" className="label">
                Wzrost (cm)
              </label>
              <input
                id="prof-height"
                className="input"
                inputMode="numeric"
                aria-label="Wzrost w centymetrach"
                aria-invalid={h.error !== null}
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
              />
              {h.error && (
                <p className="mt-1 text-xs text-rose-500" role="alert">
                  {h.error}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="prof-weight" className="label">
                Waga (kg)
              </label>
              <input
                id="prof-weight"
                className="input"
                inputMode="numeric"
                aria-label="Waga w kilogramach"
                aria-invalid={w.error !== null}
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
              />
              {w.error && (
                <p className="mt-1 text-xs text-rose-500" role="alert">
                  {w.error}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="prof-age" className="label">
                Wiek
              </label>
              <input
                id="prof-age"
                className="input"
                inputMode="numeric"
                aria-label="Wiek w latach"
                aria-invalid={a.error !== null}
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
              {a.error && (
                <p className="mt-1 text-xs text-rose-500" role="alert">
                  {a.error}
                </p>
              )}
            </div>
          </motion.div>

          {/* Płeć — przełącznik */}
          <motion.div variants={revealItem} className="paper-card space-y-2 p-4">
            <span className="label block">Płeć</span>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Płeć">
              {GENDER_OPTIONS.map((o) => {
                const selected = gender === o.v;
                return (
                  <button
                    key={o.v}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setGender(o.v)}
                    className={
                      'flex min-h-[44px] items-center justify-center rounded-2xl border px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ' +
                      (selected
                        ? 'border-accent bg-accent/10 text-accent-dark dark:text-accent'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300')
                    }
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Karty stylu życia zamiast selecta */}
          <motion.div variants={revealItem} className="paper-card p-4">
            <span className="label block">Aktywność fizyczna</span>
            <div
              className="flex gap-2 overflow-x-auto pb-1 no-scrollbar"
              role="radiogroup"
              aria-label="Poziom aktywności fizycznej"
            >
              {ACTIVITY_OPTIONS.map((o) => {
                const Icon = o.icon;
                const selected = activityLevel === o.v;
                return (
                  <motion.button
                    key={o.v}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setActivityLevel(o.v)}
                    {...pressable}
                    className={
                      'flex w-24 shrink-0 flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ' +
                      (selected
                        ? 'border-accent bg-accent/10 text-accent-dark dark:text-accent'
                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400')
                    }
                  >
                    <Icon size={20} aria-hidden="true" />
                    {o.label}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Ręczne cele (custom goals) — akordeon ze switchem */}
          <motion.div variants={revealItem} className="paper-card p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-sm font-bold text-foreground">
                <SlidersHorizontal size={18} className="text-accent" aria-hidden="true" />
                Ustaw własny cel
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={customOn}
                aria-label="Ustaw własny cel kaloryczny i makro"
                onClick={() => setCustomOn((v) => !v)}
                className="flex shrink-0 items-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <span
                  className={
                    'relative inline-flex h-7 w-12 items-center rounded-full transition-colors ' +
                    (customOn ? 'bg-accent' : 'bg-slate-300 dark:bg-slate-700')
                  }
                >
                  <motion.span
                    layout
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className={
                      'absolute h-5 w-5 rounded-full bg-white shadow ' +
                      (customOn ? 'left-[26px]' : 'left-[4px]')
                    }
                  />
                </span>
              </button>
            </div>

            <AnimatePresence initial={false}>
              {customOn && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className="overflow-hidden"
                >
                  <div className="space-y-3 pt-4">
                    <div>
                      <label htmlFor="prof-custom-cal" className="label">
                        Kalorie (kcal)
                      </label>
                      <input
                        id="prof-custom-cal"
                        className="input"
                        inputMode="numeric"
                        aria-label="Własny cel kaloryczny w kcal"
                        aria-invalid={customOn && custom[0].error !== null}
                        placeholder="np. 2000"
                        value={cCal}
                        onChange={(e) => setCCal(e.target.value)}
                      />
                      {customOn && custom[0].error && (
                        <p className="mt-1 text-xs text-rose-500" role="alert">
                          {custom[0].error}
                        </p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="prof-custom-prot" className="label">
                        Białko (g)
                      </label>
                      <input
                        id="prof-custom-prot"
                        className="input"
                        inputMode="numeric"
                        aria-label="Własny cel białka w gramach"
                        aria-invalid={customOn && custom[1].error !== null}
                        placeholder="np. 150"
                        value={cPro}
                        onChange={(e) => setCPro(e.target.value)}
                      />
                      {customOn && custom[1].error && (
                        <p className="mt-1 text-xs text-rose-500" role="alert">
                          {custom[1].error}
                        </p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="prof-custom-carb" className="label">
                        Węglowodany (g)
                      </label>
                      <input
                        id="prof-custom-carb"
                        className="input"
                        inputMode="numeric"
                        aria-label="Własny cel węglowodanów w gramach"
                        aria-invalid={customOn && custom[2].error !== null}
                        placeholder="np. 250"
                        value={cCar}
                        onChange={(e) => setCCar(e.target.value)}
                      />
                      {customOn && custom[2].error && (
                        <p className="mt-1 text-xs text-rose-500" role="alert">
                          {custom[2].error}
                        </p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="prof-custom-fat" className="label">
                        Tłuszcze (g)
                      </label>
                      <input
                        id="prof-custom-fat"
                        className="input"
                        inputMode="numeric"
                        aria-label="Własny cel tłuszczów w gramach"
                        aria-invalid={customOn && custom[3].error !== null}
                        placeholder="np. 70"
                        value={cFat}
                        onChange={(e) => setCFat(e.target.value)}
                      />
                      {customOn && custom[3].error && (
                        <p className="mt-1 text-xs text-rose-500" role="alert">
                          {custom[3].error}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Podgląd celu */}
          {activeCalories !== null && activeMacros && (
            <motion.p
              variants={revealItem}
              className="rounded-xl bg-secondary p-3 text-center text-sm text-muted-foreground"
            >
              {customOn && custom[0].n !== null ? 'Twój ręczny cel: ' : 'Twoje dzienne zapotrzebowanie: '}
              <b className="text-foreground">{activeCalories} kcal</b>
              <br />
              B {activeMacros.protein}g · W {activeMacros.carbs}g · T {activeMacros.fats}g
              {customOn && custom[0].n !== null && (
                <span className="mt-1 block text-[11px]">Ręczny cel ma priorytet nad wyliczonym.</span>
              )}
            </motion.p>
          )}

          <motion.button
            variants={revealItem}
            onClick={handleDone}
            disabled={!valid}
            className="w-full rounded-full bg-primary px-8 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
          >
            Zakończ konfigurację
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}