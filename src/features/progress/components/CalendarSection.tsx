// ============================================================================
// CalendarSection (A3) — kalendarz miesięczny posiłków: kropka przy dniach
// z posiłkami, klik dnia pokazuje listę (MealRow) + sumę kcal, nawigacja
// między miesiącami ze slide'em Framer Motion.
// ============================================================================

import { useMemo, useState } from 'react';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { CalendarDays, ChevronLeft, ChevronRight, UtensilsCrossed } from 'lucide-react';
import { useMealsStore, dateKey } from '../../../store/useMealsStore';
import { MealRow } from '../../../components/ui/MealRow';
import { SectionHeader } from './SectionHeader';
import { formatInt } from '../../../utils/format';
import { formatDayMonth } from '../progressUtils';
import type { Meal } from '../../../types';

const WEEKDAYS = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];
const MONTHS_PL = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień',
];

/** Warianty slide'u miesiąca — kierunek zależny od nawigacji (custom). */
const monthVariants: Variants = {
  enter: (d: number) => ({ x: d > 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? -48 : 48, opacity: 0 }),
};

interface DayCell {
  date: string;
  day: number;
  inMonth: boolean;
  hasMeals: boolean;
  isToday: boolean;
}

/** Siatka 6x7 (42 komórki) — tydzień zaczyna się w poniedziałek. */
function buildMonthGrid(year: number, month: number, mealsByDay: Record<string, Meal[]>): DayCell[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leading = (new Date(year, month, 1).getDay() + 6) % 7;
  const today = dateKey();
  const cells: DayCell[] = [];
  for (let i = 0; i < leading; i++) {
    const d = new Date(year, month, i - leading + 1);
    cells.push({ date: dateKey(d), day: d.getDate(), inMonth: false, hasMeals: false, isToday: false });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dk = dateKey(new Date(year, month, day));
    cells.push({
      date: dk,
      day,
      inMonth: true,
      hasMeals: (mealsByDay[dk]?.length ?? 0) > 0,
      isToday: dk === today,
    });
  }
  for (let i = cells.length; i < 42; i++) {
    const d = new Date(year, month + 1, i - leading - daysInMonth + 1);
    cells.push({ date: dateKey(d), day: d.getDate(), inMonth: false, hasMeals: false, isToday: false });
  }
  return cells;
}

export function CalendarSection(): JSX.Element {
  const mealsByDay = useMealsStore((s) => s.mealsByDay);
  const removeMeal = useMealsStore((s) => s.removeMeal);
  const [[month, dir], setMonth] = useState<[Date, number]>(() => [new Date(), 0]);
  const [selected, setSelected] = useState<string>(() => dateKey());

  const cells = useMemo(
    () => buildMonthGrid(month.getFullYear(), month.getMonth(), mealsByDay),
    [month, mealsByDay],
  );
  const dayMeals = useMemo(() => mealsByDay[selected] ?? [], [mealsByDay, selected]);
  const dayCalories = useMemo(() => dayMeals.reduce((acc, m) => acc + m.calories, 0), [dayMeals]);

  const shiftMonth = (delta: number): void => {
    const next = new Date(month.getFullYear(), month.getMonth() + delta, 1);
    setMonth([next, delta]);
    setSelected(dateKey(next));
  };

  return (
    <section>
      <SectionHeader icon={CalendarDays} title="Kalendarz posiłków" />
      <div className="card p-4">
        <MonthHeader month={month} dir={dir} onShift={shiftMonth} />
        <MonthGrid month={month} dir={dir} cells={cells} selected={selected} onPick={setSelected} />
      </div>
      <DayMealsList
        date={selected}
        meals={dayMeals}
        calories={dayCalories}
        onDelete={(id) => removeMeal(id, selected)}
      />
    </section>
  );
}

function MonthHeader({ month, dir, onShift }: { month: Date; dir: number; onShift: (d: number) => void }): JSX.Element {
  return (
    <div className="mb-3 flex items-center justify-between">
      <button
        onClick={() => onShift(-1)}
        aria-label="Poprzedni miesiąc"
        className="flex h-11 w-11 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <ChevronLeft size={20} />
      </button>
      <AnimatePresence mode="popLayout" initial={false} custom={dir}>
        <motion.p
          key={`${month.getFullYear()}-${month.getMonth()}`}
          custom={dir}
          variants={monthVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          className="text-sm font-bold"
        >
          {MONTHS_PL[month.getMonth()]} {month.getFullYear()}
        </motion.p>
      </AnimatePresence>
      <button
        onClick={() => onShift(1)}
        aria-label="Następny miesiąc"
        className="flex h-11 w-11 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}

function MonthGrid({ month, dir, cells, selected, onPick }: {
  month: Date;
  dir: number;
  cells: DayCell[];
  selected: string;
  onPick: (d: string) => void;
}): JSX.Element {
  return (
    <div>
      <div className="mb-1 grid grid-cols-7 text-center text-[10px] font-semibold uppercase text-slate-400">
        {WEEKDAYS.map((w) => <span key={w}>{w}</span>)}
      </div>
      <AnimatePresence mode="popLayout" initial={false} custom={dir}>
        <motion.div
          key={`grid-${month.getFullYear()}-${month.getMonth()}`}
          custom={dir}
          variants={monthVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          className="grid grid-cols-7 gap-y-1"
        >
          {cells.map((c) => (
            <DayCellView key={c.date} cell={c} selected={c.date === selected} onPick={() => onPick(c.date)} />
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/** Pojedynczy dzień kalendarza — kropka przy dniach z posiłkami. */
function DayCellView({ cell, selected, onPick }: { cell: DayCell; selected: boolean; onPick: () => void }): JSX.Element {
  const muted = !cell.inMonth;
  return (
    <button
      onClick={onPick}
      disabled={muted}
      aria-label={`${cell.day}${cell.hasMeals ? ' — zapisane posiłki' : ''}`}
      className={`relative flex h-9 items-center justify-center rounded-xl text-sm transition ${
        selected
          ? 'bg-accent font-bold text-white'
          : muted
            ? 'text-slate-300 dark:text-slate-600'
            : cell.isToday
              ? 'font-bold text-accent-dark ring-1 ring-accent/50 dark:text-accent'
              : 'hover:bg-slate-100 dark:hover:bg-slate-700'
      }`}
    >
      {cell.day}
      {cell.hasMeals && (
        <span className={`absolute bottom-1 h-1 w-1 rounded-full ${selected ? 'bg-white' : 'bg-accent'}`} aria-hidden="true" />
      )}
    </button>
  );
}

/** Lista posiłków wybranego dnia + suma kcal. */
function DayMealsList({ date, meals, calories, onDelete }: {
  date: string;
  meals: Meal[];
  calories: number;
  onDelete: (id: string) => void;
}): JSX.Element {
  return (
    <div className="mt-3">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <UtensilsCrossed size={16} aria-hidden="true" /> {formatDayMonth(date)}
        </h4>
        {meals.length > 0 && (
          <span className="text-xs font-semibold text-accent-dark dark:text-accent">{formatInt(calories)} kcal</span>
        )}
      </div>
      {meals.length === 0 ? (
        <p className="rounded-2xl bg-slate-50 py-5 text-center text-sm text-slate-400 dark:bg-slate-800/50 dark:text-slate-500">
          Brak posiłków w tym dniu.
        </p>
      ) : (
        <motion.ul layout className="space-y-2">
          <AnimatePresence initial={false}>
            {meals.map((m) => <MealRow key={m.id} meal={m} onDelete={onDelete} />)}
          </AnimatePresence>
        </motion.ul>
      )}
    </div>
  );
}
