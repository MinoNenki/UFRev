'use client';

import { useState } from 'react';
import { CREDIT_PACK_ORDER, PLAN_ORDER, USAGE_TOKEN_RULES } from '@/lib/plans';

export default function PricingCards({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  async function handleCheckout(itemKey: string) {
    setLoadingKey(itemKey);
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemKey }),
    });
    const data = await res.json();
    if (data?.url) window.location.href = data.url;
    else {
      alert(data?.error || 'Checkout error');
      setLoadingKey(null);
    }
  }

  return (
    <div className="space-y-12">
      <div>
        <div className="mb-5 text-sm font-semibold uppercase tracking-[0.24em] text-cyan-200">Subscriptions</div>
        <div className="mb-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm text-cyan-50">Dla zwykłych userów, którzy chcą sprawdzić produkt, koszt lub pomysł bez ryzyka przepalenia budżetu.</div>
          <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm text-emerald-50">Dla sklepów, dropshippingu, startupów i małych firm, które regularnie podejmują decyzje zakupowe i reklamowe.</div>
          <div className="rounded-2xl border border-violet-300/20 bg-violet-300/10 p-4 text-sm text-violet-50">Pakiety tokenów zostają dla okazjonalnego użycia, a subskrypcje prowadzą od taniego wejścia do pełnej warstwy operacyjnej.</div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {PLAN_ORDER.map((plan) => (
            <div key={plan.key} className={`relative overflow-hidden rounded-[28px] border p-6 text-white ${plan.featured ? 'border-cyan-300/60 bg-white/[0.06]' : 'border-white/10 bg-white/[0.03]'}`}>
              {plan.featured && <div className="absolute right-4 top-4 rounded-full border border-cyan-300/40 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">Most popular</div>}
              {plan.key === 'starter' && <div className="absolute right-4 top-4 rounded-full border border-emerald-300/40 bg-emerald-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">Low-cost entry</div>}
              {plan.key === 'scale' && <div className="absolute right-4 top-4 rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-100">Operator tier</div>}
              <div className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-cyan-200">{plan.name}</div>
              <div className="mb-1 text-4xl font-bold">{plan.priceLabel}</div>
              <div className="mb-2 text-sm text-slate-300">monthly</div>
              <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">{plan.audience}</div>
              <p className="mb-6 min-h-[88px] text-sm leading-6 text-slate-300">{plan.description}</p>
              <div className="mb-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4"><div className="text-xs uppercase tracking-[0.2em] text-slate-400">AI tokens</div><div className="mt-2 text-2xl font-bold">{plan.monthlyCredits}</div></div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4"><div className="text-xs uppercase tracking-[0.2em] text-slate-400">Analyses</div><div className="mt-2 text-2xl font-bold">{plan.monthlyAnalyses}</div></div>
              </div>
              <ul className="mb-4 space-y-3 text-sm text-slate-200">{plan.bullets.map((item) => <li key={item}>• {item}</li>)}</ul>
              <div className="mb-6 rounded-2xl border border-white/10 bg-black/20 p-3 text-xs text-slate-300">
                {plan.key === 'free' ? 'Pokaż wartość szybko i bez bariery wejścia.' : plan.key === 'starter' ? 'To najlepsza opcja dla oszczędnych klientów, małych sklepów i osób zaczynających regularne testy.' : plan.featured ? 'To główny plan konwersyjny dla klientów, którzy już widzą wartość i chcą pracować co tydzień.' : plan.key === 'scale' ? 'To warstwa premium dla firm, zespołów i większych workflow operacyjnych.' : 'To plan dla operatorów, którzy chcą powtarzalnych decyzji anti-loss.'}
              </div>
              {plan.key === 'free'
                ? <a href={isAuthenticated ? '/dashboard' : '/auth/register'} className="block rounded-2xl bg-white px-4 py-3 text-center font-semibold text-slate-950">Start free</a>
                : <button onClick={() => handleCheckout(plan.key)} disabled={!isAuthenticated || loadingKey === plan.key} className="w-full rounded-2xl bg-cyan-300 px-4 py-3 font-semibold text-slate-950 disabled:opacity-60">{loadingKey === plan.key ? 'Redirecting...' : isAuthenticated ? 'Buy subscription' : 'Log in to buy'}</button>}
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-5 text-sm font-semibold uppercase tracking-[0.24em] text-amber-200">One-time AI token packs</div>
        <div className="grid gap-6 md:grid-cols-3">
          {CREDIT_PACK_ORDER.map((pack) => (
            <div key={pack.key} className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 text-white">
              <div className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-amber-200">{pack.name}</div>
              <div className="mb-1 text-4xl font-bold">{pack.priceLabel}</div>
              <div className="mb-2 text-sm text-slate-300">one-time</div>
              <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">{pack.audience}</div>
              <p className="mb-5 min-h-[72px] text-sm leading-6 text-slate-300">{pack.description}</p>
              <div className="mb-5 rounded-2xl border border-white/10 bg-slate-950/60 p-4"><div className="text-xs uppercase tracking-[0.2em] text-slate-400">AI tokens after purchase</div><div className="mt-2 text-2xl font-bold">{pack.credits}</div></div>
              <ul className="mb-4 space-y-3 text-sm text-slate-200">{pack.bullets.map((item) => <li key={item}>• {item}</li>)}</ul>
              <div className="mb-6 rounded-2xl border border-white/10 bg-black/20 p-3 text-xs text-slate-300">Dobre dla klientów, którzy nie chcą jeszcze subskrypcji, ale potrzebują kilku dodatkowych analiz bez dużego kosztu.</div>
              <button onClick={() => handleCheckout(pack.key)} disabled={!isAuthenticated || loadingKey === pack.key} className="w-full rounded-2xl bg-amber-300 px-4 py-3 font-semibold text-slate-950 disabled:opacity-60">{loadingKey === pack.key ? 'Redirecting...' : isAuthenticated ? 'Buy AI tokens' : 'Log in to buy'}</button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-5 text-sm font-semibold uppercase tracking-[0.24em] text-cyan-200">Weighted token logic</div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {USAGE_TOKEN_RULES.map((rule) => (
            <div key={rule.key} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-white">
              <div className="text-sm font-semibold">{rule.title}</div>
              <div className="mt-2 text-2xl font-bold text-cyan-200">{rule.tokens}</div>
              <div className="mt-2 text-xs leading-5 text-slate-300">{rule.note}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
