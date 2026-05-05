'use client';

import { useState } from 'react';
import { trackEvent } from '@/lib/analytics';

type PricingCheckoutButtonProps = {
  itemKey: string;
  isAuthenticated: boolean;
  checkoutLabel: string;
  loginLabel: string;
  loadingLabel: string;
  className: string;
};

export default function PricingCheckoutButton({
  itemKey,
  isAuthenticated,
  checkoutLabel,
  loginLabel,
  loadingLabel,
  className,
}: PricingCheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick() {
    if (!isAuthenticated) {
      window.location.href = '/auth/register';
      return;
    }

    setIsLoading(true);
    trackEvent('begin_checkout', { item_key: itemKey });

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemKey }),
      });
      const data = await res.json();

      if (data?.url) {
        trackEvent('checkout_redirect', { item_key: itemKey });
        window.location.href = data.url;
        return;
      }

      trackEvent('checkout_error', {
        item_key: itemKey,
        message: data?.error || 'Checkout error',
      });
      alert(data?.error || 'Checkout error');
    } catch {
      trackEvent('checkout_error', {
        item_key: itemKey,
        message: 'Checkout error',
      });
      alert('Checkout error');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button type="button" onClick={handleClick} disabled={isLoading} className={`${className} disabled:opacity-60`}>
      {isLoading ? loadingLabel : isAuthenticated ? checkoutLabel : loginLabel}
    </button>
  );
}