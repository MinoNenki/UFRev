import React from 'react';

export default function ProgressRows({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: string; width: string; color: string }[];
}) {
  return (
    <div className="rounded-[32px] border border-white/10 bg-slate-950/60 p-7 shadow-[0_24px_100px_rgba(2,6,23,0.45)]">
      <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-200">{title}</div>
      <div className="mt-6 space-y-4">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="mb-2 flex items-center justify-between text-sm text-slate-200">
              <span>{row.label}</span>
              <span className="font-semibold text-white">{row.value}</span>
            </div>
            <div className="h-3 rounded-full bg-white/[0.06]">
              <div className="h-3 rounded-full" style={{ width: row.width, background: row.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
