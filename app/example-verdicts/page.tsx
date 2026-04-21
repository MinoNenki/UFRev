import type { Metadata } from 'next';
import ExampleVerdictShowcase from '@/components/ExampleVerdictShowcase';
import InsightPanel from '@/components/pro-ui/InsightPanel';
import { tr } from '@/lib/i18n';
import { getLanguage } from '@/lib/i18n-server';

export const metadata: Metadata = {
  title: 'Example Verdicts and Analysis Showcase',
  description: 'See animated example verdicts for product checks, document reviews, and video analysis. Explore how UFREV explains BUY, TEST, and SKIP decisions with clear reasoning.',
  alternates: { canonical: '/example-verdicts' },
};

export default async function ExampleVerdictsPage() {
  const language = await getLanguage();

  return (
    <main className="mx-auto max-w-[1600px] px-2 py-10 text-white sm:px-0 sm:py-16">
      <ExampleVerdictShowcase language={language} />

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="premium-panel p-6 sm:p-7">
          <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-200">
            {tr(language, { en: 'What this showcase proves', pl: 'Co udowadnia ten showcase' })}
          </div>
          <h2 className="mt-3 text-3xl font-black text-white">
            {tr(language, { en: 'The product does more than animate. It explains the decision like a serious operator tool.', pl: 'Produkt robi więcej niż tylko animuje. Wyjaśnia decyzję jak poważne narzędzie operatorskie.' })}
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {[
              {
                title: tr(language, { en: 'Product verdicts', pl: 'Werdykty produktowe' }),
                copy: tr(language, { en: 'Margin, competition, demand and next move shown on one board.', pl: 'Marża, konkurencja, popyt i kolejny ruch pokazane na jednej tablicy.' }),
              },
              {
                title: tr(language, { en: 'Document intelligence', pl: 'Inteligencja dokumentów' }),
                copy: tr(language, { en: 'Dense PDFs stop being opaque and become anti-loss decisions.', pl: 'Gęste PDF-y przestają być nieczytelne i stają się decyzjami anti-loss.' }),
              },
              {
                title: tr(language, { en: 'Weighted video read', pl: 'Ważony odczyt wideo' }),
                copy: tr(language, { en: 'Creative-heavy jobs stay honest on both insight and token cost.', pl: 'Cięższe zadania kreatywne pozostają uczciwe zarówno w insightach, jak i koszcie tokenów.' }),
              },
            ].map((item) => (
              <div key={item.title} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                <div className="text-lg font-black text-white">{item.title}</div>
                <p className="mt-2 text-sm leading-7 text-slate-300">{item.copy}</p>
              </div>
            ))}
          </div>
        </div>

        <InsightPanel
          language={language}
          title={tr(language, { en: 'Why this page converts better than opinions', pl: 'Dlaczego ta strona konwertuje lepiej niż opinie' })}
          items={[
            tr(language, { en: 'It shows the actual product output, not only social proof around it.', pl: 'Pokazuje realny output produktu, a nie tylko social proof wokół niego.' }),
            tr(language, { en: 'Visitors instantly see how UFREV thinks, scores risk and recommends a next move.', pl: 'Odwiedzający od razu widzą, jak UFREV myśli, ocenia ryzyko i rekomenduje kolejny ruch.' }),
            tr(language, { en: 'The rotating examples expose product, document and video strengths in one premium surface.', pl: 'Rotujące przykłady pokazują siłę produktu, dokumentów i wideo na jednej premium powierzchni.' }),
          ]}
        />
      </section>
    </main>
  );
}