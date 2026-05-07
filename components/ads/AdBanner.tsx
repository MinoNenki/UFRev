'use client';

import { useEffect, useId, useRef } from 'react';

/**
 * AdBanner – automatyczny slot reklamowy Google AdSense.
 *
 * Działa w pełni automatycznie:
 * - Czyta NEXT_PUBLIC_ADSENSE_CLIENT_ID i NEXT_PUBLIC_ADSENSE_SLOT_ID z env
 * - Jeśli któregoś brak — nic nie renderuje (zero layoutu)
 * - Google sam decyduje czy pokazać reklamę i jaką
 *
 * Żeby aktywować manualne sloty:
 *   1. Wejdź na adsense.google.com → Reklamy → Według jednostki reklamowej → Utwórz
 *   2. Skopiuj "data-ad-slot" (np. 1234567890)
 *   3. Dodaj w Vercel: NEXT_PUBLIC_ADSENSE_SLOT_ID=1234567890
 *   4. Deploy → reklamy pojawiają się automatycznie
 */

const CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || 'ca-pub-9729577979382455';
const SLOT_ID   = process.env.NEXT_PUBLIC_ADSENSE_SLOT_ID || '';

export default function AdBanner({
  slotId,
  format = 'auto',
  className = '',
}: {
  slotId?: string;
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical' | 'autorelaxed';
  className?: string;
}) {
  const effectiveSlot = slotId || SLOT_ID;
  const instanceId    = useId();
  const pushed        = useRef(false);

  useEffect(() => {
    if (!effectiveSlot || pushed.current) return;
    pushed.current = true;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch {
      // AdSense nie jest jeszcze załadowany – Auto Ads przejmą kontrolę
    }
  }, [effectiveSlot]);

  // Bez slotu – nie renderuj nic (Auto Ads nadal działają przez globalny skrypt)
  if (!effectiveSlot) return null;

  return (
    <div
      key={instanceId}
      className={`my-4 overflow-hidden rounded-2xl border border-white/5 bg-slate-950/20 ${className}`}
      aria-label="Reklama"
    >
      <ins
        className="adsbygoogle block"
        style={{ display: 'block' }}
        data-ad-client={CLIENT_ID}
        data-ad-slot={effectiveSlot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
