// ============================================================================
// features/settings/Settings.tsx — ekran Ustawień.
// - Walidacja klucza API Gemini + dynamiczne pobieranie listy modeli.
// - Wybór modelu.
// - Profil BWT: wzrost, waga, wiek, płeć, aktywność → TDEE i cele makro.
// - Reset aplikacji.
// ============================================================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  Calculator,
  CheckCircle2,
  Droplets,
  Key,
  List,
  Loader2,
  Moon,
  RotateCcw,
  Sun,
  Sunrise,
  XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useUserStore } from '../../store/useUserStore';
import { useMealsStore } from '../../store/useMealsStore';
import { useToastStore } from '../../store/useToastStore';
import { fetchAvailableModels, looksLikeApiKey } from '../../services/geminiApi';
import { syncMealReminders } from '../../services/notifications';
import { calculateTDEE, macrosFromCalories } from '../../utils/bmr';
import { Button } from '../../components/ui/Button';
import { DEFAULT_MODEL } from '../../config';
import type { Gender, GeminiModel, ReminderConfig, ReminderKey } from '../../types';

/** Definicje wierszy sekcji Przypomnienia (D3). */
const REMINDER_ROWS: Array<{ key: ReminderKey; label: string; hint: string; icon: LucideIcon }> = [
  { key: 'breakfast', label: 'Śniadanie', hint: 'Dobry start dnia', icon: Sunrise },
  { key: 'lunch', label: 'Obiad', hint: 'Główny posiłek', icon: Sun },
  { key: 'dinner', label: 'Kolacja', hint: 'Lekki wieczór', icon: Moon },
  { key: 'water', label: 'Woda', hint: 'Nawodnienie', icon: Droplets },
];

/** Etykiety przypomnień dla komunikatów. */
const REMINDER_LABEL: Record<ReminderKey, string> = {
  breakfast: 'Śniadanie',
  lunch: 'Obiad',
  dinner: 'Kolacja',
  water: 'Woda',
};

export function Settings(): JSX.Element {
  const profile = useUserStore((s) => s.profile);
  const updateProfile = useUserStore((s) => s.updateProfile);
  const apiKey = useUserStore((s) => s.apiKey);
  const setApiKey = useUserStore((s) => s.setApiKey);
  const apiKeyStatus = useUserStore((s) => s.apiKeyStatus);
  const setApiKeyStatus = useUserStore((s) => s.setApiKeyStatus);
  const selectedModel = useUserStore((s) => s.selectedModel);
  const setModel = useUserStore((s) => s.setModel);
  const availableModels = useUserStore((s) => s.availableModels);
  const setAvailableModels = useUserStore((s) => s.setAvailableModels);
  const resetAll = useUserStore((s) => s.resetAll);
  const reminders = useUserStore((s) => s.reminders);
  const setReminder = useUserStore((s) => s.setReminder);
  const show = useToastStore((s) => s.show);

  const [validating, setValidating] = useState(false);
  const [syncing, setSyncing] = useState(false);

  /**
   * D3: zmiana przypomnienia — optymistyczny zapis w sklepie, potem synchronizacja
   * planu powiadomień. Przy błędzie (np. brak uprawnień / web-PWA) cofamy zmianę
   * i pokazujemy toast — zero crashy.
   * */
  const handleReminderChange = async (key: ReminderKey, patch: Partial<ReminderConfig>): Promise<void> => {
    const prev = useUserStore.getState().reminders[key];
    setReminder(key, patch);
    const next = useUserStore.getState().reminders;
    setSyncing(true);
    try {
      await syncMealReminders(next);
      if (patch.enabled === true) {
        show(`Włączono przypomnienie: ${REMINDER_LABEL[key]} ✔`, 'success');
      }
    } catch (err) {
      setReminder(key, prev);
      const msg = (err as { message?: string }).message ?? 'Nie udało się ustawić przypomnienia.';
      show(msg, 'error');
    } finally {
      setSyncing(false);
    }
  };

  /** Walidacja klucza + pobranie modeli. */
  const validateKey = async (): Promise<void> => {
    if (!apiKey.trim()) {
      setApiKeyStatus('idle');
      show('Wpisz klucz API Gemini.', 'error');
      return;
    }
    if (!looksLikeApiKey(apiKey)) {
      setApiKeyStatus('invalid');
      show('Klucz wygląda na nieprawidłowy (zbyt krótki lub zawiera spacje).', 'error');
      return;
    }
    setValidating(true);
    setApiKeyStatus('checking');
    try {
      const models = await fetchAvailableModels(apiKey);
      setAvailableModels(models);
      setApiKeyStatus('valid');
      show('Klucz jest poprawny • pobrano listę modeli.', 'success');
      // Gdy dotychczasowy model nie istnieje na liście, wybieram pierwszy dostępny.
      if (models.length > 0 && !models.some((m) => m.name === selectedModel)) {
        setModel(DEFAULT_MODEL);
      }
    } catch (err) {
      const msg = (err as { message?: string }).message ?? 'Nie udało się zweryfikować klucza.';
      setApiKeyStatus('invalid');
      show(msg, 'error');
    } finally {
      setValidating(false);
    }
  };

  /** Przeliczenie TDEE i celów makro na podstawie profilu. */
  const recompute = (): void => {
    const tdee = calculateTDEE(profile);
    const macros = macrosFromCalories(tdee);
    updateProfile({ dailyCaloriesGoal: tdee, macrosGoal: macros });
    show(`Cel dniowy: ${tdee} kcal ✔`, 'success');
  };

  const handleNumber = (field: 'heightCm' | 'weightKg' | 'age', value: string): void => {
    // Puste pole przy czyszczeniu NIE może nadpisywać profilu zerem.
    if (value.trim() === '') return;
    const n = Number(value);
    if (Number.isFinite(n)) {
      updateProfile({ [field]: n } as Partial<typeof profile>);
    }
  };

  const pickModel = (m: GeminiModel): void => {
    setModel(m.name);
    show(`Wybrany model: ${m.displayName}`, 'success');
  };

  return (
    <section className="space-y-5 p-4">
      {/* Sekcja API */}
      <div className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <Key size={16} aria-hidden="true" /> Klucz Gemini API
        </h3>
        <input
          className="input"
          type="password"
          autoComplete="off"
          placeholder="Wklej klucz API (AIza…)"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        <Button onClick={() => void validateKey()} disabled={validating}>
          {validating ? <Loader2 size={17} className="animate-spin" /> : <CheckCircle2 size={17} aria-hidden="true" />}
          {validating ? 'Weryfikuję…' : 'Zweryfikuj klucz'}
        </Button>
        <KeyStatusRow status={apiKeyStatus} />

        {/* Wybór modelu */}
        <div className="card p-4">
          <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <List size={16} aria-hidden="true" /> Wybrany model
          </h4>
          {availableModels.length === 0 ? (
            <p className="text-xs text-slate-400">Zweryfikuj klucz, aby pobrać listę modeli.</p>
          ) : (
            <div className="max-h-52 space-y-2 overflow-y-auto">
              {availableModels.map((m) => (
                <button
                  key={m.name}
                  onClick={() => pickModel(m)}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition ${
                    selectedModel === m.name
                      ? 'border-accent bg-accent/10'
                      : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700/40'
                  }`}
                >
                  <span className="font-medium">{m.displayName}</span>
                  {selectedModel === m.name && <CheckCircle2 size={16} className="text-accent" aria-hidden="true" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Profil BWT */}
      <div className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <Calculator size={16} aria-hidden="true" /> Profil i cele
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Wzrost (cm)" value={profile.heightCm} onChange={(v) => handleNumber('heightCm', v)} />
          <NumberField label="Waga (kg)" value={profile.weightKg} onChange={(v) => handleNumber('weightKg', v)} />
          <NumberField label="Wiek" value={profile.age} onChange={(v) => handleNumber('age', v)} />
          <GenderField value={profile.gender} onChange={(g) => updateProfile({ gender: g })} />
        </div>
        <ActivityField value={profile.activityLevel} onChange={(a) => updateProfile({ activityLevel: a })} />
        <Button variant="outline" className="w-full" onClick={recompute}>
          Oblicz TDEE i cele makro
        </Button>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Cel dniowy: <b className="text-slate-600 dark:text-slate-300">{profile.dailyCaloriesGoal} kcal</b> · B {profile.macrosGoal.protein}g / W {profile.macrosGoal.carbs}g / T {profile.macrosGoal.fats}g
        </p>
      </div>

      {/* Przypomnienia (D3) */}
      <div className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <Bell size={16} aria-hidden="true" /> Przypomnienia
        </h3>
        <div className="card divide-y divide-slate-100 dark:divide-slate-700">
          {REMINDER_ROWS.map((row) => (
            <ReminderRow
              key={row.key}
              row={row}
              config={reminders[row.key]}
              busy={syncing}
              onChange={(patch) => void handleReminderChange(row.key, patch)}
            />
          ))}
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Przypomnienia działają w aplikacji mobilnej (Android/iOS). W przeglądarce PWA są niedostępne.
        </p>
      </div>

      {/* Strefa ryzyka */}
      <div className="space-y-2">
        <Button variant="danger-ghost" className="w-full" onClick={() => {
          if (window.confirm('Usunąć wszystkie dane aplikacji i zacząć od nowa?')) {
            resetAll();
            // Resetuje też dziennik posiłków (ze zdjęciami) — nie tylko profil.
            useMealsStore.getState().clearAll();
            show('Dane aplikacji zostały zresetowane.', 'info');
          }
        }}>
          <RotateCcw size={16} aria-hidden="true" /> Resetuj aplikację
        </Button>
        <p className="text-center text-[11px] text-slate-400">Aplikacja nie jest produktem medycznym.</p>
      </div>
    </section>
  );
}

function KeyStatusRow({ status }: { status: 'idle' | 'checking' | 'valid' | 'invalid' }): JSX.Element {
  if (status === 'valid') {
    return (
      <p className="flex items-center gap-1.5 text-sm text-emerald-600">
        <CheckCircle2 size={16} aria-hidden="true" /> Klucz zweryfikowany
      </p>
    );
  }
  if (status === 'invalid') {
    return (
      <p className="flex items-center gap-1.5 text-sm text-rose-500">
        <XCircle size={16} aria-hidden="true" /> Klucz jest nieprawidłowy
      </p>
    );
  }
  if (status === 'checking') {
    return (
      <p className="flex items-center gap-1.5 text-sm text-slate-400">
        <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Sprawdzanie…
      </p>
    );
  }
  return <></>;
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: string) => void }): JSX.Element {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        className="input"
        inputMode="numeric"
        value={Number.isFinite(value) ? value : ''}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function GenderField({ value, onChange }: { value: Gender; onChange: (g: Gender) => void }): JSX.Element {
  return (
    <div>
      <label className="label">Płeć</label>
      <select className="input" value={value} onChange={(e) => onChange(e.target.value as Gender)}>
        <option value="female">Kobieta</option>
        <option value="male">Mężczyzna</option>
      </select>
    </div>
  );
}

const ACTIVITY_OPTIONS: Array<{ v: number; label: string }> = [
  { v: 1.2, label: 'Brak aktywności' },
  { v: 1.375, label: 'Lekka (1-3 dni/tydz.)' },
  { v: 1.55, label: 'Umiarkowana (3-5)' },
  { v: 1.725, label: 'Wysoka (6-7)' },
  { v: 1.9, label: 'Bardzo wysoka' },
];

function ActivityField({ value, onChange }: { value: number; onChange: (v: number) => void }): JSX.Element {
  return (
    <div>
      <label className="label">Aktywność</label>
      <select className="input" value={value} onChange={(e) => onChange(Number(e.target.value))}>
        {ACTIVITY_OPTIONS.map((o) => (
          <option key={o.v} value={o.v}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

/** Pojedynczy wiersz przypomnienia: ikona, etykieta, godzina, przełącznik (D3). */
function ReminderRow({
  row,
  config,
  busy,
  onChange,
}: {
  row: { key: ReminderKey; label: string; hint: string; icon: LucideIcon };
  config: ReminderConfig;
  busy: boolean;
  onChange: (patch: Partial<ReminderConfig>) => void;
}): JSX.Element {
  const Icon = row.icon;
  return (
    <div className="flex items-center gap-3 p-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-accent">
        <Icon size={18} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{row.label}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">{row.hint}</p>
      </div>
      <input
        type="time"
        className="input w-auto py-1.5 text-sm"
        value={config.time}
        disabled={busy}
        onChange={(e) => onChange({ time: e.target.value })}
        aria-label={`Godzina przypomnienia: ${row.label}`}
      />
      <ToggleSwitch
        checked={config.enabled}
        disabled={busy}
        onChange={(v) => onChange({ enabled: v })}
        label={`Przypomnienie: ${row.label}`}
      />
    </div>
  );
}

/** Premium przełącznik (switch) z animowaną gałką (Framer Motion). */
function ToggleSwitch({
  checked,
  disabled,
  onChange,
  label,
}: {
  checked: boolean;
  disabled: boolean;
  onChange: (v: boolean) => void;
  label: string;
}): JSX.Element {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
        checked ? 'bg-accent' : 'bg-slate-300 dark:bg-slate-600'
      } ${disabled ? 'opacity-50' : ''}`}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow ${
          checked ? 'left-6' : 'left-1'
        }`}
      />
    </button>
  );
}