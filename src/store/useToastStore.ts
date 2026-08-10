// ============================================================================
// useToastStore — lekki system powiadomień (toastów) z dostępnością a11y.
// Realizuje wymóg: NIGDY nie połykaj błędów API po cichu — zawsze pokaż UI.
// ============================================================================

import { create } from 'zustand';

export type ToastVariant = 'info' | 'success' | 'error';

export interface Toast {
  /** Identyfikator toastu. */
  id: number;
  /** Treść komunikatu. */
  message: string;
  /** Wariant kolorystyczny. */
  variant: ToastVariant;
}

interface ToastState {
  toasts: Toast[];
  /** Pokazanie toastu (auto-znika po duration ms). */
  show: (message: string, variant?: ToastVariant, duration?: number) => void;
  /** Ręczne usunięcie toastu. */
  dismiss: (id: number) => void;
}

let toastId = 0;

export const useToastStore = create<ToastState>()((set, get) => ({
  toasts: [],

  show: (message, variant = 'info', duration = 4000) => {
    const id = ++toastId;
    set((state) => ({ toasts: [...state.toasts, { id, message, variant }] }));

    if (duration > 0) {
      window.setTimeout(() => get().dismiss(id), duration);
    }
  },

  dismiss: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));