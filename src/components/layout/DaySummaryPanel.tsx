// ============================================================================
// DaySummaryPanel.tsx — kompletne podsumowanie dnia (kalorie + BWT + posiłki).
// Współużywane: wysuwany drawer (swipe z lewej) oraz zakładka "Dziennik".
// Z animowanymi licznikami, paskami makro i wejścia listy posiłków.
// ============================================================================

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Flame, UtensilsCrossed } from 'lucide-react';
import { useMealsStore, dateKey } from '../../store/useMealsStore';
import { useUserStore } from '../../store/useUserStore';
import { ProgressBar } from '../ui/ProgressBar';
import { AnimatedNumber } from '../ui/AnimatedNumber';
import { MealRow } from '../ui/MealRow';
import { Button } from '../ui/Button';
import { useToastStore } from '../../store/useToastStore';
import { formatDateLong } from '../../utils/format';

function shiftDate(d: Date, delta: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + delta);
  return next;
}

interface ManualMealState {
  name: string;
  calories: string;
  protein: string;
  carbs: string;
  fats: string;
}

const EMPTY_MANUAL: ManualMealState = { name: '', calories: '', protein: '', carbs: '', fats: '' };

export function DaySummaryPanel(): JSX.Element {
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [showManual, setShowManual] = useState(false);
  const [manual, setManual] = useState<ManualMealState>(EMPTY_MANUAL);

  const profile = useUserStore((s) => s.profile);
  const show = useToastStore((s) => s.show);

  const meals = useMealsStore((s) => s.getMeals(dateKey(selectedDate)));
  const summary = useMealsStore((s) => s.getSummary(dateKey(selectedDate)));
  const addMeal = useMealsStore((s) => s.addMeal);
  const removeMeal = useMealsStore((s) => s.removeMeal);

  const isToday = useMemo(() => dateKey(selectedDate) === dateKey(), [selectedDate]);
  const caloriesPct = useMemo(() => {
    const max = profile.dailyCaloriesGoal > 0 ? profile.dailyCaloriesGoal : 1;
    return Math.min(100, Math.round((summary.calories / max) * 100));
  }, [summary.calories, profile.dailyCaloriesGoal]);

  const remaining = Math.max(0, profile.dailyCaloriesGoal - summary.calories);

  const copySummary = async (): Promise<void> => {
    const lines = [
      `Podsumowanie dnia: ${formatDateLong(selectedDate)}`,
      `Kalorie: ${summary.calories} / ${profile.dailyCaloriesGoal} kcal`,
      `Makro: B ${summary.macros.protein} g | W ${summary.macros.carbs} g | T ${summary.macros.fats} g`,
      `Posiłki: ${summary.mealCount}`,
      ...meals.map((meal) => `- ${meal.name} (${meal.calories} kcal)`),
    ];

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      show('Podsumowanie dnia skopiowane do schowka.', 'success');
    } catch {
      show('Nie udało się skopiować podsumowania.', 'error');
    }
  };

  const addManualMeal = (): void => {
    const name = manual.name.trim();
    const cal = Number(manual.calories);
    if (!name || !Number.isFinite(cal) || cal <= 0) {
      show('Podaj nazwę i kalorie posiłku.', 'error');
      return;
    }
    const toNum = (s: string): number => (Number.isFinite(Number(s)) ? Number(s) : 0);
    addMeal(
      {
        name,
        calories: cal,
        macros: {
          protein: toNum(manual.protein),
          carbs: toNum(manual.carbs),
          fats: toNum(manual.fats),
        },
        source: 'manual',
      },
      dateKey(selectedDate),
    );
    setManual(EMPTY_MANUAL);
    setShowManual(false);
    show('Posiłek dodany do dziennika ✔', 'success');
  };

  return (
    <div className="space-y-5 p-4">
      {/* Nawigacja dni */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setSelectedDate((d) => shiftDate(d, -1))}
          aria-label="Poprzedni dzień"
          className="flex h-11 w-11 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold">{formatDateLong(selectedDate)}</p>
          {isToday && <p className="text-xs text-accent-dark dark:text-accent">Dzisiaj</p>}
        </div>
        <button
          onClick={() => setSelectedDate((d) => shiftDate(d, 1))}
          aria-label="Następny dzień"
          disabled={isToday}
          className="flex h-11 w-11 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 disabled:opacity-30 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Karta kalorii */}
      <div className="card p-5 text-center">
        <div
          className="mx-auto flex h-40 w-40 items-center justify-center rounded-full"
          style={{ background: `conic-gradient(#84CC16 ${caloriesPct}%, rgba(0,0,0,0.06) ${caloriesPct}%)` }}
        >
          <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full bg-white dark:bg-slate-800">
            <span className="flex items-center gap-1 text-3xl font-extrabold">
              <Flame size={22} className="text-accent" aria-hidden="true" />
              <AnimatedNumber value={summary.calories} />
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">z {profile.dailyCaloriesGoal.toLocaleString('pl-PL')} kcal</span>
          </div>
        </div>
        <motion.p
          layout
          className="mt-3 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          Pozostało{' '}
          <b className="text-accent-dark dark:text-accent">
            <AnimatedNumber value={remaining} /> kcal
          </b>
        </motion.p>
      </div>

      {/* Cele makro BWT */}
      <div className="card space-y-4 p-5">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Makroskładniki
        </h3>
        <MacroRow label="Białko" color="#3B82F6" value={summary.macros.protein} max={profile.macrosGoal.protein} />
        <MacroRow label="Węglowodany" color="#10B981" value={summary.macros.carbs} max={profile.macrosGoal.carbs} />
        <MacroRow label="Tłuszcze" color="#F59E0B" value={summary.macros.fats} max={profile.macrosGoal.fats} />
      </div>

      {/* Lista posiłków */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <UtensilsCrossed size={16} aria-hidden="true" />
            Posiłki ({summary.mealCount})
          </h3>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => void copySummary()}>
              Kopiuj skrót
            </Button>
            {isToday && (
              <Button variant="outline" onClick={() => setShowManual((v) => !v)}>
                + Dodaj ręcznie
              </Button>
            )}
          </div>
        </div>

        <AnimatePresence initial={false}>
          {showManual && (
            <motion.div
              key="manual-form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="card space-y-3 p-4">
                <ManualForm value={manual} onChange={setManual} onSubmit={addManualMeal} onCancel={() => setShowManual(false)} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {meals.length === 0 ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-400 dark:bg-slate-800/50 dark:text-slate-500"
          >
            Brak posiłków w tym dniu. Skanuj EAN, zrób zdjęcie lub użyj AI.
          </motion.p>
        ) : (
          <motion.ul className="space-y-3" layout>
            <AnimatePresence initial={false}>
              {meals.map((meal) => (
                <MealRow key={meal.id} meal={meal} onDelete={(id) => removeMeal(id, dateKey(selectedDate))} />
              ))}
            </AnimatePresence>
          </motion.ul>
        )}
      </div>
    </div>
  );
}

function MacroRow({ label, color, value, max }: { label: string; color: string; value: number; max: number }): JSX.Element {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <motion.span
          className="text-sm font-semibold"
          style={{ color }}
          key={value}
          initial={{ opacity: 0.4, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <AnimatedNumber value={value} /> g
          <span className="font-normal text-slate-400"> / {Math.round(max)} g</span>
        </motion.span>
      </div>
      <ProgressBar value={value} max={max} color={color} label={label} />
    </div>
  );
}

function ManualForm({
  value,
  onChange,
  onSubmit,
  onCancel,
}: {
  value: ManualMealState;
  onChange: (v: ManualMealState) => void;
  onSubmit: () => void;
  onCancel: () => void;
}): JSX.Element {
  const set = (patch: Partial<ManualMealState>): void => onChange({ ...value, ...patch });
  return (
    <>
      <div>
        <label className="label" htmlFor="dm-name">Nazwa</label>
        <input id="dm-name" className="input" placeholder="np. Płatki owsiane z bananem" value={value.name}
          onChange={(e) => set({ name: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="dm-cal">kcal</label>
          <input id="dm-cal" className="input" inputMode="numeric" placeholder="450" value={value.calories}
            onChange={(e) => set({ calories: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="dm-p">Białko (g)</label>
          <input id="dm-p" className="input" inputMode="numeric" placeholder="20" value={value.protein}
            onChange={(e) => set({ protein: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="dm-c">Węglowodany (g)</label>
          <input id="dm-c" className="input" inputMode="numeric" placeholder="60" value={value.carbs}
            onChange={(e) => set({ carbs: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="dm-f">Tłuszcze (g)</label>
          <input id="dm-f" className="input" inputMode="numeric" placeholder="12" value={value.fats}
            onChange={(e) => set({ fats: e.target.value })} />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <Button className="flex-1" onClick={onSubmit}>Zapisz</Button>
        <Button variant="secondary" onClick={onCancel}>Anuluj</Button>
      </div>
    </>
  );
}
