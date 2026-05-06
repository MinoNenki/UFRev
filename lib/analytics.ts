export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

export type UFREVAnalyticsEvent =
  | 'view_pricing'
  | 'begin_checkout'
  | 'checkout_redirect'
  | 'checkout_error'
  | 'checkout_cancel'
  | 'purchase'
  | 'sign_up'
  | 'login'
  | 'analyze_started'
  | 'analyze_completed'
  | 'analyze_error'
  | 'upload_file';

export function trackEvent(eventName: UFREVAnalyticsEvent, params: Record<string, unknown> = {}) {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', eventName, params);
}

export function trackPageView(pathAndQuery: string) {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined' || typeof window.gtag !== 'function') return;

  window.gtag('event', 'page_view', {
    page_path: pathAndQuery,
    page_location: `${window.location.origin}${pathAndQuery}`,
    page_title: document.title,
  });
}
