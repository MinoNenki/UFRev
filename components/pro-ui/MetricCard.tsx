import React from 'react';
import { tr, type Language } from '@/lib/i18n';

export default function MetricCard({
  label,
  value,
  delta,
  sublabel,
  tone = 'cyan',
  language = 'en',
}: {
  label: string;
  value: string;
  delta?: string;
  sublabel?: string;
  tone?: 'cyan' | 'emerald' | 'amber' | 'violet';
  language?: Language;
}) {
  const toneMap = {
    cyan: {
      glow: 'from-cyan-400/20 via-sky-400/10 to-transparent',
      dot: 'bg-cyan-300',
      badge: 'border-cyan-300/20 bg-cyan-300/10 text-cyan-100',
      line: 'from-transparent via-cyan-300/70 to-transparent',
      edge: 'from-cyan-300/0 via-cyan-300/55 to-cyan-200/0',
      floor: 'bg-cyan-300/20',
    },
    emerald: {
      glow: 'from-emerald-400/20 via-emerald-300/10 to-transparent',
      dot: 'bg-emerald-300',
      badge: 'border-emerald-300/20 bg-emerald-300/10 text-emerald-100',
      line: 'from-transparent via-emerald-300/70 to-transparent',
      edge: 'from-emerald-300/0 via-emerald-300/55 to-emerald-200/0',
      floor: 'bg-emerald-300/20',
    },
    amber: {
      glow: 'from-amber-300/20 via-yellow-300/10 to-transparent',
      dot: 'bg-amber-300',
      badge: 'border-amber-300/20 bg-amber-300/10 text-amber-100',
      line: 'from-transparent via-amber-300/70 to-transparent',
      edge: 'from-amber-300/0 via-amber-300/55 to-amber-200/0',
      floor: 'bg-amber-300/20',
    },
    violet: {
      glow: 'from-violet-400/20 via-fuchsia-400/10 to-transparent',
      dot: 'bg-violet-300',
      badge: 'border-violet-300/20 bg-violet-300/10 text-violet-100',
      line: 'from-transparent via-violet-300/70 to-transparent',
      edge: 'from-violet-300/0 via-violet-300/55 to-violet-200/0',
      floor: 'bg-violet-300/20',
    },
  }[tone];

  const secondaryText = sublabel ?? delta;

  return (
    <div className="metric-card-3d group relative overflow-hidden rounded-[30px] border border-white/10 bg-slate-950/60 p-5 shadow-[0_18px_80px_rgba(2,6,23,0.45)] transition duration-300 hover:-translate-y-1.5 hover:border-white/20 hover:shadow-[0_28px_100px_rgba(2,6,23,0.52)] sm:p-6">
      <div className={`metric-card-floor absolute inset-x-[12%] bottom-2 h-8 rounded-full blur-xl ${toneMap.floor}`} />
      <div className={`metric-card-edge absolute inset-x-0 top-0 h-px bg-gradient-to-r ${toneMap.edge}`} />
      <div className="metric-card-grid absolute inset-0 opacity-40" />
      <div className={`absolute inset-0 bg-gradient-to-br ${toneMap.glow} opacity-90`} />
      <div className={`absolute inset-x-0 bottom-0 h-px bg-gradient-to-r ${toneMap.line}`} />
      <div className="absolute -right-10 top-0 h-24 w-24 rounded-full bg-white/10 blur-3xl transition duration-300 group-hover:scale-125" />
      <div className="relative min-h-[230px] metric-card-inner">
        <div className="flex items-start justify-between gap-3">
          <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">{label}</div>
          <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${toneMap.badge}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${toneMap.dot}`} />
            {tr(language, { en: 'Live', pl: 'Na żywo', es: 'En vivo', ru: 'В эфире' })}
          </span>
        </div>
        <div className="text-balance mt-4 max-w-[14ch] text-[clamp(2.2rem,2.7vw,3.35rem)] font-black tracking-[-0.04em] leading-[0.95] text-white break-normal [overflow-wrap:anywhere]">{value}</div>
        {secondaryText && (
          <div className="mt-4 max-w-[22ch] rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium leading-7 text-slate-200 break-normal [overflow-wrap:anywhere]">
            {secondaryText}
          </div>
        )}
      </div>
    </div>
  );
}
