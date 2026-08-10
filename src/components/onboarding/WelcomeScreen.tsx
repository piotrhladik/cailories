// ============================================================================
// WelcomeScreen — pierwszy ekran onboardingu (powitanie aplikacji).
// Bez react-routera: postęp prowadzi OnboardingFlow przekazujący callbacki.
// ============================================================================

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface Props {
  /** Przejście do następnego kroku (klauzula). */
  onNext: () => void;
}

export default function WelcomeScreen({ onNext }: Props) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center text-foreground">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex max-w-md flex-col items-center"
      >
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary">
          <Sparkles size={40} aria-hidden="true" />
        </div>
        <h1 className="mb-4 text-4xl font-bold">NutriScan AI</h1>
        <p className="mb-8 text-lg text-muted-foreground">
          Twój osobisty asystent żywienia AI. Skanuj posiłki, śledź kalorie i makro oraz osiągaj swoje cele.
        </p>
        <button
          onClick={onNext}
          className="rounded-full bg-primary px-8 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Rozpocznij
        </button>
      </motion.div>
    </div>
  );
}