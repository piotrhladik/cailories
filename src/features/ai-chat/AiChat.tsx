// ============================================================================
// features/ai-chat/AiChat.tsx — ekran startowy aplikacji (podstawa projektu).
// Czat + analiza multimodalna posiłku (opis i/lub zdjęcie). Na przywitaniu
// duzy przycisk aparatu (FAB). Stan trzymany w useChatStore, więc nie gubi
// wpisanego tekstu ani zdjęcia przy przełączaniu zakładek.
// ============================================================================

import { motion } from 'framer-motion';
import { Camera, ImagePlus, Loader2, Send, Sparkles, X } from 'lucide-react';
import { useUserStore } from '../../store/useUserStore';
import { useMealsStore } from '../../store/useMealsStore';
import { useToastStore } from '../../store/useToastStore';
import { useChatStore } from '../../store/useChatStore';
import { analyzeMeal, looksLikeApiKey } from '../../services/geminiApi';
import { useImagePicker } from '../../hooks/useImagePicker';
import { Button } from '../../components/ui/Button';
import { MealAnalysisCard } from '../../components/ui/MealAnalysisCard';
import { prepareInterstitial, showInterstitial } from '../../services/admobService';

/** Animacje wariantów — sekcje czatu wchodzą z kontrolowanym opóźnieniem. */
const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 26 },
  },
};

export function AiChat(): JSX.Element {
  const apiKey = useUserStore((s) => s.apiKey);
  const model = useUserStore((s) => s.selectedModel);
  const addMeal = useMealsStore((s) => s.addMeal);
  const show = useToastStore((s) => s.show);

  const text = useChatStore((s) => s.text);
  const image = useChatStore((s) => s.image);
  const result = useChatStore((s) => s.result);
  const thinking = useChatStore((s) => s.thinking);
  const { setText, setImage, setResult, setThinking, clear } = useChatStore.getState();
  const { picking, pick, resetError, lastError } = useImagePicker();

  const handlePick = async (fromCamera: boolean): Promise<void> => {
    resetError();
    const img = await pick(fromCamera);
    if (img) setImage(img);
    else show('Nie wybrano zdjęcia.', 'info');
  };

  const runAnalysis = async (extraText?: string): Promise<void> => {
    const prompt = (extraText ?? text).trim();
    const hasInput = prompt.length > 0 || image !== null;

    if (!apiKey) {
      show('Ustaw klucz API Gemini w Ustawieniach, aby korzystać z AI.', 'error');
      return;
    }
    if (!looksLikeApiKey(apiKey)) {
      show('Klucz API wygląda na nieprawidłowy — sprawdź go w Ustawieniach.', 'error');
      return;
    }
    if (!hasInput) {
      show('Dodaj opis lub zdjęcie posiłku do analizy.', 'error');
      return;
    }

    setThinking(true);
    setResult(null);
    try {
      const analysis = await analyzeMeal(apiKey, model, {
        text: prompt,
        imageBase64: image?.base64,
      });
      setResult(analysis);
    } catch (err) {
      const msg = (err as { message?: string }).message ?? 'Nie udało się przeanalizować posiłku.';
      show(msg, 'error');
    } finally {
      setThinking(false);
    }
  };

  const saveResult = async (): Promise<void> => {
    if (!result) return;
    addMeal({
      name: result.name,
      calories: result.calories,
      macros: { protein: result.protein, carbs: result.carbs, fats: result.fats },
      source: 'ai-chat',
      image: image?.dataUrl,
    });
    show(`Zapisano: ${result.name} ✔`, 'success');
    clear();
    // Monetyzacja — interstitial po analizie posiłku.
    await prepareInterstitial();
    await showInterstitial();
  };

  const hasActivity = text.trim().length > 0 || image !== null || result !== null;

  return (
    <section className="flex min-h-full flex-col p-4">
      {/* Hero / powitanie */}
      {!hasActivity && (
        <motion.div variants={container} initial="hidden" animate="visible" className="mb-2 flex flex-1 flex-col justify-center py-4 text-center">
          <motion.span
            variants={item}
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-accent/15 text-accent"
          >
            <Sparkles size={30} aria-hidden="true" />
          </motion.span>
          <motion.h2 variants={item} className="mt-4 text-2xl font-extrabold">
            Cześć! 👋
          </motion.h2>
          <motion.p variants={item} className="mx-auto mt-2 max-w-xs text-sm text-slate-500 dark:text-slate-400">
            Zrób zdjęcie posiłku lub opisz go — AI podliczy kalorie i makro (BWT), a Ty zapiszesz to jednym dotknięciem.
          </motion.p>

          <motion.div variants={item} className="relative mx-auto mt-6">
            {/* Aparat — główna akcja */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => void handlePick(true)}
              disabled={picking}
              aria-label="Zrób zdjęcie posiłku"
              className="relative flex h-28 w-28 items-center justify-center rounded-full bg-accent text-white shadow-[0_12px_30px_-6px_rgba(132,204,22,0.6)]"
            >
              <motion.span
                className="absolute inset-0 rounded-full border-2 border-accent/50"
                animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut' }}
              />
              {picking ? <Loader2 size={34} className="animate-spin" /> : <Camera size={34} />}
            </motion.button>
            <motion.span
              variants={item}
              className="absolute -inset-3 -z-10 rounded-[3rem] bg-accent/10 blur-2xl"
            />
          </motion.div>

          <motion.button
            variants={item}
            onClick={() => void handlePick(false)}
            className="mx-auto mt-4 flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400"
          >
            <ImagePlus size={16} aria-hidden="true" /> lub wybierz z galerii
          </motion.button>
        </motion.div>
      )}

      {/* Podgląd zdjęcia */}
      {image && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden rounded-2xl"
        >
          <img src={image.dataUrl} alt="Zdjęcie posiłku do analizy" className="aspect-video w-full object-cover" />
          <motion.button
            onClick={() => setImage(null)}
            aria-label="Usuń zdjęcie"
            whileTap={{ scale: 0.85 }}
            className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white"
          >
            <X size={16} />
          </motion.button>
        </motion.div>
      )}

      {/* Pole opisu */}
      <motion.div
        className="card mt-3 p-3"
        initial={hasActivity ? { opacity: 0, y: 10 } : false}
        animate={{ opacity: 1, y: 0 }}
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="np. Owsianka z bananem, orzechami i miodem, 350 g…"
          rows={3}
          className="w-full resize-none bg-transparent text-sm outline-none dark:text-slate-100"
        />
        <div className="mt-2 flex gap-2">
          <motion.button
            onClick={() => void handlePick(true)}
            disabled={picking}
            aria-label="Zrób zdjęcie kamerą"
            whileTap={{ scale: 0.9 }}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200"
          >
            <Camera size={17} aria-hidden="true" />
          </motion.button>
          <motion.button
            onClick={() => void handlePick(false)}
            disabled={picking}
            aria-label="Wybierz z galerii"
            whileTap={{ scale: 0.9 }}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200"
          >
            <ImagePlus size={17} aria-hidden="true" />
          </motion.button>
          <Button className="flex-1" onClick={() => void runAnalysis()} disabled={thinking || picking}>
            {thinking ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} aria-hidden="true" />}
            {thinking ? 'Analizuję…' : 'Analizuj posiłek'}
          </Button>
        </div>
      </motion.div>

      {lastError && <p className="mt-2 text-xs text-rose-500">{lastError}</p>}

      {/* Wynik */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
          <MealAnalysisCard
            name={result.name}
            calories={result.calories}
            macros={{ protein: result.protein, carbs: result.carbs, fats: result.fats }}
            notes={result.notes}
            onSave={() => void saveResult()}
            onDiscard={() => setResult(null)}
          />
        </motion.div>
      )}
    </section>
  );
}