import { createSupabaseServerClient } from '@/lib/supabase-server';
import type { Metadata } from 'next';
import StatusBadge from '@/components/StatusBadge';
import InsightPanel from '@/components/pro-ui/InsightPanel';
import TutorialMode, { TutorialStep } from '@/components/pro-ui/TutorialMode';
import { tr } from '@/lib/i18n';
import { getLanguage } from '@/lib/i18n-server';

export const metadata: Metadata = {
  title: 'Support for Billing, Reviews and Ecommerce Analysis',
  description: 'Contact UFREV.com support for billing, account, review and ecommerce validation issues. Get help with product analysis, dropshipping checks and subscription access.',
  alternates: { canonical: '/support' },
};

export default async function SupportPage({ searchParams }: { searchParams?: { sent?: string; error?: string } }) {
  const params = searchParams || {};
  const language = await getLanguage();
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  let tickets: Array<{ id: string; subject: string; status: string; created_at: string }> = [];
  if (user) {
    const { data } = await supabase.from('support_messages').select('id, subject, status, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10);
    tickets = data || [];
  }

  const tutorialSteps = [
    {
      step: '01',
      title: tr(language, { en: 'Send one clear message', pl: 'Wyślij jedną jasną wiadomość' }),
      description: tr(language, { en: 'Describe the issue, add the right subject, and tell us what blocked you.', pl: 'Opisz problem, dodaj dobry temat i napisz co Cię zablokowało.' }),
    },
    {
      step: '02',
      title: tr(language, { en: 'Track your recent tickets', pl: 'Śledź swoje ostatnie zgłoszenia' }),
      description: tr(language, { en: 'This makes it easy to see if your case is new, in progress, or already closed.', pl: 'Dzięki temu łatwo zobaczysz czy sprawa jest nowa, w trakcie czy już zamknięta.' }),
    },
    {
      step: '03',
      title: tr(language, { en: 'Use the support tips for faster help', pl: 'Skorzystaj z porad, aby szybciej dostać pomoc' }),
      description: tr(language, { en: 'A few details can make the support process much faster and less frustrating.', pl: 'Kilka detali może sprawić, że proces wsparcia będzie dużo szybszy i mniej frustrujący.' }),
    },
  ];

  return (
    <main className="mx-auto max-w-[1500px] px-4 py-14 text-white sm:px-6">
      <section className="mesh-panel animate-aurora relative rounded-[40px] p-8 shadow-[0_30px_140px_rgba(2,6,23,0.65)]">
        <div className="spotlight-sweep" />
        <div className="noise-overlay" />
        <div className="relative">
          <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-200">{tr(language, { en: 'Customer support you can rely on', pl: 'Wsparcie, na którym możesz polegać' })}</div>
          <h1 className="mt-4 text-5xl font-black tracking-tight">{tr(language, { en: 'Get help fast when something blocks your work', pl: 'Uzyskaj szybką pomoc, gdy coś blokuje Twoją pracę' })}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">{tr(language, { en: 'Use this page for billing questions, analysis issues, account problems, feature requests, or anything that slows you down. The goal is simple: fewer dead ends and faster answers.', pl: 'Użyj tej strony przy pytaniach o płatności, problemach z analizą, kontem, prośbach o funkcje albo wszystkim, co Cię spowalnia. Cel jest prosty: mniej ślepych uliczek i szybsze odpowiedzi.' })}</p>
        </div>
      </section>

      {(params.sent || params.error) && (
        <div className={`mt-6 rounded-2xl border p-4 ${params.sent ? 'border-emerald-300/30 bg-emerald-300/10 text-emerald-200' : 'border-rose-300/30 bg-rose-300/10 text-rose-200'}`}>
          {params.sent
            ? tr(language, { en: 'Your message has been sent. Support can now review it.', pl: 'Twoja wiadomość została wysłana. Support może już ją przejrzeć.' })
            : tr(language, { en: 'Please complete the required fields or try again.', pl: 'Uzupełnij wymagane pola albo spróbuj ponownie.' })}
        </div>
      )}

      <TutorialMode
        language={language}
        title={tr(language, { en: 'Want a guided support flow?', pl: 'Chcesz prowadzonego procesu wsparcia?' })}
        intro={tr(language, { en: 'Turn on tutorial mode to highlight where to send your request, where to track it, and how to get the best answer faster.', pl: 'Włącz tryb samouczka, aby zobaczyć gdzie wysłać zgłoszenie, gdzie je śledzić i jak szybciej dostać najlepszą odpowiedź.' })}
        steps={tutorialSteps}
        storageKey="ufrev-support-tutorial"
      >
        <TutorialStep
          step="01"
          title={tr(language, { en: 'Send your support request here', pl: 'Tutaj wyślij zgłoszenie do supportu' })}
          description={tr(language, { en: 'Use the form below to describe the problem clearly so the reply can be faster and more useful.', pl: 'Użyj formularza poniżej, aby jasno opisać problem — wtedy odpowiedź będzie szybsza i bardziej pomocna.' })}
        >
          <section className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="premium-panel p-8">
              <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-200">{tr(language, { en: 'Send a message', pl: 'Wyślij wiadomość' })}</div>
              <h2 className="mt-2 text-3xl font-black text-white">{tr(language, { en: 'Tell us what happened', pl: 'Powiedz nam co się wydarzyło' })}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">{tr(language, { en: 'The more specific you are, the faster support can help — especially if you include the page, action, or payment issue involved.', pl: 'Im bardziej konkretny opis, tym szybciej support może pomóc — szczególnie jeśli podasz stronę, akcję albo problem płatności, którego dotyczy sprawa.' })}</p>

              <form action="/api/support/create" method="post" className="mt-8 rounded-[32px] border border-white/10 bg-slate-950/60 p-8 shadow-[0_24px_100px_rgba(2,6,23,0.45)]">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><label className="mb-2 block text-sm text-slate-300">{tr(language, { en: 'Name or brand', pl: 'Imię lub marka' })}</label><input name="name" defaultValue={user?.email?.split('@')[0] ?? ''} className="input" placeholder="John or My Brand" /></div>
                  <div><label className="mb-2 block text-sm text-slate-300">{tr(language, { en: 'Email address', pl: 'Adres e-mail' })}</label><input name="email" type="email" defaultValue={user?.email ?? ''} className="input" placeholder="contact@company.com" required /></div>
                </div>
                <div className="mt-4"><label className="mb-2 block text-sm text-slate-300">{tr(language, { en: 'Subject', pl: 'Temat' })}</label><input name="subject" className="input" placeholder={tr(language, { en: 'Stripe payment issue', pl: 'Problem z płatnością Stripe' })} required /></div>
                <div className="mt-4"><label className="mb-2 block text-sm text-slate-300">{tr(language, { en: 'Message', pl: 'Wiadomość' })}</label><textarea name="message" rows={8} className="input" placeholder={tr(language, { en: 'Describe the issue or request in detail', pl: 'Opisz problem albo prośbę możliwie konkretnie' })} required /></div>
                <button className="mt-6 rounded-2xl bg-cyan-300 px-6 py-3 font-semibold text-slate-950">{tr(language, { en: 'Send to support', pl: 'Wyślij do supportu' })}</button>
              </form>
            </div>

            <div className="space-y-6">
              <div className="premium-panel p-8">
                <h2 className="mb-6 text-2xl font-bold">{tr(language, { en: 'Your recent tickets', pl: 'Twoje ostatnie zgłoszenia' })}</h2>
                <div className="space-y-4">
                  {tickets.length ? tickets.map((ticket) => (
                    <div key={ticket.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="font-semibold text-white">{ticket.subject}</div>
                        <StatusBadge label={ticket.status === 'new' ? 'new' : ticket.status === 'in_progress' ? 'in progress' : 'closed'} tone={ticket.status === 'new' ? 'amber' : ticket.status === 'in_progress' ? 'cyan' : 'emerald'} />
                      </div>
                      <div className="text-sm text-slate-400">{new Date(ticket.created_at).toLocaleString('en-US')}</div>
                    </div>
                  )) : <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-slate-300">{tr(language, { en: 'No tickets yet. You can send your first message right away.', pl: 'Nie masz jeszcze zgłoszeń. Możesz wysłać pierwszą wiadomość od razu.' })}</div>}
                </div>
              </div>
            </div>
          </section>
        </TutorialStep>

        <TutorialStep
          step="02"
          title={tr(language, { en: 'Use the quick tips below', pl: 'Skorzystaj z szybkich wskazówek poniżej' })}
          description={tr(language, { en: 'These tips help clients get answers faster and avoid unnecessary back-and-forth.', pl: 'Te wskazówki pomagają klientom szybciej dostać odpowiedź i uniknąć zbędnego odbijania się w wiadomościach.' })}
        >
          <section className="mt-8 grid gap-6 xl:grid-cols-[1fr_1fr]">
            <InsightPanel language={language} title={tr(language, { en: 'How to get faster help', pl: 'Jak szybciej dostać pomoc' })} items={[
              tr(language, { en: 'Mention the exact page or feature where the issue happened.', pl: 'Wspomnij dokładnie, na jakiej stronie albo funkcji pojawił się problem.' }),
              tr(language, { en: 'If it is a billing issue, include the plan or payment context.', pl: 'Jeśli to problem z płatnością, podaj plan albo kontekst płatności.' }),
              tr(language, { en: 'If possible, describe what you expected and what happened instead.', pl: 'Jeśli możesz, opisz co miało się wydarzyć i co stało się zamiast tego.' }),
            ]} />
            <InsightPanel language={language} title={tr(language, { en: 'What support usually helps with', pl: 'W czym support najczęściej pomaga' })} items={[
              tr(language, { en: 'Login, access, or account configuration problems.', pl: 'Problemy z logowaniem, dostępem albo konfiguracją konta.' }),
              tr(language, { en: 'Billing, upgrades, token balance, and payment questions.', pl: 'Pytania o płatności, upgrade, saldo tokenów i rozliczenia.' }),
              tr(language, { en: 'Analysis issues, unclear results, or feature suggestions.', pl: 'Problemy z analizą, niejasne wyniki albo sugestie funkcji.' }),
            ]} />
          </section>
        </TutorialStep>
      </TutorialMode>
    </main>
  );
}
