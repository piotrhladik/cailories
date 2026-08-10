// ============================================================================
// geminiApi.ts — klient Google Gemini REST API (bez zewnętrznych SDK).
// Klucz API przekazywany jest wyłącznie zapytaniem do generativelanguage.googleapis.com
// bezpośrednio z urządzenia — nigdy nie trafia na serwer pośredniczący.
//
// Wymagania:
//  - Walidacja klucza i dynamiczne pobieranie listy modeli.
//  - Analiza posiłku (tekst i/lub obraz) z wymuszonym wyjściem JSON.
//  - Tryb lodówki: 2-3 propozycje potraw z makro.
//  - Mapowanie błędów API na czytelne komunikaty UI (AppError).
// ============================================================================

import type {
  AppError,
  GeminiModel,
  MealAnalysis,
  RecipeSuggestion,
} from '../types';

const BASE = 'https://generativelanguage.googleapis.com/v1beta';

/** Sygnatura pomocnicza zapisu używanych struktur. */
interface SystemPrompts {
  global: string;
}

const PROMTS: SystemPrompts = {
  global:
    'Jesteś pomocnikiem aplikacji dietetycznej NutriScan AI. Zawsze musisz odpowiadać wyłącznie ' +
    'poprawnym obiektem JSON w dokładnie takiej strukturze, jaką poda użytkownik. ' +
    'Pomagasz w szacowaniu kaloryczności i makroskładników (Białko, Węglowodany, Tłuszcze). ' +
    'Nie udzielasz porad medycznych.',
};

/** Tworzenie standardowej struktury "parts" dla treści (tekst i/lub obraz). */
function buildParts(text: string, imageBase64?: string): unknown[] {
  const parts: unknown[] = [];
  if (text && text.trim()) {
    parts.push({ text: text.trim() });
  }
  if (imageBase64) {
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: imageBase64,
      },
    });
  }
  return parts;
}

/** Wspólna funkcja wywołania `:generateContent`. */
async function generateContent(
  apiKey: string,
  model: string,
  content: {
    text?: string;
    imageBase64?: string;
    system?: string;
    responseSchema?: Record<string, unknown>;
    temperature?: number;
    maxTokens?: number;
  },
): Promise<string> {
  const schema = content.responseSchema ?? undefined;

  urlCheck(apiKey, model);

  const body: Record<string, unknown> = {
    contents: [
      {
        role: 'user',
        parts: buildParts(content.text ?? '', content.imageBase64),
      },
    ],
  };

  if (content.system) {
    body.systemInstruction = { parts: [{ text: content.system }] };
  }

  const generationConfig: Record<string, unknown> = {
    temperature: content.temperature ?? 0.3,
    maxOutputTokens: content.maxTokens ?? 2048,
    responseMimeType: schema ? 'application/json' : 'text/plain',
  };
  if (schema) {
    generationConfig.responseSchema = schema;
  }
  body.generationConfig = generationConfig;

  let res: Response;
  try {
    res = await fetch(`${BASE}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw buildError('NETWORK', 'Brak połączenia z internetem. Sprawdź sieć i spróbuj ponownie.');
  }

  if (res.status === 400 || res.status === 403) {
    throw buildError('API_KEY_INVALID', 'Nieprawidłowy klucz API Gemini. Sprawdź go w Ustawieniach.');
  }
  if (res.status === 429) {
    throw buildError('RATE_LIMIT', 'Przekroczono limit zapytań do Gemini. Odczekaj chwilę i spróbuj ponownie.');
  }
  if (!res.ok) {
    const err = await readErrorBody(res);
    throw buildError('UNKNOWN', `Błąd Gemini API (${res.status}). ${err}`);
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw buildError('PARSE', 'Nie udało się odczytać odpowiedzi z Gemini.');
  }

  const text = extractText(json);
  if (!text || text.trim().length === 0) {
    throw buildError('PARSE', 'Gemini nie zwrócił treści odpowiedzi.');
  }
  return text.trim();
}

/** Zabezpieczenie: blokada przy braku klucza/modelu (nie wysyłaj zapytania). */
function urlCheck(apiKey: string, model: string): void {
  if (!apiKey || !apiKey.trim()) {
    throw buildError('API_KEY_INVALID', 'Najpierw dodaj klucz API Gemini w Ustawieniach.');
  }
  if (!model) {
    throw buildError('API_KEY_INVALID', 'Wybierz model Gemini w Ustawieniach.');
  }
}

/** Ekstrakcja tekstu odpowiedzi z candidates[].content.parts[]. */
function extractText(json: unknown): string {
  if (!json || typeof json !== 'object') return '';
  const obj = json as Record<string, unknown>;
  const candidates = obj.candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) return '';
  const parts = (candidates[0] as Record<string, unknown>).content as
    | { parts?: Array<{ text?: string }> }
    | undefined;
  const first = parts?.parts?.[0];
  return first?.text ?? '';
}

/** Próba odczytu treści błędu z odpowiedzi API. */
async function readErrorBody(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: { message?: string } };
    return data.error?.message ?? '';
  } catch {
    return '';
  }
}

function buildError(code: AppError['code'], message: string): AppError {
  return { code, message };
}

/**
 * Walidacja klucza API + pobranie listy dostępnych modeli obsługujących
 * generowanie treści. Zwraca przyjazną listę modeli.
 */
export async function fetchAvailableModels(apiKey: string): Promise<GeminiModel[]> {
  urlCheck(apiKey, 'invalid-check');
  let res: Response;
  try {
    res = await fetch(`${BASE}/models?key=${encodeURIComponent(apiKey)}&pageSize=200`, {
      headers: { Accept: 'application/json' },
    });
  } catch {
    throw buildError('NETWORK', 'Brak połączenia z internetem podczas walidacji klucza.');
  }

  if (res.status === 400 || res.status === 403 || res.status === 401) {
    throw buildError('API_KEY_INVALID', 'Nieprawidłowy klucz API — serwer odmówił dostępu.');
  }
  if (res.status === 429) {
    throw buildError('RATE_LIMIT', 'Zbyt wiele zapytań w krótkim czasie. Odczekaj chwilę.');
  }
  if (!res.ok) {
    throw buildError('UNKNOWN', `Nie udało się pobrać modeli (${res.status}).`);
  }

  const data = (await res.json()) as { models?: Array<{ name?: string; displayName?: string; supportedGenerationMethods?: string[] }> };
  const models: GeminiModel[] = (data.models ?? [])
    .filter(
      (m) => m.supportedGenerationMethods?.includes('generateContent') && m.name?.startsWith('models/gemini'),
    )
    .map((m) => ({
      name: (m.name ?? '').replace(/^models\//, ''),
      displayName: m.displayName ?? (m.name ?? '').replace(/^models\//, ''),
      supported: true,
    }))
    // Sortowanie alfabetyczne dla stabilności listy.
    .sort((a, b) => a.name.localeCompare(b.name));

  return models;
}

/**
 * Lekkie sprawdzenie "formatu" klucza: niepusty, bez spacji, rozsądna długość.
 * NIE służy do odrzucania poprawnych kluczy — prawdziwą weryfikacją jest
 * wywołanie API Gemini. Formaty kluczy bywają różne, więc używamy luźnych zasad.
 */
export function looksLikeApiKey(key: string): boolean {
  const trimmed = key.trim();
  if (trimmed.length < 20 || trimmed.length > 500) return false;
  return /^[A-Za-z0-9_\-.\+]+$/.test(trimmed);
}

/** Wymagany schemat dla analizy pojedynczego posiłku. */
const MEAL_SCHEMA: Record<string, unknown> = {
  type: 'OBJECT',
  properties: {
    name: { type: 'STRING' },
    calories: { type: 'NUMBER' },
    protein: { type: 'NUMBER' },
    carbs: { type: 'NUMBER' },
    fats: { type: 'NUMBER' },
    notes: { type: 'STRING' },
  },
  required: ['name', 'calories', 'protein', 'carbs', 'fats'],
};

/** Wymagany schemat dla propozycji potraw trybu lodówki. */
const RECIPES_SCHEMA: Record<string, unknown> = {
  type: 'ARRAY',
  items: {
    type: 'OBJECT',
    properties: {
      name: { type: 'STRING' },
      calories: { type: 'NUMBER' },
      protein: { type: 'NUMBER' },
      carbs: { type: 'NUMBER' },
      fats: { type: 'NUMBER' },
      instructions: { type: 'STRING' },
      usedIngredients: { type: 'ARRAY', items: { type: 'STRING' } },
      tags: { type: 'ARRAY', items: { type: 'STRING' } },
    },
    required: ['name', 'calories', 'protein', 'carbs', 'fats', 'instructions', 'usedIngredients'],
  },
};

/**
 * Analiza posiłku (tekst i/lub obraz) i zwrot struktury MealAnalysis.
 */
export async function analyzeMeal(
  apiKey: string,
  model: string,
  input: { text?: string; imageBase64?: string; system?: string },
): Promise<MealAnalysis> {
  if (!input.imageBase64 && !input.text?.trim()) {
    throw buildError('PARSE', 'Dodaj opis lub zdjęcie posiłku do analizy.');
  }

  const text = input.text?.trim()
    ? input.text.trim()
    : 'Oszacuj wartości odżywcze tego posiłku na podstawie zdjęcia.';

  const raw = await generateContent(apiKey, model, {
    text,
    imageBase64: input.imageBase64,
    system:
      input.system ??
      PROMTS.global +
        '\nOszacuj kaloryczność i makroskładniki. Podaj życzliwy, zwięzły komentarz w polu "notes".',
    responseSchema: MEAL_SCHEMA,
  });

  return parseObject<MealAnalysis>(raw);
}

/**
 * Generator 2-3 propozycji potraw na podstawie zawartości "lodówki".
 * Można podać składniki tekstowo oraz/lub zdjęcie zawartości lodówki.
 */
export async function suggestRecipes(
  apiKey: string,
  model: string,
  input: { ingredients?: string; imageBase64?: string; request?: string },
): Promise<RecipeSuggestion[]> {
  if (!input.ingredients?.trim() && !input.imageBase64) {
    throw buildError('PARSE', 'Dodaj składniki lub zdjęcie lodówki.');

  }

  const text = [
    input.ingredients?.trim() ? `Składniki: ${input.ingredients.trim()}.` : '',
    input.request?.trim() ?? '',
    'Zaproponuj 2-3 proste dania, które mogę przyrządzić głównie z tych składników. ' +
      'Uwzględnij instrukcję przygotowania i szacunkowe wartości odżywcze. ' +
      'Zważ na użycie tylko podanych składników.',
  ]
    .filter(Boolean)
    .join('\n');

  const raw = await generateContent(apiKey, model, {
    text,
    imageBase64: input.imageBase64,
    system:
      PROMTS.global +
      '\nWygeneruj 2-3 propozycje dań. Odpowiadaj tablicą JSON, zachowaj wszystkie pola.',
    responseSchema: RECIPES_SCHEMA,
  });

  const parsed = parseArray<RecipeSuggestion>(raw);
  // Ustal maksymalnie 3 propozycje.
  return parsed.slice(0, 3);
}

/** Bezpieczne parsowanie obiektu JSON z odpowiedzi. */
function parseObject<T>(raw: string): T {
  try {
    const value = JSON.parse(raw) as T;
    if (!value || typeof value !== 'object') {
      throw new Error('Nieoczekiwany typ odpowiedzi.');
    }
    return value;
  } catch {
    throw buildError('PARSE', 'Gemini zwrócił nieprawidłową odpowiedź JSON. Spróbuj ponownie.');
  }
}

/** Bezpieczne parsowanie tablicy JSON z odpowiedzi. */
function parseArray<T>(raw: string): T[] {
  try {
    const value = JSON.parse(raw);
    if (!Array.isArray(value)) {
      // Tolerancja: model czasem zwraca obiekt z kluczem "recipes".
      if (value && typeof value === 'object' && Array.isArray((value as Record<string, unknown>).recipes)) {
        return (value as Record<string, unknown>).recipes as T[];
      }
      throw new Error('Odpowiedź nie jest tablicą.');
    }
    return value as T[];
  } catch {
    throw buildError('PARSE', 'Gemini zwrócił nieprawidłową listę dań. Spróbuj ponownie.');
  }
}