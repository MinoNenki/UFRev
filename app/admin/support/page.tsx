import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase-admin';
import StatusBadge from '@/components/StatusBadge';
import MetricCard from '@/components/pro-ui/MetricCard';
import TutorialMode, { TutorialStep } from '@/components/pro-ui/TutorialMode';
import { tr } from '@/lib/i18n';
import { getLanguage } from '@/lib/i18n-server';

export default async function AdminSupportPage() {
  const language = await getLanguage();
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) redirect('/dashboard');

  const locale = language === 'pl' ? 'pl-PL' : language === 'es' ? 'es-ES' : language === 'ru' ? 'ru-RU' : 'en-US';
  const [{ count: newMessages }, { count: inProgressMessages }, { count: closedMessages }, { data: messages }] = await Promise.all([
    supabaseAdmin.from('support_messages').select('*', { count: 'exact', head: true }).eq('status', 'new'),
    supabaseAdmin.from('support_messages').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
    supabaseAdmin.from('support_messages').select('*', { count: 'exact', head: true }).eq('status', 'closed'),
    supabaseAdmin.from('support_messages').select('*').order('created_at', { ascending: false }).limit(100),
  ]);
  const tutorialSteps = [
    {
      step: '01',
      title: tr(language, { en: 'Read queue pressure first', pl: 'Najpierw odczytaj presję kolejki' }),
      description: tr(language, { en: 'The summary cards show whether support is filling with new risk, active cases, or healthy closure.', pl: 'Karty podsumowania pokazują czy support wypełnia się nowym ryzykiem, aktywnymi sprawami czy zdrowym domykaniem.' }),
    },
    {
      step: '02',
      title: tr(language, { en: 'Triaging comes second', pl: 'Triaging jest drugim krokiem' }),
      description: tr(language, { en: 'After reading pressure, move through the list and route each case cleanly from new to in progress or closed.', pl: 'Po odczytaniu presji przejdź przez listę i czytelnie routuj każdą sprawę od nowych do w toku lub zamkniętych.' }),
    },
  ];

  return (
    <main className="mx-auto max-w-[1600px] px-6 py-16 text-white">
      <section className="mesh-panel relative overflow-hidden p-8 shadow-[0_30px_140px_rgba(2,6,23,0.65)]">
        <div className="spotlight-sweep" />
        <div className="noise-overlay" />
        <div className="relative">
          <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-200">{tr(language, { en: 'Admin / support', pl: 'Admin / support', es: 'Admin / soporte', ru: 'Admin / support' })}</div>
          <h1 className="mt-4 text-5xl font-black tracking-tight sm:text-6xl">{tr(language, { en: 'Support response control room', pl: 'Centrum reakcji supportu', es: 'Sala de control de soporte', ru: 'Центр управления support' })}</h1>
          <p className="mt-5 max-w-4xl text-lg leading-8 text-slate-300">{tr(language, { en: 'Keep risk, ticket urgency, and customer trust in one visible queue with faster status routing.', pl: 'Trzymaj ryzyko, pilność zgłoszeń i zaufanie klienta w jednej widocznej kolejce z szybszym routingiem statusów.', es: 'Mantén riesgo, urgencia y confianza del cliente en una cola visible con un ruteo de estados más rápido.', ru: 'Держи риск, срочность тикетов и доверие клиента в одной видимой очереди с более быстрым routing статусов.' })}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/admin" className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/30 hover:bg-white/[0.07]">{tr(language, { en: '← Back to control center', pl: '← Wróć do centrum kontroli', es: '← Volver al centro de control', ru: '← Назад в центр управления' })}</Link>
            <Link href="/admin/automations" className="rounded-2xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-3 text-sm font-semibold text-cyan-50 transition hover:bg-cyan-300/15">{tr(language, { en: 'Open automation lane', pl: 'Otwórz tor automatyzacji', es: 'Abrir carril de automatización', ru: 'Открыть линию автоматизации' })}</Link>
          </div>
        </div>
      </section>

      <TutorialMode
        language={language}
        title={tr(language, { en: 'Need a support walkthrough?', pl: 'Potrzebujesz przewodnika po support?' })}
        intro={tr(language, { en: 'Turn on guide mode to read support in order: queue pressure first, then ticket triage and status routing.', pl: 'Włącz tryb przewodnika, aby czytać support po kolei: najpierw presję kolejki, potem triage zgłoszeń i routing statusów.' })}
        steps={tutorialSteps}
        storageKey="ufrev-admin-support-tutorial"
        tone="amber"
      >
        <TutorialStep
          step="01"
          title={tr(language, { en: 'Start from queue health', pl: 'Zacznij od zdrowia kolejki' })}
          description={tr(language, { en: 'This first layer tells you whether support needs faster reaction, deeper staffing, or simple status cleanup.', pl: 'Ta pierwsza warstwa pokazuje czy support potrzebuje szybszej reakcji, mocniejszego staffing albo prostego cleanupu statusów.' })}
          tone="amber"
        >
      <section className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={tr(language, { en: 'New', pl: 'Nowe', es: 'Nuevos', ru: 'Новые' })} value={String(newMessages ?? 0)} delta={tr(language, { en: 'Fresh queue', pl: 'Nowa kolejka', es: 'Cola nueva', ru: 'Свежая очередь' })} tone="amber" />
        <MetricCard label={tr(language, { en: 'In progress', pl: 'W toku', es: 'En progreso', ru: 'В работе' })} value={String(inProgressMessages ?? 0)} delta={tr(language, { en: 'Active cases', pl: 'Aktywne sprawy', es: 'Casos activos', ru: 'Активные кейсы' })} tone="cyan" />
        <MetricCard label={tr(language, { en: 'Closed', pl: 'Zamknięte', es: 'Cerrados', ru: 'Закрытые' })} value={String(closedMessages ?? 0)} delta={tr(language, { en: 'Resolved tickets', pl: 'Rozwiązane zgłoszenia', es: 'Tickets resueltos', ru: 'Решённые тикеты' })} tone="emerald" />
        <MetricCard label={tr(language, { en: 'Visible records', pl: 'Widoczne rekordy', es: 'Registros visibles', ru: 'Видимые записи' })} value={String(messages?.length ?? 0)} delta={tr(language, { en: 'Latest 100 rows', pl: 'Ostatnie 100 wierszy', es: 'Últimas 100 filas', ru: 'Последние 100 строк' })} tone="violet" />
      </section>

        </TutorialStep>

        <TutorialStep
          step="02"
          title={tr(language, { en: 'Route each ticket clearly', pl: 'Routuj każde zgłoszenie czytelnie' })}
          description={tr(language, { en: 'Use this section to move each case with less ambiguity and keep trust visible through the queue.', pl: 'Używaj tej sekcji, aby przesuwać każdą sprawę z mniejszą niejednoznacznością i utrzymywać zaufanie widoczne w całej kolejce.' })}
          tone="amber"
        >
      <section className="mt-8 space-y-4">
        {(messages || []).map((item: any) => (
          <div key={item.id} className="rounded-[28px] border border-white/10 bg-slate-950/60 p-6 shadow-[0_18px_70px_rgba(2,6,23,0.35)]">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="font-semibold text-white">{item.subject}</div>
                <div className="mt-1 text-sm text-slate-400">{item.email}</div>
                {item.name && <div className="text-sm text-slate-500">{item.name}</div>}
              </div>
              <StatusBadge label={item.status === 'new' ? tr(language, { en: 'new', pl: 'nowe', es: 'nuevo', ru: 'новый' }) : item.status === 'in_progress' ? tr(language, { en: 'in progress', pl: 'w toku', es: 'en progreso', ru: 'в работе' }) : tr(language, { en: 'closed', pl: 'zamknięte', es: 'cerrado', ru: 'закрыто' })} tone={item.status === 'new' ? 'amber' : item.status === 'in_progress' ? 'cyan' : 'emerald'} />
            </div>
            <p className="mb-4 whitespace-pre-wrap text-slate-200">{item.message}</p>
            <div className="mb-4 text-xs text-slate-500">{new Date(item.created_at).toLocaleString(locale)}</div>
            <div className="flex flex-wrap gap-3">
              {['new', 'in_progress', 'closed'].map((status) => (
                <form key={status} action="/api/admin/support/update" method="post">
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="status" value={status} />
                  <button className="rounded-xl border border-white/10 bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:border-cyan-300/40">
                    {status === 'new'
                      ? tr(language, { en: 'New', pl: 'Nowe', es: 'Nuevo', ru: 'Новый' })
                      : status === 'in_progress'
                        ? tr(language, { en: 'In progress', pl: 'W toku', es: 'En progreso', ru: 'В работе' })
                        : tr(language, { en: 'Close', pl: 'Zamknij', es: 'Cerrar', ru: 'Закрыть' })}
                  </button>
                </form>
              ))}
            </div>
          </div>
        ))}
      </section>

        </TutorialStep>
      </TutorialMode>
    </main>
  );
}
