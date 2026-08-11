// ============================================================================
// progressUtils.ts — lokalne helpery dat dla ekranu Postępów.
// Klucze dat YYYY-MM-DD parsujemy JAKO CZAS LOKALNY (unikanie przesunięcia
// strefy czasowej przy `new Date('YYYY-MM-DD')`, które parsuje UTC).
// ============================================================================

/** Parsuje klucz daty YYYY-MM-DD jako datę lokalną (północ czasu lokalnego). */
export function parseDateKey(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Formatuje klucz daty: "11 sierpnia". */
export function formatDayMonth(iso: string): string {
  return parseDateKey(iso).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' });
}

/** Formatuje klucz daty: "11 sierpnia 2026". */
export function formatDayMonthYear(iso: string): string {
  return parseDateKey(iso).toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
