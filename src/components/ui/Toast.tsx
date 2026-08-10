// ============================================================================
// Toast.tsx — kontener toastów zanimowanym wejściem/wyjściem (Framer Motion).
// Nie pozwala połykać błędów: każdy komunikat jest widoczny dla użytkownika.
// ============================================================================

import { AnimatePresence, motion } from 'framer-motion';
import { useToastStore } from '../../store/useToastStore';

const VARIANT_CLASS: Record<string, string> = {
  info: 'bg-slate-800 text-white dark:bg-slate-700',
  success: 'bg-emerald-600 text-white',
  error: 'bg-rose-600 text-white',
};

const VARIANT_ICON: Record<string, string> = {
  info: 'ℹ️',
  success: '✅',
  error: '⚠️',
};

export function ToastViewport(): JSX.Element {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-4"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: -16, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className={`pointer-events-auto flex w-full max-w-app items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium shadow-lg ${VARIANT_CLASS[t.variant]}`}
          >
            <span aria-hidden="true">{VARIANT_ICON[t.variant]}</span>
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Zamknij powiadomienie"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/70 hover:text-white"
            >
              ✕
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}