// ============================================================================
// openFoodFacts.ts — integracja z Open Food Facts API.
// Pobieranie wartości odżywczych (BWT) na podstawie kodu EAN.
// Endpoint: https://world.openfoodfacts.org/api/v2/product/{barcode}.json
// ============================================================================

import type { AppError, ProductInfo } from '../types';

const OFF_BASE = 'https://world.openfoodfacts.org/api/v2/product';

/** Mapowanie surowych bajtów z API na naszą strukturę makro. */
interface OffNutriments {
  'energy-kcal_100g'?: number;
  'proteins_100g'?: number;
  'carbohydrates_100g'?: number;
  'fat_100g'?: number;
  'fiber_100g'?: number;
}

interface OffProductRaw {
  product: {
    product_name?: string;
    brands?: string;
    nutriments?: OffNutriments;
  } | null;
  status?: number;
  status_verbose?: string;
}

/**
 * Pobranie danych o produkcie po kodzie EAN.
 * Zwraca uporządkowany `ProductInfo` albo rzuca ujednolicony `AppError`.
 */
export async function fetchProductByEan(ean: string): Promise<ProductInfo> {
  const cleaned = ean.replace(/\D/g, '');
  if (cleaned.length === 0) {
    throw buildError('NOT_FOUND', 'Podaj poprawny kod EAN.');
  }

  let res: Response;
  try {
    res = await fetch(`${OFF_BASE}/${cleaned}.json`, {
      headers: { Accept: 'application/json' },
    });
  } catch {
    throw buildError('NETWORK', 'Brak połączenia z internetem. Sprawdź sieć i spróbuj ponownie.');
  }

  if (!res.ok) {
    throw buildError('NOT_FOUND', `Open Food Facts nie odpowiedział poprawnie (${res.status}).`);
  }

  let data: OffProductRaw;
  try {
    data = (await res.json()) as OffProductRaw;
  } catch {
    throw buildError('PARSE', 'Nie udało się odczytać odpowiedzi z Open Food Facts.');
  }

  // Brak produktu w bazie (status 0 / brak produktu).
  if (!data || data.product === null || data.product === undefined) {
    return {
      ean: cleaned,
      productName: '',
      caloriesPer100g: 0,
      macrosPer100g: { protein: 0, carbs: 0, fats: 0 },
      found: false,
    };
  }

  const n = data.product.nutriments ?? {};
  const name = data.product.product_name?.trim() || 'Produkt bez nazwy';
  const calories = n['energy-kcal_100g'] ?? 0;

  return {
    ean: cleaned,
    productName: name,
    brands: data.product.brands,
    caloriesPer100g: Math.round(calories),
    macrosPer100g: {
      protein: round1(n['proteins_100g'] ?? 0),
      carbs: round1(n['carbohydrates_100g'] ?? 0),
      fats: round1(n['fat_100g'] ?? 0),
    },
    found: true,
  };
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

function buildError(code: AppError['code'], message: string): AppError {
  return { code, message };
}