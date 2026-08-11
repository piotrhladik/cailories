// ============================================================================
// useUserStore — sklep Zustand z danymi użytkownika, kluczem API i zgodą prawną.
// ============================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile, GeminiModel, ApiKeyValidationStatus, ReminderKey, ReminderConfig } from '../types';

const DEFAULT_PROFILE: UserProfile = {
  dailyCaloriesGoal: 2200,
  macrosGoal: { protein: 120, carbs: 275, fats: 85 },
  heightCm: 175,
  weightKg: 75,
  age: 30,
  gender: 'female',
  activityLevel: 1.375,
};

/** Domyślne przypomnienia (D3) — wszystkie wyłączone: safe opt-in, bez promptu o permisje. */
const DEFAULT_REMINDERS: Record<ReminderKey, ReminderConfig> = {
  breakfast: { enabled: false, time: '08:00' },
  lunch: { enabled: false, time: '13:00' },
  dinner: { enabled: false, time: '19:00' },
  water: { enabled: false, time: '10:00' },
};

interface UserState {
  profile: UserProfile;
  apiKey: string;
  selectedModel: string;
  availableModels: GeminiModel[];
  disclaimerAccepted: boolean;
  apiKeyStatus: ApiKeyValidationStatus;
  theme: 'light' | 'dark' | 'system';
  onboardingCompleted: boolean;
  userName: string;
  avatarUrl: string;
  reminders: Record<ReminderKey, ReminderConfig>;

  setApiKey: (key: string) => void;
  setModel: (model: string) => void;
  setAvailableModels: (models: GeminiModel[]) => void;
  setApiKeyStatus: (status: ApiKeyValidationStatus) => void;
  acceptDisclaimer: () => void;
  updateProfile: (patch: Partial<UserProfile>) => void;
  /** Ręczne cele kaloryczne/makro — mają priorytet nad obliczeniami BMR. */
  setCustomGoals: (patch: { calories?: number; protein?: number; carbs?: number; fats?: number }) => void;
  setTheme: (theme: UserState['theme']) => void;
  setOnboardingCompleted: (val: boolean) => void;
  setUserName: (name: string) => void;
  setAvatarUrl: (url: string) => void;
  /** Aktualizuje pojedyncze przypomnienie (klucz + częściowa łatka). */
  setReminder: (key: ReminderKey, patch: Partial<ReminderConfig>) => void;
  resetAll: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      profile: DEFAULT_PROFILE,
      apiKey: '',
      selectedModel: 'gemini-3.5-flash-lite',
      availableModels: [],
      disclaimerAccepted: false,
      apiKeyStatus: 'idle',
      theme: 'system',
      onboardingCompleted: false,
      userName: 'Użytkownik',
      avatarUrl: '',
      reminders: DEFAULT_REMINDERS,

      setApiKey: (key) => set({ 
        apiKey: key, 
        apiKeyStatus: key.trim() ? 'checking' : 'idle' 
      }),
      setModel: (model) => set({ selectedModel: model }),
      setAvailableModels: (models) => set({ availableModels: models }),
      setApiKeyStatus: (status) => set({ apiKeyStatus: status }),
      // Zgoda na klauzulę NIE kończy onboardingu — aplikacja odblokowuje się
      // dopiero po poprawnym kluczu API i uzupełnieniu profilu (patrz OnboardingFlow).
      acceptDisclaimer: () => set({ disclaimerAccepted: true }),
      updateProfile: (patch) =>
        set((state) => ({ profile: { ...state.profile, ...patch } })),
      // Ręczne cele mają priorytet nad BMR — zapisujemy je obok wyliczonych.
      setCustomGoals: (g) =>
        set((state) => ({
          profile: {
            ...state.profile,
            customCalories: g.calories,
            customProtein: g.protein,
            customCarbs: g.carbs,
            customFats: g.fats,
          },
        })),
      setTheme: (theme) => set({ theme }),
      setOnboardingCompleted: (val) => set({ onboardingCompleted: val }),
      setUserName: (name) => set({ userName: name }),
      setAvatarUrl: (url) => set({ avatarUrl: url }),
      setReminder: (key, patch) =>
        set((state) => ({
          reminders: { ...state.reminders, [key]: { ...state.reminders[key], ...patch } },
        })),
      resetAll: () =>
        set({
          profile: DEFAULT_PROFILE,
          apiKey: '',
          selectedModel: 'gemini-3.5-flash-lite',
          availableModels: [],
          disclaimerAccepted: false,
          apiKeyStatus: 'idle',
          theme: 'system',
          onboardingCompleted: false,
          userName: 'Użytkownik',
          avatarUrl: '',
          reminders: DEFAULT_REMINDERS,
        }),
    }),
    {
      name: 'nutriscan-user',
      version: 2,
    },
  ),
);
