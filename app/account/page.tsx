import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import StatusBadge from '@/components/StatusBadge';
import MetricCard from '@/components/pro-ui/MetricCard';
import InsightPanel from '@/components/pro-ui/InsightPanel';
import TutorialMode, { TutorialStep } from '@/components/pro-ui/TutorialMode';
import ReferralPanel from '@/components/ReferralPanel';
import { getReferralSettings } from '@/lib/app-config';
import { tr } from '@/lib/i18n';
import { getLanguage } from '@/lib/i18n-server';
import { getPlanDisplayName } from '@/lib/plans';

export default async function AccountPage({ searchParams }: { searchParams?: { saved?: string; error?: string } }) {
  const params = searchParams || {};
  const language = await getLanguage();
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  const referralSettings = await getReferralSettings();

  const tutorialSteps = [
    {
      step: '01',
      title: tr(language, { en: 'Check your plan and balance', pl: 'Sprawdź plan i saldo' }),
      description: tr(language, { en: 'Start here to see what access you already have and how many AI tokens are ready for use.', pl: 'Zacznij tutaj, aby zobaczyć jaki masz dostęp i ile tokenów AI jest gotowych do użycia.' }),
    },
    {
      step: '02',
      title: tr(language, { en: 'Complete your profile', pl: 'Uzupełnij profil' }),
      description: tr(language, { en: 'Add your real name and brand so the workspace feels more personal and better prepared for your business.', pl: 'Uzupełnij imię i nazwę marki, aby przestrzeń była bardziej osobista i lepiej przygotowana pod Twój biznes.' }),
    },
    {
      step: '03',
      title: tr(language, { en: 'Use quick shortcuts', pl: 'Używaj szybkich skrótów' }),
      description: tr(language, { en: 'Jump directly to dashboard, pricing, or admin without searching around the menu.', pl: 'Przechodź od razu do dashboardu, cennika albo admina bez szukania po menu.' }),
    },
    {
      step: '04',
      title: tr(language, { en: 'Invite others and grow faster', pl: 'Zaproś innych i rośnij szybciej' }),
      description: tr(language, { en: 'Use the referral section to bring new users and earn extra AI tokens more easily.', pl: 'Użyj sekcji poleceń, aby zapraszać nowych użytkowników i łatwiej zdobywać dodatkowe tokeny AI.' }),
    },
  ];

  return (
    <main className="mx-auto max-w-[1550px] px-4 py-14 text-white sm:px-6">
      <section className="mesh-panel relative rounded-[40px] p-8 shadow-[0_30px_140px_rgba(2,6,23,0.65)]">
        <div className="spotlight-sweep" />
        <div className="noise-overlay" />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-200">{tr(language, { en: 'My account', pl: 'Moje konto', de: 'Mein Konto', es: 'Mi cuenta', ja: 'マイアカウント', zh: '我的账户', id: 'Akun saya', ru: 'Мой аккаунт' })}</div>
            <h1 className="mt-4 text-5xl font-black tracking-tight">{tr(language, { en: 'Global account command center', pl: 'Globalne centrum zarządzania kontem', de: 'Globales Konto-Kontrollzentrum', es: 'Centro global de control de cuenta', ja: 'グローバルアカウント管理センター', zh: '全球账户控制中心', id: 'Pusat kontrol akun global', ru: 'Глобальный центр управления аккаунтом' })}</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">{tr(language, { en: 'Cleaner profile management, faster access shortcuts, and a more premium control layer without adding friction.', pl: 'Czytelniejsze zarządzanie profilem, szybsze skróty i bardziej premium warstwa kontroli bez zbędnego tarcia.', de: 'Klareres Profilmanagement, schnellere Kurzbefehle und eine hochwertigere Steuerungsebene ohne zusätzliche Reibung.', es: 'Gestión de perfil más limpia, accesos más rápidos y una capa de control más premium sin añadir fricción.', ja: 'プロフィール管理をより分かりやすく、ショートカットをより速く、操作層をよりプレミアムにしました。', zh: '更清晰的资料管理、更快的快捷入口，以及更高级的控制层。', id: 'Manajemen profil lebih rapi, shortcut lebih cepat, dan lapisan kontrol yang lebih premium tanpa menambah friksi.', ru: 'Более чистое управление профилем, быстрые переходы и премиальный слой контроля без лишнего трения.' })}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="glass-chip border-white/10 bg-white/[0.04] text-slate-100">{tr(language, { en: 'AI tokens', pl: 'Tokeny AI', de: 'AI-Tokens', es: 'Tokens AI', ja: 'AIトークン', zh: 'AI 代币', id: 'Token AI' })}</span>
              <span className="glass-chip border-white/10 bg-white/[0.04] text-slate-100">{tr(language, { en: 'Account health', pl: 'Stan konta', de: 'Kontostatus', es: 'Estado de la cuenta', ja: 'アカウント状態', zh: '账户状态', id: 'Kesehatan akun' })}</span>
              <span className="glass-chip border-white/10 bg-white/[0.04] text-slate-100">{tr(language, { en: 'Quick actions', pl: 'Szybkie akcje', de: 'Schnellaktionen', es: 'Acciones rápidas', ja: 'クイック操作', zh: '快捷操作', id: 'Aksi cepat' })}</span>
            </div>
          </div>
          <StatusBadge label={profile?.role === 'admin' ? 'admin' : 'user'} tone={profile?.role === 'admin' ? 'amber' : 'cyan'} />
        </div>
      </section>

      {(params.saved || params.error) && <div className={`mt-6 rounded-2xl border p-4 ${params.saved ? 'border-emerald-300/30 bg-emerald-300/10 text-emerald-200' : 'border-rose-300/30 bg-rose-300/10 text-rose-200'}`}>{params.saved ? tr(language, { en: 'Profile updated successfully.', pl: 'Profil został zapisany.', de: 'Profil erfolgreich gespeichert.', es: 'Perfil guardado correctamente.', ja: 'プロフィールを保存しました。', zh: '资料已成功更新。', id: 'Profil berhasil diperbarui.' }) : tr(language, { en: 'Could not save profile changes.', pl: 'Nie udało się zapisać zmian profilu.', de: 'Profiländerungen konnten nicht gespeichert werden.', es: 'No se pudieron guardar los cambios del perfil.', ja: 'プロフィール変更を保存できませんでした。', zh: '无法保存资料更改。', id: 'Perubahan profil tidak dapat disimpan.' })}</div>}

      <TutorialMode
        language={language}
        title={tr(language, { en: 'Need a guided setup for your account?', pl: 'Potrzebujesz prowadzonej konfiguracji konta?' })}
        intro={tr(language, { en: 'Turn on tutorial mode to see what each account block is for and what is worth updating first.', pl: 'Włącz tryb samouczka, aby zobaczyć do czego służy każdy blok konta i co warto uzupełnić jako pierwsze.' })}
        steps={tutorialSteps}
        storageKey="ufrev-account-tutorial"
      >
        <TutorialStep
          step="01"
          title={tr(language, { en: 'Check your access first', pl: 'Najpierw sprawdź swój dostęp' })}
          description={tr(language, { en: 'These cards show your current plan, AI token balance, and available capacity.', pl: 'Te karty pokazują aktualny plan, saldo tokenów AI i dostępną pojemność.' })}
        >
          <section className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard language={language} label={tr(language, { en: 'Plan', pl: 'Plan', de: 'Plan', es: 'Plan', ja: 'プラン', zh: '套餐', id: 'Paket' })} value={getPlanDisplayName(profile?.plan_key)} delta={tr(language, { en: 'Current access tier', pl: 'Aktualny poziom dostępu', de: 'Aktuelle Zugriffsstufe', es: 'Nivel de acceso actual', ja: '現在のアクセス階層', zh: '当前访问层级', id: 'Tingkat akses saat ini' })} tone="cyan" />
            <MetricCard language={language} label={tr(language, { en: 'AI Tokens', pl: 'Tokeny AI', de: 'AI-Tokens', es: 'Tokens AI', ja: 'AIトークン', zh: 'AI 代币', id: 'Token AI' })} value={String(profile?.credits_balance ?? 0)} delta={tr(language, { en: 'Protected usage balance', pl: 'Saldo chronionego użycia', de: 'Geschütztes Nutzungsguthaben', es: 'Saldo de uso protegido', ja: '保護された利用残高', zh: '受保护使用余额', id: 'Saldo penggunaan terlindungi' })} tone="emerald" />
            <MetricCard language={language} label={tr(language, { en: 'Monthly limit', pl: 'Limit miesięczny', de: 'Monatslimit', es: 'Límite mensual', ja: '月間上限', zh: '月度上限', id: 'Batas bulanan' })} value={String(profile?.monthly_analysis_limit ?? 0)} delta={tr(language, { en: 'Analysis capacity', pl: 'Pojemność analiz', de: 'Analysekapazität', es: 'Capacidad de análisis', ja: '分析容量', zh: '分析容量', id: 'Kapasitas analisis' })} tone="violet" />
            <MetricCard language={language} label={tr(language, { en: 'Admin access', pl: 'Dostęp admina', de: 'Adminzugriff', es: 'Acceso admin', ja: '管理者アクセス', zh: '管理员权限', id: 'Akses admin' })} value={profile?.role === 'admin' ? tr(language, { en: 'Enabled', pl: 'Włączony', de: 'Aktiv', es: 'Activo', ja: '有効', zh: '已启用', id: 'Aktif' }) : tr(language, { en: 'Disabled', pl: 'Wyłączony', de: 'Aus', es: 'Desactivado', ja: '無効', zh: '未启用', id: 'Nonaktif' })} delta={tr(language, { en: 'Control layer', pl: 'Warstwa kontroli', de: 'Kontrollebene', es: 'Capa de control', ja: '制御レイヤー', zh: '控制层', id: 'Lapisan kontrol' })} tone="amber" />
          </section>
        </TutorialStep>

        <TutorialStep
          step="02"
          title={tr(language, { en: 'Complete your business profile', pl: 'Uzupełnij profil biznesowy' })}
          description={tr(language, { en: 'Use this form to make the workspace feel ready for your brand and everyday work.', pl: 'Użyj tego formularza, aby dopasować przestrzeń do swojej marki i codziennej pracy.' })}
        >
          <section className="mt-8 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6">
              <form action="/api/profile/update" method="post" className="premium-panel p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold">{tr(language, { en: 'Profile details', pl: 'Dane profilu', de: 'Profildaten', es: 'Detalles del perfil', ja: 'プロフィール詳細', zh: '个人资料详情', id: 'Detail profil' })}</h2>
                    <p className="mt-2 text-sm text-slate-300">{tr(language, { en: 'Keep only the essentials updated so your workspace stays clear and business-ready.', pl: 'Aktualizuj tylko najważniejsze dane, aby Twoja przestrzeń była czytelna i gotowa do działania.' })}</p>
                  </div>
                  <div className="glass-chip border-emerald-300/20 bg-emerald-300/10 text-emerald-100">{tr(language, { en: 'Quick setup', pl: 'Szybka konfiguracja', de: 'Low-Friction-Setup', es: 'Configuración sin fricción', ja: '低摩擦セットアップ', zh: '低摩擦设置', id: 'Setup ringan' })}</div>
                </div>
                <div className="mt-6 grid gap-4">
                  <div><label className="mb-2 block text-sm text-slate-300">{tr(language, { en: 'Full name', pl: 'Imię i nazwisko', de: 'Vollständiger Name', es: 'Nombre completo', ja: '氏名', zh: '姓名', id: 'Nama lengkap' })}</label><input name="fullName" defaultValue={profile?.full_name ?? ''} className="input" placeholder="Jane Smith" /></div>
                  <div><label className="mb-2 block text-sm text-slate-300">{tr(language, { en: 'Company or brand', pl: 'Firma lub marka', de: 'Firma oder Marke', es: 'Empresa o marca', ja: '会社またはブランド', zh: '公司或品牌', id: 'Perusahaan atau brand' })}</label><input name="companyName" defaultValue={profile?.company_name ?? ''} className="input" placeholder="My ecommerce brand" /></div>
                  <div><label className="mb-2 block text-sm text-slate-300">{tr(language, { en: 'Email address', pl: 'Adres e-mail', de: 'E-Mail-Adresse', es: 'Correo electrónico', ja: 'メールアドレス', zh: '电子邮箱', id: 'Alamat email' })}</label><input value={profile?.email ?? user.email ?? ''} disabled className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-slate-400 outline-none" /></div>
                </div>
                <button className="mt-6 rounded-2xl bg-cyan-300 px-6 py-3 font-semibold text-slate-950">{tr(language, { en: 'Save profile', pl: 'Zapisz profil', de: 'Profil speichern', es: 'Guardar perfil', ja: 'プロフィールを保存', zh: '保存资料', id: 'Simpan profil' })}</button>
              </form>

              <div className="grid gap-4 md:grid-cols-3">
                <Link href="/dashboard" className="hover-lift rounded-[24px] border border-white/10 bg-slate-950/60 p-5">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-cyan-200">{tr(language, { en: 'Workspace', pl: 'Workspace', de: 'Workspace', es: 'Workspace', ja: 'ワークスペース', zh: '工作区', id: 'Workspace' })}</div>
                  <div className="mt-2 text-xl font-bold text-white">{tr(language, { en: 'Open dashboard', pl: 'Otwórz dashboard', de: 'Dashboard öffnen', es: 'Abrir panel', ja: 'ダッシュボードを開く', zh: '打开仪表板', id: 'Buka dashboard' })}</div>
                  <div className="mt-2 text-sm text-slate-300">{tr(language, { en: 'Go back to live analysis and results.', pl: 'Wróć do live analiz i wyników.', de: 'Zurück zu Live-Analysen und Ergebnissen.', es: 'Vuelve a los análisis y resultados en vivo.', ja: 'ライブ分析と結果に戻ります。', zh: '返回实时分析与结果。', id: 'Kembali ke analisis dan hasil live.' })}</div>
                </Link>
                <Link href="/pricing" className="hover-lift rounded-[24px] border border-white/10 bg-slate-950/60 p-5">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-emerald-200">{tr(language, { en: 'Billing', pl: 'Rozliczenia', de: 'Abrechnung', es: 'Facturación', ja: '請求', zh: '计费', id: 'Billing' })}</div>
                  <div className="mt-2 text-xl font-bold text-white">{tr(language, { en: 'Open pricing', pl: 'Otwórz cennik', de: 'Preise öffnen', es: 'Abrir precios', ja: '料金を開く', zh: '打开定价', id: 'Buka pricing' })}</div>
                  <div className="mt-2 text-sm text-slate-300">{tr(language, { en: 'Check plans, token packs, and upgrades.', pl: 'Sprawdź plany, pakiety tokenów i upgrady.', de: 'Prüfe Pläne, Token-Pakete und Upgrades.', es: 'Revisa planes, packs de tokens y mejoras.', ja: 'プラン、トークンパック、アップグレードを確認します。', zh: '查看套餐、代币包和升级。', id: 'Cek paket, token pack, dan upgrade.' })}</div>
                </Link>
                <Link href="/account/connections" className="hover-lift rounded-[24px] border border-white/10 bg-slate-950/60 p-5">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-violet-200">{tr(language, { en: 'Connections', pl: 'Połączenia' })}</div>
                  <div className="mt-2 text-xl font-bold text-white">{tr(language, { en: 'Connect your accounts', pl: 'Połącz swoje konta' })}</div>
                  <div className="mt-2 text-sm text-slate-300">{tr(language, { en: 'Open the free self-service panel for Shopify, WooCommerce and core marketplace lanes.', pl: 'Otwórz darmowy panel self-service dla Shopify, WooCommerce i głównych ścieżek marketplace.' })}</div>
                </Link>
                {profile?.role === 'admin' && <Link href="/admin" className="hover-lift rounded-[24px] border border-white/10 bg-slate-950/60 p-5">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-amber-200">Admin</div>
                  <div className="mt-2 text-xl font-bold text-white">{tr(language, { en: 'Open control room', pl: 'Otwórz control room', de: 'Kontrollraum öffnen', es: 'Abrir centro de control', ja: 'コントロールルームを開く', zh: '打开控制中心', id: 'Buka control room' })}</div>
                  <div className="mt-2 text-sm text-slate-300">{tr(language, { en: 'Jump into revenue, ops, and automations.', pl: 'Przejdź do revenue, operacji i automatyzacji.', de: 'Springe zu Revenue, Ops und Automationen.', es: 'Salta a revenue, ops y automatizaciones.', ja: '売上、運用、自動化へすぐ移動できます。', zh: '快速进入收入、运营和自动化。', id: 'Masuk cepat ke revenue, ops, dan automasi.' })}</div>
                </Link>}
              </div>
            </div>

            <div className="space-y-6">
              <div className="premium-panel p-6">
                <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-200">{tr(language, { en: 'Account health', pl: 'Stan konta', de: 'Kontostatus', es: 'Estado de la cuenta', ja: 'アカウント状態', zh: '账户状态', id: 'Kesehatan akun' })}</div>
                <h2 className="mt-2 text-2xl font-black">{tr(language, { en: 'Fast status overview', pl: 'Szybki przegląd statusu', de: 'Schnelle Statusübersicht', es: 'Resumen rápido del estado', ja: 'ステータス概要', zh: '快速状态概览', id: 'Ringkasan status cepat' })}</h2>
                <div className="mt-5 space-y-3">
                  {[
                    `${tr(language, { en: 'Onboarding', pl: 'Onboarding', de: 'Onboarding', es: 'Onboarding', ja: 'オンボーディング', zh: '引导状态', id: 'Onboarding' })}: ${profile?.onboarding_completed ? tr(language, { en: 'Completed', pl: 'Ukończony', de: 'Abgeschlossen', es: 'Completado', ja: '完了', zh: '已完成', id: 'Selesai' }) : tr(language, { en: 'Incomplete', pl: 'Niepełny', de: 'Unvollständig', es: 'Incompleto', ja: '未完了', zh: '未完成', id: 'Belum lengkap' })}`,
                    `${tr(language, { en: 'Role', pl: 'Rola', de: 'Rolle', es: 'Rol', ja: '権限', zh: '角色', id: 'Peran' })}: ${profile?.role ?? 'user'}`,
                    `${tr(language, { en: 'Customer email', pl: 'E-mail klienta', de: 'Kunden-E-Mail', es: 'Correo del cliente', ja: '顧客メール', zh: '客户邮箱', id: 'Email pelanggan' })}: ${profile?.email ?? user.email ?? 'n/a'}`,
                    `${tr(language, { en: 'Stripe customer ID', pl: 'Stripe customer ID', de: 'Stripe-Kunden-ID', es: 'ID de cliente Stripe', ja: 'Stripe 顧客ID', zh: 'Stripe 客户 ID', id: 'ID pelanggan Stripe' })}: ${profile?.stripe_customer_id || tr(language, { en: 'Not connected yet', pl: 'Jeszcze nie połączono', de: 'Noch nicht verbunden', es: 'Aún no conectado', ja: '未接続', zh: '尚未连接', id: 'Belum terhubung' })}`,
                  ].map((item) => (
                    <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200">{item}</div>
                  ))}
                </div>
              </div>

              <InsightPanel language={language} title={tr(language, { en: 'What is handled for you', pl: 'Co jest obsługiwane za Ciebie', de: 'Was für dich abgedeckt wird', es: 'Qué se gestiona por ti', ja: '自動で整理される内容', zh: '系统为你处理的内容', id: 'Yang ditangani untukmu' })} items={[
                tr(language, { en: 'Your access tier and AI-token balance stay visible at a glance.', pl: 'Poziom dostępu i saldo tokenów AI są widoczne od razu.', de: 'Zugriffsstufe und AI-Token-Saldo bleiben auf einen Blick sichtbar.', es: 'Tu nivel de acceso y saldo de tokens AI siguen visibles de un vistazo.', ja: 'アクセス階層と AI トークン残高がひと目で分かります。', zh: '你的访问层级和 AI 代币余额一目了然。', id: 'Tingkat akses dan saldo token AI tetap terlihat sekilas.' }),
                tr(language, { en: 'Shortcuts reduce clicks between dashboard, pricing, and admin.', pl: 'Skróty ograniczają liczbę kliknięć między dashboardem, cennikiem i adminem.', de: 'Shortcuts reduzieren Klicks zwischen Dashboard, Pricing und Admin.', es: 'Los accesos reducen clics entre dashboard, pricing y admin.', ja: 'ショートカットでダッシュボード、料金、管理画面をすばやく移動できます。', zh: '快捷入口减少了在仪表板、定价和管理面板之间的点击次数。', id: 'Shortcut mengurangi klik antara dashboard, pricing, dan admin.' }),
                tr(language, { en: 'The account layer keeps a cleaner premium feel without bloating the form.', pl: 'Warstwa konta zachowuje czysty premium wygląd bez rozbudowy formularza.', de: 'Die Kontoseite bleibt premium und sauber, ohne das Formular aufzublähen.', es: 'La capa de cuenta mantiene un aspecto premium sin inflar el formulario.', ja: 'アカウント画面は、フォームを肥大化させずにプレミアム感を保ちます。', zh: '账户层保持高级感，同时不过度堆积表单。', id: 'Lapisan akun tetap terasa premium tanpa membuat form jadi berat.' }),
              ]} />
            </div>
          </section>
        </TutorialStep>

        <TutorialStep
          step="03"
          title={tr(language, { en: 'Use your shortcuts and status area', pl: 'Korzystaj ze skrótów i strefy statusu' })}
          description={tr(language, { en: 'This side of the page helps you move faster between account, dashboard, billing, and admin.', pl: 'Ta część strony pomaga szybciej przechodzić między kontem, dashboardem, rozliczeniami i adminem.' })}
        >
          <section className="mt-8">
            <InsightPanel language={language} title={tr(language, { en: 'Why this page matters for clients', pl: 'Dlaczego ta strona ma znaczenie dla klienta' })} items={[
              tr(language, { en: 'It makes your account feel organized, trustworthy, and easy to control.', pl: 'Sprawia, że konto wygląda na uporządkowane, wiarygodne i łatwe do kontrolowania.' }),
              tr(language, { en: 'You can quickly confirm whether your setup is ready for more analyses and upgrades.', pl: 'Możesz szybko sprawdzić, czy Twoja konfiguracja jest gotowa na więcej analiz i upgrade’ów.' }),
              tr(language, { en: 'You waste less time searching and more time using the product productively.', pl: 'Marnujesz mniej czasu na szukanie i więcej na produktywne korzystanie z produktu.' }),
            ]} />
          </section>
        </TutorialStep>

        <TutorialStep
          step="04"
          title={tr(language, { en: 'Invite and earn more tokens', pl: 'Zapraszaj i zdobywaj więcej tokenów' })}
          description={tr(language, { en: 'The referral card is the easiest place to share your code and turn word-of-mouth into extra usage.', pl: 'Panel poleceń to najprostsze miejsce, by udostępnić kod i zamienić polecenia w dodatkowe użycie.' })}
        >
          <section className="mt-8">
            <ReferralPanel currentLanguage={language} referralCode={profile?.referral_code || 'share-ufrev'} rewardCredits={referralSettings.rewardCredits} />
          </section>
        </TutorialStep>
      </TutorialMode>
    </main>
  );
}
