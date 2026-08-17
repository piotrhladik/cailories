// ============================================================================
// OnboardingFlow — orkiestrator onboardingu (bez react-routera).
// Pełna sekwencja: Powitanie → Imię → Klauzula → Klucz API + model → Profil
// (waga, wzrost, wiek, płeć, aktywność, własne cele) → CZAT.
// Prawdziwy profil zbieramy TUTAJ w onboarding; po jego uzupełnieniu
// aplikacja odblokowuje się (onboardingCompleted=true) i ląduje na czacie.
// ============================================================================

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useUserStore } from '../../store/useUserStore';
import WelcomeScreen from './WelcomeScreen';
import NameStepScreen from './NameStepScreen';
import DisclaimerScreen from './DisclaimerScreen';
import ApiKeyInputScreen from './ApiKeyInputScreen';
import ProfileStepScreen, { type ProfileStepInput } from './ProfileStepScreen';

type Step = 'welcome' | 'name' | 'disclaimer' | 'apiKey' | 'profile';

const variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.18 } },
};

export default function OnboardingFlow() {
  const onboardingCompleted = useUserStore((s) => s.onboardingCompleted);
  const [step, setStep] = useState<Step>('welcome');

  if (onboardingCompleted) return null;

  // Zapis profilu + celów z kroku ProfileStepScreen.
  const handleProfileDone = (data: ProfileStepInput): void => {
    const store = useUserStore.getState();
    store.updateProfile({
      heightCm: data.heightCm,
      weightKg: data.weightKg,
      age: data.age,
      gender: data.gender,
      activityLevel: data.activityLevel,
      dailyCaloriesGoal: data.customCalories ?? data.dailyCaloriesGoal,
      macrosGoal: {
        protein: data.customProtein ?? data.macrosGoal.protein,
        carbs: data.customCarbs ?? data.macrosGoal.carbs,
        fats: data.customFats ?? data.macrosGoal.fats,
      },
    });
    // Custom goals (priorytet nad BMR) — zapis osobno dla jasności.
    store.setCustomGoals({
      calories: data.customCalories,
      protein: data.customProtein,
      carbs: data.customCarbs,
      fats: data.customFats,
    });
    // Odblokuj aplikację → domyślna zakładka to czat.
    store.setOnboardingCompleted(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={step} variants={variants} initial="initial" animate="animate" exit="exit">
          {step === 'welcome' && <WelcomeScreen onNext={() => setStep('name')} />}

          {step === 'name' && (
            <NameStepScreen
              initialName={useUserStore.getState().userName !== 'Użytkownik' ? useUserStore.getState().userName : ''}
              onDone={(name) => {
                useUserStore.getState().setUserName(name);
                setStep('disclaimer');
              }}
            />
          )}

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
              onValid={() => setStep('profile')}
            />
          )}

          {step === 'profile' && (
            <ProfileStepScreen onDone={handleProfileDone} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
