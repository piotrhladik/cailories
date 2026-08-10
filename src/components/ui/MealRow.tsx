// ============================================================================
// MealRow.tsx — lista zapisanych posiłków w dzienniku (z usuwaniem).
// Używana w Dashboard i sekcji historii.
// ============================================================================

import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import type { Meal } from '../../types';
import { formatTime } from '../../utils/format';

const SOURCE_LABEL: Record<Meal['source'], string> = {
  scan: 'EAN',
  'ai-chat': 'AI Czat',
  fridge: 'Lodówka',
  manual: 'Ręcznie',
};

interface MealRowProps {
  meal: Meal;
  onDelete: (id: string) => void;
}

export function MealRow({ meal, onDelete }: MealRowProps): JSX.Element {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, scale: 0.96, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, height: 0, marginBottom: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
      className="card overflow-hidden"
    >
      <div className="flex items-center gap-3 p-3">
        {meal.image ? (
          <img
            src={meal.image}
            alt=""
            loading="lazy"
            className="h-12 w-12 shrink-0 rounded-2xl object-cover"
          />
        ) : (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-xs font-bold text-slate-400 dark:bg-slate-700">
            {Math.round(meal.calories)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold">{meal.name}</p>
            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-300">
              {SOURCE_LABEL[meal.source]}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {formatTime(meal.createdAt)} · {Math.round(meal.calories)} kcal
          </p>
          <div className="mt-1 flex gap-3 text-[11px]">
            <span className="text-protein">B {formatMacro(meal.macros.protein)}</span>
            <span className="text-carbs">W {formatMacro(meal.macros.carbs)}</span>
            <span className="text-fats">T {formatMacro(meal.macros.fats)}</span>
          </div>
        </div>
        <motion.button
          onClick={() => onDelete(meal.id)}
          aria-label={`Usuń: ${meal.name}`}
          whileTap={{ scale: 0.85 }}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
        >
          <Trash2 size={18} />
        </motion.button>
      </div>
    </motion.li>
  );
}

function formatMacro(v: number): string {
  return `${Math.round(v)}g`;
}