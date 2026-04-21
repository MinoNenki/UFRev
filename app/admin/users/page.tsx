import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase-admin';
import StatusBadge from '@/components/StatusBadge';
import MetricCard from '@/components/pro-ui/MetricCard';
import { PLAN_ORDER } from '@/lib/plans';
import { tr } from '@/lib/i18n';
import { getLanguage } from '@/lib/i18n-server';

export default async function AdminUsersPage({ searchParams }: { searchParams?: { updated?: string; error?: string } }) {
  const language = await getLanguage();
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) redirect('/dashboard');

  const params = searchParams || {};
  const locale = language === 'pl' ? 'pl-PL' : language === 'es' ? 'es-ES' : language === 'ru' ? 'ru-RU' : 'en-US';
  const [{ count: totalUsers }, { count: paidUsers }, { count: adminUsers }, { data: users }] = await Promise.all([
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).neq('plan_key', 'free'),
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
    supabaseAdmin.from('profiles').select('id, email, full_name, company_name, plan_key, credits_balance, role, created_at').order('created_at', { ascending: false }).limit(100),
  ]);

  return (
    <main className="mx-auto max-w-[1600px] px-6 py-16 text-white">
      <section className="mesh-panel relative overflow-hidden p-8 shadow-[0_30px_140px_rgba(2,6,23,0.65)]">
        <div className="spotlight-sweep" />
        <div className="noise-overlay" />
        <div className="relative">
          <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-200">{tr(language, { en: 'Admin / users', pl: 'Admin / użytkownicy', es: 'Admin / usuarios', ru: 'Admin / пользователи' })}</div>
          <h1 className="mt-4 text-5xl font-black tracking-tight sm:text-6xl">{tr(language, { en: 'Enterprise user and billing console', pl: 'Enterprise panel użytkowników i rozliczeń', es: 'Consola enterprise de usuarios y facturación', ru: 'Enterprise-консоль пользователей и биллинга' })}</h1>
          <p className="mt-5 max-w-4xl text-lg leading-8 text-slate-300">{tr(language, { en: 'Promote billing control, AI token visibility, and admin permissions into one cleaner operating surface.', pl: 'Połącz kontrolę rozliczeń, widoczność tokenów AI i uprawnienia admina w jednej, czystszej warstwie operacyjnej.', es: 'Integra control de facturación, visibilidad de tokens AI y permisos de admin en una sola superficie limpia.', ru: 'Объедини контроль биллинга, видимость AI токенов и права админа в одной чистой операционной поверхности.' })}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/admin" className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/30 hover:bg-white/[0.07]">{tr(language, { en: '← Back to control center', pl: '← Wróć do centrum kontroli', es: '← Volver al centro de control', ru: '← Назад в центр управления' })}</Link>
            <Link href="/admin/founder" className="rounded-2xl border border-fuchsia-300/30 bg-fuchsia-300/10 px-4 py-3 text-sm font-semibold text-fuchsia-50 transition hover:bg-fuchsia-300/15">{tr(language, { en: 'Open founder lane', pl: 'Otwórz tor właściciela', es: 'Abrir ruta del fundador', ru: 'Открыть линию владельца' })}</Link>
          </div>
        </div>
      </section>

      {(params.updated || params.error) && (
        <div className={`mt-6 rounded-2xl border p-4 ${params.updated ? 'border-emerald-300/30 bg-emerald-300/10 text-emerald-200' : 'border-rose-300/30 bg-rose-300/10 text-rose-200'}`}>
          {params.updated
            ? tr(language, { en: 'Changes saved successfully.', pl: 'Zmiany zapisano pomyślnie.', es: 'Los cambios se guardaron correctamente.', ru: 'Изменения успешно сохранены.' })
            : tr(language, { en: 'Could not save changes.', pl: 'Nie udało się zapisać zmian.', es: 'No se pudieron guardar los cambios.', ru: 'Не удалось сохранить изменения.' })}
        </div>
      )}

      <section className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={tr(language, { en: 'Users', pl: 'Użytkownicy', es: 'Usuarios', ru: 'Пользователи' })} value={String(totalUsers ?? 0)} delta={tr(language, { en: 'Full account base', pl: 'Pełna baza kont', es: 'Base total', ru: 'Полная база аккаунтов' })} tone="cyan" />
        <MetricCard label={tr(language, { en: 'Paid accounts', pl: 'Płatne konta', es: 'Cuentas de pago', ru: 'Платные аккаунты' })} value={String(paidUsers ?? 0)} delta={tr(language, { en: 'Revenue users', pl: 'Użytkownicy przychodowi', es: 'Usuarios con ingresos', ru: 'Доходные пользователи' })} tone="emerald" />
        <MetricCard label={tr(language, { en: 'Admins', pl: 'Administratorzy', es: 'Administradores', ru: 'Администраторы' })} value={String(adminUsers ?? 0)} delta={tr(language, { en: 'Privileged access', pl: 'Dostęp uprzywilejowany', es: 'Acceso privilegiado', ru: 'Привилегированный доступ' })} tone="amber" />
        <MetricCard label={tr(language, { en: 'Visible records', pl: 'Widoczne rekordy', es: 'Registros visibles', ru: 'Видимые записи' })} value={String(users?.length ?? 0)} delta={tr(language, { en: 'Latest 100 rows', pl: 'Ostatnie 100 wierszy', es: 'Últimas 100 filas', ru: 'Последние 100 строк' })} tone="violet" />
      </section>

      <section className="mt-8 space-y-4">
        {(users || []).map((item: any) => (
          <div key={item.id} className="rounded-[28px] border border-white/10 bg-slate-950/60 p-6 shadow-[0_18px_70px_rgba(2,6,23,0.35)]">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="font-semibold text-white">{item.full_name || item.email}</div>
                <div className="text-sm text-slate-400">{item.email}</div>
                {item.company_name && <div className="text-sm text-slate-500">{item.company_name}</div>}
              </div>
              <div className="flex gap-2">
                <StatusBadge label={item.plan_key} tone="cyan" />
                <StatusBadge label={item.role === 'admin' ? tr(language, { en: 'admin', pl: 'admin', es: 'admin', ru: 'админ' }) : tr(language, { en: 'user', pl: 'użytkownik', es: 'usuario', ru: 'пользователь' })} tone={item.role === 'admin' ? 'amber' : 'slate'} />
              </div>
            </div>

            <div className="mb-4 text-sm text-slate-300">
              {tr(language, { en: 'AI tokens', pl: 'Tokeny AI', es: 'Tokens AI', ru: 'AI токены' })} {item.credits_balance} • {tr(language, { en: 'account since', pl: 'konto od', es: 'cuenta desde', ru: 'аккаунт с' })} {new Date(item.created_at).toLocaleDateString(locale)}
            </div>

            <div className="grid gap-4 lg:grid-cols-[0.45fr_0.55fr]">
              <div className="flex flex-wrap gap-3">
                {['user', 'admin'].map((role) => (
                  <form key={role} action="/api/admin/users/update" method="post">
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="role" value={role} />
                    <button className="rounded-xl border border-white/10 bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:border-cyan-300/40">
                      {tr(language, { en: 'Set', pl: 'Ustaw', es: 'Asignar', ru: 'Назначить' })} {role === 'admin' ? tr(language, { en: 'admin', pl: 'admina', es: 'admin', ru: 'админа' }) : tr(language, { en: 'user', pl: 'użytkownika', es: 'usuario', ru: 'пользователя' })}
                    </button>
                  </form>
                ))}
              </div>

              <form action="/api/admin/users/billing" method="post" className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950/70 p-4 md:grid-cols-[1fr_1fr_auto]">
                <input type="hidden" name="id" value={item.id} />
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">{tr(language, { en: 'Plan', pl: 'Plan', es: 'Plan', ru: 'План' })}</label>
                  <select name="planKey" defaultValue={item.plan_key} className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white outline-none">
                    {PLAN_ORDER.map((plan) => (
                      <option key={plan.key} value={plan.key}>{plan.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">{tr(language, { en: 'AI tokens', pl: 'Tokeny AI', es: 'Tokens AI', ru: 'AI токены' })}</label>
                  <input name="creditsBalance" type="number" min="0" defaultValue={item.credits_balance} className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white outline-none" />
                </div>
                <div className="flex items-end">
                  <button className="rounded-xl bg-cyan-300 px-4 py-2 font-semibold text-slate-950">{tr(language, { en: 'Save billing', pl: 'Zapisz rozliczenie', es: 'Guardar facturación', ru: 'Сохранить биллинг' })}</button>
                </div>
              </form>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
