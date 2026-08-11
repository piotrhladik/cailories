// ============================================================================
// features/ai-chat/AiChat.tsx — ekran startowy aplikacji (podstawa projektu).
// Czat + analiza multimodalna posiłku (opis i/lub zdjęcie). Na przywitaniu
// duzy przycisk aparatu (FAB). Stan trzymany w useChatStore, więc nie gubi
// wpisanego tekstu ani zdjęcia przy przełączaniu zakładek.
// D1: sekcja "Propozycje przepisów" — karty dań dopasowane do celów użytkownika.
// D2: przełącznik trybu Czat / Coach — osobisty trener żywienia (tekst, nie JSON).
// ============================================================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Camera,
  ChefHat,
  Dumbbell,
  ImagePlus,
  Loader2,
  MessageCircle,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useUserStore } from '../../store/useUserStore';
import { useMealsStore, dateKey } from '../../store/useMealsStore';
import { useToastStore } from '../../store/useToastStore';
import { useChatStore } from '../../store/useChatStore';
import { analyzeMeal, looksLikeApiKey, sendCoachMessage, suggestRecipes, COACH_SYSTEM } from '../../services/geminiApi';
import type { RecipeGoalsContext } from '../../services/geminiApi';
import { useImagePicker } from '../../hooks/useImagePicker';
import { Button } from '../../components/ui/Button';
import { MealAnalysisCard } from '../../components/ui/MealAnalysisCard';
import { prepareInterstitial, showInterstitial } from '../../services/admobService';
import type { Meal, RecipeSuggestion, UserProfile } from '../../types';

/** Tryb pracy ekranu czatu (D2). */
type ChatMode = 'chat' | 'coach';

/** Definicje trybów dla przełącznika. */
const CHAT_MODES: Array<{ key: ChatMode; label: string; icon: LucideIcon }> = [
  { key: 'chat', label: 'Czat', icon: MessageCircle },
  { key: 'coach', label: 'Coach', icon: Dumbbell },
];

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

/** Animacje kart przepisów (D1) — premium stagger. */
const recipesContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
};
const recipesItem = {
  hidden: { opacity: 0, y: 18, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 320, damping: 26 },
  },
};

/** Poprawna polska odmiana: 1 posiłek / 2 posiłki / 5 posiłków. */
function mealCountLabel(count: number): string {
  if (count === 1) return '1 posiłek';
  const teens = count % 100;
  if (teens >= 12 && teens <= 14) return `${count} posiłków`;
  const last = count % 10;
  if (last >= 2 && last <= 4) return `${count} posiłki`;
  return `${count} posiłków`;
}

/** Budowa celów dla suggestRecipes: custom > BMR (D1). */
function buildRecipeGoals(profile: UserProfile): RecipeGoalsContext {
  return {
    calories: profile.customCalories ?? profile.dailyCaloriesGoal,
    protein: profile.customProtein ?? profile.macrosGoal.protein,
    carbs: profile.customCarbs ?? profile.macrosGoal.carbs,
    fats: profile.customFats ?? profile.macrosGoal.fats,
    mealsPerDay: 3,
  };
}

/** Kontekst dla trybu Coach: ostatnie 7 dni z dziennika + cele (D2). */
function buildCoachContext(mealsByDay: Record<string, Meal[]>, profile: UserProfile): string {
  const days: string[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    days.push(dateKey(d));
  }

  const lines: string[] = [];
  let totalKcal = 0;
  let activeDays = 0;
  for (const day of days) {
    const meals = mealsByDay[day] ?? [];
    if (meals.length === 0) continue;
    const kcal = meals.reduce((sum, m) => sum + m.calories, 0);
    const protein = meals.reduce((sum, m) => sum + m.macros.protein, 0);
    totalKcal += kcal;
    activeDays += 1;
    const names = meals.slice(0, 4).map((m) => m.name).join(', ');
    lines.push(`- ${day}: ${kcal} kcal, B ${Math.round(protein)} g (${mealCountLabel(meals.length)}) — ${names}`);
  }

  if (activeDays === 0) {
    return 'Brak zapisanych posiłków w ostatnich 7 dniach.';
  }

  const avg = Math.round(totalKcal / activeDays);
  const goals =
    `Cele dzienne: ${profile.customCalories ?? profile.dailyCaloriesGoal} kcal, ` +
    `B ${profile.customProtein ?? profile.macrosGoal.protein} g, ` +
    `W ${profile.customCarbs ?? profile.macrosGoal.carbs} g, ` +
    `T ${profile.customFats ?? profile.macrosGoal.fats} g.`;
  return `Dziennik (ostatnie 7 dni):\n${lines.join('\n')}\nŚrednio ${avg} kcal dziennie.\n${goals}`;
}

export function AiChat(): JSX.Element {
  const apiKey = useUserStore((s) => s.apiKey);
  const model = useUserStore((s) => s.selectedModel);
  const profile = useUserStore((s) => s.profile);
  const addMeal = useMealsStore((s) => s.addMeal);
  const mealsByDay = useMealsStore((s) => s.mealsByDay);
  const show = useToastStore((s) => s.show);

  const text = useChatStore((s) => s.text);
  const image = useChatStore((s) => s.image);
  const result = useChatStore((s) => s.result);
  const thinking = useChatStore((s) => s.thinking);
  const { setText, setImage, setResult, setThinking, clear } = useChatStore.getState();
  const { picking, pick, resetError, lastError } = useImagePicker();

  const [mode, setMode] = useState<ChatMode>('chat');
  const [proposals, setProposals] = useState<RecipeSuggestion[]>([]);
  const [proposing, setProposing] = useState(false);
  const [coachReply, setCoachReply] = useState<string | null>(null);

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
        system: 'Jeśli to jest powitanie, odpowiedz naturalnie. Jeśli nie, przeanalizuj posiłek.',
      });
      setResult(analysis);
    } catch (err) {
      const e = err as { code?: string; message?: string };
      // Powitanie / rozmowa — naturalna odpowiedź (bez JSON) pokazywana jako informacja, nie błąd.
      if (e.code === 'CHAT' && e.message) {
        show(e.message, 'info');
      } else {
        show(e.message ?? 'Nie udało się przeanalizować posiłku.', 'error');
      }
    } finally {
      setThinking(false);
    }
  };

  /** Tryb Coach (D2): wiadomość tekstowa z kontekstem ostatnich 7 dni. */
  const runCoach = async (): Promise<void> => {
    const prompt = text.trim();
    if (!apiKey) {
      show('Ustaw klucz API Gemini w Ustawieniach, aby korzystać z trenera.', 'error');
      return;
    }
    if (!looksLikeApiKey(apiKey)) {
      show('Klucz API wygląda na nieprawidłowy — sprawdź go w Ustawieniach.', 'error');
      return;
    }
    if (!prompt) {
      show('Napisz, o co chcesz zapytać trenera.', 'error');
      return;
    }

    const context = buildCoachContext(mealsByDay, profile);
    setThinking(true);
    setCoachReply(null);
    try {
      const reply = await sendCoachMessage(apiKey, model, {
        message: prompt,
        system: `${COACH_SYSTEM}\n\nKontekst (ostatnie 7 dni):\n${context}`,
      });
      setCoachReply(reply);
    } catch (err) {
      const e = err as { message?: string };
      show(e.message ?? 'Nie udało się skontaktować z trenerem.', 'error');
    } finally {
      setThinking(false);
    }
  };

  /** D1: generowanie propozycji przepisów dopasowanych do celów użytkownika. */
  const generateProposals = async (): Promise<void> => {
    if (!apiKey) {
      show('Ustaw klucz API Gemini w Ustawieniach.', 'error');
      return;
    }
    if (!looksLikeApiKey(apiKey)) {
      show('Klucz API wygląda na nieprawidłowy — sprawdź go w Ustawieniach.', 'error');
      return;
    }
    if (!text.trim() && !image) {
      show('Dodaj składniki, preferencje lub zdjęcie lodówki.', 'error');
      return;
    }

    setProposing(true);
    setProposals([]);
    try {
      const result = await suggestRecipes(apiKey, model, {
        ingredients: text.trim(),
        imageBase64: image?.base64,
        request: 'Dopasuj dania do moich dziennych celów.',
        goals: buildRecipeGoals(profile),
      });
      setProposals(result);
      if (result.length === 0) {
        show('Nie udało się wygenerować propozycji. Spróbuj inaczej opisać składniki.', 'error');
      }
    } catch (err) {
      const msg = (err as { message?: string }).message ?? 'Nie udało się wygenerować pomysłów.';
      show(msg, 'error');
    } finally {
      setProposing(false);
    }
  };

  /** Dodanie propozycji przepisu do dziennika (D1). */
  const saveRecipe = async (recipe: RecipeSuggestion): Promise<void> => {
    addMeal({
      name: recipe.name,
      calories: recipe.calories,
      macros: { protein: recipe.protein, carbs: recipe.carbs, fats: recipe.fats },
      source: 'fridge',
    });
    show(`Dodano: ${recipe.name} ✔`, 'success');
    await prepareInterstitial();
    await showInterstitial();
  };

  /** Przełączenie trybu — czyści wyniki poprzedniego trybu (D2). */
  const switchMode = (next: ChatMode): void => {
    if (next === mode) return;
    setMode(next);
    setResult(null);
    setCoachReply(null);
    setProposals([]);
    if (next === 'coach') setImage(null);
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

  const hasActivity =
    text.trim().length > 0 || image !== null || result !== null || coachReply !== null || proposals.length > 0;

  return (
    <section className="flex min-h-full flex-col p-4">
      {/* Przełącznik trybu Czat / Coach (D2) */}
      <div className="mb-3 flex rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
        {CHAT_MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => switchMode(m.key)}
            aria-pressed={mode === m.key}
            className="relative flex-1 rounded-xl py-2 text-sm font-semibold"
          >
            {mode === m.key && (
              <motion.span
                layoutId="chat-mode-pill"
                className="absolute inset-0 rounded-xl bg-white shadow-sm dark:bg-slate-700"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <span
              className={`relative z-10 flex items-center justify-center gap-1.5 ${
                mode === m.key ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <m.icon size={15} aria-hidden="true" />
              {m.label}
            </span>
          </button>
        ))}
      </div>

      {/* Hero / powitanie — tylko tryb Czat */}
      {!hasActivity && mode === 'chat' && (
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

      {/* Intro trybu Coach (D2) */}
      {!hasActivity && mode === 'coach' && (
        <motion.div variants={container} initial="hidden" animate="visible" className="mb-2 flex flex-1 flex-col justify-center py-6 text-center">
          <motion.span
            variants={item}
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-accent/15 text-accent"
          >
            <Dumbbell size={30} aria-hidden="true" />
          </motion.span>
          <motion.h2 variants={item} className="mt-4 text-2xl font-extrabold">
            Twój trener 🏋️
          </motion.h2>
          <motion.p variants={item} className="mx-auto mt-2 max-w-xs text-sm text-slate-500 dark:text-slate-400">
            Przeanalizuję Twoje posiłki z ostatnich 7 dni, porównam z celami i dam konkretne wskazówki na najbliższe dni.
          </motion.p>
        </motion.div>
      )}

      {/* Podgląd zdjęcia — tylko tryb Czat */}
      {mode === 'chat' && image && (
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
          placeholder={
            mode === 'coach'
              ? 'np. Co mam dziś zjeść, żeby trafić w białko? Jak poprawić bilans po wczorajszym dniu?'
              : 'np. Owsianka z bananem, orzechami i miodem, 350 g…'
          }
          rows={3}
          className="w-full resize-none bg-transparent text-sm outline-none dark:text-slate-100"
        />
        <div className="mt-2 flex gap-2">
          {mode === 'chat' && (
            <>
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
            </>
          )}
          <Button
            className="flex-1"
            onClick={() => void (mode === 'coach' ? runCoach() : runAnalysis())}
            disabled={thinking || picking}
          >
            {thinking ? (
              <Loader2 size={17} className="animate-spin" />
            ) : mode === 'coach' ? (
              <Dumbbell size={17} aria-hidden="true" />
            ) : (
              <Send size={17} aria-hidden="true" />
            )}
            {thinking
              ? mode === 'coach'
                ? 'Myślę…'
                : 'Analizuję…'
              : mode === 'coach'
                ? 'Zapytaj trenera'
                : 'Analizuj posiłek'}
          </Button>
        </div>

        {/* D1: przycisk propozycji przepisów (tylko tryb Czat) */}
        {mode === 'chat' && (
          <motion.button
            onClick={() => void generateProposals()}
            disabled={proposing || thinking}
            whileTap={{ scale: 0.97 }}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-accent/30 bg-accent/10 py-2.5 text-sm font-semibold text-accent-dark dark:text-accent"
          >
            {proposing ? <Loader2 size={16} className="animate-spin" /> : <ChefHat size={16} aria-hidden="true" />}
            {proposing ? 'Szukam przepisów…' : 'Propozycje przepisów'}
          </motion.button>
        )}
      </motion.div>

      {lastError && <p className="mt-2 text-xs text-rose-500">{lastError}</p>}

      {/* D1: karty propozycji przepisów — premium stagger */}
      {proposals.length > 0 && (
        <motion.div variants={recipesContainer} initial="hidden" animate="visible" className="mt-3 space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Propozycje ({proposals.length})
          </h3>
          {proposals.map((r, idx) => (
            <motion.div key={`${r.name}-${idx}`} variants={recipesItem}>
              <MealAnalysisCard
                name={r.name}
                calories={r.calories}
                macros={{ protein: r.protein, carbs: r.carbs, fats: r.fats }}
                instructions={r.instructions}
                notes={r.usedIngredients.length ? `Składniki: ${r.usedIngredients.join(', ')}` : undefined}
                saveLabel="+ Dodaj do dziennika"
                onSave={() => void saveRecipe(r)}
                onDiscard={() => setProposals(proposals.filter((_, i) => i !== idx))}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* D2: odpowiedź trenera (tekst, nie JSON) */}
      {coachReply && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card mt-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-bold">
              <Dumbbell size={16} className="text-accent" aria-hidden="true" /> Twój trener
            </h3>
            <button
              onClick={() => setCoachReply(null)}
              aria-label="Zamknij odpowiedź trenera"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300"
            >
              <X size={15} />
            </button>
          </div>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {coachReply}
          </p>
        </motion.div>
      )}

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
