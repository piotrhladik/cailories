// ============================================================================
// GlowFrame — animowana gradientowa ramka w stylu napisu „CaiLORIES" (.glow-text).
// Kontur: wirujący conic-gradient (lime → blue → emerald), który powoli kręci się
// wokół karty i delikatnie "oddycha" (jasność). Część centralna (cutout) jest
// nieprzezroczysta, więc gradient widoczny jest tylko jako cienka obwódka.
//
// Accessibility: przy prefers-reduced-motion globalna reguła w index.css skraca
// animacje do 0.01ms → ramka pozostaje nieruchoma (bez naruszenia WCAG 2.1 AA).
// Wejście treści (spring 300/25) działa zawsze — to tylko jednorazowy fade.
// ============================================================================

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { spring } from '../../utils/motion';

interface GlowFrameProps {
  children: ReactNode;
  /** Dodatkowe klasy dla kontenera (np. odstęp mb-6). */
  className?: string;
}

export function GlowFrame({ children, className = '' }: GlowFrameProps): JSX.Element {
  return (
    <div className={`glow-frame ${className}`}>
      {/* Warstwa gradientu — wiruje i oddycha; przykrywa ją cutout poniżej. */}
      <div aria-hidden="true" className="glow-frame-rotor" />
      {/* Karta wewnętrzna: maskuje środek rotor-a, pokazując tylko obwódkę. */}
      <motion.div
        className="glow-frame-cutout"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={spring()}
      >
        {children}
      </motion.div>
    </div>
  );
}