// ============================================================================
// DailySummaryDrawer.tsx — wysuwany z lewej panel dziennego podsumowania
// (kalorie + BWT). Otwarty swipem z lewej krawędzi lub przyciskiem w headerze.
// Zamykany: backdropem, przyciskiem ✕ lub przeciągnięciem w lewo.
// ============================================================================

import { motion } from 'framer-motion';
import { ChevronRight, X } from 'lucide-react';
import { DaySummaryPanel } from './DaySummaryPanel';

interface DailySummaryDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function DailySummaryDrawer({ open, onClose }: DailySummaryDrawerProps): JSX.Element {
  return (
    <div
      className="fixed inset-0 z-40"
      style={{ pointerEvents: open ? 'auto' : 'none' }}
      aria-hidden={!open}
      aria-modal="true"
      role="dialog"
      aria-label="Podsumowanie dnia"
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        animate={{ opacity: open ? 1 : 0 }}
        transition={{ duration: 0.25 }}
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-surface-light shadow-2xl dark:bg-surface-dark"
        initial={false}
        animate={{ x: open ? 0 : '-101%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 34, mass: 0.9 }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0, right: 0.25 }}
        onDragEnd={(_, info) => {
          if (info.offset.x < -80 || info.velocity.x < -400) onClose();
        }}
      >
        {/* Grip i nagłówek */}
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-slate-300 dark:bg-slate-600" />
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ChevronRight size={18} className="text-accent" aria-hidden="true" />
              <h2 className="text-sm font-bold uppercase tracking-wide">Dzisiejszy dzień</h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Zamknij podsumowanie dnia"
              className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Treść — panel dnia przewijalny */}
        <div className="flex-1 overflow-y-auto pb-safe">
          <DaySummaryPanel />
        </div>
      </motion.div>
    </div>
  );
}