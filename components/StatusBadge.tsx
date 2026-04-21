type Props = {
  label: string;
  tone?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'slate';
};

const tones = {
  cyan: 'border-cyan-300/30 bg-cyan-300/10 text-cyan-200',
  emerald: 'border-emerald-300/30 bg-emerald-300/10 text-emerald-200',
  amber: 'border-amber-300/30 bg-amber-300/10 text-amber-200',
  rose: 'border-rose-300/30 bg-rose-300/10 text-rose-200',
  slate: 'border-white/10 bg-white/5 text-slate-200',
} as const;

export default function StatusBadge({ label, tone = 'slate' }: Props) {
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${tones[tone]}`}>
      {label}
    </span>
  );
}
