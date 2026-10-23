/**
 * Unified Analytics utility for New Age Unity
 * - Google Analytics 4: G-97GRJ111VE
 * - Yandex.Metrika: 113749368
 */

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
    ym?: (id: number, action: string, ...args: any[]) => void;
  }
}

export const GA_MEASUREMENT_ID = 'G-97GRJ111VE';
export const YM_COUNTER_ID = 113749368;

/**
 * Tracks a page view in both Google Analytics 4 and Yandex.Metrika.
 * In a Single Page Application (React Router), call this on every route / page change.
 */
export function trackPageView(path?: string, title?: string) {
  if (typeof window === 'undefined') return;

  const finalPath = path || (window.location.pathname + window.location.search);
  const finalTitle = title || document.title;
  const finalLocation = window.location.href;

  // 1. Google Analytics 4
  if (typeof window.gtag === 'function') {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: finalPath,
      page_title: finalTitle,
      page_location: finalLocation,
    });

    window.gtag('event', 'page_view', {
      page_path: finalPath,
      page_title: finalTitle,
      page_location: finalLocation,
      send_to: GA_MEASUREMENT_ID,
    });
  }

  // 2. Yandex.Metrika SPA Hit
  if (typeof window.ym === 'function') {
    window.ym(YM_COUNTER_ID, 'hit', finalLocation, {
      title: finalTitle,
      referer: document.referrer,
    });
  }
}

/**
 * Tracks custom goal events in both Google Analytics and Yandex.Metrika
 */
export function trackEvent(
  eventName: string,
  eventParams: Record<string, string | number | boolean | undefined> = {}
) {
  if (typeof window === 'undefined') return;

  // Google Analytics
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, {
      ...eventParams,
      send_to: GA_MEASUREMENT_ID,
    });
  }

  // Yandex.Metrika target / goal
  if (typeof window.ym === 'function') {
    window.ym(YM_COUNTER_ID, 'reachGoal', eventName, eventParams);
  }
}
