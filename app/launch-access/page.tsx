import { redirect } from 'next/navigation';
import { getLanguage } from '@/lib/i18n-server';
import { tr } from '@/lib/i18n';
import { isPrelaunchEnabled } from '@/lib/env';

export default async function LaunchAccessPage({
  searchParams,
}: {
  searchParams?: { from?: string; error?: string };
}) {
  const language = await getLanguage();

  if (!isPrelaunchEnabled) {
    redirect('/');
  }

  const from = searchParams?.from && searchParams.from.startsWith('/') ? searchParams.from : '/';
  const hasError = searchParams?.error === '1';

  return (
    <main className="mx-auto max-w-4xl px-6 py-16 text-white">
      <section className="mesh-panel relative overflow-hidden p-8 shadow-[0_30px_140px_rgba(2,6,23,0.65)]">
        <div className="spotlight-sweep" />
        <div className="noise-overlay" />
        <div className="relative">
          <div className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-100">
            {tr(language, {
              en: 'Private launch mode',
              pl: 'Tryb prywatnego startu',
              es: 'Modo de lanzamiento privado',
              ru: 'Режим приватного запуска',
            })}
          </div>

          <h1 className="mt-4 text-5xl font-black tracking-tight sm:text-6xl">
            {tr(language, {
              en: 'This build is hidden behind a preview gate.',
              pl: 'Ta wersja jest ukryta za bramką podglądu.',
              es: 'Esta versión está oculta detrás de una puerta de vista previa.',
              ru: 'Эта сборка скрыта за preview-доступом.',
            })}
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            {tr(language, {
              en: 'Use the private password below to enter the staging environment safely before the public launch.',
              pl: 'Użyj prywatnego hasła poniżej, aby bezpiecznie wejść do środowiska staging przed publicznym startem.',
              es: 'Usa la contraseña privada para entrar al entorno de staging antes del lanzamiento público.',
              ru: 'Используй приватный пароль ниже, чтобы безопасно войти в staging до публичного запуска.',
            })}
          </p>

          {hasError && (
            <div className="mt-6 rounded-2xl border border-rose-300/30 bg-rose-300/10 p-4 text-sm text-rose-100">
              {tr(language, {
                en: 'Wrong preview password. Try again.',
                pl: 'Nieprawidłowe hasło podglądu. Spróbuj ponownie.',
                es: 'Contraseña de vista previa incorrecta. Inténtalo de nuevo.',
                ru: 'Неверный preview-пароль. Попробуй ещё раз.',
              })}
            </div>
          )}

          <form action="/api/launch-access" method="post" className="mt-8 grid gap-4 rounded-[28px] border border-white/10 bg-slate-950/60 p-6 shadow-[0_18px_70px_rgba(2,6,23,0.35)]">
            <input type="hidden" name="from" value={from} />

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">
                {tr(language, {
                  en: 'Preview password',
                  pl: 'Hasło podglądu',
                  es: 'Contraseña de vista previa',
                  ru: 'Preview-пароль',
                })}
              </label>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="Enter your private access key"
                className="input"
              />
            </div>

            <button className="rounded-2xl bg-[linear-gradient(135deg,rgba(34,211,238,1),rgba(168,85,247,0.9))] px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_16px_48px_rgba(34,211,238,0.20)] transition hover:scale-[1.02]">
              {tr(language, {
                en: 'Enter private preview',
                pl: 'Wejdź do prywatnego podglądu',
                es: 'Entrar a la vista previa privada',
                ru: 'Войти в приватный preview',
              })}
            </button>
          </form>

          <div className="mt-6 rounded-[28px] border border-amber-300/20 bg-amber-300/10 p-5 text-sm text-amber-50">
            <div className="font-semibold text-amber-100">
              {tr(language, {
                en: 'Activation note',
                pl: 'Notatka aktywacyjna',
                es: 'Nota de activación',
                ru: 'Примечание по активации',
              })}
            </div>
            <pre className="mt-3 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-cyan-100">{`PRELAUNCH_MODE=true
PRELAUNCH_PASSWORD=your-strong-private-password`}</pre>
          </div>
        </div>
      </section>
    </main>
  );
}
