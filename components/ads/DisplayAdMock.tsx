import React from 'react';
import type { Language } from '@/lib/i18n';

const tt = (l: Language, v: { en: string; pl: string; de?: string; es?: string; pt?: string; ja?: string; zh?: string; id?: string; ru?: string }) =>
  l === 'pl' ? v.pl : l === 'de' ? (v.de ?? v.en) : l === 'es' ? (v.es ?? v.pt ?? v.en) : l === 'pt' ? (v.pt ?? v.es ?? v.en) : l === 'ja' ? (v.ja ?? v.en) : l === 'zh' ? (v.zh ?? v.en) : l === 'id' ? (v.id ?? v.en) : l === 'ru' ? (v.ru ?? v.en) : v.en;

export default function DisplayAdMock({
  title,
  subtitle,
  language = 'en',
  provider = 'Google AdSense',
  slotId = 'pending-slot',
}: {
  title?: string;
  subtitle?: string;
  language?: Language;
  provider?: string;
  slotId?: string;
}) {
  const networkReady = Boolean(process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID);

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-amber-300/20 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.16),transparent_26%),linear-gradient(180deg,rgba(15,23,42,0.9),rgba(2,6,23,0.92))] p-6 shadow-[0_24px_100px_rgba(2,6,23,0.45)]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-200">
          {tt(language, { en: 'Ad inventory', pl: 'Miejsce reklamowe', de: 'Werbeinventar', es: 'Inventario publicitario', pt: 'Inventário publicitário', ru: 'Рекламный инвентарь' })}
        </div>
        <div className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${networkReady ? 'border border-emerald-300/30 bg-emerald-300/10 text-emerald-200' : 'border border-white/10 bg-white/[0.05] text-slate-300'}`}>
          {networkReady
            ? tt(language, { en: 'Network ready', pl: 'Sieć gotowa', de: 'Netzwerk bereit', es: 'Red lista', pt: 'Rede pronta', ru: 'Сеть готова' })
            : tt(language, { en: 'Demo slot', pl: 'Slot demo', de: 'Demo-Slot', es: 'Slot demo', pt: 'Slot demo', ru: 'Демо-слот' })}
        </div>
      </div>
      <div className="text-2xl font-black tracking-tight text-white">{title || tt(language, { en: 'Sponsored placement', pl: 'Miejsce sponsorowane', de: 'Gesponserte Fläche', es: 'Ubicación patrocinada', pt: 'Espaço patrocinado', ru: 'Спонсируемый слот' })}</div>
      <div className="mt-2 max-w-xl text-sm leading-7 text-slate-300">{subtitle || tt(language, { en: 'This slot is prepared for real ad network wiring and controlled monetization experiments.', pl: 'Ten slot jest przygotowany pod realne podpięcie sieci reklamowej i kontrolowane eksperymenty monetyzacyjne.', de: 'Dieser Slot ist für echte Werbenetzwerk-Anbindung und kontrollierte Monetarisierungsexperimente vorbereitet.', es: 'Este slot está preparado para una red publicitaria real y experimentos controlados de monetización.', pt: 'Este slot está preparado para uma rede publicitária real e experiências controladas de monetização.', ru: 'Этот слот подготовлен для реального подключения рекламной сети и контролируемых monetization-экспериментов.' })}</div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200">{tt(language, { en: 'Provider', pl: 'Dostawca', de: 'Anbieter', es: 'Proveedor', pt: 'Fornecedor', ru: 'Провайдер' })}: {provider}</div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200">{tt(language, { en: 'Slot ID', pl: 'ID slotu', de: 'Slot-ID', es: 'ID del slot', pt: 'ID do slot', ru: 'ID слота' })}: {slotId}</div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200">{networkReady ? tt(language, { en: 'Revenue-ready placement', pl: 'Slot gotowy na przychód', de: 'Umsatzbereiter Slot', es: 'Espacio listo para ingresos', pt: 'Espaço pronto para receita', ru: 'Слот готов к выручке' }) : tt(language, { en: 'Safe UI placeholder', pl: 'Bezpieczny placeholder UI', de: 'Sicherer UI-Platzhalter', es: 'Placeholder UI seguro', pt: 'Placeholder UI seguro', ru: 'Безопасный UI-placeholder' })}</div>
      </div>
    </div>
  );
}
