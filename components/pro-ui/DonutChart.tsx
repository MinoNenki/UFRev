import React from 'react';
import type { Language } from '@/lib/i18n';

const tt = (l: Language, v: { en: string; pl: string; de?: string; es?: string; pt?: string; ja?: string; zh?: string; id?: string; ru?: string }) =>
  l === 'pl' ? v.pl : l === 'de' ? (v.de ?? v.en) : l === 'es' ? (v.es ?? v.pt ?? v.en) : l === 'pt' ? (v.pt ?? v.es ?? v.en) : l === 'ja' ? (v.ja ?? v.en) : l === 'zh' ? (v.zh ?? v.en) : l === 'id' ? (v.id ?? v.en) : l === 'ru' ? (v.ru ?? v.en) : v.en;

export default function DonutChart({
  title,
  value,
  items,
  language = 'en',
}: {
  title: string;
  value: string;
  items: { label: string; amount: string; color: string }[];
  language?: Language;
}) {
  return (
    <div className="premium-panel chart-3d-shell p-7">
      <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-200">{title}</div>
      <div className="mt-6 grid items-center gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="flex items-center justify-center">
          <div className="chart-donut-3d glow-ring relative flex h-56 w-56 items-center justify-center rounded-full border border-white/10 bg-[conic-gradient(#22d3ee_0_28%,#a78bfa_28%_52%,#f59e0b_52%_74%,#34d399_74%_100%)] animate-pulse-soft">
            <div className="chart-donut-shadow" />
            <div className="chart-donut-orbit" />
            <div className="chart-donut-shine" />
            <div className="absolute inset-[14px] rounded-full border border-white/10 bg-slate-950/85 backdrop-blur-xl" />
            <div className="relative flex h-32 w-32 flex-col items-center justify-center rounded-full border border-white/10 bg-slate-950/95 text-center shadow-[0_10px_40px_rgba(2,6,23,0.6)]">
              <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">{tt(language, { en: 'Health', pl: 'Stan', de: 'Status', es: 'Salud', pt: 'Saúde', ja: '状態', zh: '状态', id: 'Status', ru: 'Статус' })}</div>
              <div className="mt-2 text-2xl font-black text-white">{value}</div>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={item.label} className="chart-legend-card rounded-[24px] border border-white/10 bg-white/[0.04] p-4 transition duration-300 hover:border-white/15 hover:bg-white/[0.06]" style={{ animationDelay: `${index * 120}ms` }}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full shadow-[0_0_20px_currentColor]" style={{ backgroundColor: item.color, color: item.color }} />
                  <span className="text-sm text-slate-200">{item.label}</span>
                </div>
                <span className="text-sm font-semibold text-white">{item.amount}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
