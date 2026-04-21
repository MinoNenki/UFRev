import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase-admin';
import StatusBadge from '@/components/StatusBadge';
import MetricCard from '@/components/pro-ui/MetricCard';
import { tr } from '@/lib/i18n';
import { getLanguage } from '@/lib/i18n-server';

export default async function AdminReviewsPage() {
  const language = await getLanguage();
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) redirect('/dashboard');

  const [{ count: pendingReviews }, { count: approvedReviews }, { count: rejectedReviews }, { data: reviews }] = await Promise.all([
    supabaseAdmin.from('reviews').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabaseAdmin.from('reviews').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabaseAdmin.from('reviews').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
    supabaseAdmin.from('reviews').select('*').order('created_at', { ascending: false }).limit(100),
  ]);

  return (
    <main className="mx-auto max-w-[1600px] px-6 py-16 text-white">
      <section className="mesh-panel relative overflow-hidden p-8 shadow-[0_30px_140px_rgba(2,6,23,0.65)]">
        <div className="spotlight-sweep" />
        <div className="noise-overlay" />
        <div className="relative">
          <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-200">{tr(language, { en: 'Admin / reviews', pl: 'Admin / opinie', es: 'Admin / reseñas', ru: 'Admin / отзывы' })}</div>
          <h1 className="mt-4 text-5xl font-black tracking-tight sm:text-6xl">{tr(language, { en: 'Review moderation command lane', pl: 'Tor moderacji opinii', es: 'Carril de moderación de reseñas', ru: 'Линия модерации отзывов' })}</h1>
          <p className="mt-5 max-w-4xl text-lg leading-8 text-slate-300">{tr(language, { en: 'Curate social proof with a cleaner queue so approvals, rejections, and trust signals are easier to manage.', pl: 'Porządkuj social proof w czytelniejszej kolejce, aby łatwiej zarządzać akceptacją, odrzuceniami i sygnałami zaufania.', es: 'Gestiona la prueba social con una cola más limpia para aprobar, rechazar y reforzar la confianza.', ru: 'Управляй social proof в более чистой очереди, чтобы проще модерировать одобрения, отклонения и сигналы доверия.' })}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/admin" className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/30 hover:bg-white/[0.07]">{tr(language, { en: '← Back to control center', pl: '← Wróć do centrum kontroli', es: '← Volver al centro de control', ru: '← Назад в центр управления' })}</Link>
            <Link href="/admin/support" className="rounded-2xl border border-emerald-300/30 bg-emerald-300/10 px-4 py-3 text-sm font-semibold text-emerald-50 transition hover:bg-emerald-300/15">{tr(language, { en: 'Open support queue', pl: 'Otwórz kolejkę supportu', es: 'Abrir cola de soporte', ru: 'Открыть очередь support' })}</Link>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={tr(language, { en: 'Pending', pl: 'Oczekujące', es: 'Pendientes', ru: 'В ожидании' })} value={String(pendingReviews ?? 0)} delta={tr(language, { en: 'Needs action', pl: 'Wymaga akcji', es: 'Requiere acción', ru: 'Требует действия' })} tone="amber" />
        <MetricCard label={tr(language, { en: 'Approved', pl: 'Zaakceptowane', es: 'Aprobadas', ru: 'Одобрено' })} value={String(approvedReviews ?? 0)} delta={tr(language, { en: 'Live trust proof', pl: 'Aktywne dowody zaufania', es: 'Prueba social activa', ru: 'Активный social proof' })} tone="emerald" />
        <MetricCard label={tr(language, { en: 'Rejected', pl: 'Odrzucone', es: 'Rechazadas', ru: 'Отклонено' })} value={String(rejectedReviews ?? 0)} delta={tr(language, { en: 'Filtered out', pl: 'Odfiltrowane', es: 'Filtradas', ru: 'Отфильтровано' })} tone="violet" />
        <MetricCard label={tr(language, { en: 'Visible records', pl: 'Widoczne rekordy', es: 'Registros visibles', ru: 'Видимые записи' })} value={String(reviews?.length ?? 0)} delta={tr(language, { en: 'Latest 100 rows', pl: 'Ostatnie 100 wierszy', es: 'Últimas 100 filas', ru: 'Последние 100 строк' })} tone="cyan" />
      </section>

      <section className="mt-8 space-y-4">
        {(reviews || []).map((item: any) => (
          <div key={item.id} className="rounded-[28px] border border-white/10 bg-slate-950/60 p-6 shadow-[0_18px_70px_rgba(2,6,23,0.35)]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-white">{item.name}</div>
                {item.company_or_role && <div className="text-sm text-slate-400">{item.company_or_role}</div>}
              </div>
              <StatusBadge label={item.status === 'approved' ? tr(language, { en: 'approved', pl: 'zaakceptowane', es: 'aprobado', ru: 'одобрено' }) : item.status === 'rejected' ? tr(language, { en: 'rejected', pl: 'odrzucone', es: 'rechazado', ru: 'отклонено' }) : tr(language, { en: 'pending', pl: 'oczekujące', es: 'pendiente', ru: 'в ожидании' })} tone={item.status === 'approved' ? 'emerald' : item.status === 'rejected' ? 'rose' : 'amber'} />
            </div>
            <div className="mb-4 text-cyan-200">{'★'.repeat(item.rating)}</div>
            <p className="mb-5 text-slate-200">{item.content}</p>
            <div className="flex flex-wrap gap-3">
              {['approved', 'pending', 'rejected'].map((status) => (
                <form key={status} action="/api/admin/reviews/update" method="post">
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="status" value={status} />
                  <button className="rounded-xl border border-white/10 bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:border-cyan-300/40">
                    {status === 'approved'
                      ? tr(language, { en: 'Approve', pl: 'Akceptuj', es: 'Aprobar', ru: 'Одобрить' })
                      : status === 'pending'
                        ? tr(language, { en: 'Set pending', pl: 'Ustaw oczekujące', es: 'Marcar pendiente', ru: 'Оставить в ожидании' })
                        : tr(language, { en: 'Reject', pl: 'Odrzuć', es: 'Rechazar', ru: 'Отклонить' })}
                  </button>
                </form>
              ))}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
