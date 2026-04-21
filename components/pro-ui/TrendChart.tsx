import React from 'react';
import { tr, type Language } from '@/lib/i18n';

const tt = tr;

export default function TrendChart({
  title,
  subtitle,
  values,
  accent = '#60a5fa',
  language = 'en',
}: {
  title: string;
  subtitle?: string;
  values: number[];
  accent?: string;
  language?: Language;
}) {
  const width = 700;
  const height = 240;
  const padding = 18;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const firstValue = values[0] ?? 0;
  const lastValue = values[values.length - 1] ?? 0;
  const deltaPercent = firstValue ? Math.round(((lastValue - firstValue) / firstValue) * 100) : 0;
  const points = values
    .map((value, i) => {
      const x = padding + (i * (width - padding * 2)) / (values.length - 1 || 1);
      const y = height - padding - ((value - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  const areaPoints = `0,${height} ${points} ${width},${height}`;
  const shadowPoints = values
    .map((value, i) => {
      const x = padding + (i * (width - padding * 2)) / (values.length - 1 || 1);
      const y = height - padding - ((value - min) / range) * (height - padding * 2) + 18;
      return `${x},${y}`;
    })
    .join(' ');
  const monthLabels = tt(language, {
    en: 'Jan|Feb|Mar|Apr|May|Jun',
    pl: 'Sty|Lut|Mar|Kwi|Maj|Cze',
    de: 'Jan|Feb|Mär|Apr|Mai|Jun',
    es: 'Ene|Feb|Mar|Abr|May|Jun',
    pt: 'Jan|Fev|Mar|Abr|Mai|Jun',
    ja: '1月|2月|3月|4月|5月|6月',
    zh: '1月|2月|3月|4月|5月|6月',
    id: 'Jan|Feb|Mar|Apr|Mei|Jun',
    ru: 'Янв|Фев|Мар|Апр|Май|Июн',
  }).split('|');

  return (
    <div className="premium-panel chart-3d-shell p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-200">{title}</div>
          {subtitle && <div className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">{subtitle}</div>}
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-300">{tt(language, { en: 'Live trend', pl: 'Trend live', de: 'Live-Trend', es: 'Tendencia live', pt: 'Tendência live', ja: 'ライブ推移', zh: '实时趋势', id: 'Tren live', ru: 'Живой тренд' })}</div>
          <div className={`rounded-2xl border px-4 py-2 text-sm font-semibold ${deltaPercent >= 0 ? 'border-emerald-300/20 bg-emerald-300/10 text-emerald-100' : 'border-rose-300/20 bg-rose-300/10 text-rose-100'}`}>
            {deltaPercent >= 0 ? '+' : ''}{deltaPercent}%
          </div>
        </div>
      </div>
      <div className="chart-3d-panel chart-tilt-surface mt-6 overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.16),transparent_26%),linear-gradient(180deg,rgba(15,23,42,0.95),rgba(2,6,23,0.95))] p-4">
        <div className="chart-3d-glow" />
        <div className="chart-3d-floor" />
        <div className="chart-scanline" />
        <svg viewBox={`0 0 ${width} ${height}`} className="chart-3d-svg h-[240px] w-full">
          <defs>
            <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={accent} stopOpacity="0.35" />
              <stop offset="100%" stopColor={accent} stopOpacity="0" />
            </linearGradient>
            <linearGradient id="trendShadow" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={accent} stopOpacity="0.18" />
              <stop offset="100%" stopColor="#020617" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {[0.2, 0.4, 0.6, 0.8].map((ratio) => (
            <line key={ratio} x1="0" x2={width} y1={height * ratio} y2={height * ratio} stroke="rgba(148,163,184,0.08)" />
          ))}
          <polygon points={`0,${height} ${shadowPoints} ${width},${height}`} fill="url(#trendShadow)" opacity="0.9" />
          <polygon points={areaPoints} fill="url(#trendFill)" />
          <polyline points={shadowPoints} fill="none" stroke="rgba(15,23,42,0.55)" strokeWidth="10" strokeLinejoin="round" strokeLinecap="round" />
          <polyline points={points} fill="none" stroke={accent} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
          {values.map((value, i) => {
            const x = padding + (i * (width - padding * 2)) / (values.length - 1 || 1);
            const y = height - padding - ((value - min) / range) * (height - padding * 2);
            return (
              <g key={i} className="chart-point-pop" style={{ animationDelay: `${i * 120}ms` }}>
                <circle cx={x} cy={y + 11} r="8" fill="rgba(15,23,42,0.35)" />
                <circle cx={x} cy={y} r="8" fill={accent} fillOpacity="0.18" />
                <circle cx={x} cy={y} r="5" fill={accent} />
                <circle cx={x - 1.5} cy={y - 1.5} r="1.5" fill="rgba(255,255,255,0.82)" />
              </g>
            );
          })}
        </svg>
        <div className="mt-4 grid grid-cols-6 gap-3 text-[11px] uppercase tracking-[0.18em] text-slate-500">
          {monthLabels.map((month) => <div key={month}>{month}</div>)}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-slate-200">
            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Start</div>
            <div className="mt-1 text-lg font-bold text-white">{firstValue}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-slate-200">
            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Peak</div>
            <div className="mt-1 text-lg font-bold text-white">{max}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-slate-200">
            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Now</div>
            <div className="mt-1 text-lg font-bold text-white">{lastValue}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
