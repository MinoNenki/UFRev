import Link from 'next/link';
import type { Metadata } from 'next';
import { PLAN_ORDER, CREDIT_PACK_ORDER, USAGE_TOKEN_RULES, BILLING_UNIT_LABEL } from '@/lib/plans';
import InsightPanel from '@/components/pro-ui/InsightPanel';
import TutorialMode, { TutorialStep } from '@/components/pro-ui/TutorialMode';
import { tr } from '@/lib/i18n';
import { getLanguage } from '@/lib/i18n-server';

export const metadata: Metadata = {
  title: 'Pricing for Product Review and Ecommerce Validation',
  description: 'Compare UFREV.com plans for product review, ecommerce validation, dropshipping research and supplier checks. Start free, upgrade to Starter, Pro or Scale when validation volume grows.',
  alternates: { canonical: '/pricing' },
  openGraph: {
    title: 'UFREV.com Pricing - Product Review and Ecommerce Validation Plans',
    description: 'Pricing for dropshipping checks, product validation, supplier review and ecommerce decision support.',
  },
};

export default async function PricingPage() {
  const language = await getLanguage();
  const primaryPlans = PLAN_ORDER;
  const videoWeightBands = [
    {
      range: tr(language, { en: 'Up to 8 MB', pl: 'Do 8 MB' }),
      tokens: '4',
      note: tr(language, { en: 'Short or lighter video checks with standard frame and metadata reading.', pl: 'Krótsze albo lżejsze sprawdzenia wideo ze standardowym odczytem klatek i metadanych.' }),
    },
    {
      range: tr(language, { en: 'Above 8 MB', pl: 'Powyżej 8 MB' }),
      tokens: '6',
      note: tr(language, { en: 'Heavier files create more frame work and deeper media processing cost.', pl: 'Cięższe pliki generują więcej pracy na klatkach i głębszy koszt przetwarzania mediów.' }),
    },
    {
      range: tr(language, { en: 'Above 14 MB', pl: 'Powyżej 14 MB' }),
      tokens: '8',
      note: tr(language, { en: 'The heaviest video tier, used when the file materially increases processing load.', pl: 'Najcięższy poziom wideo, używany wtedy, gdy plik realnie mocno zwiększa obciążenie przetwarzania.' }),
    },
  ];
  const pdfWeightBands = [
    {
      range: tr(language, { en: 'Standard PDF / lighter document', pl: 'Standardowy PDF / lżejszy dokument' }),
      tokens: '2',
      note: tr(language, { en: 'Best for smaller invoices, short documents and readable summaries.', pl: 'Najlepsze dla mniejszych faktur, krótszych dokumentów i czytelnych podsumowań.' }),
    },
    {
      range: tr(language, { en: 'Above 2 MB or denser content', pl: 'Powyżej 2 MB albo gęstsza treść' }),
      tokens: '3',
      note: tr(language, { en: 'The read becomes heavier when the file is larger or packed with more text and structure.', pl: 'Odczyt robi się cięższy, gdy plik jest większy albo wypełniony gęstszą treścią i strukturą.' }),
    },
    {
      range: tr(language, { en: 'Above 6 MB / heavier file pass', pl: 'Powyżej 6 MB / cięższy pass pliku' }),
      tokens: '4',
      note: tr(language, { en: 'This tier covers the heaviest PDFs, spreadsheets and denser document jobs.', pl: 'Ten poziom obejmuje najcięższe PDF-y, arkusze i gęstsze zadania dokumentowe.' }),
    },
  ];
  const multiFileBands = [
    {
      range: tr(language, { en: '3+ files / basic due diligence', pl: '3+ pliki / podstawowe due diligence' }),
      tokens: '3',
      note: tr(language, { en: 'The stack starts rising when the job asks the engine to compare several files together.', pl: 'Stos zaczyna rosnąć, gdy zadanie wymaga od silnika porównania kilku plików naraz.' }),
    },
    {
      range: tr(language, { en: 'Larger stack or more total weight', pl: 'Większy stos albo większa łączna waga' }),
      tokens: '5-6',
      note: tr(language, { en: 'More files, more bytes and more comparison work increase protected usage.', pl: 'Więcej plików, więcej bajtów i więcej pracy porównawczej zwiększa chronione użycie.' }),
    },
    {
      range: tr(language, { en: 'Complex due diligence bundle', pl: 'Złożony pakiet due diligence' }),
      tokens: '7-8',
      note: tr(language, { en: 'Used when the job combines many files, denser context and deeper reasoning across sources.', pl: 'Używane wtedy, gdy zadanie łączy wiele plików, gęstszy kontekst i głębsze wnioskowanie między źródłami.' }),
    },
  ];

  const tutorialSteps = [
    {
      step: '01',
      title: tr(language, { en: 'Choose the plan for your stage', pl: 'Wybierz plan dla swojego etapu' }),
      description: tr(language, { en: 'Start with the subscription tier that matches your budget, your stage, and how often you want to analyze.', pl: 'Zacznij od poziomu subskrypcji, który pasuje do Twojego budżetu, etapu i tego, jak często chcesz analizować.' }),
    },
    {
      step: '02',
      title: tr(language, { en: 'Understand how AI tokens are used', pl: 'Zrozum jak używane są tokeny AI' }),
      description: tr(language, { en: 'Light tasks stay low-friction, while heavier files and media use more protected token capacity.', pl: 'Lekkie zadania pozostają proste, a cięższe pliki i media zużywają więcej chronionej pojemności tokenów.' }),
    },
    {
      step: '03',
      title: tr(language, { en: 'Top up only when you need extra usage', pl: 'Doładuj tylko wtedy, gdy potrzebujesz więcej użycia' }),
      description: tr(language, { en: 'One-time token packs help when you need more analyses without changing your whole subscription.', pl: 'Jednorazowe pakiety tokenów pomagają wtedy, gdy potrzebujesz więcej analiz bez zmiany całej subskrypcji.' }),
    },
  ];

  const planNote = (planKey: string) => {
    if (planKey === 'scale') return tr(language, { en: 'Premium operator layer for firms, teams, and bigger e-commerce workflows that need market watch, routing, and broader execution capacity.', pl: 'Premium warstwa operatorska dla firm, zespołów i większych workflow e-commerce, które potrzebują market watch, routingu i większej pojemności wykonawczej.', de: 'Premium-Ebene für Teams mit Market Watch, Routing und höherer operativer Kapazität.', es: 'Capa premium para equipos que necesitan market watch, routing y más capacidad operativa.', pt: 'Camada premium para equipas que precisam de market watch, routing e maior capacidade operacional.', ja: 'マーケット監視・ルーティング・高い処理量が必要なチーム向けの上位プランです。', zh: '适合需要市场监控、路由和更高执行容量团队的高级方案。', id: 'Lapisan premium untuk tim yang butuh market watch, routing, dan kapasitas operasional lebih besar.', ru: 'Премиальный слой для команд, которым нужны market watch, routing и большая операционная ёмкость.' });
    if (planKey === 'pro') return tr(language, { en: 'Main recurring plan for shops, startups, and operators who validate products weekly and want a clear anti-loss workflow.', pl: 'Główny plan cykliczny dla sklepów, startupów i operatorów, którzy testują produkty co tydzień i chcą prostego workflow anti-loss.', de: 'Hauptabo für Operatoren, die Produkte wöchentlich prüfen und einen klaren Anti-Loss-Workflow wollen.', es: 'Plan principal para operadores que validan productos cada semana y quieren un flujo anti-loss claro.', pt: 'Plano principal para operadores que validam produtos semanalmente e querem um fluxo anti-loss claro.', ja: '毎週商品を検証し、明確な anti-loss フローを求める運用者向けの主力プランです。', zh: '适合每周验证产品并需要清晰 anti-loss 流程的核心订阅方案。', id: 'Langganan utama untuk operator yang memvalidasi produk tiap minggu dan ingin alur anti-loss yang jelas.', ru: 'Основной тариф для операторов, которые еженедельно валидируют продукты и хотят ясный anti-loss workflow.' });
    if (planKey === 'starter') return tr(language, { en: 'Affordable recurring plan for individual users, side-hustles, dropshipping stores, and smaller startups that need more than a free trial.', pl: 'Przystępny plan cykliczny dla zwykłych użytkowników, side-hustle, sklepów dropshippingowych i mniejszych startupów, które potrzebują więcej niż darmowy trial.', de: 'Preiswerte Stufe für frühe Nutzung und erstes Vertrauen.', es: 'Plan asequible para usuarios individuales y proyectos pequeños.', pt: 'Plano acessível para utilizadores individuais e projetos pequenos.', ja: '個人ユーザーや小規模プロジェクト向けの手頃な定期プランです。', zh: '适合个人用户和小项目的实惠订阅方案。', id: 'Paket langganan terjangkau untuk pengguna individu dan proyek kecil.', ru: 'Доступный тариф для обычных пользователей и небольших проектов.' });
    return tr(language, { en: 'Low-friction validation tier for first checks and early trust.', pl: 'Niski próg wejścia do pierwszych sprawdzeń i budowy zaufania.', de: 'Einstiegsstufe mit wenig tarciem für frühes Vertrauen.', es: 'Nivel de validación con poca fricción para generar confianza inicial.', pt: 'Nível de validação com pouca fricção para construir confiança inicial.', ja: '初期検証と信頼構築のための低摩擦プランです。', zh: '低门槛验证套餐，适合早期建立信任。', id: 'Paket validasi awal dengan hambatan rendah untuk membangun kepercayaan.', ru: 'Низкий порог входа для ранней проверки и построения доверия.' });
  };

  const ruleTitle = (ruleKey: string, fallback: string) => {
    if (ruleKey === 'text') return tr(language, { en: 'Text, URL, short prompt', pl: 'Tekst, URL, krótki prompt', de: 'Text, URL, kurzer Prompt', es: 'Texto, URL, prompt corto', pt: 'Texto, URL, prompt curto', ja: 'テキスト・URL・短いプロンプト', zh: '文本、URL、短提示', id: 'Teks, URL, prompt singkat', ru: 'Текст, URL, короткий промпт' });
    if (ruleKey === 'image') return tr(language, { en: 'Image / screenshot / basic file', pl: 'Obraz / screenshot / prosty plik', de: 'Bild / Screenshot / einfache Datei', es: 'Imagen / captura / archivo básico', pt: 'Imagem / captura / ficheiro básico', ja: '画像・スクリーンショット・基本ファイル', zh: '图片 / 截图 / 基础文件', id: 'Gambar / screenshot / file dasar', ru: 'Изображение / скриншот / базовый файл' });
    if (ruleKey === 'pdf') return tr(language, { en: 'PDF / document / spreadsheet', pl: 'PDF / dokument / arkusz', de: 'PDF / Dokument / Tabelle', es: 'PDF / documento / hoja de cálculo', pt: 'PDF / documento / folha de cálculo', ja: 'PDF・ドキュメント・表計算', zh: 'PDF / 文档 / 表格', id: 'PDF / dokumen / spreadsheet', ru: 'PDF / документ / таблица' });
    if (ruleKey === 'video') return tr(language, { en: 'Video analysis', pl: 'Analiza wideo', de: 'Videoanalyse', es: 'Análisis de vídeo', pt: 'Análise de vídeo', ja: '動画分析', zh: '视频分析', id: 'Analisis video', ru: 'Анализ видео' });
    if (ruleKey === 'multi') return tr(language, { en: 'Multi-file due diligence', pl: 'Multi-file due diligence', de: 'Due-Diligence mit mehreren Dateien', es: 'Due diligence multiarchivo', pt: 'Due diligence multi-ficheiro', ja: '複数ファイルの精査', zh: '多文件尽调', id: 'Due diligence multi-file', ru: 'Due diligence по нескольким файлам' });
    return fallback;
  };

  const ruleNote = (ruleKey: string, fallback: string) => {
    if (ruleKey === 'video') return tr(language, { en: 'Pricing scales with file size because video is materially heavier to process.', pl: 'Cena rośnie wraz z rozmiarem pliku, bo wideo jest realnie cięższe do przetworzenia.', de: 'Die Preislogik skaliert mit der Dateigröße, weil Video deutlich schwerer zu verarbeiten ist.', es: 'El precio escala con el tamaño del archivo porque el vídeo es mucho más pesado de procesar.', pt: 'O preço cresce com o tamanho do ficheiro porque o vídeo é realmente mais pesado de processar.', ja: '動画は処理負荷が高いため、ファイルサイズに応じて課金が増えます。', zh: '视频处理更重，因此会根据文件大小增加计费。', id: 'Harga naik sesuai ukuran file karena video jauh lebih berat untuk diproses.', ru: 'Цена растёт вместе с размером файла, потому что видео значительно тяжелее в обработке.' });
    return tr(language, { en: fallback, pl: fallback, de: fallback, es: fallback, pt: fallback, ja: fallback, zh: fallback, id: fallback, ru: fallback });
  };

  return (
    <main className="mx-auto max-w-[1600px] px-2 py-10 text-white sm:px-0 sm:py-16">
      <section className="mesh-panel animate-aurora relative p-8 shadow-[0_30px_140px_rgba(2,6,23,0.65)]">
        <div className="spotlight-sweep" />
        <div className="noise-overlay" />
        <div className="relative text-[11px] uppercase tracking-[0.24em] text-cyan-200">{tr(language, { en: 'Pricing for users, shops, startups, and firms', pl: 'Cennik dla userów, sklepów, startupów i firm', de: 'Smart Pricing für sichereres Wachstum', es: 'Pricing inteligente para crecer con seguridad', pt: 'Pricing inteligente para crescer com segurança', ja: 'より安全な成長のためのスマート価格設定', zh: '面向更安全增长的智能定价', id: 'Pricing cerdas untuk pertumbuhan yang lebih aman', ru: 'Умное ценообразование для более безопасного роста' })}</div>
        <h1 className="relative mt-4 text-5xl font-black tracking-tight sm:text-6xl">{tr(language, { en: 'Start free, move to an affordable plan, and scale only when the engine is already saving or earning you money.', pl: 'Zacznij za darmo, przejdź do przystępnego planu i skaluj dopiero wtedy, gdy silnik realnie oszczędza albo zarabia Ci pieniądze.', de: 'Wähle einen Plan, der zu deiner Phase, Auslastung und Geschwindigkeit passt.', es: 'Elige un plan que encaje con tu etapa, carga de trabajo y ritmo.', pt: 'Escolhe um plano que combine com a tua fase, carga e ritmo.', ja: '自分のステージ・作業量・スピードに合うプランを選べます。', zh: '选择适合你阶段、工作量和节奏的方案。', id: 'Pilih paket yang sesuai dengan tahap, beban kerja, dan ritmemu.', ru: 'Выбери plan под свой этап, нагрузку и темп работы.' })}</h1>
        <p className="relative mt-5 max-w-4xl text-lg leading-8 text-slate-300">{tr(language, { en: 'The ladder is simple: Free for first proof, Starter for budget-conscious regular use, Pro for weekly e-commerce execution, and Scale for firms or teams that need broader operational coverage. This works for individual clients, dropshipping stores, startups, and established businesses.', pl: 'Drabina jest prosta: Free na pierwszy dowód wartości, Starter do regularnego użycia przy niższym budżecie, Pro do tygodniowej pracy e-commerce i Scale dla firm lub zespołów potrzebujących szerszej warstwy operacyjnej. To działa zarówno dla zwykłych klientów, sklepów dropshippingowych, startupów, jak i rozwiniętych biznesów.', de: `Starte leicht, upgrade bei Bedarf und halte schwere Dateien oder Videoanalysen durch gewichtete ${BILLING_UNIT_LABEL.toLowerCase()} unter Kontrolle. Die neue höchste Stufe positioniert Automatisierungen, Alerts und Integrationen zusätzlich als Premium-Betriebsschicht.`, es: `Empieza ligero, sube de nivel cuando necesites más profundidad y mantén protegidos los archivos pesados o el vídeo con el uso ponderado de ${BILLING_UNIT_LABEL.toLowerCase()}. El nuevo plan superior también posiciona automatizaciones, alertas e integraciones como una capa premium de operación.`, pt: `Começa leve, faz upgrade quando precisares de mais profundidade e mantém ficheiros pesados ou vídeo sob controlo com uso ponderado de ${BILLING_UNIT_LABEL.toLowerCase()}. O novo tier superior também posiciona automações, alertas e integrações como camada premium de operação.`, ja: `軽く始めて必要に応じてアップグレードし、重いファイルや動画作業は加重 ${BILLING_UNIT_LABEL.toLowerCase()} で保護します。新しい最上位プランでは、自動化・アラート・連携もトークン量とは別のプレミアム運用レイヤーとして訴求できます。`, zh: `先轻量开始，需要更深度时再升级，重文件和视频任务则通过加权 ${BILLING_UNIT_LABEL.toLowerCase()} 受保护。新的最高档还把自动化、告警和集成定位为独立的高级运营层，而不只是更多代币。`, id: `Mulai ringan, upgrade saat butuh analisis lebih dalam, dan jaga file berat atau video tetap terkendali dengan penggunaan ${BILLING_UNIT_LABEL.toLowerCase()} berbobot. Tier tertinggi baru juga memosisikan automasi, alert, dan integrasi sebagai lapisan operasi premium.`, ru: `Начни с лёгкого плана, повышай уровень при необходимости и держи тяжёлые файлы или видео под контролем благодаря взвешенному использованию ${BILLING_UNIT_LABEL.toLowerCase()}. Новый верхний тариф также продаёт автоматизации, алерты и интеграции как отдельный премиальный операционный слой.` })}</p>
        <p className="relative mt-3 max-w-4xl text-sm leading-7 text-slate-400">{tr(language, { en: 'Token top-ups and heavier operator layers still exist, but the first purchase decision is now easier for customers who need something between free and full Pro.', pl: 'Top-upy tokenów i wyższe warstwy operatorskie nadal istnieją, ale pierwsza decyzja zakupowa jest teraz prostsza dla klientów, którzy potrzebowali czegoś między darmowym planem a pełnym Pro.', de: 'Die meisten Kunden starten mit einem einfachen Plan und skalieren erst, wenn sich die Nutzung klar auszahlt.', es: 'La mayoría empieza con un plan simple y escala solo cuando el uso se justifica claramente.', pt: 'A maioria começa com um plano simples e escala apenas quando o uso compensa claramente.', ja: '多くの顧客はシンプルなプランから始め、価値を確認してから拡大します。', zh: '大多数客户会先从简单方案开始，确认价值后再扩展。', id: 'Sebagian besar klien mulai dari paket sederhana lalu scale saat manfaatnya benar-benar terasa.', ru: 'Большинство клиентов начинают с простого плана и масштабируются только когда ценность уже очевидна.' })}</p>
      </section>

      <TutorialMode
        language={language}
        title={tr(language, { en: 'Need help choosing the right option?', pl: 'Potrzebujesz pomocy w wyborze odpowiedniej opcji?' })}
        intro={tr(language, { en: 'Enable tutorial mode to see how subscriptions, token rules, and one-time packs work together.', pl: 'Włącz tryb samouczka, aby zobaczyć jak działają razem subskrypcje, zasady tokenów i pakiety jednorazowe.' })}
        steps={tutorialSteps}
        storageKey="ufrev-pricing-tutorial"
      >
        <TutorialStep
          step="01"
          title={tr(language, { en: 'Pick your starting subscription', pl: 'Wybierz subskrypcję startową' })}
          description={tr(language, { en: 'This is the best place to compare monthly value, token capacity, and the right level for your current stage.', pl: 'To najlepsze miejsce, by porównać miesięczną wartość, pojemność tokenów i poziom odpowiedni dla Twojego etapu.' })}
        >
          <section className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {primaryPlans.map((plan) => (
              <div key={plan.key} className={`relative overflow-hidden rounded-[32px] border p-7 shadow-[0_24px_100px_rgba(2,6,23,0.45)] ${plan.key === 'pro' ? 'border-cyan-300/40 bg-[linear-gradient(180deg,rgba(15,23,42,0.88),rgba(2,6,23,0.88))]' : 'border-white/10 bg-slate-950/60'}`}>
                {plan.key === 'pro' && <div className="absolute right-5 top-5 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">{tr(language, { en: 'Main plan', pl: 'Najczęstszy wybór', de: 'Hauptplan', es: 'Plan principal', pt: 'Plano principal', ja: 'メインプラン', zh: '主力方案', id: 'Paket utama', ru: 'Основной план' })}</div>}
                {plan.key === 'starter' && <div className="absolute right-5 top-5 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">{tr(language, { en: 'Affordable entry', pl: 'Przystępny start', de: 'Einstieg', es: 'Entrada asequible', pt: 'Entrada acessível', ja: '手頃な開始', zh: '实惠入门', id: 'Masuk terjangkau', ru: 'Доступный старт' })}</div>}
                {plan.key === 'scale' && <div className="absolute right-5 top-5 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-100">{tr(language, { en: 'Operator tier', pl: 'Warstwa scale', de: 'Operator-Stufe', es: 'Nivel operador', pt: 'Camada operador', ja: '運用者向け上位層', zh: '运营层', id: 'Tier operator', ru: 'Операторский тариф' })}</div>}
                <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-200">{plan.name}</div>
                <div className="mt-4 text-5xl font-black tracking-tight text-white">{plan.priceLabel}</div>
                <div className="mt-2 text-sm text-slate-400">{plan.monthlyCredits} {tr(language, { en: 'AI tokens', pl: 'tokenów AI', de: 'AI-Tokens', es: 'tokens AI', pt: 'tokens AI', ja: 'AIトークン', zh: 'AI 代币', id: 'token AI', ru: 'AI токенов' })} / {plan.monthlyAnalyses} {tr(language, { en: 'protected analyses', pl: 'chronionych analiz', de: 'geschützte Analysen', es: 'análisis protegidos', pt: 'análises protegidas', ja: '保護された分析', zh: '受保护分析', id: 'analisis terlindungi', ru: 'защищённых анализов' })}</div>
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">{planNote(plan.key)}</div>
                <Link href="/dashboard" className={`mt-6 block w-full rounded-2xl px-5 py-4 text-center font-semibold ${plan.key === 'pro' ? 'bg-cyan-300 text-slate-950' : 'border border-white/10 bg-white/[0.03] text-white'}`}>{plan.key === 'free' ? tr(language, { en: 'Start free', pl: 'Zacznij za darmo', de: 'Kostenlos starten', es: 'Empezar gratis', pt: 'Começar grátis', ja: '無料で開始', zh: '免费开始', id: 'Mulai gratis', ru: 'Начать бесплатно' }) : tr(language, { en: 'Choose this plan', pl: 'Wybierz ten plan', de: 'Abo kaufen', es: 'Elegir este plan', pt: 'Escolher este plano', ja: 'このプランを選ぶ', zh: '选择此方案', id: 'Pilih paket ini', ru: 'Выбрать этот план' })}</Link>
              </div>
            ))}
          </section>
        </TutorialStep>

        <TutorialStep
          step="02"
          title={tr(language, { en: 'Understand how billing works in practice', pl: 'Zobacz jak działa rozliczenie w praktyce' })}
          description={tr(language, { en: 'This section shows why lighter tasks stay simple and why heavier media uses more protected capacity.', pl: 'Ta sekcja pokazuje dlaczego lżejsze zadania pozostają proste, a cięższe media zużywają więcej chronionej pojemności.' })}
        >
          <div className="mt-8 rounded-[28px] border border-fuchsia-300/20 bg-[linear-gradient(135deg,rgba(168,85,247,0.18),rgba(15,23,42,0.86),rgba(34,211,238,0.08))] p-5 text-sm leading-7 text-slate-100 shadow-[0_20px_60px_rgba(88,28,135,0.18)]">
            <div className="text-[11px] uppercase tracking-[0.22em] text-fuchsia-200">{tr(language, { en: 'Video cost is weighted on purpose', pl: 'Koszt wideo jest celowo ważony' })}</div>
            <div className="mt-2 text-2xl font-black text-white">{tr(language, { en: 'Video analysis reads more and therefore consumes more protected AI token capacity.', pl: 'Analiza wideo czyta więcej i dlatego zużywa więcej chronionej pojemności tokenów AI.' })}</div>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-200">{tr(language, { en: 'That is intentional: frames, metadata, hook quality, and message clarity create a heavier workload than a simple text or screenshot check. Weighted billing keeps this feature sustainable for the business instead of hiding the real processing cost.', pl: 'To celowe: klatki, metadane, jakość hooka i klarowność przekazu tworzą cięższą pracę niż prosty check tekstu lub screena. Ważone rozliczanie utrzymuje tę funkcję opłacalną biznesowo zamiast ukrywać realny koszt przetwarzania.' })}</p>
          </div>
          <div className="pricing-video-weight-panel mt-6 rounded-[28px] border border-cyan-300/16 p-5 shadow-[0_24px_80px_rgba(8,47,73,0.22)] sm:p-6">
            <div className="text-[11px] uppercase tracking-[0.22em] text-cyan-200">{tr(language, { en: 'How video weight maps to token usage', pl: 'Jak waga wideo mapuje się na zużycie tokenów' })}</div>
            <h3 className="mt-2 text-2xl font-black text-white">{tr(language, { en: 'File weight matters, so heavier video consumes more protected capacity.', pl: 'Waga pliku ma znaczenie, więc cięższe wideo zużywa więcej chronionej pojemności.' })}</h3>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-200">{tr(language, { en: 'Current billing thresholds follow the real processing load already used by the app. This makes subscriptions easier to understand before someone uploads a heavier clip.', pl: 'Aktualne progi rozliczeń idą za realnym obciążeniem przetwarzania, którego aplikacja już używa. Dzięki temu subskrypcje są łatwiejsze do zrozumienia jeszcze przed wrzuceniem cięższego klipu.' })}</p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {videoWeightBands.map((band, index) => (
                <div key={`${band.range}-${index}`} className="pricing-video-weight-card rounded-[24px] border border-white/10 bg-slate-950/45 p-4">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">{band.range}</div>
                  <div className="mt-2 text-3xl font-black text-cyan-100">{band.tokens} {tr(language, { en: 'tokens', pl: 'tokeny' })}</div>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{band.note}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-[22px] border border-amber-300/18 bg-amber-300/8 px-4 py-4 text-sm leading-7 text-amber-50">
              {tr(language, { en: 'If a video job also includes extra files or unusually heavy context, the final protected token cost can rise slightly above the base video band. The point stays the same: bigger video workload should be visible before purchase, not hidden after upload.', pl: 'Jeżeli zadanie wideo zawiera też dodatkowe pliki albo wyjątkowo ciężki kontekst, końcowy koszt chronionych tokenów może lekko wzrosnąć ponad bazowy próg wideo. Zasada zostaje ta sama: większy koszt pracy na wideo ma być widoczny przed zakupem, a nie ukryty dopiero po uploadzie.' })}
            </div>
          </div>
          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <div className="pricing-video-weight-panel rounded-[28px] border border-violet-300/16 p-5 shadow-[0_24px_80px_rgba(76,29,149,0.18)] sm:p-6">
              <div className="text-[11px] uppercase tracking-[0.22em] text-violet-200">{tr(language, { en: 'How heavier PDF and document jobs scale', pl: 'Jak skalują się cięższe PDF-y i dokumenty' })}</div>
              <h3 className="mt-2 text-2xl font-black text-white">{tr(language, { en: 'PDF cost rises with file density and total weight.', pl: 'Koszt PDF rośnie wraz z gęstością pliku i jego łączną wagą.' })}</h3>
              <div className="mt-5 grid gap-4">
                {pdfWeightBands.map((band, index) => (
                  <div key={`${band.range}-${index}`} className="pricing-video-weight-card rounded-[24px] border border-white/10 bg-slate-950/45 p-4">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">{band.range}</div>
                    <div className="mt-2 text-3xl font-black text-violet-100">{band.tokens} {tr(language, { en: 'tokens', pl: 'tokeny' })}</div>
                    <p className="mt-3 text-sm leading-6 text-slate-300">{band.note}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pricing-video-weight-panel rounded-[28px] border border-emerald-300/16 p-5 shadow-[0_24px_80px_rgba(6,95,70,0.18)] sm:p-6">
              <div className="text-[11px] uppercase tracking-[0.22em] text-emerald-200">{tr(language, { en: 'How multi-file work scales', pl: 'Jak skaluje się praca multi-file' })}</div>
              <h3 className="mt-2 text-2xl font-black text-white">{tr(language, { en: 'Multi-file due diligence gets heavier as the engine compares more sources together.', pl: 'Multi-file due diligence robi się cięższe, gdy silnik porównuje razem więcej źródeł.' })}</h3>
              <div className="mt-5 grid gap-4">
                {multiFileBands.map((band, index) => (
                  <div key={`${band.range}-${index}`} className="pricing-video-weight-card rounded-[24px] border border-white/10 bg-slate-950/45 p-4">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">{band.range}</div>
                    <div className="mt-2 text-3xl font-black text-emerald-100">{band.tokens} {tr(language, { en: 'tokens', pl: 'tokeny' })}</div>
                    <p className="mt-3 text-sm leading-6 text-slate-300">{band.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <details className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
            <summary className="cursor-pointer list-none font-semibold text-cyan-100">{tr(language, { en: 'Open usage and billing details', pl: 'Otwórz szczegóły użycia i rozliczeń' })}</summary>
            <section className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="premium-panel p-6 sm:p-7">
              <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-200">{tr(language, { en: 'Weighted AI token rules', pl: 'Jak naliczane są tokeny AI', de: 'Gewichtete AI-Token-Regeln', es: 'Reglas ponderadas de tokens AI', pt: 'Regras ponderadas de tokens AI', ja: '重み付き AI トークンルール', zh: '加权 AI 代币规则', id: 'Aturan token AI berbobot', ru: 'Взвешенные правила AI токенов' })}</div>
              <h2 className="mt-3 text-3xl font-black text-white">{tr(language, { en: 'Pay less for simple checks, scale only for heavier work.', pl: 'Płać mniej za proste sprawdzenia, skaluj tylko przy cięższej pracy.', de: 'Weniger für einfache Checks zahlen, nur bei schwererer Arbeit skalieren.', es: 'Paga menos por chequeos simples y escala solo para trabajo más pesado.', pt: 'Paga menos por tarefas simples e escala apenas para trabalho mais pesado.', ja: '軽い確認は低コストのまま、重い作業だけが段階的に増えます。', zh: '简单检查保持低成本，只有较重任务才会扩展计费。', id: 'Bayar lebih sedikit untuk cek sederhana, dan scale hanya untuk pekerjaan yang lebih berat.', ru: 'Плати меньше за простые проверки и масштабируйся только для тяжёлой работы.' })}</h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {USAGE_TOKEN_RULES.map((rule) => (
                  <div key={rule.key} className="rounded-[24px] border border-white/10 bg-slate-950/50 p-4">
                    <div className="text-sm font-semibold text-white">{ruleTitle(rule.key, rule.title)}</div>
                    <div className="mt-2 text-2xl font-black text-cyan-200">{rule.tokens}</div>
                    <div className="mt-2 text-sm leading-6 text-slate-300">{ruleNote(rule.key, rule.note)}</div>
                  </div>
                ))}
              </div>
            </div>
            <InsightPanel language={language} title={tr(language, { en: 'Why clients feel safer with this pricing', pl: 'Dlaczego klienci czują się bezpieczniej z tym cennikiem', de: 'Warum dieses Pricing sicherer ist', es: 'Por qué este pricing es más seguro', pt: 'Porque este pricing é mais seguro', ja: 'この料金がより安全な理由', zh: '为什么这种定价更安全', id: 'Mengapa pricing ini lebih aman', ru: 'Почему это ценообразование безопаснее' })} items={[
              tr(language, { en: 'You are not overpaying for quick text or URL checks when you just need a fast answer.', pl: 'Nie przepłacasz za szybkie sprawdzenia tekstu lub URL, gdy potrzebujesz tylko krótkiej odpowiedzi.', de: 'Für schnelle Text- oder URL-Checks zahlst du nicht zu viel.', es: 'No pagas de más por chequeos rápidos de texto o URL.', ja: '短いテキストや URL チェックで過剰に支払うことはありません。', zh: '快速文本或 URL 检查不会让你多付钱。', id: 'Kamu tidak akan membayar terlalu mahal untuk cek teks atau URL yang cepat.' }),
              tr(language, { en: 'Heavier files and video use more tokens because they genuinely require more work and protection.', pl: 'Cięższe pliki i wideo zużywają więcej tokenów, bo realnie wymagają więcej pracy i ochrony.', de: 'Schwere Dateien und Video verbrauchen mehr Tokens, weil sie real mehr Arbeit bedeuten.', es: 'Los archivos pesados y el vídeo consumen más tokens porque realmente requieren más trabajo.', ja: '重いファイルや動画は本当に処理負荷が高いため、より多くのトークンを使います。', zh: '重文件和视频会消耗更多代币，因为它们确实需要更多处理。', id: 'File berat dan video memakai lebih banyak token karena memang butuh proses lebih besar.' }),
              tr(language, { en: 'The whole pricing story stays aligned with the promise: safer decisions, less waste, and better scaling timing.', pl: 'Cała historia cen pozostaje zgodna z obietnicą produktu: bezpieczniejsze decyzje, mniej marnowania i lepszy timing skali.', de: 'Die Preislogik bleibt mit dem Produktversprechen abgestimmt: sicherere Entscheidungen, weniger Verschwendung und besseres Skalierungstiming.', es: 'Toda la lógica de precios sigue alineada con la promesa del producto: decisiones más seguras y menos desperdicio.', ja: '料金ロジックは「より安全な意思決定・無駄の削減・適切な拡大」という約束と一致しています。', zh: '整个定价逻辑都与产品承诺一致：更安全的决策、更少浪费和更好的扩展时机。', id: 'Cerita pricing tetap selaras dengan janji produk: keputusan lebih aman, lebih sedikit pemborosan, dan timing scale yang lebih baik.' }),
            ]} />
            </section>
          </details>
        </TutorialStep>

        <TutorialStep
          step="03"
          title={tr(language, { en: 'Use top-up packs when needed', pl: 'Korzystaj z pakietów doładowań kiedy trzeba' })}
          description={tr(language, { en: 'These one-time packs are useful when you need extra analyses without changing your monthly setup.', pl: 'Te pakiety jednorazowe są przydatne, gdy potrzebujesz dodatkowych analiz bez zmiany miesięcznej konfiguracji.' })}
        >
          <details className="mb-6 rounded-[28px] border border-amber-300/20 bg-amber-300/10 p-5 text-sm leading-7 text-amber-50">
            <summary className="cursor-pointer list-none font-semibold">{tr(language, { en: 'Open one-time packs and operator tiers', pl: 'Otwórz pakiety jednorazowe i dodatkowe poziomy operatora' })}</summary>
            <div className="mt-4">
            {tr(language, { en: 'Recommended structure now: Free for first proof, Starter for budget-conscious recurring use, Pro for weekly execution, and Scale for team workflows with broader visibility. One-time packs stay as optional top-ups instead of a parallel pricing ladder.', pl: 'Rekomendowana struktura teraz: Free na pierwszy dowód wartości, Starter do regularnego użycia przy niższym budżecie, Pro do tygodniowej pracy i Scale dla workflow zespołowych z szerszą widocznością. Pakiety jednorazowe zostają jako opcjonalne doładowania zamiast równoległej drabiny cenowej.', de: 'Empfohlene Struktur: Free für den ersten Beweis, Pro für regelmäßige Nutzung und Scale für Team-Workflows mit breiterer Sichtbarkeit.', es: 'Estructura recomendada: Free para la primera prueba de valor, Pro para uso recurrente y Scale para flujos de equipo con mayor visibilidad.', pt: 'Estrutura recomendada: Free para a primeira prova, Pro para uso recorrente e Scale para fluxos de equipa com maior visibilidade.', ja: '推奨構成は、最初の価値確認に Free、定期利用に Pro、より広い可視化とチーム運用に Scale です。', zh: '推荐结构是：先用 Free 证明价值，用 Pro 进行 регулярное 使用，再用 Scale 覆盖团队工作流与更广可见性。', id: 'Struktur yang direkomendasikan: Free untuk bukti awal, Pro untuk penggunaan rutin, dan Scale untuk workflow tim dengan visibilitas lebih luas.', ru: 'Рекомендуемая структура: Free для первого доказательства ценности, Pro для регулярного использования и Scale для командных workflow с большей видимостью.' })}
            </div>
          </details>
          <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="grid gap-6 md:grid-cols-3">
              {CREDIT_PACK_ORDER.map((pack) => (
                <div key={pack.key} className="rounded-[32px] border border-white/10 bg-slate-950/60 p-7 shadow-[0_24px_100px_rgba(2,6,23,0.45)]">
                  <div className="text-[11px] uppercase tracking-[0.24em] text-amber-200">{pack.name}</div>
                  <div className="mt-4 text-4xl font-black tracking-tight text-white">{pack.priceLabel}</div>
                  <div className="mt-2 text-sm text-slate-400">{pack.credits} {tr(language, { en: 'one-time AI tokens', pl: 'jednorazowych tokenów AI', de: 'einmalige AI-Tokens', es: 'tokens AI de un solo pago', pt: 'tokens AI únicos', ja: '買い切り AI トークン', zh: '一次性 AI 代币', id: 'token AI sekali beli', ru: 'одноразовых AI токенов' })}</div>
                  <Link href="/dashboard" className="mt-6 block w-full rounded-2xl bg-amber-300 px-5 py-4 text-center font-semibold text-slate-950">{tr(language, { en: 'Use with dashboard', pl: 'Użyj z dashboardem', de: 'Mit Dashboard nutzen', es: 'Usar con dashboard', pt: 'Usar com dashboard', ja: 'ダッシュボードで使う', zh: '在仪表板中使用', id: 'Gunakan di dashboard', ru: 'Использовать в панели' })}</Link>
                </div>
              ))}
            </div>
            <InsightPanel language={language} title={tr(language, { en: 'How clients usually buy', pl: 'Jak klienci najczęściej kupują', de: 'Globale Pionier-Monetarisierung', es: 'Cómo suelen comprar los clientes', ja: 'ユーザーがよく選ぶ買い方', zh: '客户通常如何购买', id: 'Cara klien biasanya membeli' })} items={[
              tr(language, { en: 'Most users begin with a subscription for regular value and predictable monthly usage.', pl: 'Większość użytkowników zaczyna od subskrypcji dla regularnej wartości i przewidywalnego miesięcznego użycia.', de: 'Die meisten Nutzer starten mit einem Abo für planbare monatliche Nutzung.', es: 'La mayoría empieza con una suscripción para un valor regular y un uso predecible.', ja: '多くのユーザーは、定期的な価値と予測しやすい利用のためにサブスクから始めます。', zh: '大多数用户会先选择订阅，以获得稳定价值和可预测的使用量。', id: 'Sebagian besar pengguna mulai dari langganan untuk nilai rutin dan penggunaan bulanan yang stabil.' }),
              tr(language, { en: 'One-time packs are best when a client suddenly needs more depth, more files, or a short surge of analyses.', pl: 'Pakiety jednorazowe najlepiej sprawdzają się, gdy klient nagle potrzebuje większej głębi, większej liczby plików albo krótkiego wzrostu analiz.', de: 'Einmalpakete sind am besten bei kurzfristig höherem Analysebedarf.', es: 'Los packs únicos van mejor cuando el cliente necesita más profundidad o más archivos de forma puntual.', ja: '一時的により多くの分析やファイル処理が必要な時は、買い切りパックが最適です。', zh: '当客户短期内需要更多深度、更多文件或更多分析时，一次性包最合适。', id: 'Paket sekali beli paling cocok saat klien tiba-tiba butuh analisis lebih dalam atau lebih banyak file.' }),
              tr(language, { en: 'The pricing stays aligned with the product promise: reduce losses, decide faster, and scale only when it is worth it.', pl: 'Cennik pozostaje spójny z obietnicą produktu: ograniczaj straty, decyduj szybciej i skaluj tylko wtedy, gdy to się opłaca.', de: 'Die Preislogik bleibt mit dem Produktversprechen synchron: Verluste senken, schneller entscheiden und nur bei sinnvoller Wirtschaftlichkeit skalieren.', es: 'El pricing sigue alineado con la promesa del producto: reducir pérdidas, decidir más rápido y escalar solo cuando vale la pena.', ja: '価格設定は製品の約束と一致しています。損失を減らし、判断を速め、価値がある時だけ拡大します。', zh: '定价仍与产品承诺保持一致：减少损失、更快决策、只有值得时才扩大。', id: 'Pricing tetap selaras dengan janji produk: kurangi kerugian, ambil keputusan lebih cepat, dan scale hanya saat memang layak.' }),
            ]} />
          </section>
        </TutorialStep>
      </TutorialMode>
    </main>
  );
}
