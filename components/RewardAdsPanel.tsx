'use client';

import { useState, useEffect, useRef } from 'react';
import type { Language } from '@/lib/i18n';
import GoogleAdSenseSlot from '@/components/ads/GoogleAdSenseSlot';

type AdInventory = {
  providerType: string;
  providerName: string;
  clientId: string;
  publisherId: string;
  slotId: string;
  autoAdsEnabled?: boolean;
};

const tt = (l: Language, v: { en: string; pl: string; de?: string; es?: string; pt?: string; ja?: string; zh?: string; id?: string; ru?: string }) =>
  l === 'pl' ? v.pl : l === 'de' ? (v.de ?? v.en) : l === 'es' ? (v.es ?? v.pt ?? v.en) : l === 'pt' ? (v.pt ?? v.es ?? v.en) : l === 'ja' ? (v.ja ?? v.en) : l === 'zh' ? (v.zh ?? v.en) : l === 'id' ? (v.id ?? v.en) : l === 'ru' ? (v.ru ?? v.en) : v.en;

export default function RewardAdsPanel({ currentLanguage, initialCredits, watchedToday, dailyLimit, rewardCredits, rewardToken }: { currentLanguage: Language; initialCredits: number; watchedToday: number; dailyLimit: number; rewardCredits: number; rewardToken: string }) {
  const [credits, setCredits] = useState(initialCredits);
  const [watched, setWatched] = useState(watchedToday);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [hasRewardAds, setHasRewardAds] = useState(false);
  const [hasDisplayAds, setHasDisplayAds] = useState(false);
  const [displayInventory, setDisplayInventory] = useState<AdInventory | null>(null);
  const [checkingAds, setCheckingAds] = useState(true);
  const [highlighted, setHighlighted] = useState(false);
  const watchButtonRef = useRef<HTMLButtonElement | null>(null);
  const rewardClaimsReady = Boolean(rewardToken);

  useEffect(() => {
    function syncHashHighlight() {
      if (typeof window === 'undefined') return;
      const active = window.location.hash === '#reward-ads-panel';
      setHighlighted(active);
      if (active) {
        window.setTimeout(() => {
          if (watchButtonRef.current && !watchButtonRef.current.disabled) {
            watchButtonRef.current.focus({ preventScroll: true });
          }
        }, 220);
        window.setTimeout(() => setHighlighted(false), 2200);
      }
    }

    syncHashHighlight();
    window.addEventListener('hashchange', syncHashHighlight);
    return () => window.removeEventListener('hashchange', syncHashHighlight);
  }, []);

  const rootClassName = `relative scroll-mt-24 overflow-hidden premium-panel p-8 transition duration-500 ${highlighted ? 'reward-panel-highlight ring-2 ring-cyan-300/40 shadow-[0_0_0_1px_rgba(34,211,238,0.18),0_0_48px_rgba(34,211,238,0.16)]' : ''}`;

  useEffect(() => {
    async function checkAdProviders() {
      try {
        const res = await fetch('/api/ads/check-providers');
        if (res.ok) {
          const data = await res.json();
          setHasRewardAds(Boolean(data.hasRewardAds));
          setHasDisplayAds(Boolean(data.hasDisplayAds));
          setDisplayInventory(data.displayInventory || null);
        } else {
          setHasRewardAds(false);
          setHasDisplayAds(false);
          setDisplayInventory(null);
        }
      } catch (error) {
        console.error('Error checking ad providers:', error);
        setHasRewardAds(false);
        setHasDisplayAds(false);
        setDisplayInventory(null);
      } finally {
        setCheckingAds(false);
      }
    }
    checkAdProviders();
  }, []);

  async function handleWatch() {
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/rewards/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rewardToken, currentLanguage }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || tt(currentLanguage, { en: 'Reward error', pl: 'Błąd nagrody', de: 'Belohnungsfehler', es: 'Error de recompensa', pt: 'Erro de recompensa', ja: '報酬エラー', zh: '奖励错误', id: 'Error hadiah', ru: 'Ошибка награды' }));
        return;
      }

      setWatched(data.watchedToday);
      setCredits(data.creditsBalance);
      setMessage(data.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!rewardClaimsReady) {
      setMessage(tt(currentLanguage, {
        en: 'Reward claims are disabled until REWARD_TOKEN_SECRET is configured in the server environment.',
        pl: 'Odbieranie nagród jest wyłączone, dopóki REWARD_TOKEN_SECRET nie zostanie ustawiony w środowisku serwera.',
        es: 'Las recompensas están desactivadas hasta que REWARD_TOKEN_SECRET esté configurado en el entorno del servidor.',
        pt: 'As recompensas ficam desativadas até REWARD_TOKEN_SECRET estar configurado no ambiente do servidor.',
        ru: 'Награды отключены, пока REWARD_TOKEN_SECRET не будет настроен на сервере.',
      }));
    }
  }, [currentLanguage, rewardClaimsReady]);

  if (checkingAds) {
    return (
      <div id="reward-ads-panel" className={rootClassName}>
        <div className="mb-3 inline-flex rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-sm font-medium text-amber-200">
          {tt(currentLanguage, { en: 'Reward ads', pl: 'Reklamy nagradzane', de: 'Belohnte Anzeigen', es: 'Anuncios con recompensa', pt: 'Anúncios recompensados', ja: '報酬広告', zh: '奖励广告', id: 'Iklan berhadiah', ru: 'Рекламные награды' })}
        </div>
        <div className="animate-pulse text-slate-400">
          {tt(currentLanguage, { en: 'Loading...', pl: 'Ładowanie...', de: 'Wird geladen...', es: 'Cargando...', pt: 'A carregar...', ja: '読み込み中...', zh: '加载中...', id: 'Memuat...', ru: 'Загрузка...' })}
        </div>
      </div>
    );
  }

  if (!hasRewardAds) {
    return (
      <div id="reward-ads-panel" className={rootClassName}>
        <div className="mb-3 inline-flex rounded-full border border-slate-400/30 bg-slate-400/10 px-4 py-2 text-sm font-medium text-slate-300">
          {tt(currentLanguage, { en: 'Reward ads', pl: 'Reklamy nagradzane', de: 'Belohnte Anzeigen', es: 'Anuncios con recompensa', pt: 'Anúncios recompensados', ja: '報酬広告', zh: '奖励广告', id: 'Iklan berhadiah', ru: 'Рекламные награды' })}
        </div>
        <h2 className="text-3xl font-black text-white">
          {hasDisplayAds
            ? tt(currentLanguage, { en: 'Display ads are live. Reward unlock is not ready yet.', pl: 'Reklamy display już działają. Odblokowanie nagród nie jest jeszcze gotowe.', de: 'Display-Anzeigen laufen bereits. Reward-Freischaltung ist noch nicht bereit.', es: 'Los anuncios display ya están activos. El desbloqueo con recompensa aún no está listo.', pt: 'Os anúncios display já estão ativos. O desbloqueio por recompensa ainda não está pronto.', ja: 'ディスプレイ広告は稼働中ですが、報酬解放はまだ準備中です。', zh: '展示广告已上线，但奖励解锁尚未就绪。', id: 'Iklan display sudah aktif, tetapi unlock reward belum siap.', ru: 'Display-реклама уже работает, но reward-разблокировка пока не готова.' })
            : tt(currentLanguage, { en: 'Not yet available', pl: 'Jeszcze nie dostępne', de: 'Noch nicht verfügbar', es: 'Aún no disponible', pt: 'Ainda não disponível', ja: 'まだ利用できません', zh: '暂不可用', id: 'Belum tersedia', ru: 'Пока недоступно' })}
        </h2>
        <p className="mt-4 text-lg text-slate-300">
          {hasDisplayAds
            ? tt(currentLanguage, { en: 'Google AdSense can already monetize normal display inventory on the page, but reward unlocks still require a provider that explicitly supports rewarded ads.', pl: 'Google AdSense może już monetyzować zwykły inventory display na stronie, ale odblokowanie nagród nadal wymaga providera, który naprawdę obsługuje rewarded ads.', de: 'Google AdSense kann normales Display-Inventar bereits monetarisieren, aber Reward-Freischaltungen benötigen weiterhin einen Provider mit Reward-Support.', es: 'Google AdSense ya puede monetizar el inventario display normal de la página, pero los desbloqueos por recompensa siguen requiriendo un proveedor compatible con rewarded ads.', pt: 'O Google AdSense já pode monetizar o inventário display normal da página, mas os desbloqueios por recompensa ainda exigem um fornecedor com suporte a rewarded ads.', ja: 'Google AdSense では通常のディスプレイ広告収益化は可能ですが、報酬解放には rewarded ads 対応のプロバイダーが必要です。', zh: 'Google AdSense 已可用于普通展示广告变现，但奖励解锁仍需要明确支持 rewarded ads 的供应商。', id: 'Google AdSense sudah bisa memonetisasi inventori display biasa di halaman, tetapi unlock reward tetap butuh provider yang memang mendukung rewarded ads.', ru: 'Google AdSense уже может монетизировать обычный display inventory на странице, но для reward-разблокировок всё ещё нужен провайдер с поддержкой rewarded ads.' })
            : tt(currentLanguage, { en: 'Ad providers are not yet configured. The reward ads feature will be available soon.', pl: 'Dostawcy reklam nie zostali jeszcze skonfigurowania. Funkcja reklam nagradzanych będzie dostępna wkrótce.', de: 'Ad-Provider sind noch nicht konfiguriert. Die Werbeprämien-Funktion wird bald verfügbar sein.', es: 'Los proveedores de anuncios aún no están configurados. La función de anuncios con recompensa estará disponible pronto.', pt: 'Os fornecedores de anúncios ainda não estão configurados. O recurso de anúncios recompensados estará disponível em breve.', ja: '広告プロバイダーはまだ構成されていません。報酬広告機能はまもなく利用可能になります。', zh: '广告提供商尚未配置。奖励广告功能即将推出。', id: 'Penyedia iklan belum dikonfigurasi. Fitur iklan berhadiah akan tersedia segera.', ru: 'Поставщики рекламы еще не настроены. Функция вознаграждаемой рекламы скоро будет доступна.' })}
        </p>
        {displayInventory ? <GoogleAdSenseSlot clientId={displayInventory.clientId} slotId={displayInventory.slotId} className="mt-6" /> : null}
        <div className="mt-6 rounded-2xl border border-slate-400/30 bg-slate-400/10 p-4 text-slate-300">
          {hasDisplayAds
            ? tt(currentLanguage, { en: 'The page can already earn from display impressions. Enable a rewarded-capable provider later if you want AI-token unlocks here.', pl: 'Strona może już zarabiać na wyświetleniach display. Jeśli chcesz odblokowania tokenów AI w tym miejscu, włącz później providera obsługującego rewarded ads.', de: 'Die Seite kann bereits über Display-Impressions verdienen. Aktiviere später einen Reward-Provider, wenn du hier AI-Token-Freischaltungen möchtest.', es: 'La página ya puede monetizar impresiones display. Si quieres desbloqueos de tokens AI aquí, activa después un proveedor con rewarded ads.', pt: 'A página já pode monetizar impressões display. Se quiser desbloqueios de tokens AI aqui, ativa depois um fornecedor com rewarded ads.', ja: 'このページはすでにディスプレイ表示で収益化できます。ここで AI トークン解放を行いたい場合は、後で rewarded 対応プロバイダーを有効にしてください。', zh: '此页面已经可以通过展示广告获得收益。如果你希望在这里解锁 AI 代币，请稍后启用支持 rewarded ads 的供应商。', id: 'Halaman ini sudah bisa menghasilkan dari impresi display. Jika ingin unlock token AI di sini, aktifkan nanti provider yang mendukung rewarded ads.', ru: 'Страница уже может зарабатывать на display-показах. Если хочешь unlock AI токенов здесь, позже включи провайдера с rewarded ads.' })
            : tt(currentLanguage, { en: 'Come back later to start earning AI tokens through ads!', pl: 'Wróć później, aby zacząć zarabiać tokeny AI poprzez reklamy!', de: 'Komm später zurück, um AI-Tokens durch Werbung zu verdienen!', es: '¡Vuelve más tarde para empezar a ganar tokens AI a través de anuncios!', pt: 'Volte mais tarde para começar a ganhar tokens AI através de anúncios!', ja: '後でこのページに戻って、広告を通じてAIトークンを獲得し始めましょう!', zh: '稍后回来，通过广告开始赚取 AI 代币!', id: 'Kembali nanti untuk mulai mendapatkan token AI melalui iklan!', ru: 'Вернитесь позже, чтобы начать зарабатывать AI токены через рекламу!' })}
        </div>
      </div>
    );
  }

  return (
    <div id="reward-ads-panel" className={rootClassName}>
      <div className="mb-3 inline-flex rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-sm font-medium text-amber-200">
        {tt(currentLanguage, { en: 'Reward ads', pl: 'Reklamy nagradzane', de: 'Belohnte Anzeigen', es: 'Anuncios con recompensa', pt: 'Anúncios recompensados', ja: '報酬広告', zh: '奖励广告', id: 'Iklan berhadiah', ru: 'Рекламные награды' })}
      </div>
      <h2 className="text-3xl font-black text-white">
        {tt(currentLanguage, { en: 'Watch ads and earn AI tokens', pl: 'Oglądaj reklamy i zdobywaj tokeny AI', de: 'Sieh Anzeigen an und erhalte AI-Tokens', es: 'Mira anuncios y gana tokens AI', pt: 'Vê anúncios e ganha tokens AI', ja: '広告を見て AI トークンを獲得', zh: '观看广告赚取 AI 代币', id: 'Tonton iklan dan dapatkan token AI', ru: 'Смотри рекламу и получай AI токены' })}
      </h2>
      <div className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
        {tt(currentLanguage, { en: 'Good for reactivation and curiosity, but the bonus stays capped so paid plans still protect margin.', pl: 'Dobre do reaktywacji i ciekawości, ale bonus jest limitowany, żeby płatne plany nadal chroniły marżę.', de: 'Gut für Reaktivierung und Neugier, aber der Bonus bleibt begrenzt, damit bezahlte Pläne die Marge schützen.', es: 'Útil para reactivar y despertar curiosidad, pero el bonus está limitado para que los planes pagos sigan protegiendo el margen.', pt: 'Bom para reativação e curiosidade, mas o bónus é limitado para que os planos pagos continuem a proteger a margem.', ja: '再活性化や興味喚起には有効ですが、利益率を守るために報酬は上限付きです。', zh: '这对唤回用户和激发兴趣有帮助，但奖励有上限，以保护付费计划利润。', id: 'Bagus untuk reaktivasi dan rasa penasaran, tetapi bonus tetap dibatasi agar paket berbayar tetap menjaga margin.', ru: 'Это полезно для реактивации и интереса, но бонус ограничен, чтобы платные планы по-прежнему защищали маржу.' })}
      </div>
      {displayInventory ? <GoogleAdSenseSlot clientId={displayInventory.clientId} slotId={displayInventory.slotId} className="mt-6" /> : null}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4"><div className="text-xs uppercase tracking-[0.2em] text-slate-400">{tt(currentLanguage, { en: 'Watched today', pl: 'Obejrzane dziś', de: 'Heute gesehen', es: 'Vistos hoy', pt: 'Vistos hoje', ja: '本日視聴', zh: '今日已观看', id: 'Ditonton hari ini', ru: 'Просмотрено сегодня' })}</div><div className="mt-2 text-2xl font-bold text-white">{watched}/{dailyLimit}</div></div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4"><div className="text-xs uppercase tracking-[0.2em] text-slate-400">{tt(currentLanguage, { en: 'Current AI tokens', pl: 'Aktualne tokeny AI', de: 'Aktuelle AI-Tokens', es: 'Tokens AI actuales', pt: 'Tokens AI atuais', ja: '現在の AI トークン', zh: '当前 AI 代币', id: 'Token AI saat ini', ru: 'Текущие AI токены' })}</div><div className="mt-2 text-2xl font-bold text-white">{credits}</div></div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4"><div className="text-xs uppercase tracking-[0.2em] text-slate-400">{tt(currentLanguage, { en: 'Reward', pl: 'Nagroda', de: 'Belohnung', es: 'Recompensa', pt: 'Recompensa', ja: '報酬', zh: '奖励', id: 'Hadiah', ru: 'Награда' })}</div><div className="mt-2 text-2xl font-bold text-white">+{rewardCredits}</div></div>
      </div>
      <button ref={watchButtonRef} onClick={handleWatch} disabled={loading || watched >= dailyLimit || !rewardClaimsReady} className="mt-6 rounded-2xl bg-amber-300 px-6 py-4 font-semibold text-slate-950 transition focus:outline-none focus:ring-2 focus:ring-cyan-300/50 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-60">
        {!rewardClaimsReady
          ? tt(currentLanguage, { en: 'Reward secret required', pl: 'Wymagany sekret nagród', es: 'Se requiere secreto de recompensas', pt: 'Segredo de recompensa obrigatório', ru: 'Нужен секрет наград' })
          : watched >= dailyLimit
          ? tt(currentLanguage, { en: 'Daily limit reached', pl: 'Dzisiejszy limit osiągnięty', de: 'Tageslimit erreicht', es: 'Límite diario alcanzado', pt: 'Limite diário atingido', ja: '本日の上限に達しました', zh: '今日额度已用完', id: 'Batas harian tercapai', ru: 'Дневной лимит достигнут' })
          : loading
            ? tt(currentLanguage, { en: 'Saving...', pl: 'Zapisywanie...', de: 'Speichern...', es: 'Guardando...', pt: 'A guardar...', ja: '保存中...', zh: '保存中...', id: 'Menyimpan...', ru: 'Сохранение...' })
            : tt(currentLanguage, { en: 'Watch ad', pl: 'Obejrzyj reklamę', de: 'Anzeige ansehen', es: 'Ver anuncio', pt: 'Ver anúncio', ja: '広告を見る', zh: '观看广告', id: 'Tonton iklan', ru: 'Смотреть рекламу' })}
      </button>
      {message && <div className="mt-4 rounded-2xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-100">{message}</div>}
    </div>
  );
}
