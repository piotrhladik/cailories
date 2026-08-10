// ============================================================================
// features/fridge-mode/FridgeMode.tsx — Tryb Lodówki.
// Użytkownik podaje składniki (tekst) i/lub zdjęcie lodówki → AI generuje
// 2-3 propozycje dań z makro i przyciskiem "Dodaj do dziennika" (1-click).
// ============================================================================

import { useState } from 'react';
import { Camera, ImagePlus, Loader2, Refrigerator, Sparkles, X } from 'lucide-react';
import { useUserStore } from '../../store/useUserStore';
import { useMealsStore } from '../../store/useMealsStore';
import { useToastStore } from '../../store/useToastStore';
import { suggestRecipes, looksLikeApiKey } from '../../services/geminiApi';
import { useImagePicker } from '../../hooks/useImagePicker';
import { Button } from '../../components/ui/Button';
import { MealAnalysisCard } from '../../components/ui/MealAnalysisCard';
import { prepareInterstitial, showInterstitial } from '../../services/admobService';
import type { RecipeSuggestion } from '../../types';

export function FridgeMode(): JSX.Element {
  const apiKey = useUserStore((s) => s.apiKey);
  const model = useUserStore((s) => s.selectedModel);
  const addMeal = useMealsStore((s) => s.addMeal);
  const show = useToastStore((s) => s.show);

  const { picking, pick, lastError } = useImagePicker();

  const [ingredients, setIngredients] = useState('');
  const [image, setImage] = useState<{ dataUrl: string; base64: string } | null>(null);
  const [thinking, setThinking] = useState(false);
  const [recipes, setRecipes] = useState<RecipeSuggestion[]>([]);

  const generate = async (): Promise<void> => {
    if (!apiKey) {
      show('Ustaw klucz API Gemini w Ustawieniach.', 'error');
      return;
    }
    if (!looksLikeApiKey(apiKey)) {
      show('Klucz API wygląda na nieprawidłowy — sprawdź go w Ustawieniach.', 'error');
      return;
    }
    const hasInput = ingredients.trim().length > 0 || image !== null;
    if (!hasInput) {
      show('Dodaj składniki lub zdjęcie lodówki.', 'error');
      return;
    }

    setThinking(true);
    setRecipes([]);
    try {
      const result = await suggestRecipes(apiKey, model, {
        ingredients: ingredients.trim(),
        imageBase64: image?.base64,
      });
      setRecipes(result);
      if (result.length === 0) {
        show('Nie udało się wygenerować propozycji. Spróbuj inaczej opisać składniki.', 'error');
      }
    } catch (err) {
      const msg = (err as { message?: string }).message ?? 'Nie udało się wygenerować pomysłów.';
      show(msg, 'error');
    } finally {
      setThinking(false);
    }
  };

  /** Dodanie propozycji (z trybu lodówki) do dziennika. */
  const addRecipe = async (recipe: RecipeSuggestion): Promise<void> => {
    addMeal({
      name: recipe.name,
      calories: recipe.calories,
      macros: { protein: recipe.protein, carbs: recipe.carbs, fats: recipe.fats },
      source: 'fridge',
      image: image?.dataUrl,
    });
    show(`Dodano: ${recipe.name} ✔`, 'success');
    // Monetyzacja — interstitial po dodaniu.
    await prepareInterstitial();
    await showInterstitial();
  };

  return (
    <section className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Refrigerator size={18} className="text-accent" aria-hidden="true" />
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Tryb Lodówki
        </h2>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Wypisz co masz w lodówce (lub zrób zdjęcie) — AI zaproponuje 2-3 dania z makro.
      </p>

      {image && (
        <div className="relative">
          <img src={image.dataUrl} alt="Zdjęcie lodówki" className="aspect-video w-full rounded-2xl object-cover" />
          <button
            onClick={() => setImage(null)}
            aria-label="Usuń zdjęcie"
            className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="card p-3">
        <textarea
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          placeholder="Składniki: jajka, mąka, pomidor, ser, szpinak…"
          rows={3}
          className="w-full resize-none bg-transparent text-sm outline-none dark:text-slate-100"
        />
        <div className="mt-2 flex gap-2">
          <Button variant="secondary" onClick={() => void doPick(pick, true, setImage, show)} disabled={picking} aria-label="Zrób zdjęcie lodówki">
            <Camera size={17} aria-hidden="true" />
          </Button>
          <Button variant="secondary" onClick={() => void doPick(pick, false, setImage, show)} disabled={picking} aria-label="Wybierz zdjęcie z galerii">
            <ImagePlus size={17} aria-hidden="true" />
          </Button>
          <Button className="flex-1" onClick={() => void generate()} disabled={thinking || picking}>
            {thinking ? <Loader2 size={17} className="animate-spin" /> : <Sparkles size={17} aria-hidden="true" />}
            {thinking ? 'Generuję…' : 'Generuj pomysły'}
          </Button>
        </div>
      </div>

      {lastError && <p className="text-xs text-rose-500">{lastError}</p>}

      {recipes.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Propozycje ({recipes.length})
          </h3>
          {recipes.map((r) => (
            <MealAnalysisCard
              key={r.name}
              name={r.name}
              calories={r.calories}
              macros={{ protein: r.protein, carbs: r.carbs, fats: r.fats }}
              instructions={r.instructions}
              notes={r.usedIngredients.length ? `Składniki: ${r.usedIngredients.join(', ')}` : undefined}
              saveLabel="+ Dodaj do dziennika"
              onSave={() => void addRecipe(r)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

async function doPick(
  pick: (fromCamera: boolean) => Promise<{ base64: string; dataUrl: string } | null>,
  fromCamera: boolean,
  setImage: (img: { dataUrl: string; base64: string } | null) => void,
  show: (msg: string, variant?: 'info' | 'success' | 'error') => void,
): Promise<void> {
  const img = await pick(fromCamera);
  if (img) {
    setImage(img);
  } else {
    show('Nie wybrano zdjęcia.', 'info');
  }
}