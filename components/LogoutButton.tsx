'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

export default function LogoutButton({ label }: { label: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    if (loading) return;
    setLoading(true);

    try {
      try {
        const supabase = createSupabaseBrowserClient();
        await supabase.auth.signOut();
      } catch {
        // ignore browser sign-out issues and continue with server-side cleanup
      }

      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
      });
    } catch {
      // ignore and still force navigation away from the protected area
    } finally {
      router.replace('/?loggedOut=1');
      router.refresh();
      setTimeout(() => {
        window.location.assign('/?loggedOut=1');
      }, 80);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="rounded-2xl bg-[linear-gradient(135deg,rgba(34,211,238,1),rgba(59,130,246,0.95))] px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_12px_30px_rgba(34,211,238,0.18)] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {loading ? '...' : label}
    </button>
  );
}
