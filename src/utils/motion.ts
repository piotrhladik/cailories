// ============================================================================
// motion.ts — jednolite presety animacji Framer Motion dla całej aplikacji.
// Fizyka oparta na sprężynach (sztywność 300, tłumienie 25) dla przejść,
// staggered dla list/kart, + wsparcie prefers-reduced-motion (WCAG 2.1 AA).
// Wszędzie używamy TYCH presetów, żeby całość była spójną opowieścią wizualną.
// ============================================================================

import type { Transition, Variants } from 'framer-motion';

/** Redukcja ruchu (User Setting) — gdy włączona, wyłączamy animacje. */
export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Spring używany w całym projekcie (sztywność 300, tłumienie 25). */
export const spring = (): Transition => ({
  type: 'spring',
  stiffness: 300,
  damping: 25,
});

/** Pojedyncza pozycja wkraczająca z dołu z lekkością papieru. */
export const fadeUp = (): Variants => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: spring() },
  exit: { opacity: 0, y: -10, transition: { duration: 0.16, ease: 'easeOut' } },
});

/** Kontener staggering dla list kart — elementy wchodzą sekwencyjnie. */
export const staggerContainer = (delayChildren = 0.06, staggerChildren = 0.06): Variants => ({
  visible: {
    transition: { delayChildren, staggerChildren },
  },
  hidden: {},
});

/** Pojedyncza karta/lista — hover unosi i pogłębia cień, active wciska. */
export const revealItem: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: spring(),
  },
};

/** Mikro-interakcja interaktywnego elementu: uniesienie + wciśnięcie. */
export const pressable = {
  whileHover: { y: -2, scale: 1.02 },
  whileTap: { scale: 0.96 },
  transition: spring(),
};

/** Warianty przelotowe kart stylu życia (stagger). */
export const cardGrid: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};