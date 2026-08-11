// ============================================================================
// ApiKeyInputScreen — wpisanie klucza Gemini API z instrukcją + linkiem.
// Realna walidacja: pobranie listy modeli z Gemini (nie żadna symulacja).
//
// Przepływ:
//   1. Użytkownik wkleja klucz → pod polem pojawia się animowana ramka (GlowFrame)
//      z wyborem modelu (domyślnie gemini-3.5-flash-lite — zmianisz później w Ustawieniach).
//   2. „Zweryfikuj klucz" waliduje klucz i pobiera realną listę modeli (bez przechodzenia dalej).
//   3. „Uruchom czat" zapisuje wybrany model i zamyka onboarding → przejście do czatu.
// ============================================================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Cpu, KeyRound, Loader2, XCircle } from 'lucide-react';
import { useUserStore } from '../../store/useUserStore';
import { fetchAvailableModels, looksLikeApiKey } from '../../services/geminiApi';
import { DEFAULT_MODEL } from '../../config';
import { GlowFrame } from '../ui/GlowFrame';

interface Props {
  /** Wywoływane po zapisaniu modelu → zakończenie onboardingu (start czatu). */
  onValid: () => void;
}

type Stage = 'enter' | 'ready';

/** Podglądowy, domyślny model pokazywany zanim klucz zostanie zweryfikowany. */
const PREVIEW_MODEL = { name: DEFAULT_MODEL, displayName: 'Gemini 3.5 Flash Lite' };

export default function ApiKeyInputScreen({ onValid }: Props) {
  const setApiKey = useUserStore((s) => s.setApiKey);
  const setApiKeyStatus = useUserStore((s) => s.setApiKeyStatus);
  const setAvailableModels = useUserStore((s) => s.setAvailableModels);
  const setModel = useUserStore((s) => s.setModel);
  const selectedModel = useUserStore((s) => s.selectedModel);
  const availableModels = useUserStore((s) => s.availableModels);
  const apiKeyStatus = useUserStore((s) => s.apiKeyStatus);

  const [key, setKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>('enter');

  // Ramka modelu pojawia się, gdy tylko użytkownik wklei/rozpocznie klucz.
  const showPicker = key.trim() !== '';

  // Po weryfikacji użyjemy pełnej listy z Gemini; wcześniej — sam domyślny model.
  const modelList = stage === 'ready' && availableModels.length > 0 ? availableModels : [PREVIEW_MODEL];
  // Aktywny wybór: domyślnie 3.5 Flash Lite; jeśli już wybrany model jest na liście → my po nim.
  const picked = modelList.some((m) => m.name === selectedModel) ? selectedModel : (modelList[0]?.name ?? DEFAULT_MODEL);

  const verify = async (): Promise<void> => {
    const trimmed = key.trim();
    if (!trimmed) {
      setError('Wpisz klucz API Gemini.');
      return;
    }
    if (!looksLikeApiKey(trimmed)) {
      setError('Klucz wygląda na nieprawidłowy (zbyt krótki lub zawiera spacje).');
      return;
    }

    setError(null);
    setApiKeyStatus('checking');
    setApiKey(trimmed);
    try {
      const models = await fetchAvailableModels(trimmed);
      setAvailableModels(models);
      // Domyślny model: 3.5 Flash Lite, gdy dostępny; inaczej pierwszy z listy.
      setModel(models.some((m) => m.name === DEFAULT_MODEL) ? DEFAULT_MODEL : (models[0]?.name ?? DEFAULT_MODEL));
      setApiKeyStatus('valid');
      setStage('ready');
    } catch (err) {
      const msg = (err as { message?: string }).message ?? 'Nie udało się zweryfikować klucza. Spróbuj ponownie.';
      setApiKeyStatus('invalid');
      setError(msg);
    }
  };

  const finish = (): void => {
    setModel(picked);
    setApiKeyStatus('valid');
    onValid();
  };

  return (
    <div className="paper-layer flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center text-foreground">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="w-full max-w-md"
      >
        <h1 className="mb-3 text-3xl font-bold">Klucz Gemini API</h1>

        <div className="mb-6 space-y-3 rounded-2xl bg-secondary p-5 text-left text-sm text-muted-foreground">
          <p>
            1. Zaloguj się do Google i <b className="text-foreground">uzyskaj darmowy klucz</b>:
          </p>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 font-semibold text-primary hover:underline"
          >
            <KeyRound size={16} aria-hidden="true" /> aistudio.google.com/app/apikey
          </a>
          <p>
            2. Utwórz klucz i skopiuj go — zaczyna się od{' '}
            <code className="rounded bg-background px-1 py-0.5 text-foreground">AIza…</code> — następnie wklej go
            poniżej.
          </p>
          <p className="text-xs">
            Klucz jest zapisywany wyłącznie na Twoim urządzeniu i używany bezpośrednio do Gemini —
            nigdy nie trafia na nasze serwery.
          </p>
        </div>

        <div className="space-y-4 text-left">
          <input
            type="password"
            autoComplete="off"
            spellCheck={false}
            className="w-full rounded-lg border bg-secondary p-3 text-foreground"
            placeholder="Wklej klucz API (AIza…)"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void (stage === 'ready' ? finish() : verify())}
          />
          {error && (
            <p className="flex items-center gap-1.5 text-sm text-rose-500">
              <XCircle size={15} aria-hidden="true" /> {error}
            </p>
          )}
          {apiKeyStatus === 'checking' && (
            <p className="flex items-center gap-1.5 text-sm text-slate-400">
              <Loader2 size={15} className="animate-spin" aria-hidden="true" /> Weryfikacja klucza…
            </p>
          )}

          {/* Ramka wyboru modelu — fade wejścia jak napis; domyślnie 3.5 Flash Lite. */}
          {showPicker && (
            <GlowFrame>
              <div className="p-4">
                <h3 className="mb-1 flex items-center gap-2 text-sm font-bold text-foreground">
                  <Cpu size={16} className="text-accent" aria-hidden="true" /> Wybierz model AI
                </h3>
                <p className="mb-3 text-xs text-muted-foreground">
                  Domyślnie ustawiony na{' '}
                  <b className="text-foreground">3.5 Flash Lite</b>. Pełną listę i zmianę znajdziesz później w{' '}
                  <b className="text-foreground">Ustawieniach</b>.
                </p>
                <div className="space-y-2" role="radiogroup" aria-label="Wybierz model Gemini">
                  {modelList.map((m) => {
                    const active = picked === m.name;
                    return (
                      <button
                        key={m.name}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setModel(m.name)}
                        className={
                          'flex min-h-[44px] w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ' +
                          (active
                            ? 'border-accent bg-accent/10 text-accent-dark dark:text-accent'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300')
                        }
                      >
                        <span className="font-medium">{m.displayName}</span>
                        {active && <CheckCircle2 size={16} className="text-accent" aria-hidden="true" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </GlowFrame>
          )}

          <button
            onClick={() => void (stage === 'ready' ? finish() : verify())}
            disabled={apiKeyStatus === 'checking'}
            className="w-full rounded-full bg-primary px-8 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {stage === 'ready' ? 'Uruchom czat' : 'Zweryfikuj klucz'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}