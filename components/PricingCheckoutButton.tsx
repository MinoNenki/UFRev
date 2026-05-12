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
    window.location.href = `/checkout?itemKey=${encodeURIComponent(itemKey)}`;
  }

  return (
    <button type="button" onClick={handleClick} disabled={isLoading} className={`${className} disabled:opacity-60`}>
      {isLoading ? loadingLabel : isAuthenticated ? checkoutLabel : loginLabel}
    </button>
  );
}