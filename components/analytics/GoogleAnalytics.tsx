'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { GA_MEASUREMENT_ID, trackEvent, trackPageView } from '@/lib/analytics';

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedRef = useRef<string>('');

  useEffect(() => {
    if (!GA_MEASUREMENT_ID || !pathname) return;

    const query = searchParams.toString();
    const pathAndQuery = query ? `${pathname}?${query}` : pathname;

    if (lastTrackedRef.current === pathAndQuery) return;
    lastTrackedRef.current = pathAndQuery;

    trackPageView(pathAndQuery);

    if (pathname === '/pricing') {
      trackEvent('view_pricing', { page_path: pathAndQuery });
      if (searchParams.get('canceled') === '1') {
        trackEvent('checkout_cancel', { page_path: pathAndQuery });
      }
    }

    if (pathname === '/dashboard' && (searchParams.get('success') === '1' || searchParams.get('creditsPurchased') === '1')) {
      trackEvent('purchase', {
        purchase_type: searchParams.get('success') === '1' ? 'subscription' : 'token_pack',
        page_path: pathAndQuery,
      });
    }
  }, [pathname, searchParams]);

  if (!GA_MEASUREMENT_ID) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
        `}
      </Script>
    </>
  );
}
