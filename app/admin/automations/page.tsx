import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin';
import { getAutomationSettings } from '@/lib/profit-config';
import { getNotificationSettings } from '@/lib/growth-config';
import MetricCard from '@/components/pro-ui/MetricCard';
import InsightPanel from '@/components/pro-ui/InsightPanel';
import AutomationCommandCenter from '@/components/admin/AutomationCommandCenter';
import TutorialMode, { TutorialStep } from '@/components/pro-ui/TutorialMode';
import { tr } from '@/lib/i18n';
import { getLanguage } from '@/lib/i18n-server';

export default async function AdminAutomationsPage({ searchParams }: { searchParams?: { updated?: string; error?: string; deliveryUpdated?: string; deliveryError?: string } }) {
  const language = await getLanguage();
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) redirect('/dashboard');
  const params = searchParams || {};
  const [settings, notificationSettings] = await Promise.all([
    getAutomationSettings(),
    getNotificationSettings(),
  ]);
  const emailDeliveryLabel = process.env.RESEND_API_KEY
    ? 'Resend ready'
    : process.env.SENDGRID_API_KEY
      ? 'SendGrid ready'
      : process.env.SMTP_HOST
        ? 'SMTP env detected (adapter pending)'
        : 'No email provider env';
  const telegramDeliveryLabel = process.env.TELEGRAM_BOT_TOKEN ? 'Bot token ready' : 'Missing TELEGRAM_BOT_TOKEN';
  const discordDeliveryLabel = notificationSettings.discordWebhookUrl || process.env.DISCORD_WEBHOOK_URL ? 'Webhook ready' : 'Webhook missing';
  const tutorialSteps = [
    {
      step: '01',
      title: tr(language, { en: 'Scan the safeguards first', pl: 'Najpierw sprawdź zabezpieczenia' }),
      description: tr(language, { en: 'The top cards tell you whether spend caps, kill switch, confidence, and cadence are safe before automations run harder.', pl: 'Górne karty pokazują czy limity wydatków, kill switch, confidence i cadence są bezpieczne zanim automatyzacje ruszą mocniej.' }),
    },
    {
      step: '02',
      title: tr(language, { en: 'Tune routing and presets', pl: 'Dostrój routing i presety' }),
      description: tr(language, { en: 'Then move into delivery routing, one-click modes, and advanced safeguards to align automation with margin protection.', pl: 'Następnie przejdź do routingu dostarczania, trybów one-click i zaawansowanych zabezpieczeń, aby spiąć automatyzację z ochroną marży.' }),
    },
  ];

  return (
    <main className="mx-auto max-w-[1500px] px-6 py-16 text-white">
      <section className="mesh-panel relative p-8 shadow-[0_30px_140px_rgba(2,6,23,0.65)]">
        <div className="spotlight-sweep" />
        <div className="noise-overlay" />
        <div className="relative">
          <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-200">{tr(language, { en: 'Admin / automations', pl: 'Admin / automatyzacje', pt: 'Admin / automações', ru: 'Admin / автоматизации' })}</div>
          <h1 className="mt-4 text-5xl font-black tracking-tight">{tr(language, { en: 'Profit autopilot and revenue protection', pl: 'Autopilot zysku i ochrona przychodu', pt: 'Autopiloto de lucro e proteção da receita', ru: 'Автопилот прибыли и защита выручки' })}</h1>
          <p className="mt-5 max-w-4xl text-lg leading-8 text-slate-300">{tr(language, { en: 'One-click automation modes for safer growth, lighter ops work, and a cleaner global admin experience.', pl: 'Tryby automatyzacji one-click dla bezpieczniejszego wzrostu, lżejszych operacji i bardziej globalnego doświadczenia admina.', pt: 'Modos de automação com um clique para crescimento mais seguro, operações mais leves e uma experiência admin mais global.', ru: 'One-click режимы автоматизации для более безопасного роста, более лёгких операций и более глобального admin-опыта.' })}</p>
        </div>
      </section>

      {(params.updated || params.error || params.deliveryUpdated || params.deliveryError) && (
        <div
          className={`mt-6 rounded-2xl border p-4 ${(params.updated || params.deliveryUpdated)
            ? 'border-emerald-300/30 bg-emerald-300/10 text-emerald-200'
            : 'border-rose-300/30 bg-rose-300/10 text-rose-200'}`}
        >
          {params.updated
            ? 'Automation settings saved.'
            : params.deliveryUpdated
              ? 'Notification delivery settings saved.'
              : params.deliveryError
                ? 'Could not save notification delivery settings.'
                : 'Could not save automation settings.'}
        </div>
      )}

      <TutorialMode
        language={language}
        title={tr(language, { en: 'Need an automation walkthrough?', pl: 'Potrzebujesz przewodnika po automatyzacjach?' })}
        intro={tr(language, { en: 'Turn on guide mode to read this lane in order: core safeguards first, then routing, presets, and advanced controls.', pl: 'Włącz tryb przewodnika, aby czytać ten tor po kolei: najpierw główne zabezpieczenia, potem routing, presety i zaawansowane kontrolki.' })}
        steps={tutorialSteps}
        storageKey="ufrev-admin-automations-tutorial"
        tone="emerald"
      >
        <TutorialStep
          step="01"
          title={tr(language, { en: 'Start from automation safety', pl: 'Zacznij od bezpieczeństwa automatyzacji' })}
          description={tr(language, { en: 'This first block compresses cadence, spend defense, confidence, and review pressure into one fast operator read.', pl: 'Ten pierwszy blok kompresuje cadence, ochronę wydatków, confidence i presję review w jeden szybki odczyt operatorski.' })}
          tone="emerald"
        >
      <section className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Competitor scans" value={settings.autoCompetitorScans ? 'On' : 'Off'} delta="Recurring market checks" tone="cyan" />
        <MetricCard label="Market alerts" value={settings.autoMarketWatchAlerts ? 'On' : 'Off'} delta="Realtime watchtower" tone="emerald" />
        <MetricCard label="Weekly digest" value={settings.weeklyMarketDigest ? 'On' : 'Off'} delta="Recurring intelligence" tone="violet" />
        <MetricCard label="Review requests" value={settings.autoReviewRequests ? 'On' : 'Off'} delta="Trust generation" tone="violet" />
        <MetricCard label="Sync interval" value={`${settings.syncIntervalMinutes} min`} delta="Automation cadence" tone="amber" />
        <MetricCard label="Min confidence" value={`${settings.minConfidenceForBuy}`} delta="BUY threshold" tone="amber" />
        <MetricCard label="Safe test cap" value={`$${settings.maxSafeTestBudgetUsd}`} delta="Burn protection" tone="violet" />
        <MetricCard label="Kill switch" value={settings.killSwitchEnabled ? 'Armed' : 'Off'} delta="Hard anti-loss" tone="amber" />
        <MetricCard label="Daily spend cap" value={`$${settings.maxDailySpendUsd}`} delta="Scale ceiling" tone="emerald" />
      </section>

      <section className="mt-8">
        <AutomationCommandCenter language={language} />
      </section>

        </TutorialStep>

        <TutorialStep
          step="02"
          title={tr(language, { en: 'Route alerts and apply operating modes', pl: 'Kieruj alerty i stosuj tryby operacyjne' })}
          description={tr(language, { en: 'This second layer is where you decide who gets alerts, which preset is safe, and which advanced safeguards stay armed.', pl: 'Ta druga warstwa pokazuje komu wysyłać alerty, który preset jest bezpieczny i które zaawansowane zabezpieczenia mają pozostać uzbrojone.' })}
          tone="emerald"
        >

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[32px] border border-white/10 bg-slate-950/60 p-8 shadow-[0_24px_100px_rgba(2,6,23,0.45)]">
          <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-200">Premium alert routing</div>
          <h2 className="mt-2 text-3xl font-black">Email, Telegram, and Discord delivery</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">Route queued market alerts and weekly digests beyond the in-app feed so premium operators receive them immediately.</p>

          <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-200">
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">Email: {emailDeliveryLabel}</span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">Telegram: {telegramDeliveryLabel}</span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">Discord: {discordDeliveryLabel}</span>
          </div>

          <form action="/api/admin/notifications/settings" method="post" className="mt-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[
                ['inAppEnabled', 'In-app delivery', notificationSettings.inAppEnabled],
                ['emailEnabled', 'Email delivery', notificationSettings.emailEnabled],
                ['telegramEnabled', 'Telegram alerts', notificationSettings.telegramEnabled],
                ['discordEnabled', 'Discord alerts', notificationSettings.discordEnabled],
                ['realtimeAlertsEnabled', 'Realtime dispatch enabled', notificationSettings.realtimeAlertsEnabled],
                ['pushEnabled', 'Push delivery (next)', notificationSettings.pushEnabled],
              ].map(([name, label, checked]) => (
                <label key={String(name)} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-200"><input type="checkbox" name={String(name)} defaultChecked={Boolean(checked)} className="mr-3" />{String(label)}</label>
              ))}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm text-slate-300">Alert email inbox</label>
                <input name="alertEmailAddress" type="email" defaultValue={notificationSettings.alertEmailAddress} placeholder="alerts@yourbrand.com" className="input" />
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-300">Telegram chat ID</label>
                <input name="telegramChatId" type="text" defaultValue={notificationSettings.telegramChatId} placeholder="-1001234567890" className="input" />
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-300">Discord webhook URL</label>
                <input name="discordWebhookUrl" type="url" defaultValue={notificationSettings.discordWebhookUrl} placeholder="https://discord.com/api/webhooks/..." className="input" />
              </div>
            </div>

            <button className="mt-6 rounded-2xl bg-fuchsia-300 px-6 py-3 font-semibold text-slate-950">Save delivery routing</button>
          </form>
        </div>

        <InsightPanel title="Delivery rollout notes" items={[
          'Email alerts can send through Resend or SendGrid once the API key is present.',
          'Telegram dispatch uses TELEGRAM_BOT_TOKEN plus a saved chat ID.',
          'Discord alerts can ship instantly through a webhook URL stored here or in env.',
          'In-app delivery stays active as the safe fallback even when external channels are still being configured.',
        ]} />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[32px] border border-white/10 bg-slate-950/60 p-8 shadow-[0_24px_100px_rgba(2,6,23,0.45)]">
          <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-200">Automation presets</div>
          <h2 className="mt-2 text-3xl font-black">One-click operating modes</h2>
          <div className="mt-5 grid gap-4">
            <form action="/api/admin/automations/settings" method="post" className="hover-lift rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
              <input type="hidden" name="autoCompetitorScans" value="on" />
              <input type="hidden" name="autoMarketWatchAlerts" value="on" />
              <input type="hidden" name="weeklyMarketDigest" value="on" />
              <input type="hidden" name="autoMarginAlerts" value="on" />
              <input type="hidden" name="autoReviewRequests" value="on" />
              <input type="hidden" name="autoRestockWarnings" value="on" />
              <input type="hidden" name="requireCompetitorEvidenceForBuy" value="on" />
              <input type="hidden" name="requireUrlForBuy" value="on" />
              <input type="hidden" name="requireManualApprovalForScale" value="on" />
              <input type="hidden" name="killSwitchEnabled" value="on" />
              <input type="hidden" name="syncIntervalMinutes" value="60" />
              <input type="hidden" name="priceFloorPercent" value="18" />
              <input type="hidden" name="maxDailyRewardClaims" value="8" />
              <input type="hidden" name="profitabilityGuardrailPercent" value="22" />
              <input type="hidden" name="minConfidenceForBuy" value="62" />
              <input type="hidden" name="maxSafeTestBudgetUsd" value="800" />
              <input type="hidden" name="maxDailySpendUsd" value="1500" />
              <input type="hidden" name="maxAllowedRefundRatePercent" value="8" />
              <input type="hidden" name="maxAllowedCACPercentOfAOV" value="35" />
              <input type="hidden" name="cooldownHoursAfterLoss" value="24" />
              <input type="hidden" name="stagedRolloutPercent" value="20" />
              <input type="hidden" name="stagedRolloutMaxWaves" value="3" />
              <div className="text-[11px] uppercase tracking-[0.22em] text-cyan-200">Preset 01</div>
              <div className="mt-2 text-xl font-bold text-white">Guarded autopilot</div>
              <p className="mt-2 text-sm text-slate-300">Best default for safe scaling with manual review still enforced.</p>
              <button className="mt-4 rounded-2xl bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950">Apply preset</button>
            </form>

            <form action="/api/admin/automations/settings" method="post" className="hover-lift rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
              <input type="hidden" name="autoCompetitorScans" value="on" />
              <input type="hidden" name="autoMarketWatchAlerts" value="on" />
              <input type="hidden" name="weeklyMarketDigest" value="on" />
              <input type="hidden" name="autoMarginAlerts" value="on" />
              <input type="hidden" name="autoReviewRequests" value="on" />
              <input type="hidden" name="autoRestockWarnings" value="on" />
              <input type="hidden" name="autoPauseLowMarginAds" value="on" />
              <input type="hidden" name="requireUrlForBuy" value="on" />
              <input type="hidden" name="killSwitchEnabled" value="on" />
              <input type="hidden" name="syncIntervalMinutes" value="45" />
              <input type="hidden" name="priceFloorPercent" value="16" />
              <input type="hidden" name="maxDailyRewardClaims" value="10" />
              <input type="hidden" name="profitabilityGuardrailPercent" value="20" />
              <input type="hidden" name="minConfidenceForBuy" value="58" />
              <input type="hidden" name="maxSafeTestBudgetUsd" value="1200" />
              <input type="hidden" name="maxDailySpendUsd" value="2200" />
              <input type="hidden" name="maxAllowedRefundRatePercent" value="10" />
              <input type="hidden" name="maxAllowedCACPercentOfAOV" value="38" />
              <input type="hidden" name="cooldownHoursAfterLoss" value="18" />
              <input type="hidden" name="stagedRolloutPercent" value="25" />
              <input type="hidden" name="stagedRolloutMaxWaves" value="4" />
              <div className="text-[11px] uppercase tracking-[0.22em] text-emerald-200">Preset 02</div>
              <div className="mt-2 text-xl font-bold text-white">Balanced scale</div>
              <p className="mt-2 text-sm text-slate-300">Faster cadence for brands that already have some validated demand.</p>
              <button className="mt-4 rounded-2xl bg-emerald-300 px-4 py-2 text-sm font-semibold text-slate-950">Apply preset</button>
            </form>
          </div>
        </div>
        <InsightPanel title="Recommended max-profit setup" items={[
          'Keep competitor scans active so pricing and positioning opportunities are surfaced automatically.',
          'Use margin alerts as the default financial defense layer before scaling ad spend.',
          'Keep reward claim limits strict so free usage cannot erode subscription value.',
          'Treat automations as part of the premium perception layer as well as the business protection layer.',
          'Never allow BUY verdicts to bypass your confidence, margin, and manual-review safeguards.',
          'Arm the kill switch so unsafe spend, refund, or CAC conditions hard-block scale.',
        ]} />
      </section>

      <details className="mt-8 rounded-[32px] border border-white/10 bg-slate-950/60 p-8 shadow-[0_24px_100px_rgba(2,6,23,0.45)]">
        <summary className="cursor-pointer list-none text-2xl font-bold text-white">Open advanced automation safeguards</summary>
        <form action="/api/admin/automations/settings" method="post" className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ['autoCompetitorScans', 'Automatic competitor scans', settings.autoCompetitorScans],
              ['autoMarketWatchAlerts', 'Automatic market alerts', settings.autoMarketWatchAlerts],
              ['weeklyMarketDigest', 'Weekly market digest', settings.weeklyMarketDigest],
              ['autoMarginAlerts', 'Low-margin alerts', settings.autoMarginAlerts],
              ['autoReviewRequests', 'Automatic review requests', settings.autoReviewRequests],
              ['autoRestockWarnings', 'Restock warnings', settings.autoRestockWarnings],
              ['autoPauseLowMarginAds', 'Pause low-margin ads', settings.autoPauseLowMarginAds],
              ['requireCompetitorEvidenceForBuy', 'Require competitor evidence for BUY', settings.requireCompetitorEvidenceForBuy],
              ['requireUrlForBuy', 'Require product URL for BUY', settings.requireUrlForBuy],
              ['requireManualApprovalForScale', 'Require manual approval before scale', settings.requireManualApprovalForScale],
              ['killSwitchEnabled', 'Arm kill switch', settings.killSwitchEnabled],
            ].map(([name, label, checked]) => (
              <label key={String(name)} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-200"><input type="checkbox" name={String(name)} defaultChecked={Boolean(checked)} className="mr-3" />{String(label)}</label>
            ))}
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div><label className="mb-2 block text-sm text-slate-300">Sync interval (minutes)</label><input name="syncIntervalMinutes" type="number" min="15" max="1440" defaultValue={settings.syncIntervalMinutes} className="input" /></div>
            <div><label className="mb-2 block text-sm text-slate-300">Price floor (%)</label><input name="priceFloorPercent" type="number" min="5" max="80" defaultValue={settings.priceFloorPercent} className="input" /></div>
            <div><label className="mb-2 block text-sm text-slate-300">Daily reward claims</label><input name="maxDailyRewardClaims" type="number" min="1" max="50" defaultValue={settings.maxDailyRewardClaims} className="input" /></div>
            <div><label className="mb-2 block text-sm text-slate-300">Profitability safeguard (%)</label><input name="profitabilityGuardrailPercent" type="number" min="5" max="80" defaultValue={settings.profitabilityGuardrailPercent} className="input" /></div>
            <div><label className="mb-2 block text-sm text-slate-300">Minimum confidence for BUY</label><input name="minConfidenceForBuy" type="number" min="20" max="95" defaultValue={settings.minConfidenceForBuy} className="input" /></div>
            <div><label className="mb-2 block text-sm text-slate-300">Max safe test budget ($)</label><input name="maxSafeTestBudgetUsd" type="number" min="50" max="50000" defaultValue={settings.maxSafeTestBudgetUsd} className="input" /></div>
            <div><label className="mb-2 block text-sm text-slate-300">Hard daily spend cap ($)</label><input name="maxDailySpendUsd" type="number" min="50" max="250000" defaultValue={settings.maxDailySpendUsd} className="input" /></div>
            <div><label className="mb-2 block text-sm text-slate-300">Max allowed refund rate (%)</label><input name="maxAllowedRefundRatePercent" type="number" min="1" max="80" defaultValue={settings.maxAllowedRefundRatePercent} className="input" /></div>
            <div><label className="mb-2 block text-sm text-slate-300">Max CAC as % of AOV</label><input name="maxAllowedCACPercentOfAOV" type="number" min="5" max="95" defaultValue={settings.maxAllowedCACPercentOfAOV} className="input" /></div>
            <div><label className="mb-2 block text-sm text-slate-300">Cooldown after loss (hours)</label><input name="cooldownHoursAfterLoss" type="number" min="1" max="240" defaultValue={settings.cooldownHoursAfterLoss} className="input" /></div>
            <div><label className="mb-2 block text-sm text-slate-300">Staged rollout % per wave</label><input name="stagedRolloutPercent" type="number" min="5" max="100" defaultValue={settings.stagedRolloutPercent} className="input" /></div>
            <div><label className="mb-2 block text-sm text-slate-300">Maximum rollout waves</label><input name="stagedRolloutMaxWaves" type="number" min="1" max="10" defaultValue={settings.stagedRolloutMaxWaves} className="input" /></div>
          </div>
          <button className="mt-6 rounded-2xl bg-cyan-300 px-6 py-3 font-semibold text-slate-950">Save automations</button>
        </form>
      </details>

        </TutorialStep>
      </TutorialMode>
    </main>
  );
}
