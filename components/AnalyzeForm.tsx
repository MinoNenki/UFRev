'use client';

import { useMemo, useRef, useState, ChangeEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ShareResultButton from '@/components/ShareResultButton';
import { TutorialHint } from '@/components/pro-ui/TutorialMode';
import { tr, type Language } from '@/lib/i18n';
import { formatMoney, getCurrencyForCountry, type SupportedCurrency } from '@/lib/currency';

const ACCEPTED_EXTENSIONS = ['.txt', '.md', '.csv', '.json', '.html', '.htm', '.xml', '.pdf', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.mp4', '.mov', '.webm', '.m4v', '.avi'];
const INLINE_TEXT_EXTENSIONS = ['.txt', '.md', '.csv', '.json', '.html', '.htm', '.xml'];
const CURRENCIES = ['USD', 'EUR', 'PLN', 'GBP', 'JPY', 'CNY', 'IDR', 'RUB', 'CAD', 'AUD', 'BRL', 'MXN', 'INR', 'AED'] as const;
const MB = 1024 * 1024;
const MAX_STANDARD_FILE_MB = 16;
const MAX_VIDEO_FILE_MB = 48;
const MAX_TOTAL_UPLOAD_MB = 96;
const COUNTRY_OPTIONS = [
  { value: 'US', currency: 'USD', labels: { en: 'United States', pl: 'Stany Zjednoczone', es: 'Estados Unidos', ru: 'США' } },
  { value: 'PL', currency: 'PLN', labels: { en: 'Poland', pl: 'Polska', es: 'Polonia', ru: 'Польша' } },
  { value: 'DE', currency: 'EUR', labels: { en: 'Germany', pl: 'Niemcy', es: 'Alemania', ru: 'Германия' } },
  { value: 'ES', currency: 'EUR', labels: { en: 'Spain', pl: 'Hiszpania', es: 'España', ru: 'Испания' } },
  { value: 'PT', currency: 'EUR', labels: { en: 'Portugal', pl: 'Portugalia', es: 'Portugal', ru: 'Португалия' } },
  { value: 'GB', currency: 'GBP', labels: { en: 'United Kingdom', pl: 'Wielka Brytania', es: 'Reino Unido', ru: 'Великобритания' } },
  { value: 'JP', currency: 'JPY', labels: { en: 'Japan', pl: 'Japonia', es: 'Japón', ru: 'Япония' } },
  { value: 'CN', currency: 'CNY', labels: { en: 'China', pl: 'Chiny', es: 'China', ru: 'Китай' } },
  { value: 'ID', currency: 'IDR', labels: { en: 'Indonesia', pl: 'Indonezja', es: 'Indonesia', ru: 'Индонезия' } },
  { value: 'RU', currency: 'RUB', labels: { en: 'Russia', pl: 'Rosja', es: 'Rusia', ru: 'Россия' } },
  { value: 'CA', currency: 'CAD', labels: { en: 'Canada', pl: 'Kanada', es: 'Canadá', ru: 'Канада' } },
  { value: 'AU', currency: 'AUD', labels: { en: 'Australia', pl: 'Australia', es: 'Australia', ru: 'Австралия' } },
  { value: 'BR', currency: 'BRL', labels: { en: 'Brazil', pl: 'Brazylia', es: 'Brasil', ru: 'Бразилия' } },
  { value: 'MX', currency: 'MXN', labels: { en: 'Mexico', pl: 'Meksyk', es: 'México', ru: 'Мексика' } },
  { value: 'IN', currency: 'INR', labels: { en: 'India', pl: 'Indie', es: 'India', ru: 'Индия' } },
  { value: 'AE', currency: 'AED', labels: { en: 'UAE', pl: 'ZEA', es: 'EAU', ru: 'ОАЭ' } },
] as const;

const tt = tr;

const DEFAULT_COUNTRY_BY_LANGUAGE: Record<Language, string> = {
  en: 'US',
  pl: 'PL',
  de: 'DE',
  es: 'ES',
  pt: 'PT',
  ja: 'JP',
  zh: 'CN',
  id: 'ID',
  ru: 'RU',
};

const DEFAULT_CURRENCY_BY_LANGUAGE: Record<Language, string> = {
  en: 'USD',
  pl: 'PLN',
  de: 'EUR',
  es: 'EUR',
  pt: 'EUR',
  ja: 'JPY',
  zh: 'CNY',
  id: 'IDR',
  ru: 'RUB',
};

function isVideoLikeFile(file: File) {
  const extension = `.${String(file.name || '').split('.').pop()?.toLowerCase() || ''}`;
  return file.type.startsWith('video/') || ['.mp4', '.mov', '.webm', '.m4v', '.avi'].includes(extension);
}

function getPerFileLimitBytes(file: File) {
  return (isVideoLikeFile(file) ? MAX_VIDEO_FILE_MB : MAX_STANDARD_FILE_MB) * MB;
}

async function captureVideoPreviewFiles(file: File, maxFrames = 3) {
  if (typeof document === 'undefined' || !isVideoLikeFile(file)) return [] as File[];

  const objectUrl = URL.createObjectURL(file);

  try {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.src = objectUrl;

    await new Promise<void>((resolve, reject) => {
      video.onloadeddata = () => resolve();
      video.onerror = () => reject(new Error('video-preview-load-failed'));
    });

    const width = Math.max(320, Math.min(video.videoWidth || 960, 960));
    const height = Math.max(180, Math.round(width / Math.max((video.videoWidth || 16) / Math.max(video.videoHeight || 9, 1), 1)));
    const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 1;
    const timestamps = Array.from(new Set([
      0.25,
      Math.max(0.4, duration * 0.25),
      Math.max(0.8, duration * 0.6),
    ].map((time) => Number(Math.min(time, Math.max(duration - 0.1, 0.25)).toFixed(2))))).slice(0, maxFrames);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return [] as File[];

    const frames: File[] = [];

    for (let index = 0; index < timestamps.length; index += 1) {
      const targetTime = timestamps[index];
      await new Promise<void>((resolve) => {
        const handleSeeked = () => {
          video.removeEventListener('seeked', handleSeeked);
          resolve();
        };
        video.addEventListener('seeked', handleSeeked);
        video.currentTime = targetTime;
      });

      ctx.drawImage(video, 0, 0, width, height);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82));
      if (!blob) continue;

      const baseName = (file.name || 'video').replace(/\.[^.]+$/, '');
      frames.push(new File([blob], `${baseName}-preview-${index + 1}.jpg`, { type: 'image/jpeg' }));
    }

    return frames;
  } catch {
    return [] as File[];
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export default function AnalyzeForm({
  currentLanguage,
  onResultChange,
}: {
  currentLanguage: Language;
  onResultChange?: (result: any) => void;
}) {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [generatedPreviewFiles, setGeneratedPreviewFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [upgradeOffer, setUpgradeOffer] = useState<any>(null);
  const [advanced, setAdvanced] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(DEFAULT_COUNTRY_BY_LANGUAGE[currentLanguage] || 'US');
  const [displayCurrency, setDisplayCurrency] = useState(DEFAULT_CURRENCY_BY_LANGUAGE[currentLanguage] || 'USD');
  const [inputCurrency, setInputCurrency] = useState(DEFAULT_CURRENCY_BY_LANGUAGE[currentLanguage] || 'USD');
  const [priceValue, setPriceValue] = useState('');
  const [costValue, setCostValue] = useState('');
  const [adBudgetValue, setAdBudgetValue] = useState('');
  const [competitorPriceValue, setCompetitorPriceValue] = useState('');
  const [marketUnitsValue, setMarketUnitsValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const contentLength = useMemo(() => content.trim().length, [content]);
  const calculatorPreview = useMemo(() => {
    const parse = (value: string) => {
      const normalized = String(value || '').replace(',', '.').replace(/[^0-9.-]/g, '');
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    const price = parse(priceValue);
    const cost = parse(costValue);
    const adBudget = parse(adBudgetValue);
    const competitorAvgPrice = parse(competitorPriceValue);
    const marketUnits = parse(marketUnitsValue);
    const marginAmount = Number((price - cost).toFixed(2));
    const marginPercent = price > 0 && cost > 0 ? Number((((price - cost) / price) * 100).toFixed(1)) : 0;
    const estimatedMonthlyRevenue = price > 0 && marketUnits > 0 ? Number((price * marketUnits).toFixed(2)) : 0;
    const estimatedMonthlyGross = marginAmount > 0 && marketUnits > 0 ? Number((marginAmount * marketUnits).toFixed(2)) : 0;
    const competitorGap = price > 0 && competitorAvgPrice > 0 ? Number((price - competitorAvgPrice).toFixed(2)) : 0;
    const budgetShare = price > 0 && adBudget > 0 ? Number(((adBudget / price) * 100).toFixed(1)) : 0;

    return {
      price,
      cost,
      adBudget,
      competitorAvgPrice,
      marketUnits,
      marginAmount,
      marginPercent,
      estimatedMonthlyRevenue,
      estimatedMonthlyGross,
      competitorGap,
      budgetShare,
    };
  }, [priceValue, costValue, adBudgetValue, competitorPriceValue, marketUnitsValue]);

  const analysisGuideSteps = [
    tt(currentLanguage, {
      en: 'Add a product link, short text or file.',
      pl: 'Dodaj link do produktu, krótki tekst albo plik.',
      de: 'Starte mit einer Schnellaktion oder füge Datei / Link hinzu.',
      es: 'Empieza con una acción rápida o añade un archivo / enlace.',
    }),
    tt(currentLanguage, {
      en: 'Read the verdict, margin, risk and next step.',
      pl: 'Przeczytaj werdykt, marżę, ryzyko i kolejny krok.',
      de: 'Schreibe die gewünschte Entscheidung, nicht den perfekten Prompt.',
      es: 'Escribe la decisión que quieres, no un prompt perfecto.',
    }),
    tt(currentLanguage, {
      en: 'Open advanced only if you need more precision.',
      pl: 'Otwórz advanced tylko wtedy, gdy potrzebujesz większej precyzji.',
      de: 'Öffne erweitert nur für Preis-, Kosten-, Nachfrage- oder Konkurrenzdaten.',
      es: 'Abre avanzado solo para precio, coste, demanda o competencia.',
    }),
  ];

  const advancedGuideItems = [
    tt(currentLanguage, {
      en: 'Fill only the boxes you already know — the rest can stay empty.',
      pl: 'Wypełnij tylko pola, które już znasz — reszta może zostać pusta.',
      de: 'Fülle nur die Felder aus, die du schon kennst — der Rest kann leer bleiben.',
      es: 'Rellena solo los campos que ya conoces; el resto puede quedar vacío.',
    }),
    tt(currentLanguage, {
      en: 'Price, cost, and ad budget power the live calculator below.',
      pl: 'Cena, koszt i budżet reklamowy zasilają kalkulator live poniżej.',
      de: 'Preis, Kosten und Werbebudget speisen den Live-Rechner unten.',
      es: 'Precio, coste y presupuesto publicitario alimentan la calculadora en vivo.',
    }),
    tt(currentLanguage, {
      en: 'Competitor links and target market help the verdict become more specific.',
      pl: 'Linki konkurencji i rynek docelowy pomagają doprecyzować werdykt.',
      de: 'Konkurrenz-Links und Zielmarkt machen das Urteil präziser.',
      es: 'Los enlaces de la competencia y el mercado objetivo hacen el veredicto más preciso.',
    }),
  ];

  const videoCostGuideItems = [
    tt(currentLanguage, {
      en: 'Video uploads are supported and the system can read preview frames plus metadata.',
      pl: 'Uploady wideo są obsługiwane, a system potrafi odczytać klatki podglądowe oraz metadane.',
      de: 'Video-Uploads werden unterstützt und das System liest Vorschaubilder sowie Metadaten.',
      es: 'Se admiten vídeos y el sistema puede leer fotogramas previos y metadatos.',
    }),
    tt(currentLanguage, {
      en: 'Video analysis uses heavier weighted AI tokens than a light text or image check.',
      pl: 'Analiza wideo zużywa cięższe, ważone tokeny AI niż lekki check tekstu albo obrazu.',
      de: 'Videoanalyse verbraucht mehr gewichtete AI-Tokens als ein leichter Text- oder Bild-Check.',
      es: 'El análisis de vídeo consume más tokens AI ponderados que una comprobación ligera de texto o imagen.',
    }),
    tt(currentLanguage, {
      en: 'This keeps the feature honest near usage: heavier media costs more because it actually requires more work.',
      pl: 'To utrzymuje uczciwość funkcji blisko użycia: cięższe media kosztują więcej, bo realnie wymagają więcej pracy.',
      de: 'So bleibt die Funktion ehrlich im użyciu: schwerere Medien kosten mehr, weil sie wirklich mehr Arbeit erfordern.',
      es: 'Así la función sigue siendo honesta cerca del uso: los medios más pesados cuestan más porque realmente requieren más trabajo.',
    }),
  ];

  function syncCountryAndCurrency(nextCountry: string) {
    const nextCurrency = getCurrencyForCountry(nextCountry, displayCurrency as SupportedCurrency);
    setSelectedCountry(nextCountry);
    setDisplayCurrency(nextCurrency);
    setInputCurrency(nextCurrency);
  }

  function normalizeServerErrorMessage(message: string) {
    if (/single json object|json object requested|multiple \(or no\) rows returned|cannot coerce the result/i.test(message || '')) {
      return tt(currentLanguage, {
        en: 'Your account profile is still initializing. Refresh the page and try again.',
        pl: 'Profil konta jest jeszcze inicjalizowany. Odśwież stronę i spróbuj ponownie.',
        de: 'Dein Kontoprofil wird noch initialisiert. Aktualisiere die Seite und versuche es erneut.',
        es: 'Tu perfil aún se está inicializando. Actualiza la página y vuelve a intentarlo.',
      });
    }

    return message;
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    setFileError(null);

    const invalidFile = files.find(
      (file) => !ACCEPTED_EXTENSIONS.includes(`.${String(file.name).split('.').pop()?.toLowerCase() || ''}`)
    );

    if (invalidFile) {
      setFileError(
        `${tt(currentLanguage, {
          en: 'Supported files',
          pl: 'Obsługiwane pliki',
          de: 'Unterstützte Dateien',
          es: 'Archivos compatibles',
          pt: 'Ficheiros suportados',
          ru: 'Поддерживаемые файлы',
        })}: ${ACCEPTED_EXTENSIONS.join(', ')}`
      );
      event.target.value = '';
      return;
    }

    const oversizedFile = files.find((file) => file.size > getPerFileLimitBytes(file));
    if (oversizedFile) {
      const videoLike = isVideoLikeFile(oversizedFile);
      const limitMb = videoLike ? MAX_VIDEO_FILE_MB : MAX_STANDARD_FILE_MB;
      setFileError(tt(currentLanguage, {
        en: `File ${oversizedFile.name} is too large. ${videoLike ? 'Video' : 'File'} limit: ${limitMb}MB.`,
        pl: `Plik ${oversizedFile.name} jest za duży. Limit dla ${videoLike ? 'wideo' : 'pliku'}: ${limitMb}MB.`,
        de: `Datei ${oversizedFile.name} ist zu groß. ${videoLike ? 'Video' : 'Datei'}-Limit: ${limitMb}MB.`,
        es: `El archivo ${oversizedFile.name} es demasiado grande. Límite de ${videoLike ? 'vídeo' : 'archivo'}: ${limitMb}MB.`,
        pt: `O ficheiro ${oversizedFile.name} é demasiado grande. Limite de ${videoLike ? 'vídeo' : 'ficheiro'}: ${limitMb}MB.`,
        ru: `Файл ${oversizedFile.name} слишком большой. Лимит для ${videoLike ? 'видео' : 'файла'}: ${limitMb}MB.`,
      }));
      event.target.value = '';
      return;
    }

    const totalUploadBytes = files.reduce((sum, file) => sum + file.size, 0);
    if (totalUploadBytes > MAX_TOTAL_UPLOAD_MB * MB) {
      setFileError(tt(currentLanguage, {
        en: `Total selected upload is too large. Max combined size: ${MAX_TOTAL_UPLOAD_MB}MB.`,
        pl: `Łączny rozmiar wybranych plików jest za duży. Maksymalnie: ${MAX_TOTAL_UPLOAD_MB}MB.`,
        de: `Die gesamte ausgewählte Upload-Größe ist zu groß. Maximal: ${MAX_TOTAL_UPLOAD_MB}MB.`,
        es: `El tamaño total seleccionado es demasiado grande. Máximo: ${MAX_TOTAL_UPLOAD_MB}MB.`,
        pt: `O tamanho total selecionado é demasiado grande. Máximo: ${MAX_TOTAL_UPLOAD_MB}MB.`,
        ru: `Общий размер выбранных файлов слишком большой. Максимум: ${MAX_TOTAL_UPLOAD_MB}MB.`,
      }));
      event.target.value = '';
      return;
    }

    const videoFiles = files.filter((file) => isVideoLikeFile(file));
    const generatedPreviews = videoFiles.length
      ? (await Promise.all(videoFiles.map((file) => captureVideoPreviewFiles(file, 3)))).flat().slice(0, 3)
      : [];

    setGeneratedPreviewFiles(generatedPreviews);
    setFileNames(files.map((file) => file.name || 'file'));
    setSelectedFiles(files);

    const textFiles = files.filter((file) =>
      INLINE_TEXT_EXTENSIONS.includes(`.${String(file.name || '').split('.').pop()?.toLowerCase() || ''}`)
    );

    if (textFiles.length) {
      const textParts = await Promise.all(
        textFiles.map(async (file) => `# File: ${file.name}\n${await file.text()}`)
      );
      setContent((prev) => [prev.trim(), ...textParts].filter(Boolean).join('\n\n'));
    }

    event.target.value = '';
  }

  function applyQuickFill(kind: 'product' | 'competitor' | 'pricing' | 'invoice') {
    if (kind === 'product') setContent(tt(currentLanguage, { en: 'will this sell?', pl: 'czy to się sprzeda?', de: 'verkauft sich das?', es: '¿se venderá?', pt: 'isto vai vender?', ja: '売れそうですか？', zh: '这个会卖吗？', id: 'apakah ini akan laku?', ru: 'будет ли это продаваться?' }));
    if (kind === 'competitor') setContent(tt(currentLanguage, { en: 'analyze competitors', pl: 'przeanalizuj konkurencję', de: 'analysiere die Konkurrenz', es: 'analiza la competencia', pt: 'analisa a concorrência', ja: '競合を分析して', zh: '分析竞争对手', id: 'analisis kompetitor', ru: 'проанализируй конкурентов' }));
    if (kind === 'pricing') setContent(tt(currentLanguage, { en: 'calculate margin and profitability', pl: 'policz marżę i opłacalność', de: 'berechne Marge und Rentabilität', es: 'calcula margen y rentabilidad', pt: 'calcula a margem e a rentabilidade', ja: '粗利と採算性を計算して', zh: '计算利润率和可行性', id: 'hitung margin dan profitabilitas', ru: 'посчитай маржу и рентабельность' }));
    if (kind === 'invoice') setContent(tt(currentLanguage, { en: 'check whether the costs from this file can be reduced', pl: 'sprawdź czy da się obniżyć koszty z tego pliku', de: 'prüfe, ob sich die Kosten aus dieser Datei senken lassen', es: 'comprueba si se pueden reducir los costes de este archivo', pt: 'verifica se os custos deste ficheiro podem ser reduzidos', ja: 'このファイルのコストを下げられるか確認して', zh: '检查这个文件中的成本是否可以降低', id: 'cek apakah biaya dari file ini bisa diturunkan', ru: 'проверь, можно ли снизить затраты из этого файла' }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setLoading(true);
      setResult(null);
      setUpgradeOffer(null);
      setErrorMsg(null);

      const formData = new FormData(e.currentTarget);
      formData.set('currentLanguage', currentLanguage);
      formData.set('selectedCountry', selectedCountry);
      formData.set('displayCurrency', displayCurrency);
      formData.set('inputCurrency', inputCurrency);
      selectedFiles.forEach((file) => formData.append('analysisFiles', file));
      generatedPreviewFiles.forEach((file) => formData.append('analysisPreviewImages', file));

      const res = await fetch('/api/analyze', { method: 'POST', body: formData });
      const contentType = res.headers.get('content-type') || '';

      if (!contentType.includes('application/json')) {
        setErrorMsg(
          tt(currentLanguage, {
            en: 'Invalid server response',
            pl: 'Niepoprawna odpowiedź serwera',
            de: 'Ungültige Serverantwort',
            es: 'Respuesta no válida del servidor',
          })
        );
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(
          normalizeServerErrorMessage(
            data.error ||
              tt(currentLanguage, {
                en: 'Analysis failed',
                pl: 'Analiza nie powiodła się',
                de: 'Analyse fehlgeschlagen',
                es: 'El análisis falló',
              })
          )
        );
        return;
      }

      const nextResult = {
        ...data.decision,
        text: data.resultText,
        productName:
          data.productName ||
          tt(currentLanguage, {
            en: 'Product',
            pl: 'Produkt',
            de: 'Produkt',
            es: 'Producto',
          }),
      };

      setResult(nextResult);
      onResultChange?.(nextResult);
      setUpgradeOffer(data.upgradeOffer || null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      router.refresh();
    } catch {
      setErrorMsg(
        tt(currentLanguage, {
          en: 'Server connection error',
          pl: 'Błąd połączenia z serwerem',
          de: 'Serververbindungsfehler',
          es: 'Error de conexión con el servidor',
        })
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} encType="multipart/form-data" className="premium-panel glow-ring analysis-form-shell p-4 sm:p-5 xl:p-5 2xl:p-6">
      <div className="analysis-form-orb analysis-form-orb-a" />
      <div className="analysis-form-orb analysis-form-orb-b" />
      <div className="analysis-form-scan" />
      <input type="hidden" name="currentLanguage" value={currentLanguage} />
      <input type="hidden" name="selectedCountry" value={selectedCountry} />
      <input type="hidden" name="displayCurrency" value={displayCurrency} />
      <input type="hidden" name="inputCurrency" value={inputCurrency} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.02fr)_minmax(320px,0.98fr)] 2xl:gap-6">
        <div>
          <div className="text-[11px] uppercase tracking-[0.24em] text-amber-100">
            {tt(currentLanguage, { en: 'New analysis', pl: 'Nowa analiza', de: 'Neue Analyse', es: 'Nuevo análisis', ja: '新しい分析', zh: '新分析', id: 'Analisis baru', ru: 'Новый анализ' })}
          </div>

          <h2 className="mt-3 max-w-[10ch] text-3xl font-black leading-[0.95] text-white sm:text-4xl xl:max-w-[9ch] xl:text-[2.85rem] 2xl:text-[3.15rem]">
            {tt(currentLanguage, {
              en: 'Check the product before it burns your budget.',
              pl: 'Sprawdź produkt zanim spali Ci budżet.',
              de: 'Sag, was du wissen willst. Du bekommst eine Entscheidung.',
              es: 'Escribe lo que quieres saber. Obtendrás una decisión.',
              ja: '知りたいことを書けば、判断が返ります。',
              zh: '写下你的问题，直接获得判断。',
              id: 'Tulis yang ingin dicek. Dapatkan keputusan.',
              ru: 'Опиши, что хочешь проверить. Получишь решение.',
            })}
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 xl:max-w-[52ch]">
            {tt(currentLanguage, {
              en: 'Use one simple path: paste a link, add a file or describe the product. The system will return a verdict, margin, risk and the safest next move.',
              pl: 'Użyj jednej prostej ścieżki: wklej link, dodaj plik albo opisz produkt. System zwróci werdykt, marżę, ryzyko i najbezpieczniejszy kolejny ruch.',
              de: 'Füge einen Link ein, lade eine Datei hoch oder beschreibe deinen Fall. Das System erkennt dein Ziel und wählt die passende Analyse automatisch.',
              es: 'Pega un enlace, añade un archivo o describe tu caso. El sistema detectará lo que quieres y elegirá automáticamente el análisis adecuado.',
            })}
          </p>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3">
            {analysisGuideSteps.map((item, index) => (
              <div key={`${item}-${index}`} className="analysis-form-step-card rounded-2xl border border-white/10 bg-slate-950/45 px-3 py-3 text-sm text-slate-200 xl:px-3 xl:py-2.5">
                <div className="mb-2 text-[10px] uppercase tracking-[0.22em] text-amber-100">
                  {tt(currentLanguage, { en: 'Step', pl: 'Krok', de: 'Schritt', es: 'Paso' })} {index + 1}
                </div>
                <div className="leading-6 xl:leading-5">{item}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="analysis-form-control rounded-[28px] border border-amber-200/20 bg-[linear-gradient(135deg,rgba(251,191,36,0.16),rgba(15,23,42,0.42),rgba(120,53,15,0.18))] p-4 sm:p-5 xl:p-4 shadow-[0_20px_80px_rgba(245,158,11,0.10)]">
          <div className="text-xs uppercase tracking-[0.24em] text-amber-50">
            {tt(currentLanguage, { en: 'Try one of these', pl: 'Spróbuj jednego z tych wejść', de: 'Schnellaktionen', es: 'Acciones rápidas', ja: 'クイック操作', zh: '快捷操作', id: 'Aksi cepat', ru: 'Быстрые действия' })}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:gap-2.5">
            <button
              type="button"
              onClick={() => applyQuickFill('product')}
              className="analysis-form-quick-card rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-left text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-slate-900/60 xl:min-h-[84px]"
            >
              {tt(currentLanguage, { en: 'Check if it will sell', pl: 'Sprawdź czy się sprzeda', de: 'Prüfe, ob es sich verkauft', es: 'Comprobar si se venderá', ja: '売れるか確認', zh: '检查是否能卖', id: 'Cek apakah akan laku', ru: 'Проверить, будет ли продаваться' })}
            </button>

            <button
              type="button"
              onClick={() => applyQuickFill('competitor')}
              className="analysis-form-quick-card rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-left text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-slate-900/60 xl:min-h-[84px]"
            >
              {tt(currentLanguage, { en: 'Will this burn my ad budget?', pl: 'Czy to spali mój budżet reklamowy?', de: 'Wettbewerb analysieren', es: 'Analizar competencia', ja: '競合を分析', zh: '分析竞争对手', id: 'Analisis kompetitor', ru: 'Проанализировать конкурентов' })}
            </button>

            <button
              type="button"
              onClick={() => applyQuickFill('pricing')}
              className="analysis-form-quick-card rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-left text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-slate-900/60 xl:min-h-[84px]"
            >
              {tt(currentLanguage, { en: 'Count margin and risk', pl: 'Policz marżę i ryzyko', de: 'Marge berechnen', es: 'Calcular margen', ja: '粗利を計算', zh: '计算利润率', id: 'Hitung margin', ru: 'Посчитать маржу' })}
            </button>

            <button
              type="button"
              onClick={() => applyQuickFill('invoice')}
              className="analysis-form-quick-card rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-left text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-slate-900/60 xl:min-h-[84px]"
            >
              {tt(currentLanguage, { en: 'Read file / screenshot', pl: 'Odczytaj plik / screenshot', de: 'Rechnung / Kosten optimieren', es: 'Optimizar factura / costes', ja: '請求書 / コストを最適化', zh: '优化账单 / 成本', id: 'Optimalkan invoice / biaya', ru: 'Оптимизировать счёт / расходы' })}
            </button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-[1.05fr_0.95fr] xl:gap-2.5">
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-300">
                {tt(currentLanguage, { en: 'Target country', pl: 'Kraj docelowy', de: 'Zielland', es: 'País objetivo', ja: '対象国', zh: '目标国家', id: 'Negara target', ru: 'Целевая страна' })}
              </label>
              <select value={selectedCountry} onChange={(e) => syncCountryAndCurrency(e.target.value)} className="input">
                {COUNTRY_OPTIONS.map((country) => (
                  <option key={country.value} value={country.value}>{country.labels[currentLanguage as 'en' | 'pl' | 'es' | 'ru'] ?? country.labels.en} · {country.currency}</option>
                ))}
              </select>
            </div>
            <div className="rounded-2xl border border-amber-200/20 bg-amber-300/10 p-4 shadow-[0_16px_34px_rgba(245,158,11,0.10)]">
              <div className="text-xs uppercase tracking-[0.18em] text-amber-50">{tt(currentLanguage, { en: 'Auto local estimate', pl: 'Automatyczna estymacja lokalna', de: 'Automatische lokale Schätzung', es: 'Estimación local automática', ja: '自動ローカル見積もり', zh: '自动本地估算', id: 'Estimasi lokal otomatis', ru: 'Авто локальная оценка' })}</div>
              <div className="mt-2 text-xl font-black text-white">{displayCurrency}</div>
              <div className="mt-1 text-xs leading-5 text-slate-200">{tt(currentLanguage, { en: 'Analysis and estimated cost will return in the selected country currency. Payments can still be settled in USD.', pl: 'Analiza i szacowany koszt wrócą w walucie wybranego kraju. Płatność może nadal być rozliczana w USD.', de: 'Analyse und geschätzte Kosten werden in der Währung des gewählten Landes angezeigt. Die Zahlung kann weiterhin in USD erfolgen.', es: 'El análisis y el coste estimado volverán en la moneda del país elegido. El pago real puede seguir en USD.', pt: 'A análise e o custo estimado voltarão na moeda do país escolhido. O pagamento real pode continuar em USD.', ja: '分析と推定コストは、選択した国の通貨で返されます。実際の支払いは USD のままでも構いません。', zh: '分析和估算成本将按所选国家的货币返回，实际支付仍可保持为 USD。', id: 'Analisis dan estimasi biaya akan kembali dalam mata uang negara terpilih. Pembayaran nyata tetap bisa dalam USD.', ru: 'Анализ и примерная стоимость будут показаны в валюте выбранной страны, а фактическая оплата может оставаться в USD.' })}</div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3 xl:gap-2.5">
            <label className="analysis-form-upload inline-flex cursor-pointer items-center gap-3 rounded-2xl border border-amber-200/30 bg-black/10 px-4 py-3 text-sm font-semibold text-white">
              <input
                ref={fileInputRef}
                type="file"
                name="analysisFiles"
                accept={ACCEPTED_EXTENSIONS.join(',')}
                className="hidden"
                multiple
                onChange={handleFileChange}
              />
              {tt(currentLanguage, { en: 'Add files', pl: 'Dodaj pliki', de: 'Dateien hinzufügen', es: 'Añadir archivos', ja: 'ファイルを追加', zh: '添加文件', id: 'Tambah file', ru: 'Добавить файлы' })}
            </label>

            {fileNames.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setFileNames([]);
                  setSelectedFiles([]);
                  setGeneratedPreviewFiles([]);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/5"
              >
                {tt(currentLanguage, { en: 'Clear files', pl: 'Wyczyść pliki', de: 'Dateien löschen', es: 'Limpiar archivos' })}
              </button>
            )}

            <button
              type="button"
              onClick={() => setAdvanced((v) => !v)}
              className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/5"
            >
              {advanced
                ? tt(currentLanguage, { en: 'Hide advanced', pl: 'Ukryj zaawansowane', de: 'Erweitert ausblenden', es: 'Ocultar avanzado' })
                : tt(currentLanguage, { en: 'Show advanced', pl: 'Pokaż zaawansowane', de: 'Erweitert anzeigen', es: 'Mostrar avanzado' })}
            </button>
          </div>

          <TutorialHint
            className="mt-4 xl:mt-3"
            title={tt(currentLanguage, { en: 'Mini tutorial for this analysis box', pl: 'Mini tutorial dla tego panelu analizy', de: 'Mini-Tutorial für dieses Analysefeld', es: 'Mini tutorial para este panel de análisis' })}
            description={tt(currentLanguage, { en: 'When guided mode is on, follow this short order to reach a decision faster and with less confusion.', pl: 'Gdy przewodnik jest włączony, trzymaj się tej krótkiej kolejności, aby szybciej dojść do decyzji i nie mieszać pól.', de: 'Wenn der Guide aktiv ist, folge dieser kurzen Reihenfolge für ein schnelleres und klareres Ergebnis.', es: 'Cuando el guía está activo, sigue este orden corto para llegar más rápido a una decisión.' })}
            items={analysisGuideSteps}
            tone="amber"
          />

          <TutorialHint
            className="mt-4 xl:mt-3"
            title={tt(currentLanguage, { en: 'Video uploads and weighted token cost', pl: 'Uploady wideo i ważony koszt tokenów', de: 'Video-Uploads und gewichtete Token-Kosten', es: 'Vídeos y coste ponderado de tokens' })}
            description={tt(currentLanguage, { en: 'This is the usage-side reminder: video is supported, but it is billed heavier on purpose.', pl: 'To przypomnienie po stronie użycia: wideo jest obsługiwane, ale celowo rozliczane ciężej.', de: 'Das ist die Nutzungs-Erinnerung: Video wird unterstützt, aber bewusst schwerer abgerechnet.', es: 'Este es el recordatorio del lado de uso: el vídeo está soportado, pero se factura de forma más pesada a propósito.' })}
            items={videoCostGuideItems}
            tone="amber"
          />
        </div>
      </div>

      <div className="mt-5 xl:mt-4">
        <label className="mb-2 block text-sm text-slate-300">
          {tt(currentLanguage, {
            en: 'What do you want to check?',
            pl: 'Co chcesz sprawdzić?',
            de: 'Was möchtest du prüfen?',
            es: '¿Qué quieres comprobar?',
          })}
        </label>

        <textarea
          name="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          className="analysis-form-textarea min-h-[200px] w-full rounded-[24px] border border-white/10 bg-slate-950/90 px-4 py-4 text-[15px] leading-7 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] xl:min-h-[176px] xl:leading-6"
          placeholder={tt(currentLanguage, {
            en: `Paste a product link, add a file or describe what you want to test...

Examples:
- will this sell or burn my budget?
- what margin is left after ads?
- should I test or skip this?
- what is in this image / file?`,
            pl: `Wklej link do produktu, dodaj plik albo opisz co chcesz przetestować...

Przykłady:
- czy to się sprzeda?
- czy to spali mój budżet?
- ile marży zostaje po reklamach?
- testować czy odpuścić?
- co jest na tym zdjęciu / w tym pliku?`,
            de: `Füge einen Link ein, lade eine Datei hoch oder schreibe, was du brauchst...

Beispiele:
- verkauft sich das?
- berechne die Marge
- analysiere die Konkurrenz
- lohnt sich ein Test?
- was ist auf diesem Bild / in dieser Datei?`,
            es: `Pega un enlace, añade un archivo o escribe lo que quieres...

Ejemplos:
- ¿se venderá?
- calcula el margen
- analiza la competencia
- ¿merece una prueba?
- ¿qué hay en esta imagen / archivo?`,
          })}
        />

        <div className="mt-3 text-sm text-slate-400 xl:mt-2">
          {tt(currentLanguage, {
            en: 'The system chooses the right analysis automatically. Advanced fields stay optional.',
            pl: 'System sam dobiera właściwą analizę. Pola advanced pozostają opcjonalne.',
            de: 'Das System wählt die passende Analyse automatisch. Erweiterte Felder sind optional.',
            es: 'El sistema elegirá el análisis correcto automáticamente. Los campos avanzados son opcionales.',
          })}
        </div>

        <div className="mt-2 text-sm text-slate-400">
          {fileNames.length
            ? `${tt(currentLanguage, {
                en: 'Added files',
                pl: 'Dodane pliki',
                de: 'Hinzugefügte Dateien',
                es: 'Archivos añadidos',
              })}: ${fileNames.join(', ')}`
            : tt(currentLanguage, {
                en: `Supported: PDF, HTML, TXT, CSV, JSON, JPG, PNG, WEBP, GIF, MP4, MOV, WEBM, AVI. Standard files up to ${MAX_STANDARD_FILE_MB}MB, video up to ${MAX_VIDEO_FILE_MB}MB, total upload up to ${MAX_TOTAL_UPLOAD_MB}MB.`,
                pl: `Obsługiwane: PDF, HTML, TXT, CSV, JSON, JPG, PNG, WEBP, GIF, MP4, MOV, WEBM, AVI. Zwykłe pliki do ${MAX_STANDARD_FILE_MB}MB, wideo do ${MAX_VIDEO_FILE_MB}MB, łącznie do ${MAX_TOTAL_UPLOAD_MB}MB.`,
                de: `Unterstützt: PDF, HTML, TXT, CSV, JSON, JPG, PNG, WEBP, GIF, MP4, MOV, WEBM, AVI. Normale Dateien bis ${MAX_STANDARD_FILE_MB}MB, Videos bis ${MAX_VIDEO_FILE_MB}MB, insgesamt bis ${MAX_TOTAL_UPLOAD_MB}MB.`,
                es: `Compatible: PDF, HTML, TXT, CSV, JSON, JPG, PNG, WEBP, GIF, MP4, MOV, WEBM, AVI. Archivos normales hasta ${MAX_STANDARD_FILE_MB}MB, vídeo hasta ${MAX_VIDEO_FILE_MB}MB y total hasta ${MAX_TOTAL_UPLOAD_MB}MB.`,
                pt: `Suportado: PDF, HTML, TXT, CSV, JSON, JPG, PNG, WEBP, GIF, MP4, MOV, WEBM, AVI. Ficheiros normais até ${MAX_STANDARD_FILE_MB}MB, vídeo até ${MAX_VIDEO_FILE_MB}MB e total até ${MAX_TOTAL_UPLOAD_MB}MB.`,
                ru: `Поддерживается: PDF, HTML, TXT, CSV, JSON, JPG, PNG, WEBP, GIF, MP4, MOV, WEBM, AVI. Обычные файлы до ${MAX_STANDARD_FILE_MB}MB, видео до ${MAX_VIDEO_FILE_MB}MB, общий размер до ${MAX_TOTAL_UPLOAD_MB}MB.`,
              })}
        </div>

        <div className="mt-2 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm leading-6 text-amber-50">
          {tt(currentLanguage, {
            en: 'Video is fully supported here, but it uses heavier weighted AI token capacity than a simple text or screenshot check because processing frames and metadata costs more.',
            pl: 'Wideo jest tu w pełni obsługiwane, ale zużywa cięższą, ważoną pojemność tokenów AI niż prosty check tekstu lub screena, bo przetwarzanie klatek i metadanych kosztuje więcej.',
            de: 'Video wird hier vollständig unterstützt, nutzt aber mehr gewichtete AI-Token-Kapazität als ein einfacher Text- oder Screenshot-Check, weil Frames und Metadaten mehr kosten.',
            es: 'El vídeo es totalmente compatible aquí, pero usa una capacidad de tokens AI ponderada más pesada que una comprobación simple de texto o captura, porque procesar fotogramas y metadatos cuesta más.',
          })}
        </div>

        {generatedPreviewFiles.length > 0 && (
          <div className="mt-2 text-sm text-cyan-300">
            {tt(currentLanguage, {
              en: `Auto-generated video previews: ${generatedPreviewFiles.length}`,
              pl: `Automatycznie wygenerowane podglądy wideo: ${generatedPreviewFiles.length}`,
              de: `Automatisch erzeugte Video-Vorschauen: ${generatedPreviewFiles.length}`,
              es: `Vistas previas de vídeo generadas automáticamente: ${generatedPreviewFiles.length}`,
              pt: `Pré-visualizações de vídeo geradas automaticamente: ${generatedPreviewFiles.length}`,
              ru: `Автоматически созданные превью видео: ${generatedPreviewFiles.length}`,
            })}
          </div>
        )}

        <div className="text-xs text-slate-500">
          {tt(currentLanguage, { en: 'Characters', pl: 'Znaki', de: 'Zeichen', es: 'Caracteres' })}: {contentLength}
        </div>

        {fileError && <div className="mt-3 text-red-400">{fileError}</div>}
      </div>

      {advanced && (
        <div className="mt-5 rounded-[28px] border border-white/10 bg-white/[0.03] p-5 xl:mt-4">
          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
            {tt(currentLanguage, { en: 'Advanced mode', pl: 'Tryb zaawansowany', de: 'Erweiterter Modus', es: 'Modo avanzado' })}
          </div>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            {tt(currentLanguage, {
              en: 'Use this only when you want more precision: price, cost, demand, competitor links, and channel details.',
              pl: 'Używaj tego tylko wtedy, gdy chcesz większej precyzji: cena, koszt, popyt, linki konkurencji i szczegóły kanału.',
              de: 'Nutze dies nur für mehr Präzision: Preis, Kosten, Nachfrage, Konkurrenz-Links und Kanal-Details.',
              es: 'Usa esto solo si quieres más precisión: precio, coste, demanda, enlaces de la competencia y canal.',
            })}
          </p>

          <div className="mt-3 rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-sm leading-6 text-slate-300">
            {tt(currentLanguage, {
              en: 'You do not need to complete every field. Fill what you know and leave the rest empty.',
              pl: 'Nie musisz uzupełniać każdego pola. Wpisz to, co wiesz, a resztę zostaw pustą.',
              de: 'Du musst nicht jedes Feld ausfüllen. Trage ein, was du weißt, und lasse den Rest leer.',
              es: 'No necesitas completar todos los campos. Rellena lo que sepas y deja el resto vacío.',
            })}
          </div>

          <TutorialHint
            className="mt-4"
            title={tt(currentLanguage, { en: 'How to use advanced mode well', pl: 'Jak dobrze używać trybu zaawansowanego', de: 'So nutzt du den erweiterten Modus gut', es: 'Cómo usar bien el modo avanzado' })}
            description={tt(currentLanguage, { en: 'This is the optional precision layer for pricing tests, margin checks, and market scenario planning.', pl: 'To opcjonalna warstwa precyzji do testów ceny, sprawdzania marży i planowania scenariuszy rynkowych.', de: 'Dies ist die optionale Präzisionsebene für Preis-Tests, Margenprüfung und Marktszenarien.', es: 'Esta es la capa opcional de precisión para pruebas de precio, márgenes y escenarios de mercado.' })}
            items={advancedGuideItems}
          />

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <div className="xl:col-span-2">
              <label className="mb-2 block text-sm text-slate-300">
                {tt(currentLanguage, { en: 'Product name', pl: 'Nazwa produktu', de: 'Produktname', es: 'Nombre del producto' })}
              </label>
              <input name="productName" className="input" />
            </div>

            <div className="xl:col-span-2">
              <label className="mb-2 block text-sm text-slate-300">
                {tt(currentLanguage, { en: 'Product / offer link', pl: 'Link do produktu / oferty', de: 'Produkt- / Angebotslink', es: 'Enlace del producto / oferta' })}
              </label>
              <input name="websiteUrl" className="input" placeholder="https://..." />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">
                {tt(currentLanguage, { en: 'Display currency', pl: 'Waluta wyniku', de: 'Anzeige-Währung', es: 'Moneda de resultado' })}
              </label>
              <select
                name="displayCurrency"
                value={displayCurrency}
                onChange={(e) => setDisplayCurrency(e.target.value)}
                className="input"
              >
                {CURRENCIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">
                {tt(currentLanguage, { en: 'Input currency', pl: 'Waluta wejściowa', de: 'Eingabe-Währung', es: 'Moneda de entrada' })}
              </label>
              <select
                name="inputCurrency"
                value={inputCurrency}
                onChange={(e) => setInputCurrency(e.target.value)}
                className="input"
              >
                {CURRENCIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">
                {tt(currentLanguage, { en: 'Price', pl: 'Cena sprzedaży', de: 'Verkaufspreis', es: 'Precio de venta' })}
              </label>
              <input name="price" value={priceValue} onChange={(e) => setPriceValue(e.target.value)} className="input" placeholder="29" />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">
                {tt(currentLanguage, { en: 'Product cost', pl: 'Koszt produktu', de: 'Produktkosten', es: 'Coste del producto' })}
              </label>
              <input name="productCost" value={costValue} onChange={(e) => setCostValue(e.target.value)} className="input" placeholder="9" />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">
                {tt(currentLanguage, { en: 'Ad budget', pl: 'Budżet testowy', de: 'Testbudget', es: 'Presupuesto de test' })}
              </label>
              <input name="adBudget" value={adBudgetValue} onChange={(e) => setAdBudgetValue(e.target.value)} className="input" placeholder="150" />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">
                {tt(currentLanguage, { en: 'Competitor average price', pl: 'Średnia cena konkurencji', de: 'Durchschnittspreis der Konkurrenz', es: 'Precio medio de la competencia' })}
              </label>
              <input name="competitorAvgPrice" value={competitorPriceValue} onChange={(e) => setCompetitorPriceValue(e.target.value)} className="input" placeholder="34" />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">
                {tt(currentLanguage, { en: 'Demand (0-100)', pl: 'Popyt (0-100)', de: 'Nachfrage (0-100)', es: 'Demanda (0-100)' })}
              </label>
              <input name="demand" className="input" placeholder="65" />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">
                {tt(currentLanguage, { en: 'Competition (0-100)', pl: 'Konkurencja (0-100)', de: 'Wettbewerb (0-100)', es: 'Competencia (0-100)' })}
              </label>
              <input name="competition" className="input" placeholder="45" />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">
                {tt(currentLanguage, { en: 'Market turnover (units/month)', pl: 'Obrót rynku (szt./mies.)', de: 'Marktvolumen (Einheiten/Monat)', es: 'Volumen del mercado (uds/mes)' })}
              </label>
              <input name="marketMonthlyUnits" value={marketUnitsValue} onChange={(e) => setMarketUnitsValue(e.target.value)} className="input" placeholder="1200" />
            </div>

            <div className="xl:col-span-2">
              <label className="mb-2 block text-sm text-slate-300">
                {tt(currentLanguage, { en: 'Competitor URLs', pl: 'Linki konkurencji', de: 'Konkurrenz-Links', es: 'Enlaces de competidores' })}
              </label>
              <input name="competitorUrls" className="input" placeholder="https://..." />
            </div>

            <div className="xl:col-span-2">
              <label className="mb-2 block text-sm text-slate-300">
                {tt(currentLanguage, { en: 'Target market', pl: 'Rynek', de: 'Zielmarkt', es: 'Mercado objetivo' })}
              </label>
              <input name="targetMarket" className="input" placeholder="PL / EU / USA / global" />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">
                {tt(currentLanguage, { en: 'Main channel', pl: 'Główny kanał', de: 'Hauptkanal', es: 'Canal principal' })}
              </label>
              <input name="salesChannel" className="input" placeholder="Shopify / Amazon / Allegro / WooCommerce" />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">
                {tt(currentLanguage, { en: 'Analysis type', pl: 'Typ analizy', de: 'Analysetyp', es: 'Tipo de análisis' })}
              </label>
              <select name="analysisType" className="input" defaultValue="product-decision">
                <option value="product-decision">{tt(currentLanguage, { en: 'Product decision', pl: 'Decyzja produktowa', de: 'Produktentscheidung', es: 'Decisión de producto', ru: 'Решение по продукту' })}</option>
                <option value="competitor-review">{tt(currentLanguage, { en: 'Competitor review', pl: 'Analiza konkurencji', de: 'Wettbewerbsanalyse', es: 'Análisis de competencia', ru: 'Анализ конкурентов' })}</option>
                <option value="offer-audit">{tt(currentLanguage, { en: 'Offer audit', pl: 'Audyt oferty', de: 'Angebots-Audit', es: 'Auditoría de oferta', ru: 'Аудит оффера' })}</option>
                <option value="ad-angle">{tt(currentLanguage, { en: 'Ad angle', pl: 'Kąt reklamowy', de: 'Werbewinkel', es: 'Ángulo de anuncio', ru: 'Рекламный угол' })}</option>
                <option value="pricing-check">{tt(currentLanguage, { en: 'Pricing / cost', pl: 'Cena / koszt', de: 'Preis / Kosten', es: 'Precio / coste', ru: 'Цена / себестоимость' })}</option>
              </select>
            </div>
          </div>

          <div className="mt-5 rounded-[24px] border border-emerald-300/20 bg-emerald-300/5 p-4">
            <div className="text-[11px] uppercase tracking-[0.2em] text-emerald-200">{tt(currentLanguage, { en: 'Estimated local calculator', pl: 'Szacowany kalkulator lokalny', de: 'Geschätzter lokaler Kalkulator', es: 'Calculadora local estimada', ja: '推定ローカル計算機', zh: '本地估算计算器', id: 'Kalkulator lokal perkiraan', ru: 'Локальный оценочный калькулятор' })}</div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"><div className="text-xs uppercase tracking-[0.18em] text-slate-400">{tt(currentLanguage, { en: 'Margin', pl: 'Marża', de: 'Marge', es: 'Margen', ja: '粗利', zh: '利润率', id: 'Margin', ru: 'Маржа' })}</div><div className="mt-2 text-xl font-bold text-white">{calculatorPreview.price > 0 ? `${calculatorPreview.marginPercent}%` : '—'}</div><div className="mt-1 text-xs text-slate-400">{calculatorPreview.price > 0 ? formatMoney(calculatorPreview.marginAmount, currentLanguage, displayCurrency as SupportedCurrency) : '—'}</div></div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"><div className="text-xs uppercase tracking-[0.18em] text-slate-400">{tt(currentLanguage, { en: 'Monthly revenue', pl: 'Przychód miesięczny', de: 'Monatsumsatz', es: 'Ingreso mensual', ja: '月間売上', zh: '月收入', id: 'Pendapatan bulanan', ru: 'Месячная выручка' })}</div><div className="mt-2 text-xl font-bold text-white">{calculatorPreview.estimatedMonthlyRevenue ? formatMoney(calculatorPreview.estimatedMonthlyRevenue, currentLanguage, displayCurrency as SupportedCurrency) : '—'}</div><div className="mt-1 text-xs text-slate-400">{calculatorPreview.marketUnits > 0 ? `${calculatorPreview.marketUnits} ${tt(currentLanguage, { en: 'units / month', pl: 'szt. / mies.', de: 'Einheiten / Monat', es: 'uds / mes', ja: '個 / 月', zh: '件 / 月', id: 'unit / bulan', ru: 'шт. / мес.' })}` : tt(currentLanguage, { en: 'Add market volume to estimate this', pl: 'Dodaj wolumen rynku, aby to oszacować', de: 'Füge Marktvolumen hinzu, um dies zu schätzen', es: 'Añade volumen de mercado para estimarlo', ja: '市場数量を追加すると見積もれます', zh: '添加市场体量后可估算', id: 'Tambahkan volume pasar untuk estimasi', ru: 'Добавьте объём рынка для оценки' })}</div></div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"><div className="text-xs uppercase tracking-[0.18em] text-slate-400">{tt(currentLanguage, { en: 'Competitor gap', pl: 'Różnica vs konkurencja', de: 'Abstand zum Wettbewerb', es: 'Diferencia vs competencia', ja: '競合との差', zh: '与竞品差距', id: 'Selisih kompetitor', ru: 'Разница с конкурентами' })}</div><div className="mt-2 text-xl font-bold text-white">{calculatorPreview.competitorAvgPrice ? formatMoney(calculatorPreview.competitorGap, currentLanguage, displayCurrency as SupportedCurrency) : '—'}</div><div className="mt-1 text-xs text-slate-400">{tt(currentLanguage, { en: 'vs estimated competitor average', pl: 'vs szacowana średnia konkurencji', de: 'vs geschätzter Wettbewerbsdurchschnitt', es: 'vs media estimada de competencia', ja: '推定競合平均との比較', zh: '对比估算竞品均价', id: 'vs rata-rata kompetitor', ru: 'против средней цены конкурентов' })}</div></div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"><div className="text-xs uppercase tracking-[0.18em] text-slate-400">{tt(currentLanguage, { en: 'Budget pressure', pl: 'Presja budżetu', de: 'Budgetdruck', es: 'Presión del presupuesto', ja: '予算圧力', zh: '预算压力', id: 'Tekanan budget', ru: 'Давление бюджета' })}</div><div className="mt-2 text-xl font-bold text-white">{calculatorPreview.adBudget ? `${calculatorPreview.budgetShare}%` : '—'}</div><div className="mt-1 text-xs text-slate-400">{tt(currentLanguage, { en: 'ad budget relative to price', pl: 'budżet reklamowy względem ceny', de: 'Werbebudget relativ zum Preis', es: 'presupuesto publicitario relativo al precio', ja: '価格に対する広告費比率', zh: '广告预算相对售价占比', id: 'budget iklan relatif ke harga', ru: 'доля рекламного бюджета к цене' })}</div></div>
            </div>
            <div className="mt-3 text-xs leading-6 text-slate-300">{tt(currentLanguage, { en: 'This preview is only an estimate. The final analysis normalizes the values and returns the cost in the selected country currency.', pl: 'To tylko estymacja. Finalna analiza normalizuje wartości i zwraca koszt w walucie wybranego kraju.', de: 'Dies ist nur eine Schätzung. Die finale Analyse normalisiert die Werte und gibt die Kosten in der Währung des gewählten Landes zurück.', es: 'Esto es solo una estimación. El análisis final normaliza los valores y devuelve el coste en la moneda del país elegido.', ja: 'これはあくまで概算です。最終分析では値を正規化し、選択した国の通貨でコストを返します。', zh: '这只是估算。最终分析会标准化数值，并按所选国家的货币返回成本。', id: 'Ini hanya estimasi. Analisis akhir akan menormalkan nilai dan mengembalikan biaya dalam mata uang negara terpilih.', ru: 'Это только предварительная оценка. Финальный анализ нормализует значения и вернёт стоимость в валюте выбранной страны.' })}</div>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button type="submit" disabled={loading} className="btn-primary glow px-8 py-4 text-lg">
          {loading
            ? tt(currentLanguage, { en: 'Analyzing...', pl: 'Analizuję...', de: 'Analysiere...', es: 'Analizando...' })
            : tt(currentLanguage, { en: 'Check this before I spend', pl: 'Sprawdź to zanim wydam', de: 'Analysieren', es: 'Analizar' })}
        </button>

        {errorMsg && <div className="text-sm text-red-400">{errorMsg}</div>}
      </div>

      {result && (
        <div className="mt-8 rounded-[24px] border border-emerald-300/20 bg-emerald-300/5 p-4">
          <div className="text-sm font-semibold text-emerald-200">
            {tt(currentLanguage, { en: 'Decision is ready', pl: 'Decyzja jest gotowa', de: 'Analyse ist bereit', es: 'El análisis está listo' })}
          </div>
          <div className="mt-2 text-sm text-slate-300">
            {tt(currentLanguage, {
              en: 'The full result appears in the decision panel on the right. Review the verdict, margin, risk and next step first.',
              pl: 'Pełny wynik pojawił się w panelu decyzji po prawej. Najpierw sprawdź werdykt, marżę, ryzyko i kolejny krok.',
              de: 'Das vollständige Ergebnis erscheint rechts im Entscheidungsbereich. Du kannst direkt die nächste Frage stellen oder die Datei austauschen.',
              es: 'El resultado completo aparece en el panel de decisión de la derecha. Ya puedes hacer la siguiente pregunta o cambiar el archivo sin refrescar.',
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <ShareResultButton productName={result.productName} result={result} currentLanguage={currentLanguage} />
            {upgradeOffer?.planKey && (
              <Link href="/pricing" className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/5">
                {tt(currentLanguage, { en: 'Unlock more', pl: 'Odblokuj więcej', de: 'Mehr freischalten', es: 'Desbloquear más' })}
              </Link>
            )}
          </div>
        </div>
      )}
    </form>
  );
}