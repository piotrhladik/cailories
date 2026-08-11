// ============================================================================
// MeasurementsSection (A5) — obwody ciała (klatka/talia/biodra/ramię/udo):
// formularz z walidacją >0 oraz lista wpisów z różnicą od pierwszego pomiaru
// (spadek = zielony, wzrost = czerwony) i usuwaniem.
// ============================================================================

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Ruler, Trash2 } from 'lucide-react';
import { useProgressStore, type BodyMeasurement } from '../../../store/useProgressStore';
import { dateKey } from '../../../store/useMealsStore';
import { useToastStore } from '../../../store/useToastStore';
import { SectionHeader } from './SectionHeader';
import { Button } from '../../../components/ui/Button';
import { formatDayMonthYear } from '../progressUtils';

type FieldKey = Exclude<keyof BodyMeasurement, 'date'>;

const FIELDS: Array<{ key: FieldKey; label: string }> = [
  { key: 'chest', label: 'Klatka' },
  { key: 'waist', label: 'Talia' },
  { key: 'hips', label: 'Biodra' },
  { key: 'arms', label: 'Ramię' },
  { key: 'thighs', label: 'Udo' },
];

const EMPTY_FORM: Record<FieldKey, string> = { chest: '', waist: '', hips: '', arms: '', thighs: '' };

export function MeasurementsSection(): JSX.Element {
  const measurements = useProgressStore((s) => s.measurements);
  const addMeasurement = useProgressStore((s) => s.addMeasurement);
  const removeMeasurement = useProgressStore((s) => s.removeMeasurement);
  const show = useToastStore((s) => s.show);
  const [form, setForm] = useState<Record<FieldKey, string>>(EMPTY_FORM);

  const submit = (): void => {
    const parsed = FIELDS.reduce<Partial<BodyMeasurement>>((acc, f) => {
      const v = Number(form[f.key].replace(',', '.'));
      if (Number.isFinite(v) && v > 0) acc[f.key] = v;
      return acc;
    }, {});
    if (Object.keys(parsed).length === 0) {
      show('Podaj przynajmniej jeden pomiar większy od 0.', 'error');
      return;
    }
    addMeasurement({ ...parsed, date: dateKey() });
    setForm(EMPTY_FORM);
    show('Pomiary zapisane ✔', 'success');
  };

  const setField = (key: FieldKey, value: string): void => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <section>
      <SectionHeader icon={Ruler} title="Pomiary ciała" hint={`${measurements.length} wpisów`} />
      <div className="card space-y-3 p-4">
        <div className="grid grid-cols-3 gap-2">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <label className="label" htmlFor={`m-${f.key}`}>{f.label}</label>
              <input
                id={`m-${f.key}`}
                className="input"
                inputMode="decimal"
                placeholder="cm"
                value={form[f.key]}
                onChange={(e) => setField(f.key, e.target.value)}
              />
            </div>
          ))}
        </div>
        <Button className="w-full" onClick={submit}>Zapisz pomiary</Button>
      </div>
      <MeasurementList measurements={measurements} onRemove={removeMeasurement} />
    </section>
  );
}

/** Lista pomiarów (najnowsze na górze) — różnica względem najstarszego wpisu. */
function MeasurementList({ measurements, onRemove }: {
  measurements: BodyMeasurement[];
  onRemove: (i: number) => void;
}): JSX.Element {
  if (measurements.length === 0) return <></>;
  const baseline = measurements[measurements.length - 1];

  return (
    <motion.ul layout className="mt-3 max-h-72 space-y-2 overflow-y-auto">
      <AnimatePresence initial={false}>
        {measurements.map((m, i) => (
          <motion.li
            key={m.date}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            className="card p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{formatDayMonthYear(m.date)}</p>
              <button
                onClick={() => onRemove(i)}
                aria-label={`Usuń pomiary z ${m.date}`}
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="mt-2 grid grid-cols-5 gap-1">
              {FIELDS.map((f) => {
                const val = m[f.key];
                if (val === undefined) return <span key={f.key} className="text-center text-[11px] text-slate-300 dark:text-slate-600">—</span>;
                const diff = val - (baseline[f.key] ?? val);
                return <MeasurementValue key={f.key} label={f.label} value={val} diff={diff} />;
              })}
            </div>
          </motion.li>
        ))}
      </AnimatePresence>
    </motion.ul>
  );
}

/** Wartość pojedynczego obwodu z kolorowaną różnicą (spadek/wzrost). */
function MeasurementValue({ label, value, diff }: { label: string; value: number; diff: number }): JSX.Element {
  const diffClass = diff < -0.05
    ? 'text-emerald-600 dark:text-emerald-400'
    : diff > 0.05
      ? 'text-rose-600 dark:text-rose-400'
      : 'text-slate-400';
  const diffText = diff < -0.05 || diff > 0.05 ? `${diff > 0 ? '+' : ''}${diff.toFixed(1)}` : '±0';
  return (
    <div className="text-center">
      <p className="text-[10px] text-slate-400">{label}</p>
      <p className="text-xs font-bold">{value.toFixed(1)}</p>
      <p className={`text-[10px] font-medium ${diffClass}`}>{diffText}</p>
    </div>
  );
}
