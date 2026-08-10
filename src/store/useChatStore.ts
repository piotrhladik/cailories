// ============================================================================
// useChatStore — transientny (w pamięci) stan Czatu AI.
// Dzięki trzymaniu stanu poza komponentem, czat nie traci wpisanego tekstu ani
// wybranego zdjęcia przy przełączaniu zakładek (chat jest sercem aplikacji).
// ============================================================================

import { create } from 'zustand';
import type { MealAnalysis } from '../types';

export interface ChatImage {
  dataUrl: string;
  base64: string;
}

interface ChatState {
  /** Wpisany opis posiłku. */
  text: string;
  /** Wybrane/zrobione zdjęcie do analizy. */
  image: ChatImage | null;
  /** Wynik ostatniej analizy. */
  result: MealAnalysis | null;
  /** Trwa analiza. */
  thinking: boolean;

  setText: (t: string) => void;
  setImage: (img: ChatImage | null) => void;
  setResult: (r: MealAnalysis | null) => void;
  setThinking: (b: boolean) => void;
  /** Reset po zapisaniu / odrzuceniu wyniku. */
  clear: () => void;
}

export const useChatStore = create<ChatState>()((set) => ({
  text: '',
  image: null,
  result: null,
  thinking: false,

  setText: (text) => set({ text }),
  setImage: (image) => set({ image }),
  setResult: (result) => set({ result }),
  setThinking: (thinking) => set({ thinking }),
  clear: () => set({ text: '', image: null, result: null, thinking: false }),
}));