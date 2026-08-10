// ============================================================================
// features/scanner/Scanner.tsx — skaner kodów EAN i integracja z Open Food Facts.
// Tryby: aparat (BarcodeDetector) + ręczny wpis kodu. Wynik można dodać do
// dziennika z wybraną wielkością porcji.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Loader2, PackageX, ScanLine, Search } from 'lucide-react';
import { fetchProductByEan } from '../../services/openFoodFacts';
import { detectBarcodeFromVideo, initDetector, isBarcodeDetectorSupported, startCamera, stopStream } from '../../services/barcodeScanner';
import { useMealsStore } from '../../store/useMealsStore';
import { useToastStore } from '../../store/useToastStore';
import { Button } from '../../components/ui/Button';
import { isValidEan, formatNumber } from '../../utils/format';
import type { ProductInfo } from '../../types';

export function Scanner(): JSX.Element {
  const [ean, setEan] = useState('');
  const [product, setProduct] = useState<ProductInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [portion, setPortion] = useState('100');
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraSupported] = useState(() => isBarcodeDetectorSupported());

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const scanningRef = useRef(false);

  const addMeal = useMealsStore((s) => s.addMeal);
  const show = useToastStore((s) => s.show);

  /** Pobranie danych produktu po kodzie EAN. */
  const lookup = useCallback(
    async (code: string) => {
      const cleaned = code.replace(/\D/g, '');
      if (!isValidEan(cleaned)) {
        show('Nieprawidłowy kod EAN (8 lub 13 cyfr).', 'error');
        return;
      }
      setLoading(true);
      setProduct(null);
      setEan(cleaned);
      try {
        const found = await fetchProductByEan(cleaned);
        setProduct(found);
      } catch (err) {
        const msg = (err as { message?: string })?.message ?? 'Nie udało się pobrać produktu.';
        show(msg, 'error');
      } finally {
        setLoading(false);
        stopStream(mediaRef.current);
        mediaRef.current = null;
        setCameraOn(false);
      }
    },
    [show],
  );

  /** Uruchomienie aparatu i pętli detekcji. */
  const startCameraScan = useCallback(async () => {
    if (cameraSupported === false) {
      show('Ta przeglądarka nie wspiera skanera kamerą. Wpisz EAN ręcznie.', 'info');
      return;
    }
    setLoading(true);
    try {
      await initDetector();
      const stream = await startCamera();
      mediaRef.current = stream;
      setCameraOn(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      scanningRef.current = true;
      loop();
    } catch {
      show('Brak dostępu do kamery. Użyj ręcznego wpisu EAN.', 'error');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraSupported, show]);

  const loop = async (): Promise<void> => {
    if (!scanningRef.current || !videoRef.current) return;
    const code = await detectBarcodeFromVideo(videoRef.current);
    if (code) {
      scanningRef.current = false;
      stopStream(mediaRef.current);
      mediaRef.current = null;
      setCameraOn(false);
      await lookup(code);
      return;
    }
    rafRef.current = window.requestAnimationFrame(() => void loop());
  };

  // Sprzątanie przy odmontowaniu.
  useEffect(() => {
    return () => {
      scanningRef.current = false;
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      stopStream(mediaRef.current);
    };
  }, []);

  const stopCamera = (): void => {
    scanningRef.current = false;
    if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    stopStream(mediaRef.current);
    mediaRef.current = null;
    setCameraOn(false);
  };

  /** Dodanie produktu do dziennika z wybraną porcją. */
  const addToJournal = (): void => {
    if (!product || !product.found) return;
    const raw = portion.trim();
    const grams = Number(raw);
    // Pusta/nieprawidłowa porcja nie może po cichu zalogować 100 g.
    if (raw === '' || !Number.isFinite(grams) || grams <= 0) {
      show('Podaj wielkość porcji w gramach.', 'error');
      return;
    }
    const factor = grams / 100;
    addMeal({
      name: product.productName,
      calories: Math.round(product.caloriesPer100g * factor),
      macros: {
        protein: round1(product.macrosPer100g.protein * factor),
        carbs: round1(product.macrosPer100g.carbs * factor),
        fats: round1(product.macrosPer100g.fats * factor),
      },
      source: 'scan',
    });
    show(`Dodano: ${product.productName} ✔`, 'success');
    setProduct(null);
    setPortion('100');
  };

  return (
    <section className="space-y-4 p-4">
      <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Skanuj kod EAN
      </h2>

      {/* Podgląd kamery */}
      {cameraOn && (
        <div className="relative overflow-hidden rounded-3xl bg-black">
          <video ref={videoRef} className="aspect-square w-full object-cover" playsInline muted />
          <p className="pointer-events-none absolute bottom-2 left-0 right-0 text-center text-xs text-white/80">
            Nakieruj kamerę na kod kreskowy…
          </p>
        </div>
      )}

      {/* Kontrola kamery */}
      {!cameraOn && (
        <Button variant="secondary" className="w-full" onClick={() => void startCameraScan()} disabled={loading}>
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} aria-hidden="true" />}
          Zeskanuj kamerą
        </Button>
      )}
      {cameraOn && (
        <Button variant="secondary" className="w-full" onClick={stopCamera}>
          Zatrzymaj kamerę
        </Button>
      )}

      {/* Ręczny wpis */}
      <div className="flex gap-2">
        <input
          className="input flex-1"
          inputMode="numeric"
          placeholder="Wpisz kod EAN (np. 5901234123457)"
          maxLength={13}
          value={ean}
          onChange={(e) => {
            setEan(e.target.value.replace(/\D/g, ''));
            setProduct(null);
          }}
        />
        <Button onClick={() => void lookup(ean)} disabled={loading || ean.length === 0} aria-label="Szukaj produktu">
          <Search size={18} aria-hidden="true" />
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-6 text-sm text-slate-400">
          <Loader2 size={20} className="animate-spin" /> Pobieram dane produktu…
        </div>
      )}

      {/* Wynik EAN */}
      {product && !loading && (
        <>
          {product.found ? (
            <div className="card space-y-3 p-4">
              <div className="flex items-start gap-2">
                <ScanLine size={18} className="mt-1 shrink-0 text-accent" aria-hidden="true" />
                <div>
                  <p className="text-sm font-bold">{product.productName}</p>
                  {product.brands && <p className="text-xs text-slate-400 dark:text-slate-400">{product.brands}</p>}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center">
                <Stat label="kcal" value={formatNumber(product.caloriesPer100g)} />
                <Stat label="Białko" value={`${formatNumber(product.macrosPer100g.protein)}g`} color="#3B82F6" />
                <Stat label="Węglow." value={`${formatNumber(product.macrosPer100g.carbs)}g`} color="#10B981" />
                <Stat label="Tłuszcze" value={`${formatNumber(product.macrosPer100g.fats)}g`} color="#F59E0B" />
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">Wartości na 100 g.</p>

              <div className="flex items-center gap-2">
                <label className="label mb-0 shrink-0" htmlFor="portion">Porcja (g)</label>
                <input
                  id="portion"
                  className="input"
                  inputMode="numeric"
                  placeholder="100"
                  value={portion}
                  disabled={!product}
                  onChange={(e) => setPortion(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <Button className="w-full" onClick={addToJournal}>
                + Dodaj do dziennika
              </Button>
            </div>
          ) : (
            <div className="card flex flex-col items-center gap-3 p-6 text-center">
              <PackageX size={28} className="text-slate-300 dark:text-slate-500" aria-hidden="true" />
              <p className="text-sm">
                Produkt nie znaleziony w bazie Open Food Facts.
                <br />
                Spróbuj innego kodu albo analizy zdjęciem w Czacie AI.
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }): JSX.Element {
  return (
    <div className="rounded-xl bg-slate-50 py-2 dark:bg-slate-700/40">
      <div className="text-sm font-bold" style={{ color }}>{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-400">{label}</div>
    </div>
  );
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}