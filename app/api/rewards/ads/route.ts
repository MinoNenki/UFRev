import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getRewardSettings } from '@/lib/app-config';
import { getAutomationSettings } from '@/lib/profit-config';
import { SECURITY_LIMITS, verifyRewardToken } from '@/lib/security';
import type { Language } from '@/lib/i18n';
import { getEnabledAdProviders } from '@/lib/app-config';
import { getProviderSummary } from '@/lib/ad-providers';

export const runtime = 'nodejs';

const tt = (l: Language, v: { en: string; pl: string; de?: string; es?: string; pt?: string; ja?: string; zh?: string; id?: string; ru?: string }) =>
  l === 'pl' ? v.pl : l === 'de' ? (v.de ?? v.en) : l === 'es' ? (v.es ?? v.pt ?? v.en) : l === 'pt' ? (v.pt ?? v.es ?? v.en) : l === 'ja' ? (v.ja ?? v.en) : l === 'zh' ? (v.zh ?? v.en) : l === 'id' ? (v.id ?? v.en) : l === 'ru' ? (v.ru ?? v.en) : v.en;

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const body = await req.json().catch(() => ({}));
  const currentLanguage = String(body?.currentLanguage || 'en') as Language;

  if (!user) {
    return NextResponse.json({ error: tt(currentLanguage, { en: 'Unauthorized.', pl: 'Brak autoryzacji.', de: 'Nicht autorisiert.', es: 'No autorizado.', pt: 'Não autorizado.', ja: '認証されていません。', zh: '未授权。', id: 'Tidak diizinkan.', ru: 'Нет авторизации.' }) }, { status: 401 });
  }

  const enabledProviders = await getEnabledAdProviders();
  const providerSummary = getProviderSummary(enabledProviders as any);
  if (!providerSummary.hasRewardAds) {
    return NextResponse.json({
      error: tt(currentLanguage, {
        en: 'Reward ads are not enabled yet. Display monetization can run separately, but reward unlocks still need a rewarded-capable provider.',
        pl: 'Reklamy nagradzane nie są jeszcze aktywne. Monetyzacja display może działać osobno, ale odblokowanie nagród wymaga providera obsługującego rewarded ads.',
        de: 'Belohnte Anzeigen sind noch nicht aktiv. Display-Monetarisierung kann separat laufen, aber Reward-Freischaltungen brauchen einen Reward-Provider.',
        es: 'Los anuncios recompensados aún no están activos. La monetización display puede funcionar aparte, pero los desbloqueos requieren un proveedor compatible con rewarded ads.',
        ru: 'Reward ads пока не активны. Display-монетизация может работать отдельно, но для наград нужен провайдер с rewarded inventory.',
      }),
    }, { status: 409 });
  }

  const rewardToken = String(body?.rewardToken || '');
  const verified = verifyRewardToken(rewardToken, user.id);
  if (!verified.valid) {
    return NextResponse.json({ error: verified.reason || tt(currentLanguage, { en: 'Invalid reward token.', pl: 'Nieprawidłowy token nagrody.', de: 'Ungültiger Belohnungstoken.', es: 'Token de recompensa no válido.', pt: 'Token de recompensa inválido.', ja: '無効な報酬トークンです。', zh: '奖励令牌无效。', id: 'Token hadiah tidak valid.', ru: 'Недействительный токен награды.' }) }, { status: 400 });
  }

  const [{ data: usedToken }, { data: recentClaims }, automationSettings, rewardSettings] = await Promise.all([
    supabaseAdmin.from('security_events').select('id').eq('event_type', 'reward_token_used').filter('metadata->>token_hash', 'eq', verified.tokenHash).maybeSingle(),
    supabaseAdmin.from('security_events').select('created_at').eq('user_id', user.id).eq('event_type', 'reward_claim').order('created_at', { ascending: false }).limit(20),
    getAutomationSettings(),
    getRewardSettings(),
  ]);

  if (usedToken) {
    return NextResponse.json({ error: tt(currentLanguage, { en: 'Reward token already used.', pl: 'Token nagrody został już użyty.', de: 'Belohnungstoken wurde bereits verwendet.', es: 'El token de recompensa ya fue usado.', pt: 'O token de recompensa já foi usado.', ja: '報酬トークンはすでに使用されています。', zh: '奖励令牌已被使用。', id: 'Token hadiah sudah dipakai.', ru: 'Токен награды уже использован.' }) }, { status: 400 });
  }

  const now = Date.now();
  const cooldownMs = SECURITY_LIMITS.minSecondsBetweenRewardClaims * 1000;
  const lastClaim = recentClaims?.[0]?.created_at ? new Date(recentClaims[0].created_at).getTime() : 0;
  if (lastClaim && now - lastClaim < cooldownMs) {
    return NextResponse.json({ error: tt(currentLanguage, { en: `Wait ${Math.ceil((cooldownMs - (now - lastClaim)) / 1000)}s before the next reward claim.`, pl: `Poczekaj ${Math.ceil((cooldownMs - (now - lastClaim)) / 1000)} s przed kolejną nagrodą.`, de: `Warte ${Math.ceil((cooldownMs - (now - lastClaim)) / 1000)} Sek. vor der nächsten Belohnung.`, es: `Espera ${Math.ceil((cooldownMs - (now - lastClaim)) / 1000)} s antes de la siguiente recompensa.`, pt: `Espera ${Math.ceil((cooldownMs - (now - lastClaim)) / 1000)} s antes da próxima recompensa.`, ja: `次の報酬請求まで ${Math.ceil((cooldownMs - (now - lastClaim)) / 1000)} 秒待ってください。`, zh: `请等待 ${Math.ceil((cooldownMs - (now - lastClaim)) / 1000)} 秒后再领取下一次奖励。`, id: `Tunggu ${Math.ceil((cooldownMs - (now - lastClaim)) / 1000)} dtk sebelum klaim berikutnya.`, ru: `Подождите ${Math.ceil((cooldownMs - (now - lastClaim)) / 1000)} сек. перед следующей наградой.` }) }, { status: 429 });
  }

  const oneHourAgo = now - 60 * 60 * 1000;
  const recentHourCount = (recentClaims || []).filter((item: any) => new Date(item.created_at).getTime() >= oneHourAgo).length;
  if (recentHourCount >= Math.min(automationSettings.maxDailyRewardClaims, SECURITY_LIMITS.maxRewardClaimsPerHour)) {
    return NextResponse.json({ error: tt(currentLanguage, { en: 'Hourly reward claim limit reached.', pl: 'Osiągnięto godzinowy limit nagród.', de: 'Stündliches Belohnungslimit erreicht.', es: 'Se alcanzó el límite horario de recompensas.', pt: 'O limite horário de recompensas foi atingido.', ja: '1時間あたりの報酬上限に達しました。', zh: '已达到每小时奖励上限。', id: 'Batas klaim hadiah per jam tercapai.', ru: 'Достигнут почасовой лимит наград.' }) }, { status: 429 });
  }

  const { data, error } = await supabase.rpc('record_rewarded_ad_view', { p_user_id: user.id, p_daily_limit: Math.min(rewardSettings.dailyAdLimit, automationSettings.maxDailyRewardClaims), p_reward_credits: rewardSettings.dailyRewardCredits });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  const payload = Array.isArray(data) ? data[0] : data;

  await supabaseAdmin.from('security_events').insert([
    { user_id: user.id, event_type: 'reward_token_used', metadata: { token_hash: verified.tokenHash, source: 'reward_ads' } },
    { user_id: user.id, event_type: 'reward_claim', metadata: { watched_today: payload?.watched_today ?? 0, reward_granted: Boolean(payload?.reward_granted) } },
  ]);

  return NextResponse.json({
    watchedToday: payload?.watched_today ?? 0,
    creditsBalance: payload?.credits_balance ?? 0,
    rewardGranted: Boolean(payload?.reward_granted),
    message: payload?.reward_granted
      ? tt(currentLanguage, { en: `Full ad streak completed. You received ${rewardSettings.dailyRewardCredits} bonus AI tokens.`, pl: `Pełna seria reklam ukończona. Otrzymujesz ${rewardSettings.dailyRewardCredits} bonusowych tokenów AI.`, de: `Komplette Anzeigenserie abgeschlossen. Du erhältst ${rewardSettings.dailyRewardCredits} Bonus-AI-Tokens.`, es: `Serie completa de anuncios terminada. Recibes ${rewardSettings.dailyRewardCredits} tokens AI extra.`, pt: `Sequência completa de anúncios concluída. Recebes ${rewardSettings.dailyRewardCredits} tokens AI extra.`, ja: `広告シリーズを完了しました。${rewardSettings.dailyRewardCredits} 個のボーナス AI トークンを獲得しました。`, zh: `完整广告任务已完成。你获得了 ${rewardSettings.dailyRewardCredits} 个额外 AI 代币。`, id: `Rangkaian iklan selesai. Kamu mendapat ${rewardSettings.dailyRewardCredits} token AI bonus.`, ru: `Полная серия рекламы завершена. Вы получили ${rewardSettings.dailyRewardCredits} бонусных AI токенов.` })
      : tt(currentLanguage, { en: 'Ad view recorded. The bonus unlocks after the full streak is completed.', pl: 'Wyświetlenie reklamy zapisane. Bonus odblokuje się po ukończeniu całej serii.', de: 'Anzeigenaufruf gespeichert. Der Bonus wird nach Abschluss der ganzen Serie freigeschaltet.', es: 'Visualización registrada. El bonus se desbloquea al completar toda la serie.', pt: 'Visualização registada. O bónus desbloqueia-se após completares toda a sequência.', ja: '広告視聴を記録しました。ボーナスは全シリーズ完了後に解放されます。', zh: '已记录广告观看。完成整组后将解锁奖励。', id: 'Tayangan iklan tercatat. Bonus terbuka setelah seluruh rangkaian selesai.', ru: 'Просмотр рекламы записан. Бонус откроется после завершения всей серии.' }),
  });
}
