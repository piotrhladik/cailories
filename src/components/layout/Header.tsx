// ============================================================================
// Header.tsx — pasek górny: nazwa zakładki, przycisk podsumowania dnia (kcal)
// oraz przełącznik motywu. Przycisk kcal otwiera wysuwany panel dnia.
// ============================================================================

import { motion } from 'framer-motion';
import { Moon, Sparkles, Sun, Wallet } from 'lucide-react';
import { useUserStore } from '../../store/useUserStore';
import { useMealsStore } from '../../store/useMealsStore';
import { AnimatedNumber } from '../ui/AnimatedNumber';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onOpenSummary: () => void;
}

export function Header({ title, subtitle, onOpenSummary }: HeaderProps): JSX.Element {
  const theme = useUserStore((s) => s.theme);
  const setTheme = useUserStore((s) => s.setTheme);
  const summary = useMealsStore((s) => s.getSummary());

  const toggleTheme = (): void => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-3 py-2.5 backdrop-blur pt-safe dark:border-slate-700 dark:bg-slate-900/90">
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-accent text-white">
          <Sparkles size={20} aria-hidden="true" />
        </span>
        <div className="min-w-0 leading-tight">
          <h1 className="truncate text-base font-bold">{title}</h1>
          {subtitle && <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {/* Przycisk podsumowania dnia — otwiera wysuwany panel (swipe/lewo) */}
        <motion.button
          onClick={onOpenSummary}
          whileTap={{ scale: 0.92 }}
          aria-label="Otwórz podsumowanie dnia"
          className="flex h-10 items-center gap-1.5 rounded-full bg-accent/12 px-3 text-sm font-bold text-accent-dark dark:bg-accent/15 dark:text-accent"
        >
          <Wallet size={16} aria-hidden="true" />
          <AnimatedNumber value={summary.calories} />
          <span className="text-[10px] font-medium opacity-70">kcal</span>
        </motion.button>

        <motion.button
          onClick={toggleTheme}
          whileTap={{ scale: 0.9 }}
          aria-label={theme === 'dark' ? 'Włącz tryb jasny' : 'Włącz tryb ciemny'}
          className="flex h-11 w-11 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <motion.span
            key={theme}
            initial={{ rotate: -60, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </motion.span>
        </motion.button>
      </div>
    </header>
  );
}