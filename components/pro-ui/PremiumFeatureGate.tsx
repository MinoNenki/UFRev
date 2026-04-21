import Link from 'next/link';

type Copy = {
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
  hint: string;
};

export default function PremiumFeatureGate({ copy }: { copy: Copy }) {
  return (
    <div className="rounded-[32px] border border-amber-300/20 bg-[linear-gradient(180deg,rgba(251,191,36,0.12),rgba(15,23,42,0.72))] p-8 shadow-[0_24px_100px_rgba(2,6,23,0.45)]">
      <div className="text-[11px] uppercase tracking-[0.24em] text-amber-200">{copy.eyebrow}</div>
      <h2 className="mt-3 text-3xl font-black text-white">{copy.title}</h2>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-200">{copy.description}</p>
      <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-amber-50">{copy.hint}</div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/pricing" className="rounded-2xl bg-amber-300 px-5 py-3 font-semibold text-slate-950">{copy.cta}</Link>
        <Link href="/account" className="rounded-2xl border border-white/10 px-5 py-3 font-semibold text-white hover:bg-white/5">Account</Link>
      </div>
    </div>
  );
}