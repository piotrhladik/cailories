// ============================================================================
// Definicje typów TypeScript — wspólne modele danych aplikacji NutriScan AI.
// Wszystkie typy obowiązują w całym projekcie (strict mode, zakaz `any`).
// ============================================================================

/** Makroskładniki: Białko (g), Węglowodany (g), Tłuszcze (g). */
export interface Macro {
  /** Białko w gramach */
  protein: number;
  /** Węglowodany w gramach */
  carbs: number;
  /** Tłuszcze w gramach */
  fats: number;
}

/** Źródło dodania posiłku do dziennika. */
export type MealSource = 'scan' | 'ai-chat' | 'fridge' | 'manual';

/** Pojedynczy posiłek dodany do dziennika. */
export interface Meal {
  /** Unikalny identyfikator posiłku (UUID). */
  id: string;
  /** Nazwa posiłku/dania. */
  name: string;
  /** Wartość energetyczna w kcal. */
  calories: number;
  /** Makroskładniki posiłku. */
  macros: Macro;
  /** Skąd pochodzi wpis. */
  source: MealSource;
  /** Opcjonalne zdjęcie posiłku (Data URL). */
  image?: string;
  /** Znacznik czasu utworzenia (ISO 8601). */
  createdAt: string;
  /** Sugerowany posiłek (np. z trybu lodówki) — nie zaakceptowany jeszcze. */
}

/** Wynik analizy posiłku zwracany przez Gemini. */
export interface MealAnalysis extends Macro {
  /** Proponowana nazwa produktu/dania. */
  name: string;
  /** Kalorie w kcal. */
  calories: number;
  /** Krótki komentarz/model uzasadnienia (opcjonalne). */
  notes?: string;
}

/** Propozycja posiłku w Trybie Lodówki. */
export interface RecipeSuggestion extends Macro {
  /** Nazwa proponowanego dania. */
  name: string;
  /** Kalorie w kcal. */
  calories: number;
  /** Krótki przepis / opis przygotowania. */
  instructions: string;
  /** Składniki użyte z "lodówki". */
  usedIngredients: string[];
  /** Ewentualne informacje extra (np. alergie). */
  tags?: string[];
}

/** Podsumowanie dzienne spożycia. */
export interface DailySummary {
  /** Data w formacie YYYY-MM-DD. */
  date: string;
  /** Łączne kalorie. */
  calories: number;
  /** Łączne makroskładniki. */
  macros: Macro;
  /** Liczba posiłków. */
  mealCount: number;
}

/** Profil użytkownika użyty do wyliczania BMR/TDEE oraz celów dziennych. */
export type Gender = 'male' | 'female';

export interface UserProfile {
  /** Cel kaloryczny = TDEE (kcal/dzień). */
  dailyCaloriesGoal: number;
  /** Cele makroskładników (g). */
  macrosGoal: Macro;
  /** Wzrost użytkownika (cm). */
  heightCm: number;
  /** Masa ciała (kg). */
  weightKg: number;
  /** Wiek (lata). */
  age: number;
  /** Płeć biologiczna (do wzorów Mifflin-St Jeor). */
  gender: Gender;
  /** Współczynnik aktywności x1.2 - x1.9. */
  activityLevel: number;
}

/** Model Gemini dostępny dla użytkownika. */
export interface GeminiModel {
  /** Identyfikator modelu do zapytań zapisu (np. "gemini-2.5-flash"). */
  name: string;
  /** Wyświetlana nazwa (np. "Gemini 2.5 Flash"). */
  displayName: string;
  /** Czy model obsługuje generowanie treści. */
  supported?: boolean;
}

/** Status walidacji klucza API. */
export type ApiKeyValidationStatus = 'idle' | 'checking' | 'valid' | 'invalid';

/** Stan ekranu Ustawień dla klucza API. */
export interface ApiKeyState {
  status: ApiKeyValidationStatus;
  message?: string;
}

/** Typowy status operacji asynchronicznej w UI. */
export type AsyncState = 'idle' | 'loading' | 'success' | 'error';

/** Kategorie nawigacji dolnej. */
export type TabKey = 'dashboard' | 'fridge' | 'scanner' | 'chat' | 'settings';

/** Format danych produktu z Open Food Facts, który nam potrzebny. */
export interface ProductInfo {
  /** Kod EAN (barcode). */
  ean: string;
  /** Nazwa produktu. */
  productName: string;
  /** Kalorie na 100 g w kcal. */
  caloriesPer100g: number;
  /** Makro na 100 g. */
  macrosPer100g: Macro;
  /** Wielkość porcji sugerowana (g) lub 1 szt. */
  portionSize?: number;
  /** Logo/brand producenta. */
  brands?: string;
  /** Czy znaleziono produkt. */
  found: boolean;
}

/** Ujednolicony błąd aplikacji z kodem (do mapowania na komunikaty UI). */
export interface AppError {
  /** Kod błędu — czytelny dla UI. */
  code: 'API_KEY_INVALID' | 'RATE_LIMIT' | 'NETWORK' | 'NOT_FOUND' | 'PARSE' | 'UNKNOWN';
  /** Komunikat po polsku dla użytkownika. */
  message: string;
}