import Link from 'next/link';
import { SITE } from '@/lib/site';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { tr } from '@/lib/i18n';
import { getLanguage } from '@/lib/i18n-server';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import LogoutButton from '@/components/LogoutButton';
import { isSupabaseConfigured } from '@/lib/env';

export default async function Navbar() {
  let user: { id: string } | null = null;
  let profileRole: string | null = null;

  if (isSupabaseConfigured) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data } = await supabase.auth.getUser();
      user = data.user;

      if (data.user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
        profileRole = profile?.role ?? null;
      }
    } catch {
      user = null;
      profileRole = null;
    }
  }

  const language = await getLanguage();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/65 shadow-[0_16px_60px_rgba(2,6,23,0.30)] backdrop-blur-2xl">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-6 py-4 text-white lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="group flex items-center gap-3">
            <span className="relative inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-cyan-300/30 bg-[linear-gradient(135deg,rgba(34,211,238,0.95),rgba(96,165,250,0.95),rgba(168,85,247,0.95))] text-sm font-black text-slate-950 shadow-[0_0_40px_rgba(34,211,238,0.25)] transition duration-300 group-hover:scale-105">
              <span className="animate-pulse-soft absolute inset-[1px] rounded-[15px] bg-white/20" />
              <span className="relative">AI</span>
            </span>
            <span>
              <span className="block text-base font-black leading-none tracking-wide">{SITE.shortName}</span>
              <span className="mt-1 block text-xs text-slate-400">{tr(language,{en:'Decision engine for e-commerce, startup validation and cost optimization',pl:'Silnik decyzji dla e-commerce, walidacji startupów i optymalizacji kosztów',de:'Decision Engine für E-Commerce, Startup-Validierung und Kostenoptimierung',es:'Motor de decisiones para e-commerce, validación startup y optimización de costes',pt:'Motor de decisão para e-commerce, validação de startup e otimização de custos',ru:'Движок решений для e-commerce, проверки стартапов и оптимизации затрат'})}</span>
            </span>
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <NavLink href="/pricing">{tr(language, { en: 'Pricing', pl: 'Cennik', de: 'Preise', es: 'Precios', pt: 'Preços', ru: 'Тарифы' })}</NavLink>
          <NavLink href="/integrations">{tr(language, { en: 'Integrations', pl: 'Integracje', de: 'Integrationen', es: 'Integraciones', pt: 'Integrações', ru: 'Интеграции' })}</NavLink>
          <NavLink href="/reviews">{tr(language, { en: 'Reviews', pl: 'Opinie', de: 'Bewertungen', es: 'Reseñas', pt: 'Avaliações', ru: 'Отзывы' })}</NavLink>
          <NavLink href="/support">{tr(language, { en: 'Support', pl: 'Wsparcie', de: 'Support', es: 'Soporte', pt: 'Suporte', ru: 'Поддержка' })}</NavLink>
          <NavLink href="/privacy">{tr(language, { en: 'Privacy', pl: 'Prywatność', de: 'Datenschutz', es: 'Privacidad', pt: 'Privacidade', ru: 'Конфиденциальность' })}</NavLink>
          {!isSupabaseConfigured && <NavLink href="/setup">{tr(language, { en: 'Setup', pl: 'Konfiguracja', es: 'Configuración', ru: 'Настройка' })}</NavLink>}
          <LanguageSwitcher currentLanguage={language} />
          {!isSupabaseConfigured ? (
            <Link href="/setup" className="rounded-2xl bg-[linear-gradient(135deg,rgba(34,211,238,1),rgba(16,185,129,0.95))] px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_16px_48px_rgba(34,211,238,0.20)] transition hover:scale-[1.02]">{tr(language,{en:'Configure',pl:'Skonfiguruj',de:'Konfigurieren',es:'Configurar',pt:'Configurar',ru:'Настроить'})}</Link>
          ) : user ? (
            <>
              <Link href="/dashboard" className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-2.5 text-sm font-semibold text-cyan-50 transition hover:border-cyan-200/40 hover:bg-cyan-300/15">{tr(language,{en:'Dashboard',pl:'Dashboard',de:'Dashboard',es:'Dashboard',pt:'Dashboard',ru:'Дашборд'})}</Link>
              {profileRole === 'admin' && (
                <Link href="/admin" className="rounded-2xl border border-fuchsia-300/30 bg-fuchsia-300/10 px-4 py-2.5 text-sm font-semibold text-fuchsia-50 transition hover:border-fuchsia-200/50 hover:bg-fuchsia-300/15">{tr(language,{en:'Admin',pl:'Admin',de:'Admin',es:'Admin',pt:'Admin',ru:'Админ'})}</Link>
              )}
              <Link href="/account" className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/[0.06]">{tr(language,{en:'My account',pl:'Moje konto',de:'Mein Konto',es:'Mi cuenta',pt:'Minha conta',ru:'Мой аккаунт'})}</Link>
              <LogoutButton label={tr(language,{en:'Log out',pl:'Wyloguj się',de:'Abmelden',es:'Cerrar sesión',pt:'Sair',ru:'Выйти'})} />
            </>
          ) : (
            <>
              <Link href="/auth/login" className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/[0.06]">{tr(language,{en:'Log in',pl:'Logowanie',de:'Anmelden',es:'Iniciar sesión',pt:'Entrar',ru:'Войти'})}</Link>
              <Link href="/auth/register" className="rounded-2xl bg-[linear-gradient(135deg,rgba(34,211,238,1),rgba(168,85,247,0.9))] px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_12px_30px_rgba(34,211,238,0.18)] transition hover:scale-[1.02]">{tr(language,{en:'Create account',pl:'Załóż konto',de:'Konto erstellen',es:'Crear cuenta',pt:'Criar conta',ru:'Создать аккаунт'})}</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-4 py-2.5 text-sm font-medium text-slate-200 transition duration-300 hover:-translate-y-[1px] hover:border-cyan-300/20 hover:bg-white/[0.06] hover:text-white hover:shadow-[0_14px_36px_rgba(8,47,73,0.20)]">
      {children}
    </Link>
  );
}
