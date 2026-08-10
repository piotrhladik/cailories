// ============================================================================
// DisclaimerModal.tsx — obowiązkowy Medical Disclaimer przy pierwszym uruchomieniu.
// Nie można go zamknąć bez akceptacji (zgodność prawna). Zapis w localStorage.
// ============================================================================

import { Activity, AlertTriangle } from 'lucide-react';
import { useUserStore } from '../../store/useUserStore';

const DISCLAIMER_TEXT: readonly string[] = [
  'Aplikacja nie jest produktem medycznym i nie świadczy porad zdrowotnych.',
  'Informacje o wartościach odżywczych mają charakter szacunkowy.',
  'Przed zmianą diety skonsultuj się z lekarzem lub dietetykiem.',
];

export function DisclaimerGate(): JSX.Element | null {
  const accepted = useUserStore((s) => s.disclaimerAccepted);
  const acceptDisclaimer = useUserStore((s) => s.acceptDisclaimer);

  if (accepted) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-surface-light p-5 dark:bg-surface-dark">
      <div className="mx-auto w-full max-w-sm rounded-3xl bg-white p-6 shadow-card dark:bg-slate-800">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-500 dark:bg-amber-500/20">
          <AlertTriangle size={28} aria-hidden="true" />
        </span>
        <h2 className="mt-4 text-xl font-bold">Ważne informacje</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Ten komunikat dotyczy wszystkich treści aplikacji NutriScan AI.
        </p>
        <ul className="mt-4 space-y-2">
          {DISCLAIMER_TEXT.map((line) => (
            <li key={line} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
              <Activity size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
              {line}
            </li>
          ))}
        </ul>
        <label className="mt-4 flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
          <input
            id="disclaimer-accept"
            type="checkbox"
            className="mt-0.5 accent-accent"
            onChange={(e) => e.target.checked && acceptDisclaimer()}
          />
          <span>
            Rozumiem i akceptuję powyższe informacje. Używam aplikacji na własną odpowiedzialność.
          </span>
        </label>
      </div>
    </div>
  );
}