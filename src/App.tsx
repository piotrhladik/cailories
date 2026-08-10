import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { DailySummaryDrawer } from './components/layout/DailySummaryDrawer';
import { ToastViewport } from './components/ui/Toast';
import { AdBanner } from './components/ui/AdBanner';
import { useLeftEdgeSwipe } from './hooks/useLeftEdgeSwipe';
import { useUserStore } from './store/useUserStore';
import { AiChat } from './features/ai-chat/AiChat';
import { FridgeMode } from './features/fridge-mode/FridgeMode';
import { Scanner } from './features/scanner/Scanner';
import { Dashboard } from './features/dashboard/Dashboard';
import { Settings } from './features/settings/Settings';
import { initializeAdMob } from './services/admobService';
import { WEB_ADS_ENABLED } from './config';
import type { TabKey } from './types';
import OnboardingFlow from './components/onboarding/OnboardingFlow';

const TITLES: Record<TabKey, { title: string; subtitle: string }> = {
  chat: { title: 'AI Czat', subtitle: 'Analiza posiłków' },
  fridge: { title: 'Tryb Lodówki', subtitle: 'Pomysły na posiłki' },
  scanner: { title: 'Skaner EAN', subtitle: 'Open Food Facts' },
  dashboard: { title: 'Dziennik', subtitle: 'Kalorie i BWT' },
  settings: { title: 'Ustawienia', subtitle: 'Klucz i profil' },
};

const pageVariants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.24, ease: [0.16, 1, 0.3, 1] as const } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.16 } },
};

export function App(): JSX.Element {
  const [tab, setTab] = useState<TabKey>('chat');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useUserStore((s) => s.theme);
  const onboardingCompleted = useUserStore((s) => s.onboardingCompleted);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') {
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      const apply = (): void => {
        root.classList.toggle('dark', mql.matches);
      };
      apply();
      mql.addEventListener('change', apply);
      return () => mql.removeEventListener('change', apply);
    }
    root.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    void initializeAdMob();
  }, []);

  useLeftEdgeSwipe(() => setDrawerOpen(true));

  const { title, subtitle } = TITLES[tab];

  return (
    <div className="app-shell">
      <OnboardingFlow />
      <ToastViewport />
      <Header title={title} subtitle={subtitle} onOpenSummary={() => setDrawerOpen(true)} />
      
      {onboardingCompleted && (
        <main className="flex-1 pb-6">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={tab} variants={pageVariants} initial="initial" animate="animate" exit="exit">
              {tab === 'chat' && <AiChat />}
              {tab === 'fridge' && <FridgeMode />}
              {tab === 'scanner' && <Scanner />}
              {tab === 'dashboard' && <Dashboard />}
              {tab === 'settings' && <Settings />}
            </motion.div>
          </AnimatePresence>
        </main>
      )}
      
      {WEB_ADS_ENABLED && <AdBanner force />}
      <DailySummaryDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      
      {onboardingCompleted && <BottomNav active={tab} onChange={setTab} />}
    </div>
  );
}
