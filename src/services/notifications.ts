// ============================================================================
// services/notifications.ts — planowanie lokalnych przypomnień posiłków (D3).
// Wrapper wokół @capacitor/local-notifications z bezpiecznym fallbackiem:
// na web/PWA plugin potrafi rzucić błąd → łapiemy i zwracamy przyjazny
// komunikat (UI pokaże go jako toast). Zero crashy w każdej sytuacji.
// ============================================================================

import { LocalNotifications } from '@capacitor/local-notifications';
import type { LocalNotificationSchema } from '@capacitor/local-notifications';
import type { ReminderConfig, ReminderKey } from '../types';

/** Metadane przypomnień: stabilne ID (1-4), tytuły i treści PL. */
const REMINDER_META: Record<ReminderKey, { id: number; title: string; body: string }> = {
  breakfast: { id: 1, title: 'Śniadanie', body: 'Czas na pożywne śniadanie — dobry start dnia! 🌅' },
  lunch: { id: 2, title: 'Obiad', body: 'Pora na zbilansowany obiad. Smacznego! 🍽️' },
  dinner: { id: 3, title: 'Kolacja', body: 'Lekka kolacja — nie zapomnij o makro. 🌙' },
  water: { id: 4, title: 'Woda', body: 'Napij się wody — nawodnienie to podstawa! 💧' },
};

const REMINDER_KEYS: ReminderKey[] = ['breakfast', 'lunch', 'dinner', 'water'];

/** Data "dziś o podanej godzinie" — z powtórzeniem codziennym (repeats: true). */
function atTime(time: string): Date {
  const [rawHours, rawMinutes] = time.split(':');
  const hours = Number(rawHours);
  const minutes = Number(rawMinutes);
  const date = new Date();
  date.setHours(Number.isFinite(hours) ? hours : 8, Number.isFinite(minutes) ? minutes : 0, 0, 0);
  return date;
}

/** Prośba o uprawnienia do powiadomień. Zwraca true, gdy przyznano. */
export async function requestPermission(): Promise<boolean> {
  try {
    const status = await LocalNotifications.requestPermissions();
    return status.display === 'granted';
  } catch {
    return false;
  }
}

/** Sprawdzenie/uzyskanie uprawnień — bez podwójnego promptu o zgodę. */
async function ensurePermission(): Promise<boolean> {
  try {
    const current = await LocalNotifications.checkPermissions();
    if (current.display === 'granted') return true;
    if (current.display === 'denied') return false;
    return requestPermission();
  } catch {
    return false;
  }
}

/** Anulowanie wszystkich przypomnień posiłków (stabilne ID 1-4). */
export async function cancelMealReminders(): Promise<void> {
  try {
    await LocalNotifications.cancel({
      notifications: REMINDER_KEYS.map((key) => ({ id: REMINDER_META[key].id })),
    });
  } catch {
    // Brak natywnej platformy — anulowanie niemożliwe, ale nie jest to błąd krytyczny.
  }
}

/**
 * Zaplanowanie aktywnych przypomnień (id 1-4, codziennie o wskazanej godzinie).
 * Najpierw anuluje wszystkie, aby uniknąć duplikatów po zmianie ustawień.
 * */
export async function scheduleMealReminders(reminders: Record<ReminderKey, ReminderConfig>): Promise<void> {
  await cancelMealReminders();

  const notifications: LocalNotificationSchema[] = REMINDER_KEYS.filter((key) => reminders[key]?.enabled).map(
    (key) => ({
      id: REMINDER_META[key].id,
      title: REMINDER_META[key].title,
      body: REMINDER_META[key].body,
      schedule: { at: atTime(reminders[key].time), repeats: true },
    }),
  );

  if (notifications.length === 0) return;

  try {
    await LocalNotifications.schedule({ notifications });
  } catch {
    // Web/PWA lub brak uprawnień — rzucamy czytelny komunikat dla UI.
    throw new Error('Nie udało się ustawić przypomnień — powiadomienia są dostępne w aplikacji mobilnej (Android/iOS).');
  }
}

/** Główny punkt wejścia: synchronizacja planu przypomnień ze stanem aplikacji. */
export async function syncMealReminders(reminders: Record<ReminderKey, ReminderConfig>): Promise<void> {
  const hasEnabled = REMINDER_KEYS.some((key) => reminders[key]?.enabled);
  if (!hasEnabled) {
    await cancelMealReminders();
    return;
  }
  const granted = await ensurePermission();
  if (!granted) {
    throw new Error('Brak uprawnień do powiadomień. Włącz je w ustawieniach systemu i spróbuj ponownie.');
  }
  await scheduleMealReminders(reminders);
}
