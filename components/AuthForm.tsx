'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { SITE } from '@/lib/site';

type Props = {
  mode: 'login' | 'register';
};

function getAuthErrorMessage(message: string) {
  if (message === 'Database error saving new user') {
    return 'Registration is blocked by an outdated Supabase schema. Apply supabase/signup_referral_hotfix.sql in the Supabase SQL Editor, then try again.';
  }

  return message;
}

export default function AuthForm({ mode }: Props) {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailRedirectTo = `${SITE.url.replace(/\/$/, '')}/auth/confirm`;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    const ref = searchParams.get('ref') || localStorage.getItem('referral_code') || '';
    if (ref) {
      setReferralCode(ref);
      localStorage.setItem('referral_code', ref);
    }
  }, [searchParams]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (mode === 'register' && !termsAccepted) {
      setMessage('You must accept the Terms of Service, Privacy Policy, and Cookies Policy to register.');
      setLoading(false);
      return;
    }

    if (mode === 'register') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo,
          data: referralCode ? { referral_code: referralCode } : {},
        },
      });
      if (error) setMessage(getAuthErrorMessage(error.message));
      else {
        setMessage(`Account created. Check your email and confirm your account. After clicking the link, you will return to a branded ${SITE.shortName} confirmation page.`);
        router.push('/auth/login');
        router.refresh();
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage(getAuthErrorMessage(error.message));
      else {
        router.replace('/account');
        router.refresh();
      }
    }

    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-5xl px-6 text-white">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-8">
          <div className="mb-4 inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-200">
            {mode === 'login' ? 'Login' : 'Register'}
          </div>
          <h1 className="text-4xl font-black tracking-tight">
            {mode === 'login' ? `Access your ${SITE.name} workspace.` : `Create your account and start using ${SITE.name}.`}
          </h1>
          <p className="mt-4 leading-7 text-slate-300">
            After logging in, the user should see account details, plan data, AI token balance, support access, and paid subscription options.
          </p>
          {mode === 'register' && referralCode && <div className="mt-4 rounded-2xl border border-emerald-300/30 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-200">Referral code detected: {referralCode}. A referring user will only earn AI tokens after you become an active user, which protects platform margins.</div>}
        </div>

        <form onSubmit={onSubmit} className="space-y-4 rounded-[32px] border border-white/10 bg-slate-900/80 p-8 shadow-[0_0_50px_rgba(34,211,238,0.08)]">
          <h2 className="text-3xl font-bold">{mode === 'login' ? 'Log in' : 'Create account'}</h2>
          <input className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 outline-none ring-0" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 outline-none ring-0" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          {mode === 'register' && (
            <label className="flex items-start gap-3 text-sm text-slate-300 rounded-lg border border-slate-700/50 bg-slate-950/50 p-3">
              <input
                type="checkbox"
                required
                className="w-4 h-4 rounded mt-0.5 flex-shrink-0"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
              />
              <span>
                I accept the{' '}
                <Link href="/terms" className="text-cyan-300 hover:underline" target="_blank" rel="noopener noreferrer">
                  Terms of Service
                </Link>
                , 
                <Link href="/privacy" className="text-cyan-300 hover:underline" target="_blank" rel="noopener noreferrer">
                  {' '}Privacy Policy
                </Link>
                , and
                <Link href="/cookies" className="text-cyan-300 hover:underline" target="_blank" rel="noopener noreferrer">
                  {' '}Cookies Policy
                </Link>
              </span>
            </label>
          )}
          <button className="w-full rounded-2xl bg-cyan-300 px-4 py-3 font-semibold text-slate-950 transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed" disabled={loading || (mode === 'register' && !termsAccepted)}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>
          {message && <p className="text-sm text-slate-300">{message}</p>}
          <p className="text-sm text-slate-400">
            {mode === 'login' ? (
              <>Don&apos;t have an account? <Link href="/auth/register" className="text-cyan-200">Create one</Link></>
            ) : (
              <>Already have an account? <Link href="/auth/login" className="text-cyan-200">Log in</Link></>
            )}
          </p>
        </form>
      </div>
    </div>
  );
}
