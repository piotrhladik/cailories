// ============================================================================
// Helpery formatowania liczb i dat (polskie formaty).
// ============================================================================

/** Formatowanie liczby z separatorem tysięcznym. */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 1 }).format(value);
}

/** Formatowanie liczby całkowitej. */
export function formatInt(value: number): string {
  return new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 }).format(Math.round(value));
}

/** Formatowanie wagi z jednostką g. */
export function formatGrams(value: number): string {
  return `${formatNumber(value)} g`;
}

/** Formatowanie daty lokalnej do czytelnego zapisu po polsku. */
export function formatDateLong(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  return d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Formatowanie czasu (godzina:minuta) na podstawie ISO. */
export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
}

/** Bezpieczne klonowanie obiektu JSON (sanityzacja danych). */
export function safeClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Prosta weryfikacja poprawności kodu EAN-13 / EAN-8 (13 lub 8 cyfr). */
export function isValidEan(value: string): boolean {
  const cleaned = value.replace(/\D/g, '');
  return cleaned.length === 13 || cleaned.length === 8;
}