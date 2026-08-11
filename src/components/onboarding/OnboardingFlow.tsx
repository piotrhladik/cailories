// ============================================================================
// OnboardingFlow — orkiestrator onboardingu (bez react-routera).
// Kolejność kroków: Powitanie → Klauzula → Klucz API + wybór modelu.
// Po ustawieniu modelu aplikacja odblokowuje się (onboardingCompleted = true)
// i trafia od razu do czatu. Profil (waga/wzrost/TDEE) edytuje się w Ustawieniach.
// ============================================================================

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useUserStore } from '../../store/useUserStore';
import WelcomeScreen from './WelcomeScreen';
import DisclaimerScreen from './DisclaimerScreen';
import ApiKeyInputScreen from './ApiKeyInputScreen';

type Step = 'welcome' | 'disclaimer' | 'apiKey';

const variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.18 } },
};

export default function OnboardingFlow() {
  const onboardingCompleted = useUserStore((s) => s.onboardingCompleted);
  const [step, setStep] = useState<Step>('welcome');

  if (onboardingCompleted) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={step} variants={variants} initial="initial" animate="animate" exit="exit">
          {step === 'welcome' && <WelcomeScreen onNext={() => setStep('disclaimer')} />}
          {step === 'disclaimer' && (
            <DisclaimerScreen
              onAccept={() => {
                useUserStore.getState().acceptDisclaimer();
                setStep('apiKey');
              }}
            />
          )}
          {step === 'apiKey' && (
            <ApiKeyInputScreen
              onValid={() => {
                // Domyślna zakładka to czat → odblokowanie onboardingu prowadzi prosto do czatu.
                useUserStore.getState().setOnboardingCompleted(true);
              }}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}