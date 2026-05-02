'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { SITE } from '@/lib/site';

type ConfirmState = 'loading' | 'success' | 'error';

export default function ConfirmPage() {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<ConfirmState>('loading');
  const [message, setMessage] = useState('Confirming your account...');

  useEffect(() => {
    let active = true;

    async function confirmAccount() {
      const code = searchParams.get('code');
      const tokenHash = searchParams.get('token_hash');
      const type = searchParams.get('type');
      const errorDescription = searchParams.get('error_description');

      if (errorDescription) {
        if (!active) return;
        setStatus('error');
        setMessage(decodeURIComponent(errorDescription));
        return;
      }

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (tokenHash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as 'signup' | 'recovery' | 'invite' | 'email_change' | 'magiclink' | 'email',
          });
          if (error) throw error;
        }

        if (!active) return;
        setStatus('success');
        setMessage(`Your ${SITE.shortName} account is confirmed and ready.`);
      } catch (error) {
        if (!active) return;
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Confirmation failed. Please request a new confirmation email.');
      }
    }

    confirmAccount();

    return () => {
      active = false;
    };
  }, [searchParams, supabase.auth]);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-3xl items-center px-6 py-20 text-white">
      <section className="w-full rounded-[32px] border border-white/10 bg-slate-900/80 p-8 shadow-[0_0_60px_rgba(34,211,238,0.10)] sm:p-10">
        <div className="mb-4 inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-200">
          {status === 'loading' ? 'Account confirmation' : status === 'success' ? 'Welcome to UFREV' : 'Confirmation issue'}
        </div>
        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
          {status === 'loading' && 'Confirming your account'}
          {status === 'success' && 'Your account is now active'}
          {status === 'error' && 'We could not confirm your account'}
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">{message}</p>

        <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
          {status === 'success' ? (
            <>
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:opacity-90"
              >
                Open dashboard
              </button>
              <Link href="/account" className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/[0.06]">
                Go to my account
              </Link>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:opacity-90">
                Go to login
              </Link>
              <Link href="/support" className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/[0.06]">
                Contact support
              </Link>
            </>
          )}
        </div>

        <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-sm leading-7 text-slate-300">
          <div className="font-semibold text-white">{SITE.shortName}</div>
          <div className="mt-2">AI decision engine for e-commerce, startup validation and cost optimization.</div>
          <div className="mt-2">Support: {SITE.supportEmail}</div>
        </div>
      </section>
    </main>
  );
}