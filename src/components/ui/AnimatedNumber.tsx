// ============================================================================
// AnimatedNumber.tsx — "odlicza" do wartości (count-up), np. kalorie dnia.
// Używa Framer Motion (animate + MotionValue) dla płynnej interpolacji.
// ============================================================================

import { animate, useMotionValue } from 'framer-motion';
import { useEffect, useState } from 'react';

interface AnimatedNumberProps {
  value: number;
  className?: string;
}

export function AnimatedNumber({ value, className }: AnimatedNumberProps): JSX.Element {
  const mv = useMotionValue(value);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const controls = animate(mv, value, {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
    });
    const unsub = mv.on('change', (v) => setShown(v));
    return () => {
      controls.stop();
      unsub();
    };
  }, [value, mv]);

  return <span className={className}>{Math.round(shown).toLocaleString('pl-PL')}</span>;
}