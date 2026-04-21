import React from 'react';
import { tr, type Language } from '@/lib/i18n';

export default function InsightPanel({
  title,
  items,
  language = 'en',
}: {
  title: string;
  items: string[];
  language?: Language;
}) {
  return (
    <div className="premium-panel p-7">
      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-200">{title}</div>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-100">
            {tr(language, { en: 'Key points', pl: 'Kluczowe punkty', es: 'Puntos clave', ru: 'Ключевые пункты' })}
          </span>
        </div>

        <div className="mt-5 space-y-3 text-sm leading-7 text-slate-200">
          {items.map((item, index) => (
            <div key={item} className="group rounded-[24px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-4 py-4 transition duration-300 hover:-translate-y-[1px] hover:border-cyan-300/20 hover:bg-white/[0.06]">
              <div className="flex gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-xs font-black text-cyan-100 shadow-[0_10px_24px_rgba(34,211,238,0.12)]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="pt-0.5 text-sm leading-7 text-slate-100">{item}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
