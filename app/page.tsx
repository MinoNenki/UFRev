import Link from 'next/link';
import type { Metadata } from 'next';
import { SITE } from '@/lib/site';
import HeroWordReveal from '@/components/HeroWordReveal';
import InteractiveDemoPreview from '@/components/InteractiveDemoPreview';
import DonutChart from '@/components/pro-ui/DonutChart';
import InsightPanel from '@/components/pro-ui/InsightPanel';
import MetricCard from '@/components/pro-ui/MetricCard';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { isSupabaseConfigured, getSetupWarnings } from '@/lib/env';
import { tr } from '@/lib/i18n';
import { getLanguage } from '@/lib/i18n-server';

export const metadata: Metadata = {
  title: 'Product Review, Ecommerce Validation and Dropshipping Checks',
  description: 'Review products, supplier offers, landing pages, invoices and ecommerce costs with AI. UFREV.com helps validate dropshipping ideas, product pages and pricing before you scale.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'UFREV.com - Product Review, Ecommerce Validation and Dropshipping Checks',
    description: 'Review products, supplier offers, landing pages, invoices and ecommerce costs with AI before you spend more budget.',
    url: SITE.url,
  },
};

export default async function HomePage() {
  const warnings = getSetupWarnings();
  const language = await getLanguage();
  let latestPreviewCase: {
    productName: string;
    verdict: string;
    margin: string;
    risk: string;
    nextStep: string;
  } | null = null;

  if (isSupabaseConfigured) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: latestAnalysis } = await supabase
          .from('analyses')
          .select('product_name, decision_json')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const decision = latestAnalysis?.decision_json as any;
        if (decision) {
          latestPreviewCase = {
            productName: String(latestAnalysis?.product_name || 'Live analysis'),
            verdict: String(decision.verdict || 'TEST'),
            margin: typeof decision?.pricing?.marginPercent === 'number' ? `${decision.pricing.marginPercent}% ${tr(language, { en: 'projected margin', pl: 'prognozowanej marży' })}` : tr(language, { en: 'Margin visible in saved case', pl: 'Marża widoczna w zapisanym case' }),
            risk: typeof decision?.burnRisk === 'string' ? String(decision.burnRisk) : tr(language, { en: 'Risk visible in saved case', pl: 'Ryzyko widoczne w zapisanym case' }),
            nextStep: String(decision?.adStrategy?.nextStep || decision?.productSourcing?.recommendedNextStep || tr(language, { en: 'Open the saved case and continue from the next protected move.', pl: 'Otwórz zapisany case i kontynuuj od następnego chronionego ruchu.' })),
          };
        }
      }
    } catch {
      latestPreviewCase = null;
    }
  }

  return (
    <main className="mx-auto max-w-[1600px] px-2 py-10 text-white sm:px-0 sm:py-16">
      {!isSupabaseConfigured && (
        <section className="premium-panel mb-8 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-amber-100">
                {tr(language, {
                  en: 'Setup required before login and dashboard features will work',
                  pl: 'Przed logowaniem i użyciem panelu trzeba zrobić konfigurację',
                  de: 'Vor Login und Dashboard-Nutzung ist ein Setup erforderlich',
                  es: 'Se requiere configuración antes de usar el login y el panel',
                  pt: 'A configuração é necessária antes que o login e o dashboard funcionem',
                  ru: 'Перед входом и работой панели нужна настройка',
                })}
              </div>
              <div className="mt-2 text-sm text-amber-50">{warnings.join(' ')}</div>
            </div>
            <Link href="/setup" className="rounded-2xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950">
              {tr(language, {
                en: 'Open setup',
                pl: 'Otwórz konfigurację',
                de: 'Setup öffnen',
                es: 'Abrir configuración',
                pt: 'Abrir configuração',
                ru: 'Открыть настройку',
              })}
            </Link>
          </div>
        </section>
      )}

      <section className="mesh-panel homepage-hero-shell animate-aurora relative rounded-[44px] p-8 shadow-[0_30px_140px_rgba(2,6,23,0.68)]">
        <div className="spotlight-sweep" />
        <div className="noise-overlay" />
        <div className="homepage-hero-flare homepage-hero-flare-a" />
        <div className="homepage-hero-flare homepage-hero-flare-b" />
        <div className="homepage-hero-ribbon homepage-hero-ribbon-a" />
        <div className="homepage-hero-ribbon homepage-hero-ribbon-b" />
        <div className="homepage-hero-grid" />
        <div className="hero-orb left-[5%] top-10 h-32 w-32 bg-cyan-400/20 animate-float" />
        <div className="hero-orb right-[8%] top-24 h-24 w-24 bg-fuchsia-400/20 animate-float-delayed" />
        <div className="hero-orb bottom-8 left-[42%] h-28 w-28 bg-emerald-300/20 animate-float" />
        <div className="hero-orb left-[16%] top-[18%] h-40 w-40 bg-amber-300/18 animate-float-long" />
        <div className="hero-orb right-[22%] bottom-[16%] h-44 w-44 bg-amber-200/14 animate-drift-diagonal" />
        <div className="hero-orb left-[22%] top-[8%] h-24 w-24 bg-rose-400/24 animate-pulse-soft" />
        <div className="hero-orb right-[14%] top-[14%] h-32 w-32 bg-lime-300/16 animate-float-delayed" />

        <div className="relative grid gap-8 xl:grid-cols-[1.04fr_0.96fr]">
          <div>
            <div className="glass-chip mb-4 border-cyan-300/30 bg-cyan-300/10 text-cyan-100 shadow-[0_14px_40px_rgba(34,211,238,0.12)]">
              {tr(language, {
                en: 'AI decision engine for dropshipping, e-commerce & startups',
                pl: 'Silnik decyzji AI dla dropshippingu, e-commerce i startupów',
                de: 'Decision Intelligence zur Verlustreduktion und Chancenfindung',
                es: 'Inteligencia de decisión para reducir pérdidas y encontrar upside',
                pt: 'Inteligência de decisão criada para reduzir perdas e encontrar upside',
                ru: 'Интеллект решений, созданный для снижения потерь и поиска роста',
              })}
            </div>
            <h1 className="hero-headline text-balance max-w-4xl text-[clamp(3.2rem,5.4vw,5.8rem)] font-black leading-[0.9] tracking-[-0.055em] text-white [text-wrap:balance]">
              <HeroWordReveal
                durationMs={15000}
                text={tr(language, {
                  en: 'Stop losing money on bad products.',
                  pl: 'Przestań tracić pieniądze na złe produkty.',
                  de: 'Hör auf, Geld mit schlechten Produkten zu verlieren.',
                  es: 'Deja de perder dinero con productos equivocados.',
                  pt: 'Para de perder dinheiro com produtos errados.',
                  ru: 'Перестань терять деньги на плохих продуктах.',
                })}
              />
            </h1>
            <p className="mt-6 max-w-3xl text-[1.04rem] leading-8 text-slate-300 sm:text-[1.12rem] sm:leading-9">
              {tr(language, {
                en: 'Analyze any product before you spend money. Get an AI decision: BUY, TEST, or SKIP — with real margin, risk insights, and a safer next step.',
                pl: 'Przeanalizuj każdy produkt zanim wydasz pieniądze. Dostań decyzję AI: BUY, TEST lub SKIP — z realną marżą, analizą ryzyka i bezpieczniejszym kolejnym krokiem.',
                de: 'Analysiere jedes Produkt bevor du Geld ausgibst. Erhalte eine KI-Entscheidung: BUY, TEST oder SKIP — mit echten Margen- und Risikoeinblicken.',
                es: 'Analiza cualquier producto antes de gastar dinero. Obtén una decisión AI: BUY, TEST o SKIP — con margen real e insights de riesgo.',
                pt: 'Analisa qualquer produto antes de gastar dinheiro. Obtém uma decisão AI: BUY, TEST ou SKIP — com margem real e análise de risco.',
                ru: 'Анализируй любой продукт до того, как тратить деньги. Получай AI-решение: ПОКУПАТЬ, ТЕСТИРОВАТЬ или ПРОПУСТИТЬ — с реальной маржой и анализом рисков.',
              })}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/dashboard" className="rounded-2xl bg-[linear-gradient(135deg,rgba(34,211,238,1),rgba(16,185,129,0.95),rgba(59,130,246,0.96))] px-6 py-4 font-semibold text-slate-950 shadow-[0_22px_70px_rgba(34,211,238,0.28)] transition duration-300 hover:scale-[1.02] hover:shadow-[0_28px_80px_rgba(34,211,238,0.34)]">
                {tr(language, {
                  en: '👉 Analyze product now — free',
                  pl: '👉 Analizuj produkt teraz — za darmo',
                  de: '👉 Produkt jetzt analysieren — kostenlos',
                  es: '👉 Analizar producto ahora — gratis',
                  pt: '👉 Analisar produto agora — grátis',
                  ru: '👉 Анализировать продукт сейчас — бесплатно',
                })}
              </Link>
              <Link href="/pricing" className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-4 font-semibold transition duration-300 hover:-translate-y-[1px] hover:bg-white/5 hover:shadow-[0_18px_45px_rgba(2,6,23,0.24)]">
                {tr(language, {
                  en: 'View pricing',
                  pl: 'Zobacz cennik',
                  de: 'Preise ansehen',
                  es: 'Ver precios',
                  pt: 'Ver preços',
                  ru: 'Посмотреть тарифы',
                })}
              </Link>
              <Link href="/example-verdicts" className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-6 py-4 font-semibold text-cyan-50 transition duration-300 hover:-translate-y-[1px] hover:border-cyan-200/40 hover:bg-cyan-300/15">
                {tr(language, {
                  en: 'See example verdicts',
                  pl: 'Zobacz przykładowe werdykty',
                })}
              </Link>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                tr(language, { en: '1 input: URL, oferta, dokument lub plik', pl: '1 input: URL, oferta, dokument albo plik' }),
                tr(language, { en: '1 output: BUY, TEST, SKIP or cut the cost', pl: '1 wynik: BUY, TEST, SKIP albo tnij koszt' }),
                tr(language, { en: 'Built to stop budget burn in e-commerce and beyond', pl: 'Zbudowane, by zatrzymać przepalanie budżetu w e-commerce i nie tylko' }),
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-slate-200 shadow-[0_12px_30px_rgba(2,6,23,0.14)]">
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                tr(language, {
                  en: 'AI vision for screenshots',
                  pl: 'AI vision dla screenshotów',
                  de: 'AI-Vision für Screenshots',
                  es: 'AI vision para capturas',
                  pt: 'IA visual para capturas',
                  ru: 'AI-зрение для скриншотов',
                }),
                tr(language, {
                  en: 'Weighted video analysis',
                  pl: 'Ważona analiza wideo',
                  de: 'Gewichtete Videoanalyse',
                  es: 'Análisis de vídeo ponderado',
                  pt: 'Análise de vídeo ponderada',
                  ru: 'Взвешенный анализ видео',
                }),
                tr(language, {
                  en: 'PDF & document reading',
                  pl: 'Odczyt PDF i dokumentów',
                  de: 'PDF- & Dokumentlese',
                  es: 'Lectura de PDF y documentos',
                  pt: 'Leitura de PDF e documentos',
                  ru: 'Чтение PDF и документов',
                }),
                tr(language, {
                  en: 'Protected pricing logic',
                  pl: 'Chroniona logika cenowa',
                  de: 'Geschützte Preislogik',
                  es: 'Lógica de precios protegida',
                  pt: 'Lógica de preços protegida',
                  ru: 'Защищённая ценовая логика',
                }),
              ].map((item) => (
                <span key={item} className="glass-chip animate-pulse-soft border-white/10 bg-white/[0.04] text-slate-100">{item}</span>
              ))}
            </div>
          </div>

          <div className="grid content-start gap-5">
            <div className="premium-panel hover-lift overflow-hidden p-5 sm:p-6">
              <div className="mb-4 rounded-[24px] border border-cyan-300/20 bg-[linear-gradient(135deg,rgba(34,211,238,0.16),rgba(8,47,73,0.2),rgba(2,6,23,0.55))] p-4 shadow-[0_14px_40px_rgba(34,211,238,0.10)]">
                <div className="text-[11px] uppercase tracking-[0.22em] text-cyan-100">{tr(language, { en: 'What you unlock fast', pl: 'Co odblokowujesz od razu' })}</div>
                <div className="mt-2 text-2xl font-black text-white">{tr(language, { en: 'From raw input to a clear verdict, safer next step, and better confidence.', pl: 'Od surowych danych do jasnego werdyktu, bezpieczniejszego kolejnego kroku i większej pewności.' })}</div>
              </div>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-200">
                    {tr(language, {
                      en: 'Built for real input',
                      pl: 'Zbudowane pod realny input',
                      de: 'Für echten Input gebaut',
                      es: 'Hecho para input real',
                      pt: 'Feito para input real',
                      ru: 'Сделано для реальных данных',
                    })}
                  </div>
                  <div className="text-balance mt-2 max-w-xl text-[clamp(1.95rem,3vw,2.7rem)] font-black leading-[0.96] tracking-[-0.035em] text-white">
                    {tr(language, {
                      en: 'URL, PDF, screenshots, videos, supplier offers, startup notes, invoices.',
                      pl: 'URL, PDF, screenshoty, wideo, oferty dostawców, notatki startupowe, faktury.',
                      de: 'URL, PDF, Screenshots, Startup-Notizen, Rechnungen.',
                      es: 'URL, PDF, capturas, notas de startup, facturas.',
                      pt: 'URL, PDF, capturas de ecrã, notas de startup, faturas.',
                      ru: 'URL, PDF, скриншоты, заметки стартапа, счета.',
                    })}
                  </div>
                </div>
                <div className="glass-chip text-cyan-100">{tr(language, { en: 'Global UI refresh', pl: 'Globalny refresh UI', de: 'Globales UI-Refresh', es: 'Refresh global UI', pt: 'Atualização global da UI', ru: 'Глобальное обновление UI' })}</div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_18px_45px_rgba(2,6,23,0.18)]">
                  <div className="text-xs uppercase tracking-[0.22em] text-emerald-200">{tr(language, { en: 'Product & offer analysis', pl: 'Analiza produktu i oferty', de: 'Produkt- und Angebotsanalyse', es: 'Análisis de producto y oferta', pt: 'Análise de produto e oferta', ru: 'Анализ продукта и предложения' })}</div>
                  <div className="mt-3 text-lg font-black leading-7 tracking-[-0.02em] text-white sm:text-[1.35rem]">{tr(language, { en: 'BUY / TEST / SKIP', pl: 'BUY / TEST / SKIP', de: 'KAUFEN / TESTEN / VERMEIDEN', es: 'COMPRAR / PROBAR / EVITAR', pt: 'COMPRAR / TESTAR / EVITAR', ru: 'ПОКУПАТЬ / ТЕСТИРОВАТЬ / ИЗБЕГАТЬ' })}</div>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{tr(language, { en: 'Margin, risk, confidence, anti-loss warnings, and a practical next move for stores, offers, and sourcing.', pl: 'Marża, ryzyko, pewność, ostrzeżenia anty-stratowe i praktyczny kolejny ruch dla sklepów, ofert i sourcingu.', de: 'Marge, Risiko, Sicherheit, Anti-Loss-Warnungen und ein klügerer erster Schritt.', es: 'Margen, riesgo, confianza, alertas anti-pérdida y un primer paso más inteligente.', pt: 'Margem, risco, confiança, alertas anti-loss e um primeiro passo mais inteligente.', ru: 'Маржа, риск, уверенность, anti-loss предупреждения и более умный первый шаг.' })}</p>
                </div>
                <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_18px_45px_rgba(2,6,23,0.18)]">
                  <div className="text-xs uppercase tracking-[0.22em] text-amber-200">{tr(language, { en: 'Cost & invoice optimization', pl: 'Optymalizacja kosztów i faktur', de: 'Kosten- und Rechnungsoptimierung', es: 'Optimización de costes y facturas', pt: 'Otimização de custos e faturas', ru: 'Оптимизация затрат и счетов' })}</div>
                  <div className="mt-3 text-lg font-black leading-7 tracking-[-0.02em] text-white sm:text-[1.35rem]">{tr(language, { en: 'Reduce / keep / review', pl: 'Obniż / zostaw / sprawdź', de: 'Senken / lassen / prüfen', es: 'Reducir / mantener / revisar', pt: 'Reduzir / manter / rever', ru: 'Снизить / оставить / проверить' })}</div>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{tr(language, { en: 'Find money leaks, estimate savings, and get concrete next actions for invoices, suppliers, tools, and operations.', pl: 'Wykrywaj przecieki kosztowe, szacuj oszczędności i dostawaj konkretne następne kroki dla faktur, dostawców, narzędzi i operacji.', de: 'Kostenlecks finden, Einsparungen schätzen und konkrete nächste Schritte erhalten.', es: 'Detecta fugas de dinero, estima ahorro y recibe siguientes acciones concretas.', pt: 'Encontre fugas de dinheiro, estime poupanças e receba próximos passos concretos.', ru: 'Находи утечки денег, оценивай экономию и получай конкретные следующие шаги.' })}</p>
                </div>
              </div>
              <div className="mt-4 rounded-[28px] border border-fuchsia-300/20 bg-[linear-gradient(135deg,rgba(168,85,247,0.18),rgba(15,23,42,0.86),rgba(34,211,238,0.08))] p-5 shadow-[0_20px_60px_rgba(88,28,135,0.18)]">
                <div className="text-xs uppercase tracking-[0.22em] text-fuchsia-200">{tr(language, { en: 'Video analysis and token protection', pl: 'Analiza wideo i ochrona tokenów' })}</div>
                <div className="mt-3 text-[1.35rem] font-black leading-7 tracking-[-0.02em] text-white">{tr(language, { en: 'Reads video frames, hook, product demo, and message clarity.', pl: 'Czyta klatki wideo, hook, demo produktu i klarowność przekazu.' })}</div>
                <p className="mt-3 text-sm leading-7 text-slate-200">{tr(language, { en: 'UFREV already supports MP4, MOV, WEBM, and AVI analysis through extracted preview frames and metadata. Video work uses more weighted AI tokens than light text or image tasks, so heavier media stays profitable instead of quietly eating your margin.', pl: 'UFREV już obsługuje analizę MP4, MOV, WEBM i AVI przez wyodrębnione klatki podglądowe oraz metadane. Praca na wideo zużywa więcej ważonych tokenów AI niż lekki tekst lub obraz, dzięki czemu cięższe media pozostają opłacalne zamiast po cichu zjadać marżę.' })}</p>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              {[
                {
                  eyebrow: tr(language, { en: 'Fast verdict', pl: 'Szybki werdykt' }),
                  title: tr(language, { en: 'One clear answer', pl: 'Jedna jasna odpowiedź' }),
                  text: tr(language, { en: 'The first screen should immediately show if the idea deserves action or not.', pl: 'Pierwszy ekran ma od razu pokazać, czy pomysł zasługuje na działanie czy nie.' }),
                  tone: 'text-cyan-200',
                },
                {
                  eyebrow: tr(language, { en: 'Safer money flow', pl: 'Bezpieczniejszy przepływ pieniędzy' }),
                  title: tr(language, { en: 'Budget before hype', pl: 'Budżet przed hype' }),
                  text: tr(language, { en: 'Margin, cost and pressure should be visible before anyone scales traffic.', pl: 'Marża, koszt i presja mają być widoczne zanim ktoś zacznie skalować ruch.' }),
                  tone: 'text-emerald-200',
                },
                {
                  eyebrow: tr(language, { en: 'Real operator view', pl: 'Realny widok operatora' }),
                  title: tr(language, { en: 'Less clutter, more signal', pl: 'Mniej chaosu, więcej sygnału' }),
                  text: tr(language, { en: 'Big UI blocks and stronger hierarchy make the product feel more decisive.', pl: 'Duże bloki UI i mocniejsza hierarchia sprawiają, że produkt wygląda bardziej decyzyjnie.' }),
                  tone: 'text-violet-200',
                },
              ].map((item) => (
                <div key={item.title} className="rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(15,23,42,0.55))] p-5 shadow-[0_18px_45px_rgba(2,6,23,0.2)]">
                  <div className={`text-[11px] uppercase tracking-[0.22em] ${item.tone}`}>{item.eyebrow}</div>
                  <div className="mt-3 text-[1.35rem] font-black leading-[1.02] tracking-[-0.03em] text-white">{item.title}</div>
                  <p className="mt-2 text-sm leading-7 text-slate-300">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative mt-8">
          <div className="mb-6 grid gap-4 xl:grid-cols-3">
            <MetricCard
              label={tr(language, { en: 'Core value', pl: 'Główna wartość', de: 'Kernwert', es: 'Valor principal', pt: 'Valor central', ru: 'Ключевая ценность' })}
              value={tr(language, { en: 'Stop weak decisions earlier', pl: 'Zatrzymuj słabe decyzje wcześniej', de: 'Sicherere Entscheidungen', es: 'Decisiones más seguras', pt: 'Decisões mais seguras', ru: 'Более безопасные решения' })}
              delta={tr(language, { en: 'Less guessing for clients, shops, and teams', pl: 'Mniej zgadywania dla klientów, sklepów i zespołów', de: 'Weniger Raten, weniger Burn', es: 'Menos suposiciones, menos burn', pt: 'Menos adivinhação, menos desperdício', ru: 'Меньше догадок, меньше потерь' })}
              tone="cyan"
            />
            <MetricCard
              label={tr(language, { en: 'Monetization', pl: 'Monetyzacja', de: 'Monetarisierung', es: 'Monetización', pt: 'Monetização', ru: 'Монетизация' })}
              value={tr(language, { en: 'Free + Starter + Pro + Scale', pl: 'Free + Starter + Pro + Scale', de: 'Abos + AI-Tokens + Upsells', es: 'Suscripciones + tokens AI + upsells', pt: 'Subscrições + tokens AI + upsells', ru: 'Подписки + AI-токены + апселлы' })}
              delta={tr(language, { en: 'Affordable path from first check to full ops', pl: 'Przystępna ścieżka od pierwszego checku do pełnej operacji', de: 'Für MRR gebaut', es: 'Diseñado para MRR', pt: 'Feito para MRR', ru: 'Построено для MRR' })}
              tone="emerald"
            />
            <MetricCard
              label={tr(language, { en: 'Coverage', pl: 'Zakres', de: 'Abdeckung', es: 'Cobertura', pt: 'Cobertura', ru: 'Охват' })}
              value={tr(language, { en: 'Products, sourcing, costs, and startup ideas', pl: 'Produkty, sourcing, koszty i pomysły startupowe', de: 'Produkte + Kosten + Startup-Ideen', es: 'Productos + costes + ideas startup', pt: 'Produtos + custos + ideias de startup', ru: 'Товары + затраты + идеи стартапов' })}
              delta={tr(language, { en: 'Works for users, stores, and firms', pl: 'Działa dla userów, sklepów i firm', de: 'Mehr Rückkehrgründe', es: 'Más razones para volver', pt: 'Mais motivos para voltar', ru: 'Больше причин вернуться' })}
              tone="violet"
            />
          </div>

          <InteractiveDemoPreview
            language={language}
            liveMetrics={{
              setupConfigured: isSupabaseConfigured,
              warningCount: warnings.length,
              supportedInputCount: 6,
              supportedVideoFormats: 4,
              decisionStateCount: 3,
              liveSourceUrl: 'https://supplier.example.com/product/portable-blender',
            }}
            liveCase={latestPreviewCase}
          />
        </div>
      </section>

      <section className="mt-8 rounded-[32px] border border-red-500/20 bg-[linear-gradient(135deg,rgba(239,68,68,0.08),rgba(15,23,42,0.9),rgba(2,6,23,0.95))] p-8 shadow-[0_20px_60px_rgba(239,68,68,0.08)]">
        <div className="text-center">
          <div className="glass-chip mx-auto mb-4 inline-block border-red-400/30 bg-red-400/10 text-red-200">
            {tr(language, { en: '⚠️ The real problem', pl: '⚠️ Prawdziwy problem', de: '⚠️ Das echte Problem', es: '⚠️ El problema real', pt: '⚠️ O problema real', ru: '⚠️ Настоящая проблема' })}
          </div>
          <h2 className="text-[clamp(1.8rem,3vw,2.8rem)] font-black leading-tight text-white">
            {tr(language, {
              en: 'Most e-commerce founders lose money before finding a winning product.',
              pl: 'Większość e-commerce founders traci pieniądze zanim znajdzie zwycięski produkt.',
              de: 'Die meisten E-Commerce-Gründer verlieren Geld, bevor sie ein Gewinnprodukt finden.',
              es: 'La mayoría de fundadores de e-commerce pierde dinero antes de encontrar un producto ganador.',
              pt: 'A maioria dos fundadores de e-commerce perde dinheiro antes de encontrar um produto vencedor.',
              ru: 'Большинство основателей e-commerce теряют деньги до того, как находят выигрышный продукт.',
            })}
          </h2>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: '🔥',
              title: tr(language, { en: 'Testing blindly', pl: 'Testowanie na ślepo', de: 'Blindes Testen', es: 'Probar a ciegas', pt: 'Testar às cegas', ru: 'Слепое тестирование' }),
              text: tr(language, { en: 'Running ads on products without knowing the margin or risk first.', pl: 'Reklamy na produkty bez znajomości marży i ryzyka.', de: 'Werbung schalten ohne Marge und Risiko zu kennen.', es: 'Lanzar anuncios sin conocer el margen o el riesgo.', pt: 'Lançar anúncios sem conhecer a margem ou o risco.', ru: 'Запуск рекламы без знания маржи и риска.' }),
            },
            {
              icon: '💸',
              title: tr(language, { en: 'Burning ad budget', pl: 'Przepalanie budżetu reklamowego', de: 'Werbebudget verbrennen', es: 'Quemar presupuesto publicitario', pt: 'Queimar orçamento de anúncios', ru: 'Сжигание рекламного бюджета' }),
              text: tr(language, { en: 'Spending thousands on ads before validating if the product actually converts.', pl: 'Tysiące wydane na reklamy zanim sprawdzi się, czy produkt w ogóle konwertuje.', de: 'Tausende für Werbung ausgeben, bevor man prüft ob das Produkt konvertiert.', es: 'Gastar miles en anuncios antes de validar si el producto convierte.', pt: 'Gastar milhares em anúncios antes de validar se o produto converte.', ru: 'Тысячи на рекламу до проверки конверсии продукта.' }),
            },
            {
              icon: '🎲',
              title: tr(language, { en: 'Guessing instead of knowing', pl: 'Zgadywanie zamiast wiedzy', de: 'Raten statt Wissen', es: 'Adivinar en vez de saber', pt: 'Adivinhar em vez de saber', ru: 'Догадки вместо знаний' }),
              text: tr(language, { en: 'No data on competition, real demand, or margin before you invest time and money.', pl: 'Brak danych o konkurencji, realnym popycie i marży przed inwestycją czasu i pieniędzy.', de: 'Keine Daten zu Konkurrenz, Nachfrage oder Marge vor dem Invest.', es: 'Sin datos de competencia, demanda real o margen antes de invertir.', pt: 'Sem dados de concorrência, procura real ou margem antes de investir.', ru: 'Нет данных о конкуренции, спросе и марже до инвестирования.' }),
            },
          ].map((item) => (
            <div key={item.title} className="rounded-[24px] border border-red-400/15 bg-red-400/5 p-5">
              <div className="text-2xl">{item.icon}</div>
              <div className="mt-3 text-lg font-bold text-white">{item.title}</div>
              <p className="mt-2 text-sm leading-7 text-slate-300">{item.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 text-center">
          <p className="text-lg font-semibold text-slate-200">
            {tr(language, {
              en: "👉 You don't need more tools. You need better decisions.",
              pl: '👉 Nie potrzebujesz więcej narzędzi. Potrzebujesz lepszych decyzji.',
              de: '👉 Du brauchst keine weiteren Tools. Du brauchst bessere Entscheidungen.',
              es: '👉 No necesitas más herramientas. Necesitas mejores decisiones.',
              pt: '👉 Não precisas de mais ferramentas. Precisas de melhores decisões.',
              ru: '👉 Тебе не нужно больше инструментов. Тебе нужны лучшие решения.',
            })}
          </p>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-4">
        {[
          {
            title: tr(language, { en: 'Visual AI', pl: 'Visual AI', de: 'Visual AI', es: 'Visual AI', pt: 'IA visual', ru: 'Визуальный AI' }),
            text: tr(language, { en: 'Reads screenshots, product images, and interface views.', pl: 'Czyta screenshoty, zdjęcia produktów i widoki interfejsu.', de: 'Liest Screenshots, Produktbilder und Interface-Ansichten.', es: 'Lee capturas, imágenes de producto y vistas de interfaz.', pt: 'Lê capturas, imagens de produto e vistas da interface.', ru: 'Читает скриншоты, изображения товаров и виды интерфейса.' }),
            tone: 'text-cyan-200',
          },
          {
            title: tr(language, { en: 'Document layer', pl: 'Warstwa dokumentów', de: 'Dokument-Ebene', es: 'Capa documental', pt: 'Camada documental', ru: 'Документный слой' }),
            text: tr(language, { en: 'Understands PDFs, text files, and structured notes.', pl: 'Rozumie PDF-y, pliki tekstowe i ustrukturyzowane notatki.', de: 'Versteht PDFs, Textdateien und strukturierte Notizen.', es: 'Entiende PDFs, archivos de texto y notas estructuradas.', pt: 'Compreende PDFs, ficheiros de texto e notas estruturadas.', ru: 'Понимает PDF, текстовые файлы и структурированные заметки.' }),
            tone: 'text-emerald-200',
          },
          {
            title: tr(language, { en: 'Video reading', pl: 'Odczyt wideo', de: 'Videolesen', es: 'Lectura de vídeo', pt: 'Leitura de vídeo', ru: 'Чтение видео' }),
            text: tr(language, { en: 'Reads preview frames and metadata from video, then applies heavier token usage so long-form media does not erode margin.', pl: 'Czyta klatki podglądowe i metadane z wideo, a następnie stosuje cięższe użycie tokenów, aby dłuższe media nie zjadały marży.', de: 'Liest Vorschaubilder und Metadaten aus Video und stosuje cięższe użycie tokenów dla cięższych mediów.', es: 'Lee fotogramas y metadatos del vídeo y aplica un uso de tokens más pesado para proteger el margen.', pt: 'Lê frames de pré-visualização e metadados do vídeo e aplica mais tokens para proteger a margem.', ru: 'Читает превью-кадры и метаданные видео и применяет более тяжёлое списание токенов, чтобы защитить маржу.' }),
            tone: 'text-fuchsia-200',
          },
          {
            title: tr(language, { en: 'Protected pricing', pl: 'Chronione ceny', de: 'Geschützte Preise', es: 'Precios protegidos', pt: 'Preços protegidos', ru: 'Защищённые цены' }),
            text: tr(language, { en: 'Keeps margin, risk, and token logic visible.', pl: 'Utrzymuje marżę, ryzyko i logikę tokenów w zasięgu wzroku.', de: 'Hält Marge, Risiko und Token-Logik sichtbar.', es: 'Mantiene margen, riesgo y lógica de tokens visibles.', pt: 'Mantém margem, risco e lógica de tokens sempre visíveis.', ru: 'Держит маржу, риск и логику токенов на виду.' }),
            tone: 'text-violet-200',
          },
        ].map((item) => (
          <div key={item.title} className="hover-lift rounded-[24px] border border-white/10 bg-slate-950/60 p-5">
            <div className={`text-[11px] uppercase tracking-[0.22em] ${item.tone}`}>{tr(language, { en: 'Live layer', pl: 'Warstwa live', de: 'Live-Ebene', es: 'Capa live', pt: 'Camada live', ru: 'Живой слой' })}</div>
            <div className="mt-2 text-xl font-bold text-white">{item.title}</div>
            <p className="mt-2 text-sm text-slate-300">{item.text}</p>
          </div>
        ))}
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          {
            step: tr(language, { en: 'Step 01', pl: 'Krok 01', de: 'Schritt 01', es: 'Paso 01', pt: 'Passo 01', ru: 'Шаг 01' }),
            title: tr(language, { en: 'Add your real input', pl: 'Dodaj realne dane', de: 'Füge echte Daten hinzu', es: 'Dodaj realne dane', pt: 'Adiciona o input real', ru: 'Добавь реальные данные' }),
            text: tr(language, { en: 'Paste a URL, upload a screenshot, PDF, invoice or a startup idea — whatever you actually want to validate.', pl: 'Wklej URL, wrzuć screenshot, PDF, fakturę albo pomysł startupowy — cokolwiek chcesz realnie zwalidować.', de: 'Füge URL, Screenshot, PDF, Rechnung oder Startup-Idee ein — alles, was du validieren willst.', es: 'Pega una URL, sube una captura, un PDF, una factura o una idea startup para validarla.', pt: 'Cola um URL, envia uma captura, PDF, fatura ou ideia para validação.', ru: 'Вставь URL, загрузи скриншот, PDF, счёт или идею стартапа — всё, что хочешь проверить.' }),
            tone: 'text-cyan-200',
          },
          {
            step: tr(language, { en: 'Step 02', pl: 'Krok 02', de: 'Schritt 02', es: 'Paso 02', pt: 'Passo 02', ru: 'Шаг 02' }),
            title: tr(language, { en: 'Read one clear verdict', pl: 'Przeczytaj jeden jasny werdykt', de: 'Lies ein klares Urteil', es: 'Lee un veredicto claro', pt: 'Lê um veredito claro', ru: 'Получи один ясный вердикт' }),
            text: tr(language, { en: 'Instead of drowning in research, you see what to buy, test, avoid, reduce, renegotiate or optimize next.', pl: 'Zamiast tonąć w researchu, od razu widzisz co kupić, testować, odrzucić, obniżyć, renegocjować albo zoptymalizować.', de: 'Statt in Recherche zu tonnen, siehst du sofort, was kaufen, testen oder vermeiden.', es: 'En vez de perderte en research, ves qué comprar, probar, evitar o renegociar.', pt: 'Em vez de te perderes em pesquisa, vês logo o que comprar, testar, evitar ou renegociar.', ru: 'Вместо долгого ресерча ты сразу видишь, что покупать, тестировать, избегать или пересматривать.' }),
            tone: 'text-emerald-200',
          },
          {
            step: tr(language, { en: 'Step 03', pl: 'Krok 03', de: 'Schritt 03', es: 'Paso 03', pt: 'Passo 03', ru: 'Шаг 03' }),
            title: tr(language, { en: 'Move forward with less risk', pl: 'Działaj dalej z mniejszym ryzykiem', de: 'Mach weiter mit weniger Risiko', es: 'Avanza con menos riesgo', pt: 'Avança com menos risco', ru: 'Двигайся дальше с меньшим риском' }),
            text: tr(language, { en: 'Use the next-step guidance and anti-loss logic to act faster without burning budget blindly.', pl: 'Użyj rekomendacji kolejnego kroku i logiki anti-loss, by działać szybciej bez ślepego przepalania budżetu.', de: 'Nutze die Handlungsempfehlung und Anti-Loss-Logik, um schneller und sicherer zu handeln.', es: 'Usa la recomendación del siguiente paso y la lógica anti-loss para actuar más rápido y con menos riesgo.', pt: 'Usa a recomendação do próximo passo e a lógica anti-loss para agir mais rápido e com menos risco.', ru: 'Используй следующий шаг и anti-loss логику, чтобы действовать быстрее и безопаснее.' }),
            tone: 'text-violet-200',
          },
        ].map((item) => (
          <div key={item.title} className="hover-lift rounded-[24px] border border-white/10 bg-slate-950/60 p-5">
            <div className={`text-[11px] uppercase tracking-[0.22em] ${item.tone}`}>{item.step}</div>
            <div className="mt-2 text-xl font-bold text-white">{item.title}</div>
            <p className="mt-2 text-sm leading-7 text-slate-300">{item.text}</p>
          </div>
        ))}
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <InsightPanel language={language}
          title={tr(language, { en: 'Why people stay with the product', pl: 'Dlaczego ludzie zostają z produktem', de: 'Warum Nutzer bleiben', es: 'Por qué la gente se queda', pt: 'Porque as pessoas ficam com o produto', ru: 'Почему люди остаются с продуктом' })}
          items={[
            tr(language, { en: 'Because the tool cuts decision time from research hours to minutes.', pl: 'Bo narzędzie skraca czas decyzji z godzin researchu do minut.', de: 'Weil das Tool Entscheidungszeit von Stunden auf Minuten verkürzt.', es: 'Porque la herramienta reduce horas de investigación a minutos.', pt: 'Porque a ferramenta reduz o tempo de decisão de horas de pesquisa para minutos.', ru: 'Потому что инструмент сокращает время принятия решения с часов исследования до минут.' }),
            tr(language, { en: 'Because the result is concrete: what to do, what to avoid, and what to test first.', pl: 'Bo wynik jest konkretny: co zrobić, czego unikać i co testować najpierw.', de: 'Weil das Ergebnis konkret ist: was tun, was vermeiden und was zuerst testen.', es: 'Porque el resultado es concreto: qué hacer, qué evitar y qué probar primero.', pt: 'Porque o resultado é concreto: o que fazer, o que evitar e o que testar primeiro.', ru: 'Потому что результат конкретный: что делать, чего избегать и что тестировать первым.' }),
            tr(language, { en: 'Because the same engine helps with products, invoices, costs, and early startup validation in one place.', pl: 'Bo ten sam silnik pomaga z produktami, fakturami, kosztami i wczesną walidacją startupu w jednym miejscu.', de: 'Weil dieselbe Engine Produkte, Rechnungen, Kosten und Startup-Validierung in einem Ort obsługuje.', es: 'Porque el mismo motor ayuda con productos, facturas, costes y validación temprana en un solo lugar.', pt: 'Porque o mesmo motor ajuda com produtos, faturas, custos e validação inicial num só lugar.', ru: 'Потому что один и тот же движок помогает с товарами, счетами, затратами и ранней проверкой стартапов в одном месте.' }),
          ]}
        />
        <DonutChart
          title={tr(language, { en: 'What the user gets', pl: 'Co dostaje użytkownik', de: 'Was der Nutzer bekommt', es: 'Qué recibe el usuario', pt: 'O que o utilizador recebe', ru: 'Что получает пользователь' })}
          value={tr(language, { en: 'Clear next move', pl: 'Jasny następny ruch', de: 'Klarer nächster Schritt', es: 'Siguiente paso claro', pt: 'Próximo passo claro', ru: 'Ясный следующий шаг' })}
          items={[
            { label: tr(language, { en: 'Product verdict', pl: 'Werdykt produktu', de: 'Produkturteil', es: 'Veredicto de producto', pt: 'Veredito do produto', ru: 'Вердикт по продукту' }), amount: tr(language, { en: 'BUY / TEST / AVOID', pl: 'KUP / TESTUJ / ODRZUĆ', de: 'KAUFEN / TESTEN / VERMEIDEN', es: 'COMPRAR / PROBAR / EVITAR', pt: 'COMPRAR / TESTAR / EVITAR', ru: 'ПОКУПАТЬ / ТЕСТИРОВАТЬ / ИЗБЕГАТЬ' }), color: '#22d3ee' },
            { label: tr(language, { en: 'Cost verdict', pl: 'Werdykt kosztowy', de: 'Kostenurteil', es: 'Veredicto de costes', pt: 'Veredito de custos', ru: 'Вердикт по затратам' }), amount: tr(language, { en: 'Reduce / keep / review', pl: 'Obniż / zostaw / sprawdź', de: 'Senken / lassen / prüfen', es: 'Reducir / mantener / revisar', pt: 'Reduzir / manter / rever', ru: 'Снизить / оставить / проверить' }), color: '#34d399' },
            { label: tr(language, { en: 'Next step', pl: 'Następny krok', de: 'Nächster Schritt', es: 'Siguiente paso', pt: 'Próximo passo', ru: 'Следующий шаг' }), amount: tr(language, { en: 'Safer first move', pl: 'Bezpieczniejszy pierwszy ruch', de: 'Sichererer erster Schritt', es: 'Primer paso más seguro', pt: 'Primeiro passo mais seguro', ru: 'Более безопасный первый шаг' }), color: '#a78bfa' },
          ]}
          language={language}
        />
      </section>
    </main>
  );
}
