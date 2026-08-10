// ============================================================================
// ProgressBar.tsx — animowany pasek postępu realizacji celu BWT/kalorii.
// Wypełnienie płynnie animuje się do wartości; obsługuje przekroczenie celu.
// ============================================================================

import { motion } from 'framer-motion';

interface ProgressBarProps {
  value: number;
  max: number;
  color: string;
  label: string;
}

export function ProgressBar({ value, max, color, label }: ProgressBarProps): JSX.Element {
  const safeMax = max > 0 ? max : 1;
  const pct = Math.min(100, Math.max(0, (value / safeMax) * 100));
  const over = value > max && max > 0;

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={Math.round(safeMax)}
      className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700"
    >
      <motion.div
        className={`h-full rounded-full ${over ? 'opacity-90' : ''}`}
        style={{ backgroundColor: color, boxShadow: over ? `0 0 0 2px ${color}55` : undefined }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}