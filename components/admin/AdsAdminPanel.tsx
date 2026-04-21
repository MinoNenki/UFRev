import React from 'react';
import type { Language } from '@/lib/i18n';

const tt = (l: Language, v: { en: string; pl: string; de?: string; es?: string; pt?: string; ja?: string; zh?: string; id?: string; ru?: string }) =>
  l === 'pl' ? v.pl : l === 'de' ? (v.de ?? v.en) : l === 'es' ? (v.es ?? v.en) : l === 'pt' ? (v.pt ?? v.en) : l === 'ja' ? (v.ja ?? v.en) : l === 'zh' ? (v.zh ?? v.en) : l === 'id' ? (v.id ?? v.en) : l === 'ru' ? (v.ru ?? v.en) : v.en;

export default function AdsAdminPanel({
  dailyLimit,
  rewardCredits,
  monetizationSettings,
  currentLanguage = 'en',
}: {
  dailyLimit: number;
  rewardCredits: number;
  monetizationSettings: {
    smartPaywallEnabled: boolean;
    premiumGateScore: number;
    highIntentConfidence: number;
    freeAnalysesBeforePaywall: number;
    creditPackUpsellScore: number;
    annualDiscountPercent: number;
    adUnlockEnabled: boolean;
    estimatedCACUsd: number;
    ltvMonths: number;
    targetLtvToCacRatio: number;
  };
  currentLanguage?: Language;
}) {
  return (
    <div className="rounded-[32px] border border-white/10 bg-slate-950/60 p-8 shadow-[0_24px_100px_rgba(2,6,23,0.45)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.24em] text-amber-200">{tt(currentLanguage, { en: 'Revenue control center', pl: 'Centrum kontroli przychodu', es: 'Centro de control de ingresos', ru: 'Центр контроля выручки' })}</div>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white">{tt(currentLanguage, { en: 'Preset-driven monetization ops', pl: 'Monetyzacja sterowana presetami', es: 'Operaciones de monetización por presets', ru: 'Монетизация, управляемая пресетами' })}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">{tt(currentLanguage, { en: 'Use one-click revenue modes first, then open advanced controls only when you need fine tuning.', pl: 'Najpierw używaj gotowych trybów przychodu, a zaawansowane ustawienia otwieraj dopiero przy precyzyjnym strojeniu.', es: 'Usa primero los modos de ingresos de un clic y abre los controles avanzados solo cuando necesites ajuste fino.', ru: 'Сначала используй готовые режимы выручки, а расширенные настройки открывай только для тонкой настройки.' })}</p>
        </div>
        <div className="glass-chip border-amber-300/20 bg-amber-300/10 text-amber-100">{tt(currentLanguage, { en: 'Less manual input', pl: 'Mniej ręcznej pracy', es: 'Menos trabajo manual', ru: 'Меньше ручной работы' })}</div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><div className="text-xs uppercase tracking-[0.2em] text-slate-500">{tt(currentLanguage, { en: 'Reward ads', pl: 'Reklamy nagradzane', es: 'Anuncios con recompensa', ru: 'Вознаграждаемые объявления' })}</div><div className="mt-2 text-2xl font-black text-white">{monetizationSettings.adUnlockEnabled ? tt(currentLanguage, { en: 'Enabled', pl: 'Włączone', es: 'Activo', ru: 'Включено' }) : tt(currentLanguage, { en: 'Off', pl: 'Wyłączone', es: 'Apagado', ru: 'Выключено' })}</div></div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><div className="text-xs uppercase tracking-[0.2em] text-slate-500">{tt(currentLanguage, { en: 'Smart paywall', pl: 'Inteligentny paywall', es: 'Paywall inteligente', ru: 'Умный paywall' })}</div><div className="mt-2 text-2xl font-black text-white">{monetizationSettings.smartPaywallEnabled ? tt(currentLanguage, { en: 'Enabled', pl: 'Włączony', es: 'Activo', ru: 'Включён' }) : tt(currentLanguage, { en: 'Basic', pl: 'Podstawowy', es: 'Básico', ru: 'Базовый' })}</div></div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><div className="text-xs uppercase tracking-[0.2em] text-slate-500">{tt(currentLanguage, { en: 'Premium gate score', pl: 'Próg premium gate', es: 'Puntuación del premium gate', ru: 'Порог premium gate' })}</div><div className="mt-2 text-2xl font-black text-white">{monetizationSettings.premiumGateScore}</div></div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><div className="text-xs uppercase tracking-[0.2em] text-slate-500">{tt(currentLanguage, { en: 'Free analyses before paywall', pl: 'Darmowe analizy przed paywallem', es: 'Análisis gratis antes del paywall', ru: 'Бесплатные анализы до paywall' })}</div><div className="mt-2 text-2xl font-black text-white">{monetizationSettings.freeAnalysesBeforePaywall}</div></div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <form action="/api/admin/monetization/settings" method="post" className="hover-lift rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
          <input type="hidden" name="dailyAdLimit" value="6" />
          <input type="hidden" name="dailyRewardCredits" value="1" />
          <input type="hidden" name="smartPaywallEnabled" value="on" />
          <input type="hidden" name="premiumGateScore" value="80" />
          <input type="hidden" name="highIntentConfidence" value="74" />
          <input type="hidden" name="freeAnalysesBeforePaywall" value="1" />
          <input type="hidden" name="creditPackUpsellScore" value="70" />
          <input type="hidden" name="annualDiscountPercent" value="10" />
          <input type="hidden" name="adUnlockEnabled" value="on" />
          <input type="hidden" name="estimatedCACUsd" value="24" />
          <input type="hidden" name="ltvMonths" value="10" />
          <input type="hidden" name="targetLtvToCacRatio" value="4" />
          <div className="text-[11px] uppercase tracking-[0.22em] text-cyan-200">Preset 01</div>
          <div className="mt-2 text-xl font-bold text-white">{tt(currentLanguage, { en: 'Lean activation', pl: 'Lekka aktywacja', es: 'Activación ligera', ru: 'Лёгкая активация' })}</div>
          <p className="mt-2 text-sm text-slate-300">{tt(currentLanguage, { en: 'Stricter paywall, lighter ad rewards, healthier protection for margins.', pl: 'Surowszy paywall, lżejsze nagrody reklamowe i zdrowsza ochrona marży.', es: 'Paywall más estricto, recompensas publicitarias más ligeras y mejor protección del margen.', ru: 'Более строгий paywall, мягче награды за рекламу и здоровее защита маржи.' })}</p>
          <button className="mt-4 rounded-2xl bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950">{tt(currentLanguage, { en: 'Apply preset', pl: 'Zastosuj preset', es: 'Aplicar preset', ru: 'Применить пресет' })}</button>
        </form>

        <form action="/api/admin/monetization/settings" method="post" className="hover-lift rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
          <input type="hidden" name="dailyAdLimit" value="6" />
          <input type="hidden" name="dailyRewardCredits" value="1" />
          <input type="hidden" name="smartPaywallEnabled" value="on" />
          <input type="hidden" name="premiumGateScore" value="76" />
          <input type="hidden" name="highIntentConfidence" value="72" />
          <input type="hidden" name="freeAnalysesBeforePaywall" value="1" />
          <input type="hidden" name="creditPackUpsellScore" value="68" />
          <input type="hidden" name="annualDiscountPercent" value="15" />
          <input type="hidden" name="adUnlockEnabled" value="on" />
          <input type="hidden" name="estimatedCACUsd" value="24" />
          <input type="hidden" name="ltvMonths" value="10" />
          <input type="hidden" name="targetLtvToCacRatio" value="4" />
          <div className="text-[11px] uppercase tracking-[0.22em] text-emerald-200">Preset 02</div>
          <div className="mt-2 text-xl font-bold text-white">{tt(currentLanguage, { en: 'Balanced MRR', pl: 'Zbalansowany MRR', es: 'MRR equilibrado', ru: 'Сбалансированный MRR' })}</div>
          <p className="mt-2 text-sm text-slate-300">{tt(currentLanguage, { en: 'Best default mix for recurring revenue, activation, and upsells.', pl: 'Najlepszy domyślny miks dla przychodu cyklicznego, aktywacji i upselli.', es: 'La mejor mezcla por defecto para ingresos recurrentes, activación y upsells.', ru: 'Лучший базовый баланс для регулярной выручки, активации и upsell.' })}</p>
          <button className="mt-4 rounded-2xl bg-emerald-300 px-4 py-2 text-sm font-semibold text-slate-950">{tt(currentLanguage, { en: 'Apply preset', pl: 'Zastosuj preset', es: 'Aplicar preset', ru: 'Применить пресет' })}</button>
        </form>

        <form action="/api/admin/monetization/settings" method="post" className="hover-lift rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
          <input type="hidden" name="dailyAdLimit" value="5" />
          <input type="hidden" name="dailyRewardCredits" value="1" />
          <input type="hidden" name="smartPaywallEnabled" value="on" />
          <input type="hidden" name="premiumGateScore" value="84" />
          <input type="hidden" name="highIntentConfidence" value="78" />
          <input type="hidden" name="freeAnalysesBeforePaywall" value="1" />
          <input type="hidden" name="creditPackUpsellScore" value="74" />
          <input type="hidden" name="annualDiscountPercent" value="10" />
          <input type="hidden" name="adUnlockEnabled" value="on" />
          <input type="hidden" name="estimatedCACUsd" value="28" />
          <input type="hidden" name="ltvMonths" value="10" />
          <input type="hidden" name="targetLtvToCacRatio" value="4" />
          <div className="text-[11px] uppercase tracking-[0.22em] text-amber-200">Preset 03</div>
          <div className="mt-2 text-xl font-bold text-white">{tt(currentLanguage, { en: 'Premium upsell', pl: 'Upsell premium', es: 'Upsell premium', ru: 'Премиум upsell' })}</div>
          <p className="mt-2 text-sm text-slate-300">{tt(currentLanguage, { en: 'Tighter gate for high-intent users and stronger premium positioning.', pl: 'Mocniejsza bramka dla użytkowników high-intent i silniejsze pozycjonowanie premium.', es: 'Puerta más estricta para usuarios de alta intención y un posicionamiento premium más fuerte.', ru: 'Более жёсткая воронка для high-intent пользователей и сильнее premium-позиционирование.' })}</p>
          <button className="mt-4 rounded-2xl bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950">{tt(currentLanguage, { en: 'Apply preset', pl: 'Zastosuj preset', es: 'Aplicar preset', ru: 'Применить пресет' })}</button>
        </form>
      </div>

      <details className="mt-6 rounded-[24px] border border-white/10 bg-white/[0.02] p-5">
        <summary className="cursor-pointer list-none text-sm font-semibold text-white">{tt(currentLanguage, { en: 'Open advanced revenue controls', pl: 'Otwórz zaawansowane sterowanie przychodem', es: 'Abrir controles avanzados de ingresos', ru: 'Открыть расширенные настройки выручки' })}</summary>
        <form action="/api/admin/monetization/settings" method="post" className="mt-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div><label className="mb-2 block text-sm text-slate-300">{tt(currentLanguage, { en: 'Daily reward ad limit', pl: 'Dzienny limit reklam nagradzanych', es: 'Límite diario de anuncios con recompensa', ru: 'Дневной лимит вознаграждаемой рекламы' })}</label><input name="dailyAdLimit" type="number" min="1" max="50" defaultValue={dailyLimit} className="input" /></div>
            <div><label className="mb-2 block text-sm text-slate-300">{tt(currentLanguage, { en: 'Reward AI tokens', pl: 'Nagroda w tokenach AI', es: 'Tokens AI de recompensa', ru: 'Награда в AI токенах' })}</label><input name="dailyRewardCredits" type="number" min="1" max="20" defaultValue={rewardCredits} className="input" /></div>
            <div><label className="mb-2 block text-sm text-slate-300">{tt(currentLanguage, { en: 'Premium gate score', pl: 'Próg premium gate', es: 'Puntuación del premium gate', ru: 'Порог premium gate' })}</label><input name="premiumGateScore" type="number" min="40" max="95" defaultValue={monetizationSettings.premiumGateScore} className="input" /></div>
            <div><label className="mb-2 block text-sm text-slate-300">{tt(currentLanguage, { en: 'High intent confidence', pl: 'Pewność high intent', es: 'Confianza de alta intención', ru: 'Уверенность high intent' })}</label><input name="highIntentConfidence" type="number" min="30" max="95" defaultValue={monetizationSettings.highIntentConfidence} className="input" /></div>
            <div><label className="mb-2 block text-sm text-slate-300">{tt(currentLanguage, { en: 'Free analyses before paywall', pl: 'Darmowe analizy przed paywallem', es: 'Análisis gratis antes del paywall', ru: 'Бесплатные анализы до paywall' })}</label><input name="freeAnalysesBeforePaywall" type="number" min="0" max="20" defaultValue={monetizationSettings.freeAnalysesBeforePaywall} className="input" /></div>
            <div><label className="mb-2 block text-sm text-slate-300">{tt(currentLanguage, { en: 'AI-token pack upsell score', pl: 'Próg upsellu pakietów AI', es: 'Puntuación de upsell de paquetes AI', ru: 'Порог upsell для AI-пакетов' })}</label><input name="creditPackUpsellScore" type="number" min="30" max="95" defaultValue={monetizationSettings.creditPackUpsellScore} className="input" /></div>
            <div><label className="mb-2 block text-sm text-slate-300">{tt(currentLanguage, { en: 'Annual discount (%)', pl: 'Roczna zniżka (%)', es: 'Descuento anual (%)', ru: 'Годовая скидка (%)' })}</label><input name="annualDiscountPercent" type="number" min="0" max="80" defaultValue={monetizationSettings.annualDiscountPercent} className="input" /></div>
            <div><label className="mb-2 block text-sm text-slate-300">{tt(currentLanguage, { en: 'Estimated CAC ($)', pl: 'Szacowany CAC ($)', es: 'CAC estimado ($)', ru: 'Оценочный CAC ($)' })}</label><input name="estimatedCACUsd" type="number" min="1" max="10000" defaultValue={monetizationSettings.estimatedCACUsd} className="input" /></div>
            <div><label className="mb-2 block text-sm text-slate-300">{tt(currentLanguage, { en: 'LTV months', pl: 'Miesiące LTV', es: 'Meses de LTV', ru: 'Месяцы LTV' })}</label><input name="ltvMonths" type="number" min="1" max="60" defaultValue={monetizationSettings.ltvMonths} className="input" /></div>
            <div><label className="mb-2 block text-sm text-slate-300">{tt(currentLanguage, { en: 'Target LTV/CAC', pl: 'Docelowe LTV/CAC', es: 'Objetivo LTV/CAC', ru: 'Целевое LTV/CAC' })}</label><input name="targetLtvToCacRatio" type="number" min="1" max="20" defaultValue={monetizationSettings.targetLtvToCacRatio} className="input" /></div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-200"><input type="checkbox" name="smartPaywallEnabled" defaultChecked={monetizationSettings.smartPaywallEnabled} className="mr-3" />{tt(currentLanguage, { en: 'Enable smart paywall routing', pl: 'Włącz inteligentny routing paywalla', es: 'Activar el enrutamiento inteligente del paywall', ru: 'Включить умную маршрутизацию paywall' })}</label>
            <label className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-200"><input type="checkbox" name="adUnlockEnabled" defaultChecked={monetizationSettings.adUnlockEnabled} className="mr-3" />{tt(currentLanguage, { en: 'Allow ad unlock for free users', pl: 'Pozwól darmowym użytkownikom odblokować dostęp reklamą', es: 'Permitir desbloqueo por anuncios para usuarios gratis', ru: 'Разрешить бесплатным пользователям разблокировку через рекламу' })}</label>
          </div>
          <button className="mt-6 rounded-2xl bg-cyan-300 px-6 py-3 font-semibold text-slate-950">{tt(currentLanguage, { en: 'Save monetization settings', pl: 'Zapisz ustawienia monetyzacji', es: 'Guardar ajustes de monetización', ru: 'Сохранить настройки монетизации' })}</button>
        </form>
      </details>
    </div>
  );
}
