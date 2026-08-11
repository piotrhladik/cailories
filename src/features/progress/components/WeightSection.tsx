// ============================================================================
// WeightSection (A1) — historia wagi: ręcznie rysowany wykres SVG (bez
// bibliotek chartów), animacja linii przez pathLength, formularz dodawania
// (walidacja 20-400 kg) oraz lista wpisów z usuwaniem.
// ============================================================================

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Scale, Trash2 } from 'lucide-react';
import {
  useProgressStore,
  MIN_WEIGHT_KG,
  MAX_WEIGHT_KG,
  type WeightEntry,
} from '../../../store/useProgressStore';
import { dateKey } from '../../../store/useMealsStore';
import { useToastStore } from '../../../store/useToastStore';
import { SectionHeader } from './SectionHeader';
import { Button } from '../../../components/ui/Button';
import { formatDayMonthYear } from '../progressUtils';

const CHART_W = 320;
const CHART_H = 150;
const PAD_X = 34;
const PAD_Y = 14;

interface ChartPoint {
  x: number;
  y: number;
  weight: number;
  date: string;
}

interface ChartData {
  points: ChartPoint[];
  pathD: string;
  min: number;
  max: number;
}

/** Punkty chronologicznie + ścieżka linii + zakres osi Y. */
function buildChartData(entries: WeightEntry[]): ChartData {
  const sorted = [...entries].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  if (sorted.length === 0) return { points: [], pathD: '', min: 0, max: 0 };
  const weights = sorted.map((e) => e.weightKg);
  const min = Math.min(...weights);
  const span = Math.max(...weights) - min || 1;
  const innerW = CHART_W - PAD_X * 2;
  const innerH = CHART_H - PAD_Y * 2;
  const points = sorted.map((e, i) => ({
    x: PAD_X + (sorted.length === 1 ? innerW / 2 : (i / (sorted.length - 1)) * innerW),
    y: PAD_Y + innerH - ((e.weightKg - min) / span) * innerH,
    weight: e.weightKg,
    date: e.date,
  }));
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  return { points, pathD, min, max: Math.max(...weights) };
}

export function WeightSection(): JSX.Element {
  const weightEntries = useProgressStore((s) => s.weightEntries);
  const addWeight = useProgressStore((s) => s.addWeight);
  const removeWeight = useProgressStore((s) => s.removeWeight);

  const submit = (kg: number): void => addWeight(dateKey(), kg);

  return (
    <section>
      <SectionHeader icon={Scale} title="Waga" hint={`${weightEntries.length} pomiarów`} />
      <div className="card space-y-4 p-4">
        <WeightChart entries={weightEntries} />
        <WeightForm onSubmit={submit} todayLogged={weightEntries.some((e) => e.date === dateKey())} />
      </div>
      <WeightList entries={weightEntries} onRemove={removeWeight} />
    </section>
  );
}

/** Wykres SVG: siatka, gradient pod linią, animowana linia, punkty + tooltip. */
function WeightChart({ entries }: { entries: WeightEntry[] }): JSX.Element {
  const data = useMemo(() => buildChartData(entries), [entries]);
  const [hover, setHover] = useState<number | null>(null);

  if (data.points.length === 0) {
    return (
      <p className="rounded-2xl bg-slate-50 py-8 text-center text-sm text-slate-400 dark:bg-slate-800/50 dark:text-slate-500">
        Dodaj pierwszy pomiar wagi, aby zobaczyć wykres.
      </p>
    );
  }

  const first = data.points[0];
  const last = data.points[data.points.length - 1];
  const hovered = hover !== null ? data.points[hover] : null;
  const areaD = `${data.pathD} L ${last.x} ${CHART_H - PAD_Y} L ${first.x} ${CHART_H - PAD_Y} Z`;

  return (
    <div className="relative pt-2">
      <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="w-full" role="img" aria-label="Wykres wagi">
        <ChartGrid min={data.min} max={data.max} firstDate={first.date} lastDate={last.date} />
        <defs>
          <linearGradient id="weight-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#84CC16" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#84CC16" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#weight-fill)" />
        <motion.path
          d={data.pathD}
          fill="none"
          stroke="#84CC16"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        />
        {data.points.map((p, i) => (
          <circle
            key={p.date}
            cx={p.x}
            cy={p.y}
            r={hover === i ? 5 : 3.5}
            fill="#fff"
            stroke="#84CC16"
            strokeWidth={2}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
      </svg>
      {hovered && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-xl bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white shadow-lg dark:bg-slate-700"
          style={{
            left: `${(hovered.x / CHART_W) * 100}%`,
            top: `${(hovered.y / CHART_H) * 100}%`,
          }}
        >
          {hovered.weight.toFixed(1)} kg
        </div>
      )}
    </div>
  );
}

/** Poziome linie siatki z etykietami osi Y oraz daty krańcowe osi X. */
function ChartGrid({ min, max, firstDate, lastDate }: { min: number; max: number; firstDate: string; lastDate: string }): JSX.Element {
  const innerH = CHART_H - PAD_Y * 2;
  const mid = (min + max) / 2;
  const rows = [
    { v: max, y: PAD_Y },
    { v: mid, y: PAD_Y + innerH / 2 },
    { v: min, y: PAD_Y + innerH },
  ];
  const fmt = (d: string): string => `${d.slice(8, 10)}.${d.slice(5, 7)}`;
  return (
    <g>
      {rows.map((r) => (
        <g key={r.y}>
          <line x1={PAD_X} y1={r.y} x2={CHART_W - PAD_X} y2={r.y} stroke="currentColor" strokeOpacity={0.12} strokeDasharray="3 4" />
          <text x={PAD_X - 6} y={r.y + 3} textAnchor="end" className="fill-slate-400 text-[9px]">
            {Math.round(r.v)}
          </text>
        </g>
      ))}
      <text x={PAD_X} y={CHART_H - 2} className="fill-slate-400 text-[9px]">{fmt(firstDate)}</text>
      <text x={CHART_W - PAD_X} y={CHART_H - 2} textAnchor="end" className="fill-slate-400 text-[9px]">{fmt(lastDate)}</text>
    </g>
  );
}

/** Formularz dodania wagi — walidacja zakresu 20-400 kg. */
function WeightForm({ onSubmit, todayLogged }: { onSubmit: (kg: number) => void; todayLogged: boolean }): JSX.Element {
  const [value, setValue] = useState('');
  const show = useToastStore((s) => s.show);

  const submit = (): void => {
    const kg = Number(value.replace(',', '.'));
    if (!Number.isFinite(kg) || kg < MIN_WEIGHT_KG || kg > MAX_WEIGHT_KG) {
      show(`Waga musi być w zakresie ${MIN_WEIGHT_KG}-${MAX_WEIGHT_KG} kg.`, 'error');
      return;
    }
    onSubmit(kg);
    setValue('');
    show(todayLogged ? 'Zaktualizowano wagę z dzisiaj ✔' : 'Zapisano wagę ✔', 'success');
  };

  return (
    <div className="flex items-center gap-2">
      <input
        className="input"
        inputMode="decimal"
        placeholder={`kg (${MIN_WEIGHT_KG}-${MAX_WEIGHT_KG})`}
        aria-label="Nowa waga w kilogramach"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
        }}
      />
      <Button className="shrink-0" onClick={submit}>Dodaj</Button>
    </div>
  );
}

/** Lista wpisów wagi (najnowsze na górze) z usuwaniem. */
function WeightList({ entries, onRemove }: { entries: WeightEntry[]; onRemove: (i: number) => void }): JSX.Element {
  if (entries.length === 0) return <></>;
  return (
    <motion.ul layout className="mt-3 max-h-56 space-y-2 overflow-y-auto">
      <AnimatePresence initial={false}>
        {entries.map((e, i) => (
          <motion.li
            key={e.date}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            className="card flex items-center gap-3 p-3"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300">
              <Scale size={17} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{e.weightKg.toFixed(1)} kg</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{formatDayMonthYear(e.date)}</p>
            </div>
            <button
              onClick={() => onRemove(i)}
              aria-label={`Usuń pomiar z ${e.date}`}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
            >
              <Trash2 size={17} />
            </button>
          </motion.li>
        ))}
      </AnimatePresence>
    </motion.ul>
  );
}
