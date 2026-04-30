'use client';

import { useState } from 'react';

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

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemKey }),
      });
      const data = await res.json();

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      alert(data?.error || 'Checkout error');
    } catch {
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