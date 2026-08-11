# Przewodnik Publikacji w Google Play — CaiLORIES

Ten przewodnik przeprowadzi Cię przez proces przygotowania, testowania i publikacji aplikacji **CaiLORIES** w sklepie Google Play.

---

## Krok 1: Konfiguracja AdMob Produkcyjnego

Przed publikacją w Google Play musisz zastąpić testowe identyfikatory AdMob w pliku `src/config.ts` własnymi identyfikatorami z panelu Google AdMob:

1. Zarejestruj konto w [Google AdMob](https://admob.google.com).
2. Dodaj nową aplikację na system **Android**.
3. Utwórz jednostki reklamowe:
   - **Banner Ad Unit ID**
   - **Interstitial Ad Unit ID**
4. Zaktualizuj plik `src/config.ts`:
   ```ts
   export const ADMOB_APP_ID = 'ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY';
   export const BANNER_AD_UNIT_ID = 'ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY';
   export const INTERSTITIAL_AD_UNIT_ID = 'ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ';
   ```
5. Zaktualizuj plik `android/app/src/main/AndroidManifest.xml`, dodając ID aplikacji AdMob:
   ```xml
   <meta-data
       android:name="com.google.android.gms.ads.APPLICATION_ID"
       android:value="ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY"/>
   ```

---

## Krok 2: Generowanie paczki produkcyjnej (AAB - Android App Bundle)

1. **Zbuduj aplikację webową:**
   ```bash
   npm run build
   ```
2. **Synchronizuj z projektem Capacitor:**
   ```bash
   npx cap sync android
   ```
3. **Otwórz projekt w Android Studio:**
   ```bash
   npx cap open android
   ```
4. **W Android Studio:**
   - Wybierz z menu górnego: `Build` -> `Generate Signed Bundle / APK...`
   - Wybierz **Android App Bundle (AAB)** (wymagane przez Google Play).
   - Utwórz nowy klucz podpisywania (Keystore) lub użyj istniejącego. Zapamiętaj hasła!
   - Wybierz wariant `release`.
   - Kliknij `Finish`. Android Studio wygeneruje plik `.aab` (zazwyczaj w `android/app/release/app-release.aab`).

---

## Krok 3: Publikacja w Google Play Console

1. Zaloguj się do [Google Play Console](https://play.google.com/console).
2. Utwórz nową aplikację:
   - **Nazwa:** CaiLORIES
   - **Język domyślny:** Polski
   - **Typ:** Aplikacja
   - **Model cenowy:** Darmowa
3. Wypełnij wymagane sekcje w konsoli:
   - **Główny listing sklepu:** Opis krótki, opis długi, ikona aplikacji (512x512 px), grafika wyróżniająca (1024x500 px), zrzuty ekranu z telefonu.
   - **Polityka prywatności:** Podaj link do publicznie dostępnej polityki (np. hostowanej na GitHub Pages lub własnym serwerze: `https://twojadomena.pl/privacy-policy.html`).
   - **Treść aplikacji (Content Rating):** Wypełnij kwestionariusze oceny wiekowej.
   - **Docelowi odbiorcy:** Wskazanie grupy wiekowej.
4. **Wersja aplikacyjna (Production / Testing):**
   - Utwórz nową wersję w zakładce **Test zamknięty** lub **Produkcja**.
   - Prześlij wygenerowany plik `.aab`.
   - Zatwierdź zmiany i przekaż aplikację do recenzji Google!
