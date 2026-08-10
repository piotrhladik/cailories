import { motion } from 'framer-motion';
import { MessageCircleHeart, Refrigerator, ScanLine, Home, Settings } from 'lucide-react';
import type { TabKey } from '../../types';
import { useUserStore } from '../../store/useUserStore';

interface NavItem {
  key: TabKey;
  label: string;
  icon: JSX.Element;
}

const ITEMS: NavItem[] = [
  { key: 'chat', label: 'Czat', icon: <MessageCircleHeart size={21} /> },
  { key: 'fridge', label: 'Lodówka', icon: <Refrigerator size={21} /> },
  { key: 'scanner', label: 'EAN', icon: <ScanLine size={21} /> },
  { key: 'dashboard', label: 'Dziennik', icon: <Home size={21} /> },
  { key: 'settings', label: 'Ustaw.', icon: <Settings size={21} /> },
];

interface BottomNavProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}

export function BottomNav({ active, onChange }: BottomNavProps): JSX.Element | null {
  const onboardingCompleted = useUserStore((s) => s.onboardingCompleted);

  if (!onboardingCompleted) {
    return null;
  }

  return (
    <nav
      aria-label="Nawigacja dolna"
      className="sticky bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-safe backdrop-blur dark:border-slate-700 dark:bg-slate-900/95"
    >
      <div className="mx-auto flex max-w-app items-stretch justify-between px-1">
        {ITEMS.map((item) => {
          const isActive = item.key === active;
          return (
            <button
              key={item.key}
              onClick={() => onChange(item.key)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className="relative flex min-h-[54px] flex-1 flex-col items-center justify-center gap-0.5 pt-1.5 text-[10px] font-medium"
            >
              {isActive && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute top-0 h-9 w-14 rounded-2xl bg-accent/15 dark:bg-accent/20"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                />
              )}
              <motion.span
                className={isActive ? 'relative text-accent-dark dark:text-accent' : 'relative text-slate-400 dark:text-slate-500'}
                animate={isActive ? { scale: 1.08, y: -1 } : { scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 24 }}
              >
                {item.icon}
              </motion.span>
              <span
                className={
                  isActive
                    ? 'relative font-semibold text-accent-dark dark:text-accent'
                    : 'relative text-slate-500 dark:text-slate-400'
                }
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
