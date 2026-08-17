# 🥗 CaiLORIES

Hybrydowa (Android APK + iOS PWA) aplikacja dietetyczna — **inteligentny kalkulator kalorii i makroskładników (BWT: Białko, Węglowodany, Tłuszcze)**.

Użytkownik dodaje posiłki przez **opis tekstowy, zdjęcie, skan kodu EAN (Open Food Facts)** lub generuje dania w **Trybie Lodówki**. Aplikacja działa **Offline-First** — wszystkie dane przechowywane są lokalnie na urządzeniu.

---

## ✅ Funkcje

| Obszar | Opis |
|--------|------|
| 📊 **Dashboard** | Licznik kalorii, realizacja celów BWT na żywo, historia posiłków z podziałem na dni |
| 🤖 **AI Czat** | Analiza posiłku ze zdjęcia/opisu → JSON z kaloriami i makro (Gemini API) |
| 🧊 **Tryb Lodówki** | 2–3 propozycje dań ze składników/zdjęcia, dodanie 1-klik do dziennika |
| 📷 **Skaner EAN** | Odczytywanie kodów kreskowych + automatyczne pobieranie BWT z Open Food Facts |
| ⚙️ **Ustawienia** | Walidacja klucza Gemini, dynamiczny wybór modelu, profil i wyliczenie TDEE/BMR |
| 🛡️ **Medical Disclaimer** | Wymagany komunikat prawny przy pierwszym uruchomieniu (zapis w localStorage) |
| 💰 **Monetyzacja** | Google AdMob — banner + reklama interstitial po analizie posiłku |

⚠️ **Aplikacja nie jest produktem medycznym** i nie świadczy porad zdrowotnych. Wartości odżywcze mają charakter szacunkowy.

---

## 🧱 Stos technologiczny

- **Frontend:** React 18 + Vite 5 + Tailwind CSS 3 + TypeScript (strict)
- **Stan:** Zustand (middleware `persist` → localStorage)
- **Mobile:** Capacitor 8 (Android), PWA (iOS / web)
- **API:** Google Gemini REST (JSON-Schema), Open Food Facts, Google AdMob
- **Ikony:** Lucide React

---

## 📁 Struktura projektu

```
src/
├── assets/
├── components/
│   ├── layout/          # Header, BottomNav, DisclaimerModal
│   └── ui/              # Button, Card, ProgressBar, Modal, Toast, AdBanner, MealRow, MealAnalysisCard
├── features/
│   ├── dashboard/       # Widok BWT, licznik kalorii, dziennik
│   ├── ai-chat/         # Analiza zdjęć/opisów, czat
│   ├── fridge-mode/     # Tryb Lodówki, generator dań
│   ├── scanner/         # Skaner EAN + Open Food Facts
│   └── settings/        # Klucz API, modele, profil BWT
├── services/
│   ├── geminiApi.ts     # Klient Gemini (walidacja, modele, analiza, JSON-schema)
│   ├── openFoodFacts.ts # Pobieranie BWT po EAN
│   ├── admobService.ts  # AdMob banner + interstitial (izolowany)
│   ├── imageCompressor.ts # Kompresja zdjęć (max 1024px, JPEG 0.8)
│   ├── barcodeScanner.ts  # Detekcja EAN (BarcodeDetector)
│   └── storage.ts       # Wraper localStorage
├── store/               # useUserStore, useMealsStore, useToastStore
├── types/               # Modele TS (Meal, Macro, GeminiResponse …)
├── utils/               # format, bmr.tdee
├── config.ts            # AdMob ID, model domyślny
├── App.tsx              # Korzeń + nawigacja + motyw
└── main.tsx             # Entry + rejestracja Service Worker
```

---

## 🚀 Szybki start (rozwój)

Wymagania: **Node.js 18+**, npm.

```bash
# 1. Instalacja zależności
npm install

# 2. Uruchomienie serwera deweloperskiego
npm run dev

# 3. Build produkcyjny (Weryfikuje TypeScript + generuje PWA)
npm run build
```

Rozwijanej aplikacji używasz pod `http://localhost:5173`.

---

## 🔐 Konfiguracja klucza Gemini API

Aplikacja wykorzystuje **własny klucz API użytkownika** (bez kosztów po stronie twórcy).

1. Utwórz klucz w [Google AI Studio](https://aistudio.google.com/apikey).
2. Otwórz aplikację → **Ustawienia** → wklej klucz → **Zweryfikuj klucz**.
3. Wybierz jeden z **automatycznie pobranych modeli** (np. `gemini-1.5-flash`, `gemini-1.5-flash-8b`, `gemini-1.5-pro`).

> **Bezpieczeństwo:** klucz jest przechowywany **wyłącznie na urządzeniu** w
> `localStorage` i wysyłany bezpośrednio do `generativelanguage.googleapis.com`.
> Nigdy nie trafia na serwer pośredniczący ani do repozytorium.
> Format klucza `AIza…` jest walidowany w UI.

> **Dostępne modele:** Aplikacja **dynamicznie pobiera** listę modeli z Gemini API po weryfikacji klucza. Domyślny fallback (przed wyborem) to `gemini-1.5-flash-lite`. Modele `gemini-2.x` są **celowo pomijane** (nie wszystkie klucze mają do nich dostęp).

---

## 📱 Kompilacja Android APK/AAB (Android Studio)

### 1. Build web

```bash
npm install
npm run build      # tworzy katalog /dist
```

### 2. Dodaj platformę + synchronizuj

```bash
npx cap add android        # (pierwszy raz — tworzy /android)
npx cap sync android       # kopiuje /dist do assets + rejestruje pluginy
```

### 3. Otwórz w Android Studio

```bash
npx cap open android
```

### 4. W Android Studio

1. Poczekaj na **Gradle Sync** (może pobierać zależności).
2. Zbuduj APK: **Build ▸ Build Bundle(s) / APK(s) ▸ Build APK(s)**
   albo wygeneruj AAB:
   **Build ▸ Generate Signed Bundle / APK ▸ Android App Bundle**.
3. Podpisany AAB jest gotowy do przesłania do **Google Play**.
   Podpis debugowania: **Build ▸ Edit Build Types** (do testów wystarczy).

> W piaskownicy, bez Android SDK, archiwum `/android` jest już gotowe do
> otwarcia w Android Studio — nie musisz ręcznie generować plików projektu.

---

## 🌐 PWA — instalacja (iOS / Web)

Nie używasz Androida? Aplikacja działa też jako **PWA** (offline).

### Lokalnie / hostowane build

```bash
npm run build
npx vite preview      # podgląd zbudowanego builda
```

### Publikacja (np. Vercel / Netlify / GitHub Pages)

Publikuj katalog **`dist`** (statyczne pliki).

### Instalacja na ekranie głównym iPhone / Android

1. Otwórz adres aplikacji w Safari (iOS) lub Chrome (Android).
2. **iOS:** przycisk Udostępnij ▸ „Dodaj do ekranu głównego”.
   **Android:** menu ▸ „Dodaj do ekranu głównego”.
3. Aplikacja otworzy się w trybie **standalone** (bez paska przeglądarki).

Manifest (`manifest.webmanifest`) i Service Worker (`sw.js`) są generowane
automatycznie przez `vite-plugin-pwa`.

### Tryb ciemny

Dopasowuje się do ustawień systemu lub wybory w aplikacji (ikona księżyca/słońca).

---

## 💰 Monetyzacja (Google AdMob)

- **Banner adaptacyjny** — dolna część ekranu.
- **Interstitial** — po zapisaniu posiłku z analizy AI / lodówki.

### Konfiguracja przed publikacją

1. Załóż konto w [Google AdMob](https://admob.google.com) i zarejestruj aplikację.
2. Podmień **testowe identyfikatory** na produkcyjne w `src/config.ts`:
   - `ADMOB_APP_ID`
   - `BANNER_AD_UNIT_ID`
   - `INTERSTITIAL_AD_UNIT_ID`
3. Zaktualizuj `capacitor.config.json` ▸ `plugins.AdMob.appId` oraz meta-tag
   `APPLICATION_ID` w `android/app/src/main/AndroidManifest.xml`.
4. Zmień `isTesting: true` na `false` w `src/services/admobService.ts`.
5. Przejdź proces zatwierdzania reklam w konsoli AdMob (m.in. zgoda użytkownika,
   polityka prywatności — zawiera informacje o brak zastępstwie porad lekarskich).

> Uwaga: reklamy interstitial działają po wbudowaniu natywnym. W wersji web/PWA
> AdMob wymaga dodatkowej konfiguracji skryptu AdSense — domyślnie pokazywane
> jest rezerwowe miejsce.

---

## 🧾 Obsługa scenariuszy brzegowych

| Scenariusz | Zachowanie aplikacji |
|-----------|----------------------|
| Brak klucza API | Czytelny toast: „Ustaw klucz API Gemini…” |
| Niepoprawny klucz (`AIza…`) | Toast błędu + status „Klucz jest nieprawidłowy” |
| Przekroczony limit (HTTP 429) | Toast: „Przekroczono limit zapytań…” |
| Brak sieci | Toast NETWORK; dane lokalne (dziennik) wciąż działają |
| Produkt nieznany w OFF | Karta „Produkt nie znaleziony” + propozycja analizy AI |
| Niewspierany EAN | Komunikat: „Nieprawidłowy kod EAN (8/13 cyfr)” |
| Nieczytelne/krzywe zdjęcie | Toast błędu / powtórka; aplikacja się nie zawiesza |
| `BarcodeDetector` niedostępny | Fallback: ręczny wpis kodu EAN |
| Kamera zablokowana | Komunikat o uprawnieniach → ręczny wpis |

---

## 🔒 Bezpieczeństwo / prywatność

- Klucz API przechowywany lokalnie; **brak twardego kodu w repo**.
- Wymóg ścisłego formatu JSON z Gemini (`responseSchema`) — chroni przed
  niespójnymi odpowiedziami.
- Kompresja zdjęć przed wysłaniem (max 1024 px, JPEG 0.8) — mniejszy transfer.
- Twoje lokalne dane (posiłki, profil) nie opuszczają urządzenia.
- Edukacyjny charakter: aplikacja nie zastępuje porady lekarskiej/dietetycznej.

---

## 🧪 Testy

Build weryfikuje poprawność TypeScript (`tsc --noEmit`) i generuje optymalny
bundle (PWA). Sprawdzenie builda:

```bash
npm run typecheck   # samo sprawdzenie typów
npm run build       # pełny build produkcyjny
```

---

## 📄 Licencja

Projekt edukacyjny. AdMob/Gemini/Open Food Facts — sprawdź m.in. politykę
prywatności i warunki usług poszczególnych dostawców przed publikacją.