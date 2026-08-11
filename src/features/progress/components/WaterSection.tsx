// ============================================================================
// WaterSection (A2) — dzienny licznik wody: +/-250 ml, pasek postępu,
// animowana liczba (AnimatedNumber) i edycja celu (min. 1 ml).
// ============================================================================

import { useState } from 'react';
import { Droplets, Minus, Plus } from 'lucide-react';
import { useProgressStore } from '../../../store/useProgressStore';
import { dateKey } from '../../../store/useMealsStore';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { AnimatedNumber } from '../../../components/ui/AnimatedNumber';
import { Button } from '../../../components/ui/Button';
import { SectionHeader } from './SectionHeader';

const STEP_ML = 250;

export function WaterSection(): JSX.Element {
  const waterMl = useProgressStore((s) => s.getWaterForDay(dateKey()));
  const goal = useProgressStore((s) => s.waterGoalMl);
  const addWater = useProgressStore((s) => s.addWater);
  const removeWater = useProgressStore((s) => s.removeWater);
  const setWaterGoalMl = useProgressStore((s) => s.setWaterGoalMl);
  const remaining = Math.max(0, goal - waterMl);

  return (
    <section>
      <SectionHeader icon={Droplets} title="Woda" hint={`cel ${goal} ml`} />
      <div className="card space-y-4 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-3xl font-extrabold text-sky-500 dark:text-sky-400">
            <Droplets size={26} aria-hidden="true" />
            <AnimatedNumber value={waterMl} />
            <span className="text-sm font-medium text-slate-400">ml</span>
          </p>
          <GoalEditor goal={goal} onSave={setWaterGoalMl} />
        </div>
        <ProgressBar value={waterMl} max={goal} color="#0EA5E9" label="Woda" />
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {remaining > 0 ? `Do celu zostało ${remaining} ml` : 'Cel osiągnięty — świetna robota! 🎉'}
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => removeWater(STEP_ML)}>
            <Minus size={17} aria-hidden="true" /> 250 ml
          </Button>
          <Button className="flex-1" onClick={() => addWater(STEP_ML)}>
            <Plus size={17} aria-hidden="true" /> 250 ml
          </Button>
        </div>
      </div>
    </section>
  );
}

/** Edycja dziennego celu wody — walidacja min. 1 ml. */
function GoalEditor({ goal, onSave }: { goal: number; onSave: (ml: number) => void }): JSX.Element {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(goal));

  const save = (): void => {
    const ml = Number(value.replace(/\D/g, ''));
    if (!Number.isFinite(ml) || ml < 1) return;
    onSave(ml);
    setEditing(false);
  };

  if (!editing) {
    return (
      <button
        onClick={() => {
          setValue(String(goal));
          setEditing(true);
        }}
        className="rounded-full bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-600 dark:bg-sky-500/10 dark:text-sky-400"
      >
        Cel: {goal} ml ✏️
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        className="input w-24 px-3 py-1 text-center text-xs"
        inputMode="numeric"
        aria-label="Dzienny cel wody w ml"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') save();
        }}
      />
      <Button className="px-3 text-xs" onClick={save}>OK</Button>
    </div>
  );
}
