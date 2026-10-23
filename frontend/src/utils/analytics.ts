/**
 * Google Analytics 4 (gtag.js) utility for New Age Unity
 * Measurement ID: G-97GRJ111VE
 */

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

export const GA_MEASUREMENT_ID = 'G-97GRJ111VE';

/**
 * Tracks a page view in Google Analytics.
 * In a Single Page Application (React Router), call this on every route / page change.
 */
export function trackPageView(path?: string, title?: string) {
  if (typeof window === 'undefined') return;

  const finalPath = path || (window.location.pathname + window.location.search);
  const finalTitle = title || document.title;
  const finalLocation = window.location.href;

  if (typeof window.gtag === 'function') {
    // 1. Update config with current page path and title
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: finalPath,
      page_title: finalTitle,
      page_location: finalLocation,
    });

    // 2. Explicitly send page_view event for SPA navigation
    window.gtag('event', 'page_view', {
      page_path: finalPath,
      page_title: finalTitle,
      page_location: finalLocation,
      send_to: GA_MEASUREMENT_ID,
    });
  }
}

/**
 * Tracks custom events (e.g. registration, login, conference join, donation, etc.)
 */
export function trackEvent(
  eventName: string,
  eventParams: Record<string, string | number | boolean | undefined> = {}
) {
  if (typeof window === 'undefined') return;

  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, {
      ...eventParams,
      send_to: GA_MEASUREMENT_ID,
    });
  }
}
