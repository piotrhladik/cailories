// ============================================================================
// ApiKeyInputScreen — wpisanie klucza Gemini API z instrukcją + linkiem.
// Realna walidacja: pobranie listy modeli z Gemini (nie żadna symulacja).
// ============================================================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import { KeyRound, Loader2, XCircle } from 'lucide-react';
import { useUserStore } from '../../store/useUserStore';
import { fetchAvailableModels, looksLikeApiKey } from '../../services/geminiApi';

interface Props {
  /** Wywoływane po pomyślnej walidacji klucza → przejście do profilu. */
  onValid: () => void;
}

export default function ApiKeyInputScreen({ onValid }: Props) {
  const setApiKey = useUserStore((s) => s.setApiKey);
  const setApiKeyStatus = useUserStore((s) => s.setApiKeyStatus);
  const setAvailableModels = useUserStore((s) => s.setAvailableModels);
  const setModel = useUserStore((s) => s.setModel);
  const apiKeyStatus = useUserStore((s) => s.apiKeyStatus);

  const [key, setKey] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleContinue = async (): Promise<void> => {
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
      if (models.length > 0) setModel(models[0].name);
      setApiKeyStatus('valid');
      onValid();
    } catch (err) {
      const msg = (err as { message?: string }).message ?? 'Nie udało się zweryfikować klucza. Spróbuj ponownie.';
      setApiKeyStatus('invalid');
      setError(msg);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center text-foreground">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
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
            onKeyDown={(e) => e.key === 'Enter' && void handleContinue()}
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
          <button
            onClick={() => void handleContinue()}
            disabled={apiKeyStatus === 'checking'}
            className="w-full rounded-full bg-primary px-8 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            Zweryfikuj i kontynuuj
          </button>
        </div>
      </motion.div>
    </div>
  );
}