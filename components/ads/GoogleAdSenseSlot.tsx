'use client';

import Script from 'next/script';
import { useEffect, useId, useState } from 'react';

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

export default function GoogleAdSenseSlot({
  clientId,
  slotId,
  format = 'auto',
  className = '',
  responsive = true,
}: {
  clientId: string;
  slotId: string;
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  className?: string;
  responsive?: boolean;
}) {
  const instanceId = useId();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!ready || typeof window === 'undefined') return;
    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    } catch (error) {
      console.error('AdSense slot render failed:', error);
    }
  }, [ready, instanceId]);

  if (!clientId || !slotId) {
    return null;
  }

  return (
    <div className={className}>
      <Script
        id={`adsense-script-${instanceId}`}
        async
        strategy="afterInteractive"
        crossOrigin="anonymous"
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`}
        onLoad={() => setReady(true)}
      />
      <ins
        className="adsbygoogle block min-h-[120px] w-full overflow-hidden rounded-[24px] border border-amber-300/15 bg-slate-950/40"
        style={{ display: 'block' }}
        data-ad-client={clientId}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
}