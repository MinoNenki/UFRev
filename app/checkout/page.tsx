'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { trackEvent } from '@/lib/analytics';

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const itemKey = searchParams.get('itemKey') || '';
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [message, setMessage] = useState('Przygotowujemy bezpieczne przekierowanie do płatności.');

  const registerUrl = useMemo(() => {
    const next = `/checkout?itemKey=${encodeURIComponent(itemKey)}`;
    return `/auth/register?next=${encodeURIComponent(next)}`;
  }, [itemKey]);

  useEffect(() => {
    if (!itemKey) {
      setStatus('error');
      setMessage('Brakuje wybranego planu. Wróć do cennika i wybierz pakiet ponownie.');
      return;
    }

    let cancelled = false;

    async function startCheckout() {
      trackEvent('begin_checkout', { item_key: itemKey });

      try {
        const res = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemKey }),
        });
        const data = await res.json();

        if (cancelled) {
          return;
        }

        if (res.status === 401) {
          window.location.replace(registerUrl);
          return;
        }

        if (data?.url) {
          trackEvent('checkout_redirect', { item_key: itemKey });
          setMessage('Za chwilę otworzymy bezpieczną stronę Stripe.');
          window.setTimeout(() => {
            window.location.replace(data.url);
          }, 450);
          return;
        }

        throw new Error(data?.error || 'Checkout error');
      } catch (error) {
        if (cancelled) {
          return;
        }

        const details = error instanceof Error ? error.message : 'Checkout error';
        trackEvent('checkout_error', { item_key: itemKey, message: details });
        setStatus('error');
        setMessage('Nie udało się przygotować płatności. Wróć do cennika i spróbuj ponownie.');
      }
    }

    void startCheckout();

    return () => {
      cancelled = true;
    };
  }, [itemKey, registerUrl]);

  return (
    <main className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl items-center px-4 py-12 text-white sm:px-6">
      <div className="relative w-full overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.18),transparent_28%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.98))] p-6 shadow-[0_24px_90px_rgba(2,6,23,0.55)] sm:p-8">
        <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.18)_1px,transparent_0)] [background-size:24px_24px]" />
        <div className="relative">
          <div className="mb-5 inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100">
            Secure checkout
          </div>
          <h1 className="text-3xl font-black tracking-[-0.04em] text-white sm:text-5xl">Przygotowujemy płatność</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            {message}
          </p>

          {status === 'loading' ? (
            <div className="mt-8 space-y-4">
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-2/3 rounded-full bg-[linear-gradient(90deg,rgba(34,211,238,1),rgba(168,85,247,1),rgba(251,191,36,1))] animate-pulse" />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <CheckoutStep title="Weryfikacja konta" description="Sprawdzamy dostęp do wybranego planu." />
                <CheckoutStep title="Tworzenie sesji" description="Generujemy bezpieczny link Stripe." />
                <CheckoutStep title="Przekierowanie" description="Otworzymy płatność bez dodatkowych kroków." />
              </div>
            </div>
          ) : (
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <button
                type="button"
                onClick={() => router.push('/pricing')}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/[0.07]"
              >
                Wróć do cennika
              </button>
              <button
                type="button"
                onClick={() => window.location.assign(registerUrl)}
                className="rounded-2xl bg-[linear-gradient(135deg,rgba(34,211,238,1),rgba(168,85,247,0.92))] px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_16px_40px_rgba(34,211,238,0.18)] transition hover:scale-[1.01]"
              >
                Załóż konto i kontynuuj
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function CheckoutStep({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="text-sm font-semibold text-white">{title}</div>
      <div className="mt-2 text-xs leading-5 text-slate-300">{description}</div>
    </div>
  );
}
