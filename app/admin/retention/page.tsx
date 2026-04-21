import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getRetentionSettings, getPricingSettings, getNotificationSettings } from '@/lib/growth-config';
import MetricCard from '@/components/pro-ui/MetricCard';
import InsightPanel from '@/components/pro-ui/InsightPanel';
import { tr } from '@/lib/i18n';
import { getLanguage } from '@/lib/i18n-server';

export default async function AdminRetentionPage() {
  const language = await getLanguage();
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) redirect('/dashboard');

  const [retentionSettings, pricingSettings, notificationSettings, highRisk, mediumRisk, recentNotifications] = await Promise.all([
    getRetentionSettings(),
    getPricingSettings(),
    getNotificationSettings(),
    supabaseAdmin.from('retention_events').select('*', { count: 'exact', head: true }).eq('segment', 'high'),
    supabaseAdmin.from('retention_events').select('*', { count: 'exact', head: true }).eq('segment', 'medium'),
    supabaseAdmin.from('notification_events').select('id, title, message, status, created_at').order('created_at', { ascending: false }).limit(10),
  ]);

  return (
    <main className="mx-auto max-w-[1500px] px-6 py-16 text-white">
      <section className="rounded-[40px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_24%),linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.92))] p-8 shadow-[0_30px_140px_rgba(2,6,23,0.65)]">
        <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-200">{tr(language, { en: 'Admin / retention', pl: 'Admin / retencja', pt: 'Admin / retenção', ru: 'Admin / удержание' })}</div>
        <h1 className="mt-4 text-5xl font-black tracking-tight">{tr(language, { en: 'Retention, churn defense, and global growth automations', pl: 'Retencja, obrona przed churnem i automatyzacje wzrostu', pt: 'Retenção, defesa contra churn e automações de crescimento', ru: 'Удержание, защита от churn и автоматизации роста' })}</h1>
        <p className="mt-5 max-w-4xl text-lg leading-8 text-slate-300">{tr(language, { en: 'This panel adds V7 and V8 growth logic: churn defense, CRM triggers, dynamic pricing, and notifications.', pl: 'Ten panel dodaje logikę wzrostu V7 i V8: obronę przed churnem, triggery CRM, dynamic pricing i powiadomienia.', pt: 'Este painel adiciona a lógica de crescimento V7 e V8: defesa contra churn, triggers de CRM, pricing dinâmico e notificações.', ru: 'Эта панель добавляет логику роста V7 и V8: защиту от churn, CRM-триггеры, dynamic pricing и уведомления.' })}</p>
      </section>

      <section className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-6">
        <MetricCard label="High risk" value={String(highRisk.count ?? 0)} delta="Needs win-back" tone="amber" />
        <MetricCard label="Medium risk" value={String(mediumRisk.count ?? 0)} delta="Needs activation" tone="violet" />
        <MetricCard label="CRM" value={retentionSettings.crmEnabled ? 'On' : 'Off'} delta="Retention engine" tone="emerald" />
        <MetricCard label="Dynamic pricing" value={pricingSettings.dynamicPricingEnabled ? 'On' : 'Off'} delta="Global pricing" tone="cyan" />
        <MetricCard label="Realtime alerts" value={notificationSettings.realtimeAlertsEnabled ? 'On' : 'Off'} delta="Notification system" tone="amber" />
        <MetricCard label="Annual discount" value={`${pricingSettings.premiumAnnualDiscountPercent}%`} delta="Pricing lever" tone="emerald" />
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[32px] border border-white/10 bg-slate-950/60 p-8 shadow-[0_24px_100px_rgba(2,6,23,0.45)]">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-200">Notification queue</div>
              <h2 className="mt-2 text-3xl font-black">Recent growth messages</h2>
            </div>
            <form action="/api/retention/run" method="post">
              <button className="rounded-2xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950">Run retention scan</button>
            </form>
          </div>
          <div className="space-y-3">
            {recentNotifications.data?.length ? recentNotifications.data.map((item: any) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-sm font-semibold text-white">{item.title || 'Notification'}</div>
                <div className="mt-2 text-sm text-slate-300">{item.message}</div>
                <div className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">{item.status}</div>
              </div>
            )) : <div className="text-slate-400">No notifications queued yet.</div>}
          </div>
        </div>

        <InsightPanel title="What V8 unlocks" items={[
          'Retention automation helps recover users before they churn.',
          'Dynamic pricing lets you adapt plan presentation for high-intent users.',
          'Realtime in-app notifications keep users engaged after each analysis.',
          'CRM events prepare the app for email, push, and lifecycle campaigns.',
        ]} />
      </section>
    </main>
  );
}
