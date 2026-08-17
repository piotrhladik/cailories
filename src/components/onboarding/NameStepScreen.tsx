// ============================================================================
// NameStepScreen — krok imienia (pierwszy po powitaniu).
// Prosi użytkownika o imię, które personalizuje późniejszą rozmowę i komunikat
// powitalny. Używa styl a'onboarding (paper-layer, spring, glow-tytuł).
// ============================================================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import { UserRound } from 'lucide-react';
import { spring, revealItem, staggerContainer } from '../../utils/motion';

interface Props {
  /** Domyślne imię (jeśli użytkownik już je ustawił). */
  initialName?: string;
  /** Zakończenie kroku z podanym imieniem (może być puste → fallback). */
  onDone: (name: string) => void;
}

export default function NameStepScreen({ initialName = '', onDone }: Props) {
  const [name, setName] = useState(initialName);
  const trimmed = name.trim();
  const valid = trimmed.length > 0;

  const submit = (): void => {
    if (!valid) return;
    onDone(trimmed);
  };

  return (
    <div className="paper-layer flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center text-foreground">
      <motion.div
        variants={staggerContainer()}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md"
      >
        <motion.div
          variants={revealItem}
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-accent/10 text-accent-dark dark:text-accent"
        >
          <UserRound size={40} aria-hidden="true" />
        </motion.div>

        <motion.h1 variants={revealItem} className="mb-2 text-3xl font-bold">
          Jak masz na imię?
        </motion.h1>
        <motion.p variants={revealItem} className="mb-8 text-sm text-muted-foreground">
          Będziemy się do Ciebie zwracać po imieniu.
        </motion.p>

        <motion.form
          variants={revealItem}
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="space-y-4"
        >
          <div className="text-left">
            <label htmlFor="onb-name" className="label">
              Imię
            </label>
            <input
              id="onb-name"
              className="input"
              autoComplete="given-name"
              placeholder="np. Kasia lub Janek"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-label="Twoje imię"
              maxLength={32}
            />
          </div>

          <motion.button
            type="submit"
            disabled={!valid}
            whileTap={{ scale: 0.96 }}
            transition={spring()}
            className="w-full rounded-full bg-primary px-8 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
          >
            Dalej
          </motion.button>
        </motion.form>
      </motion.div>
    </div>
  );
}
