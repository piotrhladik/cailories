# 📱 CaiLORIES v2.1 — Instrukcja Publikacji w Google Play

## ✅ Co jest GOTOWE (kod, infrastruktura, build)

| Element | Status | Szczegóły |
|---------|--------|-----------|
| **Kod źródłowy** | ✅ | GitHub: https://github.com/piotrhladik/cailories |
| **Strona WWW (Vercel)** | ✅ | https://cailories.pl (HTTPS, HTTP 200) |
| **Domena + DNS** | ✅ | A `@` → `216.198.79.1`, CNAME `www` → `cname.vercel-dns.com` |
| **Polityka prywatności** | ✅ | https://cailories.pl/privacy-policy.html |
| **AdSense (WWW)** | ✅ | Publisher ID: `pub-462291723554126`, Slot: `2301034709` |
| **AdMob (APK)** | ✅ | App ID: `ca-app-pub-462291723554126~4046873988`, Banner: `ca-app-pub-462291723554126/9919619944` |
| **USE_TEST_ADS** | ✅ | `false` (produkcyjne reklamy) |
| **Debug APK v2.1** | ✅ | **`CaiLORIES-v2.1-debug.apk`** (w repo i lokalnie) |
| **capacitor.config.json** | ✅ | appId: `pl.nutriscan.ai`, appName: `CaiLORIES` |
| **AndroidManifest.xml** | ✅ | AdMob meta-data + INTERNET permission |
| **Checklista** | ✅ | `docs/PUBLISH_CHECKLIST.md` (zaktualizowana) |

---

## 📥 Gdzie pobrać APK v2.1 do testów na telefonie

**Plik:** `CaiLORIES-v2.1-debug.apk` — znajduje się w głównym katalogu projektu:
```
/c/Users/piotr/Desktop/projekty/CaiLORIES/CaiLORIES-v2.1-debug.apk
```

**Lub pobierz z GitHub (Assets / Releases):**
https://github.com/piotrhladik/cailories

### Instalacja na telefonie:
1. Prześlij plik na telefon (kabel, Google Drive, Telegram, e-mail)
2. Otwórz plik na telefonie → **Zainstaluj** (wymaga zgody na instalację z nieznanych źródeł)
3. Uruchom aplikację → przejdź onboarding → reklama AdMob na dole ekranu powinna się pojawić

> **Uwaga:** To wersja **debug** (podpisana kluczem debugowym). Do Google Play potrzebujesz **podpisanego AAB (release)** — patrz niżej.

---

## 🔑 KROK KLUCZOWY: Keystore (Zrób to RAZ, zachowaj na zawsze!)

Bez podpisanego AAB **nie opublikujesz** w Google Play. Jeśli zgubisz keystore — **nie zaktualizujesz aplikacji nigdy więcej**.

```bash
cd /c/Users/piotr/Desktop/projekty/CaiLORIES/android/app
keytool -genkey -v \
  -keystore calories-upload.jks \
  -alias calories \
  -keyalg RSA -keysize 2048 \
  -validity 10000
```

**Zapisz bezpiecznie (poza repo!):**
- Plik `calories-upload.jks`
- Hasło do keystore
- Alias: `calories`
- Hasło do klucza (może być takie samo)

---

## 🏗️ Generowanie podpisanego AAB do Google Play

### Opcja A: Android Studio (najprostsza, zalecana)
1. Otwórz folder `android/` w **Android Studio**
2. Menu: **Build → Generate Signed Bundle / APK**
3. Wybierz **Android App Bundle (.aab)** → **Next**
4. Wskazuj swój `calories-upload.jks`, wpisz hasła, alias `calories`
5. **Build Variant:** `release` → **Finish**
6. Wynik: `android/app/build/outputs/bundle/release/app-release.aab`

### Opcja B: Terminal (po skonfigurowaniu signingConfigs w build.gradle)
```bash
cd /c/Users/piotr/Desktop/projekty/CaiLORIES/android
./gradlew bundleRelease
# Wynik: app/build/outputs/bundle/release/app-release.aab
```

> **Wskazówka:** Jeśli używasz Opcji B, musisz dodać `signingConfigs` do `android/app/build.gradle` (patrz `docs/PUBLISH_CHECKLIST.md` linie 59-77).

---

## 📋 Google Play Console — Publikacja krok po kroku

### 1. Konto dewelopera (jednorazowo 25 USD)
https://play.google.com/console → Zapłać opłatę → Zweryfikuj tożsamość

### 2. Utwórz aplikację
- **Nazwa:** `CaiLORIES`
- **Język domyślny:** Polski (`pl`)
- **Typ:** Aplikacja (nie gra)
- **Cena:** Darmowa
- **Zgodność z zasadami reklam:** Wypełnij deklarację AdMob

### 3. Główny listing sklepu (Main Store Listing)
| Pole | Wartość |
|------|---------|
| Nazwa aplikacji | `CaiLORIES` |
| Krótki opis (80 zn.) | `Kalorie, makro (BWT) i AI analiza posiłków ze zdjęcia, opisu lub kodu EAN.` |
| Pełny opis (4000 zn.) | Opisz: offline-first, Gemini AI, skaner EAN, lokalne dane, PWA na iOS |
| Ikona 512×512 | `public/icons/icon-512.png` (sprawdź, czy to finalna grafika) |
| Grafika wyróżniająca 1024×500 | Musisz przygotować (JPEG/PNG) |
| Zrzuty ekranu | Min. 2 (telefon 16:9 lub 9:16), dodaj 4–8 |
| Kategoria | Zdrowie i fitness |
| **Polityka prywatności — URL** | **`https://cailories.pl/privacy-policy.html`** ✅ |
| E-mail dewelopera | Ten sam co w polityce prywatności |

### 4. Karta „Dane w aplikacji” (Data Safety)
- ❌ Nie zbierasz kont / uwierzytelniania
- ❌ Nie przesyłasz danych osobowych na swoje serwery
- ✅ Reklamy (AdMob/AdSense) → Google zbiera identyfikatory reklamowe
- ✅ Zdjęcia do Gemini API → przesyłane przez HTTPS
- ✅ Usuwanie danych → odinstalowanie aplikacji / wyczyszczenie danych aplikacji

### 5. Ocena wiekowa (Content Rating) + Docelowi odbiorcy
- Wypełnij kwestionariusz **IARC** (Content Rating)
- Typowe: brak przemocy, brak treści dla dorosłych, tematyka zdrowotna
- **Wiek:** 13+ (zdrowie/dieta + reklamy)
- **Treści AI:** Zadeklaruj zgodnie z wytycznymi Play (aplikacja używa Gemini)

### 6. AdMob / GDPR
- **Google UMP (User Messaging Platform):** Wymagana zgoda RODO w EOG/UK/CH na spersonalizowane reklamy
- Polityka prywatności (sekcja 5.1) to już opisuje
- `USE_TEST_ADS = false` ✅ (już ustawione)

### 7. Wydanie (Release) — Prześlij AAB
1. Play Console → **Wydanie produkcyjne** → **Utwórz nową wersję**
2. Prześlij `app-release.aab` (podpisany!)
3. Informacje o wydaniu: `Pierwsza wersja produkcyjna CaiLORIES v2.1.`
4. **Przekaż do recenzji**

> 💡 **Zalecane:** Najpierw utwórz **Test zamknięty (Closed track)**, dodaj siebie jako tester, sprawdź na prawdziwym telefonie, czy reklamy AdMob działają, a potem przesyłaj do produkcji.

---

## 📱 PWA / iOS (dodatkowe info)

- **iOS nie trafia do Google Play** — użytkownicy iPhone dodają do ekranu głównego przez Safari („Dodaj do ekranu głównego”)
- Wersja PWA/web korzysta z **Google AdSense** (`adsenseService.ts`), nie AdMob — to już działa na `cailories.pl`
- Manifest PWA kompletny: `public/manifest.webmanifest` (ikony, maskable, standalone)

---

## 🔗 Przydatne linki

| Co | Link |
|----|------|
| **GitHub Repo** | https://github.com/piotrhladik/cailories |
| **Vercel Dashboard** | https://vercel.com/piotrhladiks-projects/calories |
| **Google Play Console** | https://play.google.com/console |
| **Google AdMob** | https://admob.google.com |
| **Google AdSense** | https://adsense.google.com |
| **Domena (nazwa.pl)** | Panel DNS → rekordy A/CNAME |
| **Polityka prywatności (live)** | https://cailories.pl/privacy-policy.html |

---

## ⚠️ Checklista „Przed kliknięciem Przekaż do recenzji”

- [ ] **Podpisany AAB** wygenerowany (`bundleRelease` / Android Studio)
- [ ] **Keystore** zabezpieczony (kopia zapasowa w bezpiecznym miejscu!)
- [ ] **E-mail kontaktowy** w `privacy-policy.html` zastąpiony na prawdziwy (zastąp `kontakt@calories-app.example`)
- [ ] Polityka prywatności opublikowana pod `https://cailories.pl/privacy-policy.html` ✅
- [ ] `USE_TEST_ADS = false` w `src/config.ts` ✅
- [ ] Ikona 512×512, grafika 1024×500, zrzuty ekranu załadowane
- [ ] Data Safety, Content Rating, Docelowi odbiorcy wypełnione
- [ ] **Domena `cailories.pl` dodana w AdSense** (Witryny → Dodaj witrynę) — bez tego reklamy na stronie nie zadziałają!
- [ ] Test zamknięty przeszedł na realnym urządzeniu (APK z AdMob działa)

---

## 📞 Wsparcie

Wszystkie pliki konfiguracyjne są w repo. W razie problemów:
- Logi builda: `android/build/reports/problems/problems-report.html`
- AdLogi: sprawdź `adb logcat` po uruchomieniu APK na telefonie
- Vercel Logi: https://vercel.com/piotrhladiks-projects/calories

**Wersja dokumentu:** v2.1 (zgodna z `CaiLORIES-v2.1-debug.apk`)