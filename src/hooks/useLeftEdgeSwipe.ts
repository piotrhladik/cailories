// ============================================================================
// useLeftEdgeSwipe.ts — gest "swipe z lewej krawędzi" otwierający panel dnia.
// Wykrywa poziomy przeciągnięcie w prawo (> 64px, mały ruch pionowy).
// ============================================================================

import { useEffect } from 'react';

interface SwipeState {
  active: boolean;
  startX: number;
  startY: number;
}

export function useLeftEdgeSwipe(onOpen: () => void): void {
  useEffect(() => {
    const state: SwipeState = { active: false, startX: 0, startY: 0 };

    const onPointerDown = (e: PointerEvent): void => {
      // Interesuje nas tylko pasek przy lewej krawędzi (szerokość ~32px).
      if (e.clientX > 32) return;
      state.active = true;
      state.startX = e.clientX;
      state.startY = e.clientY;
    };

    const onPointerUp = (e: PointerEvent): void => {
      if (!state.active) return;
      state.active = false;
      const dx = e.clientX - state.startX;
      const dy = e.clientY - state.startY;
      // Przeciągnięcie w prawo, mało pionowej komponenty.
      if (dx > 64 && Math.abs(dy) < Math.abs(dx) * 0.5) {
        onOpen();
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointerup', onPointerUp);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('pointerup', onPointerUp);
    };
  }, [onOpen]);
}