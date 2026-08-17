# 📦 CaiLORIES — Play Store Publication Checklist

Kompletny, praktyczny przewodnik publikacji **CaiLORIES** w Google Play Console.
Używaj go jako listy kontrolnej „od końca do końca" przed przesłaniem aplikacji do recenzji.

> **Status tego repo:** aplikacja jest zrebrandowana, skompilowana (AAB + debug APK), polityka prywatności gotowa.
> Poniżej znajdziesz dokładnie, co musisz zrobić ręcznie (wymaga konta Google Play, podpisu wydawniczego i panelu AdMob).

---

## 0. Przegląd kluczowych faktów Aplikacji

| Parametr | Wartość | Skąd to się bierze |
|---|---|---|
| **Nazwa aplikacji (Play)** | `CaiLORIES` | `capacitor.config.json` → `appName` |
| **Nazwa pakietu (applicationId)** | `pl.nutriscan.ai` | `android/app/build.gradle` → `defaultConfig.applicationId` |
| **Podtytuł / short_name** | `CaiLORIES` | `public/manifest.webmanifest` → `short_name` |
| **Język domyślny (Play)** | Polski (`pl`) | `index.html` lang, `manifest.lang` |
| **versionCode / versionName** | `1` / `1.0` | `android/app/build.gradle` |
| **minSdk / targetSdk / compileSdk** | `24` / `35` / `35` | `android/variables.gradle` |
| **AdMob App ID** | `ca-app-pub-1761393785289872~7024057976` | `src/config.ts` + `AndroidManifest.xml` |
| **Banner Ad Unit** | `ca-app-pub-1761393785289872/7518327084` | `src/config.ts` |
| **AdSense Publisher ID (PWA)** | `pub-1761393785289872` | `src/config.ts` |
| **Model Gemini** | `gemini-3.5-flash-lite` (fallback) | `src/config.ts` |

> ⚠️ **Uwaga o nazwie pakietu:** applicationId **pozostaje `pl.nutriscan.ai`**, bo Twoja aplikacja AdMob
> jest zarejestrowana pod tym ID. Zmiana applicationId po rejestracji w AdMob/Play = **nowa aplikacja**
> i zerwanie konfiguracji reklam. Nazwa *wyświetlana* to CaiLORIES — to się użytkownikom pokazuje.
> Nie zmieniaj applicationId bez podjęcia decyzji migracyjnej (migracja, ponowna rejestracja AdMob, nowy listing).

---

## 1. Wymagania wstępne

- [ ] Konto **Google Play Console** (opłata rejestracyjna jednorazowa 25 USD): <https://play.google.com/console>
- [ ] Konto **Google AdMob** (już zarejestrowana aplikacja, komplet ID): <https://admob.google.com>
- [ ] Zweryfikowany **kontakt e-mail dewelopera** (do polityki prywatności i kontaktu w Play)
- [ ] Hosting publiczny pod **politykę prywatności** (GitHub Pages / domena / inne) — wygenerowany plik: `public/privacy-policy.html`
- [ ] Java 17 + Android SDK (na Twojej maszynie już skonfigurowane)

---

## 2. Podpisywanie aplikacji (Keystore) — KRĘTYCZNE

Play **wymaga podpisanego AAB**. Obecnie w repo jest **niepodpisany AAB release** i podpisany *debug APK* (do instalacji testowej).
Docelowy podpis wydawniczy generujesz sam — wykonaj to **dokładnie raz i zabezpiecz kopię zapasową**, bo od tego podpisu zależą
wszystkie przyszłe aktualizacje.

### Utwórz keystore (keytool, z JDK):
```bash
keytool -genkey -v \
  -keystore calories-upload.jks \
  -alias calories \
  -keyalg RSA -keysize 2048 \
  -validity 10000
```
Zapamiętaj hasła i aliasy! Przechowuj `.jks` w bezpiecznym miejscu (poza repo).

### Skonfiguruj podpisywanie (dodaj do `android/app/build.gradle` w bloku `android`):
```groovy
signingConfigs {
    release {
        storeFile file('calories-upload.jks')
        storePassword 'TWOJE_HASLO'
        keyAlias 'calories'
        keyPassword 'TWOJE_HASLO'
    }
}
buildTypes {
    release {
        minifyEnabled true
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        signingConfig signingConfigs.release   // <-- dodaj to
    }
}
```
> Alternatywnie użyj **Android Studio**: `Build → Generate Signed Bundle / APK → Android App Bundle (AAB) → release`.
> Wtedy Android Studio wykona całą konfigurację podpisu za Ciebie.

### Po skonfigurowaniu podpisu, zbuduj podpisany AAB:
```bash
cd android
./gradlew bundleRelease
# wynik: android/app/build/outputs/bundle/release/app-release.aab
```

---

## 3. Build (co już jest zrobione / powtórz przed każdą publikacją)

```bash
npm run typecheck      # kontrola typów TS
npm run build          # budowa web (dist/)
npx cap sync android   # kopiuje dist/ do projektu Capacitor
cd android
./gradlew assembleDebug    # podpisany debug APK (testy na urządzeniu)
./gradlew bundleRelease    # AAB (uzupełnij podpis — patrz krok 2)
```

**Artefakty:**
- Debug APK (instalowalny do testów): `android/app/build/outputs/apk/debug/app-debug.apk`
- AAB release (niepodpisany, po skonfigurowaniu podpisu — podpisany): `android/app/build/outputs/bundle/release/app-release.aab`

---

## 4. Google Play Console — Tworzenie aplikacji

1. Zaloguj się do Play Console → **Utwórz aplikację**.
2. Pola:
   - **Nazwa aplikacji:** `CaiLORIES`
   - **Język domyślny:** polski (`pl`)
   - **Aplikacja / gra:** Aplikacja
   - **Darmowa / płatna:** Darmowa
   - **Zgodność z zasadami reklam (wymóg kwietnia 2025):** wypełnij **deklarację AdMob**
3. Zapisz.

---

## 5. Konfiguracja aplikacji (zakładki)

### Główny listing sklepu
- [ ] **Nazwa aplikacji:** `CaiLORIES`
- [ ] **Krótki opis** (max 80 zn.): np. `Kalorie, makro (BWT) i AI analiza posiłków ze zdjęcia, opisu lub kodu EAN.`
- [ ] **Pełny opis** (max 4000 zn.): kluczowe funkcje, offline-first, Gemini AI, skaner EAN, lokalne dane.
- [ ] **Ikona aplikacji:** 512×512 PNG (już w `public/icons/icon-512.png` — upewnij się, że to docelowa grafika).
- [ ] **Grafika wyróżniająca (feature graphic):** 1024×500 JPEG/PNG.
- [ ] **Zrzuty ekranu:** min 2 (telefon 16:9 lub 9:16); dodaj 4–8.
- [ ] **Kategoria:** Zdrowie i fitness.
- [ ] **Polityka prywatności — URL:** wskaż publiczny adres hostowanego `privacy-policy.html`
  (np. `https://twojastrona.pl/privacy-policy.html` lub GitHub Pages). **Wymagane do publikacji.**

### Kontakt z aplikacją
- [ ] Podaj e-mail dewelopera (ten sam, co w polityce prywatności — patrz sekcja 9 pliku polityki).

---

## 6. Karta „Dane w aplikacji” (Data safety form)

Wypełnij zgodnie z prawdą na podstawie zawartości aplikacji:

- [ ] **Dane zbierane:**
  - Nie zbierasz kont/uwierzytelniania (brak kont).
  - Aplikacja **nie przesyła** danych osobowych na Twoje serwery.
- [ ] **Udostępniane dane:** brak danych użytkowników.
- [ ] **Kluczowe deklaracje:** żadnych danych nie jest udostępnianych ani sprzedawanych.
- [ ] **Szyfrowanie:** zdjęcia/wysyłka do Gemini API odbywa się przez HTTPS.
- [ ] **Usuwanie danych:** użytkownik może usunąć dane odinstalowując aplikację / czyszcząc dane aplikacji.

> 🧠 Reklamy (AdMob/AdSense) mogą prowadzić Google do zbierania identyfikatorów reklamowych — zaznacz to w sekcji
> dotyczącej usług reklamowych w formularzu, jeśli Play o to zapyta.

---

## 7. Ocena wiekowa (Content rating) i Docelowi odbiorcy

- [ ] Wypełnij kwestionariusz **Content Rating** (IARC). Typowe odpowiedzi: brak przemocy, brak treści dla dorosłych;
      aplikacja ma zastosowanie medyczne/zdrowotne — sprawdź odpowiednie pytania o tematy zdrowotne.
- [ ] **Docelowi odbiorcy:** 13+ (tematyka zdrowia/diety), a przy reklamach — zweryfikuj zgodność z polityką reklam dla dzieci.
- [ ] **Zasady — treści generowane przez użytkowników (AI):** aplikacja używa Gemini AI do analizy posiłków —
      zapoznaj się z wytycznymi Play dotyczącymi treści generowanych przez AI i zawrzyj odpowiednie deklaracje.

---

## 8. AdMob / GDPR — zgoda i zgodność

- [ ] **Zgoda RODO / U-CMP:** Google reklamuje spersonalizowane reklamy w EOG/Wielkiej Brytanii/Szwajcarii;
      przy testach i w produkcji obsłuż mechanizm **Google UMP** (User Messaging Platform), aby uzyskać zgodę przed
      spersonalizowanymi reklamami. Polityka prywatności (sekcja 5.1) już to opisuje.
- [ ] **Ustaw `USE_TEST_ADS = false`** w `src/config.ts` (aktualnie ustawione — **nie przełącz na true przy publikacji**).
- [ ] **Usuń/pomiń testowe ID:** w repo jest `TEST_APP_ID`/`TEST_BANNER_AD_UNIT_ID`, ale przy `USE_TEST_ADS=false`
      nie są używane w produkcji — trzymaj ustawienie na `false`.

---

## 9. Wydanie (Release) — przesłanie AAB

1. **Utwórz wersję produkcyjną (lub test zamknięty):**
   - Play Console → **Wydanie produkcyjne** → **Utwórz nową wersję**.
2. **Prześlij AAB:** `android/app/build/outputs/bundle/release/app-release.aab` (podpisany).
3. Wypełnij **informacje o wydaniu** (release notes) np. `Pierwsza wersja produkcyjna CaiLORIES.`.
4. Zatwierdź i **przekaż do recenzji**.

### Uwagi dodatkowe
- **Częstotliwość aktualizacji:** przy każdej aktualizacji podnieś `versionCode` (integer, rosnący) i `versionName`.
- **Zachowaj ten sam keystore** do wszystkich aktualizacji — inaczej nie zaktualizujesz aplikacji.
- Test zamknięty (Closed track) zalecany przed produkcją, by sprawdzić recenzję i ad-serw.

---

## 10. PWA / iOS — nota dodatkowa

- **iOS nie jest w Google Play** — wersja PWA dla iPhone („Dodaj do ekranu głównego”) i web korzysta z **Google AdSense**
  (`adsenseService.ts`), nie AdMob. To już zaimplementowane i nie ma wpływu na publikację w Play.
- Manifest PWA (nazwa, ikony, maskable, standalone) jest kompletny w `public/manifest.webmanifest`.

---

## 11. Gotowość — szybka lista „przed przekazaniem do recenzji”

- [ ] AAB **podpisany** wygenerowany (`bundleRelease`)
- [ ] Zastąpiono placeholder kontaktowy w `privacy-policy.html` (`kontakt@calories-app.example` → realny e-mail)
- [ ] Polityka prywatności opublikowana pod publicznym URL
- [ ] Zmieniono email kontaktowy w Play Console na deweloperski
- [ ] `USE_TEST_ADS = false`
- [ ] Ikona, grafika wyróżniająca, zrzuty ekranu załadowane
- [ ] Data safety, content rating, docelowi odbiorcy wypełnione
- [ ] Wersja testowa (test zamknięty) przeszła weryfikację na realnym urządzeniu Android
