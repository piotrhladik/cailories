// ============================================================================
// DisclaimerScreen — akceptacja klauzuli prawnej (nie porada medyczna).
// Treść otoczona animowaną gradientową ramką (GlowFrame) w stylu napisu.
// ============================================================================

import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { GlowFrame } from '../ui/GlowFrame';
import { spring } from '../../utils/motion';

interface Props {
  /** Akceptacja klauzuli i przejście do kroku klucza API. */
  onAccept: () => void;
}

export default function DisclaimerScreen({ onAccept }: Props) {
  return (
    <div className="paper-layer flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center text-foreground">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring()}
        className="w-full max-w-md"
      >
        <h1 className="mb-6 flex items-center justify-center gap-2 text-3xl font-bold">
          <ShieldCheck className="text-primary" aria-hidden="true" /> Informacja
        </h1>
        <GlowFrame className="mb-8 block">
          <div className="space-y-4 p-5 text-left text-sm text-muted-foreground">
            <p>
              CaiLORIES
              analizy AI. Wyniki są przybliżone i <b className="text-foreground">nie stanowią porady medycznej</b>.
            </p>
            <p>
              Przed wprowadzeniem istotnych zmian w diecie <b className="text-foreground">skonsultuj się ze
              specjalistą</b> (lekarzem lub dietetykiem).
            </p>
            <p>
              Kontynuując, akceptujesz nasz regulamin i rozumiesz, że CaiLORIES
              <b className="text-foreground"> nie ponosi odpowiedzialności </b> za decyzje żywieniowe podejmowane na podstawie jego sugestii.
            </p>
          </div>
        </GlowFrame>
        <button
          onClick={onAccept}
          className="w-full rounded-full bg-primary px-8 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Akceptuję i kontynuuję
        </button>
      </motion.div>
    </div>
  );
}