import { getSetupWarnings, isOpenAIConfigured, isRewardSecurityConfigured, isStripeConfigured, isStripeWebhookConfigured, isSupabaseConfigured } from '@/lib/env';
import { tr } from '@/lib/i18n';
import { getLanguage } from '@/lib/i18n-server';

export default async function SetupPage() {
  const warnings = getSetupWarnings();
  const language = await getLanguage();

  return (
    <main className="mx-auto max-w-5xl px-6 py-16 text-white">
      <section className="rounded-[36px] border border-white/10 bg-slate-950/70 p-8">
        <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-200">{tr(language, { en: 'Setup', pl: 'Konfiguracja', es: 'Configuración', ru: 'Настройка' })}</div>
        <h1 className="mt-3 text-4xl font-black">{tr(language, { en: 'Project setup and local run guide', pl: 'Instrukcja konfiguracji projektu i uruchomienia lokalnego', es: 'Guía de configuración del proyecto y ejecución local', ru: 'Гид по настройке проекта и локальному запуску' })}</h1>
        <p className="mt-4 text-slate-300">
          {tr(language, { en: 'This page appears so the app can start safely even before Supabase and OpenAI are configured.', pl: 'Ta strona pojawia się po to, aby aplikacja mogła bezpiecznie wystartować jeszcze przed konfiguracją Supabase i OpenAI.', es: 'Esta página aparece para que la app pueda arrancar con seguridad incluso antes de configurar Supabase y OpenAI.', ru: 'Эта страница отображается для того, чтобы приложение могло безопасно запускаться ещё до настройки Supabase и OpenAI.' })}
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="text-sm font-semibold text-white">{tr(language, { en: 'Current status', pl: 'Aktualny status', es: 'Estado actual', ru: 'Текущий статус' })}</div>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              <li>• Site URL: {process.env.NEXT_PUBLIC_SITE_URL ? 'OK' : tr(language, { en: 'Missing', pl: 'Brak', es: 'Falta', ru: 'Отсутствует' })}</li>
              <li>• Supabase public config: {isSupabaseConfigured ? 'OK' : tr(language, { en: 'Missing', pl: 'Brak', es: 'Falta', ru: 'Отсутствует' })}</li>
              <li>• OpenAI key: {isOpenAIConfigured ? 'OK' : tr(language, { en: 'Missing', pl: 'Brak', es: 'Falta', ru: 'Отсутствует' })}</li>
              <li>• Stripe secret: {isStripeConfigured ? 'OK' : tr(language, { en: 'Missing', pl: 'Brak', es: 'Falta', ru: 'Отсутствует' })}</li>
              <li>• Stripe webhook: {isStripeWebhookConfigured ? 'OK' : tr(language, { en: 'Missing', pl: 'Brak', es: 'Falta', ru: 'Отсутствует' })}</li>
              <li>• Reward token secret: {isRewardSecurityConfigured ? 'OK' : tr(language, { en: 'Missing', pl: 'Brak', es: 'Falta', ru: 'Отсутствует' })}</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-5">
            <div className="text-sm font-semibold text-amber-100">{tr(language, { en: 'Missing items', pl: 'Brakujące elementy', es: 'Elementos faltantes', ru: 'Недостающие элементы' })}</div>
            <ul className="mt-3 space-y-2 text-sm text-amber-50">
              {warnings.length ? warnings.map((item) => <li key={item}>• {item}</li>) : <li>• {tr(language, { en: 'All required basics are present.', pl: 'Wszystkie wymagane podstawy są obecne.', es: 'Todos los elementos básicos requeridos están presentes.', ru: 'Все необходимые базовые элементы присутствуют.' })}</li>}
            </ul>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="text-sm font-semibold text-white">{tr(language, { en: '1. Create .env.local', pl: '1. Utwórz .env.local', es: '1. Crea .env.local', ru: '1. Создай .env.local' })}</div>
          <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-sm text-cyan-100">{`NEXT_PUBLIC_SITE_URL=https://ufrev.com
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key
OPENAI_API_KEY=your-openai-production-key
STRIPE_SECRET_KEY=sk_live_replace_before_launch
STRIPE_WEBHOOK_SECRET=whsec_replace_with_live_webhook_secret
REWARD_TOKEN_SECRET=replace-with-a-long-random-production-secret
NOTIFICATION_EMAIL_FROM=ufrevsupport@gmail.com`}</pre>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="text-sm font-semibold text-white">{tr(language, { en: '2. Run SQL schema in Supabase', pl: '2. Uruchom schemat SQL w Supabase', es: '2. Ejecuta el esquema SQL en Supabase', ru: '2. Запусти SQL-схему в Supabase' })}</div>
          <p className="mt-3 text-sm text-slate-300">{tr(language, { en: 'Open Supabase SQL editor and run:', pl: 'Otwórz edytor SQL w Supabase i uruchom:', es: 'Abre el editor SQL de Supabase y ejecuta:', ru: 'Открой SQL-редактор Supabase и выполни:' })}</p>
          <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-sm text-cyan-100">supabase/schema.sql</pre>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="text-sm font-semibold text-white">{tr(language, { en: '3. Install and run', pl: '3. Zainstaluj i uruchom', es: '3. Instala y ejecuta', ru: '3. Установи и запусти' })}</div>
          <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-sm text-cyan-100">{`npm install
npm run dev`}</pre>
        </div>
      </section>
    </main>
  );
}
