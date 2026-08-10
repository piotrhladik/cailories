// ============================================================================
// Modal.tsx — dostępny modal z backdropem, klawiszem Esc i arrayem a11y.
// ============================================================================

import { useEffect, type ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Ukryj przycisk zamykania (np. disclaimer na starcie). */
  closable?: boolean;
}

export function Modal({ open, onClose, title, children, closable = true }: ModalProps): JSX.Element | null {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && closable) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose, closable]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={closable ? onClose : undefined}
    >
      <div
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-5 shadow-card dark:bg-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">{title}</h2>
          {closable && (
            <button
              onClick={onClose}
              aria-label="Zamknij okno"
              className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
            >
              ✕
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}