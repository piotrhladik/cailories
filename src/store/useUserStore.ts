// ============================================================================
// useUserStore — sklep Zustand z danymi użytkownika, kluczem API i zgodą prawną.
// Persistent w localStorage (Offline-First). Klucz API pozostaje wyłącznie
// na urządzeniu użytkownika — nigdy nie jest wysyłany na zewnętrzne serwery.
// ============================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile, GeminiModel, ApiKeyValidationStatus } from '../types';

/** Domyślny profil BWT — wg ogólnych zaleceń (B 15%, W 50%, T 35% energii). */
const DEFAULT_PROFILE: UserProfile = {
  dailyCaloriesGoal: 2200,
  macrosGoal: { protein: 120, carbs: 275, fats: 85 },
  heightCm: 175,
  weightKg: 75,
  age: 30,
  gender: 'female',
  activityLevel: 1.375,
};

interface UserState {
  /** Profil i cele makro. */
  profile: UserProfile;
  /** Klucz API Gemini użytkownika. */
  apiKey: string;
  /** Wybrany model Gemini. */
  selectedModel: string;
  /** Modele pobrane z API (cache). */
  availableModels: GeminiModel[];
  /** Zgoda na Medical Disclaimer (true = zaakceptowano). */
  disclaimerAccepted: boolean;
  /** Status walidacji klucza API. */
  apiKeyStatus: ApiKeyValidationStatus;
  /** Dark mode — zmienna nadrzędna nad preferencją systemu (null = system). */
  theme: 'light' | 'dark' | 'system';

  setApiKey: (key: string) => void;
  setModel: (model: string) => void;
  setAvailableModels: (models: GeminiModel[]) => void;
  setApiKeyStatus: (status: ApiKeyValidationStatus) => void;
  acceptDisclaimer: () => void;
  updateProfile: (patch: Partial<UserProfile>) => void;
  setTheme: (theme: UserState['theme']) => void;
  resetAll: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      profile: DEFAULT_PROFILE,
      apiKey: '',
      selectedModel: 'gemini-2.5-flash',
      availableModels: [],
      disclaimerAccepted: false,
      apiKeyStatus: 'idle',
      theme: 'system',

      setApiKey: (key) => set({ apiKey: key.trim(), apiKeyStatus: key.trim() ? 'checking' : 'idle' }),
      setModel: (model) => set({ selectedModel: model }),
      setAvailableModels: (models) => set({ availableModels: models }),
      setApiKeyStatus: (status) => set({ apiKeyStatus: status }),

      acceptDisclaimer: () => set({ disclaimerAccepted: true }),

      updateProfile: (patch) =>
        set((state) => ({ profile: { ...state.profile, ...patch } })),

      setTheme: (theme) => set({ theme }),
      resetAll: () =>
        set({
          profile: DEFAULT_PROFILE,
          apiKey: '',
          selectedModel: 'gemini-2.5-flash',
          availableModels: [],
          disclaimerAccepted: false,
          apiKeyStatus: 'idle',
          theme: 'system',
        }),
    }),
    {
      name: 'nutriscan-user',
      version: 1,
    },
  ),
);