// ============================================================================
// WelcomeScreen — pierwszy ekran onboardingu (premium splash: „CaiLORIES").
// Art direction: „layered paper cut" + fizyka sprężyn.
// Bez react-routera: postęp prowadzi OnboardingFlow przekazujący callbacki.
// ============================================================================

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { prefersReducedMotion, revealItem, spring, staggerContainer } from '../../utils/motion';

interface Props {
  /** Przejście do następnego kroku (klauzula). */
  onNext: () => void;
}

/** Napis „CaiLORIES" — płynna lewitacja (zamiast spring: tween keyframes).
 *  Wejście (fade) zapewnia wrapper revealItem; tu jest tylko niekończący się bob.
 *  Przy reduced-motion — bez unoszenia (WCAG 2.1 AA). */
const floatTitle = () => {
  if (prefersReducedMotion()) {
    return { animate: { y: 0, scale: 1 }, transition: { duration: 0 } };
  }
  return {
    animate: { y: [0, -12, 0], scale: [1, 1.03, 1] },
    transition: {
      duration: 3.2,
      ease: 'easeInOut' as const,
      repeat: Infinity,
      times: [0, 0.5, 1],
    },
  };
};

export default function WelcomeScreen({ onNext }: Props) {
  const float = floatTitle();

  return (
    <div className="paper-layer flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center text-foreground">
      <motion.div
        variants={staggerContainer()}
        initial="hidden"
        animate="visible"
        className="flex max-w-md flex-col items-center"
      >
        <motion.div
          variants={revealItem}
          className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary"
        >
          <Sparkles size={40} aria-hidden="true" />
        </motion.div>

        <motion.div variants={revealItem} className="mb-4">
          <motion.h1
            animate={float.animate}
            transition={float.transition}
            className="glow-text text-5xl font-black tracking-tight"
          >
            CaiLORIES
          </motion.h1>
        </motion.div>

        <motion.p
          variants={revealItem}
          className="mb-8 text-lg text-muted-foreground"
        >
          Twój osobisty asystent żywienia AI. Skanuj posiłki, śledź kalorie i makro oraz osiągaj swoje cele.
        </motion.p>

        <motion.button
          variants={revealItem}
          whileHover={{ y: -3, scale: 1.03, boxShadow: '0 14px 30px rgba(15, 23, 42, 0.22)' }}
          whileTap={{ scale: 0.96 }}
          transition={spring()}
          onClick={onNext}
          aria-label="Otwórz kreator profilu i rozpocznij pracę z aplikacją"
          className="rounded-full bg-primary px-8 py-3 font-semibold text-primary-foreground shadow-md transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Rozpocznij
        </motion.button>
      </motion.div>
    </div>
  );
}