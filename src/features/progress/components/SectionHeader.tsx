// ============================================================================
// SectionHeader.tsx — wspólny nagłówek sekcji ekranu Postępów (A1-A5).
// Spójny z nagłówkami w Settings/Dashboard: uppercase + ikona + tracking.
// ============================================================================

import type { LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
  icon: LucideIcon;
  title: string;
  /** Dodatkowa informacja po prawej (np. licznik wpisów). */
  hint?: string;
}

export function SectionHeader({ icon: Icon, title, hint }: SectionHeaderProps): JSX.Element {
  return (
    <div className="mb-3 flex items-end justify-between gap-2">
      <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        <Icon size={16} aria-hidden="true" />
        {title}
      </h3>
      {hint && <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">{hint}</span>}
    </div>
  );
}
