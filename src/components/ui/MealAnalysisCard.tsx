// ============================================================================
// MealAnalysisCard.tsx — prezentacja wyniku analizy makro (z opcją zapisu).
// Używany przez Czat AI (analiza zdjęcia/opisu) i Tryb Lodówki.
// ============================================================================

import { Info, Plus, X } from 'lucide-react';
import type { Macro } from '../../types';
import { Button } from './Button';
import { formatNumber } from '../../utils/format';

interface MealAnalysisCardProps {
  /** Nazwa dania/produktu. */
  name: string;
  /** Kalorie w kcal. */
  calories: number;
  /** Makroskładniki. */
  macros: Macro;
  /** Komentarz / notatki (opcjonalne). */
  notes?: string;
  /** Instrukcja (dla przepisów lodówki). */
  instructions?: string;
  /** Czy pokazać przycisk "Dodaj do dziennika". */
  allowSave?: boolean;
  onSave?: () => void;
  onDiscard?: () => void;
  /** Niestandardowa etykieta przycisku zapisu. */
  saveLabel?: string;
}

export function MealAnalysisCard({
  name,
  calories,
  macros,
  notes,
  instructions,
  allowSave = true,
  onSave,
  onDiscard,
  saveLabel = '+ Dodaj do dziennika',
}: MealAnalysisCardProps): JSX.Element {
  return (
    <div className="card overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-bold leading-snug">{name}</h3>
          <span className="shrink-0 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-bold text-accent-dark dark:text-accent">
            {formatNumber(calories)} kcal
          </span>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <MacroStat label="Białko" value={macros.protein} color="#3B82F6" />
          <MacroStat label="Węglow." value={macros.carbs} color="#10B981" />
          <MacroStat label="Tłuszcze" value={macros.fats} color="#F59E0B" />
        </div>

        {notes && (
          <p className="mt-3 flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Info size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
            {notes}
          </p>
        )}

        {instructions && (
          <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600 dark:bg-slate-700/40 dark:text-slate-300">
            <strong className="block text-[11px] uppercase tracking-wide text-slate-400">Przygotowanie</strong>
            {instructions}
          </div>
        )}
      </div>

      {allowSave && onSave && (
        <div className="flex gap-2 border-t border-slate-100 p-3 dark:border-slate-700">
          <Button className="flex-1" onClick={onSave}>
            <Plus size={16} aria-hidden="true" />
            {saveLabel}
          </Button>
          {onDiscard && (
            <Button variant="secondary" onClick={onDiscard} aria-label="Odrzuć">
              <X size={16} />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function MacroStat({ label, value, color }: { label: string; value: number; color: string }): JSX.Element {
  return (
    <div className="rounded-xl bg-slate-50 py-2 dark:bg-slate-700/40">
      <div className="text-sm font-bold" style={{ color }}>{formatNumber(value)} g</div>
      <div className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-400">{label}</div>
    </div>
  );
}