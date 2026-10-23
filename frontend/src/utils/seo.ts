import { useEffect } from 'react';
import { trackPageView } from './analytics';

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  author?: string;
  publishedTime?: string;
  noindex?: boolean;
}

const DEFAULT_TITLE = 'New Age Unity — Мультифункциональная социальная экосистема';
const DEFAULT_DESCRIPTION = 'New Age Unity — инновационная социальная платформа для духовного роста, самопознания и осознанного общения. Астрология, Human Design, ченнелинг, нумерология, конференции и сообщества единомышленников.';
const DEFAULT_IMAGE = 'https://newageunity.com/logo.png';
const BASE_URL = 'https://newageunity.com';

/**
 * Sets or updates meta tag by selector or name/property attribute.
 */
function setMetaTag(attrName: 'name' | 'property', attrValue: string, content: string | undefined) {
  if (!content) return;
  let element = document.querySelector(`meta[${attrName}="${attrValue}"]`) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attrName, attrValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

/**
 * Sets or updates canonical link
 */
function setCanonical(href: string) {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

/**
 * React hook to dynamically update page title, Open Graph, Twitter Cards, and meta tags for SEO.
 */
export function useSEO({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords,
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
  author,
  publishedTime,
  noindex = false,
}: SEOProps = {}) {
  useEffect(() => {
    // 1. Page Title
    const finalTitle = title 
      ? (title.includes('New Age') ? title : `${title} — New Age Unity`)
      : DEFAULT_TITLE;
    document.title = finalTitle;

    // 2. Canonical URL
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
    const canonicalUrl = url || `${BASE_URL}${currentPath}`;
    setCanonical(canonicalUrl);

    // 3. Standard Meta
    setMetaTag('name', 'description', description);
    if (keywords) {
      setMetaTag('name', 'keywords', keywords);
    }
    setMetaTag('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1');
    if (author) {
      setMetaTag('name', 'author', author);
    }

    // 4. Open Graph Tags (Telegram, WhatsApp, VK, Facebook)
    const fullImage = image.startsWith('http') ? image : `${BASE_URL}${image.startsWith('/') ? '' : '/'}${image}`;
    setMetaTag('property', 'og:title', finalTitle);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:image', fullImage);
    setMetaTag('property', 'og:image:secure_url', fullImage);
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('property', 'og:type', type);
    setMetaTag('property', 'og:site_name', 'New Age Unity');

    if (publishedTime) {
      setMetaTag('property', 'article:published_time', publishedTime);
    }

    // 5. Twitter Card
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', finalTitle);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', fullImage);
    setMetaTag('name', 'twitter:url', canonicalUrl);

    // 6. Google Analytics 4 page view tracking
    trackPageView(currentPath, finalTitle);

  }, [title, description, keywords, image, url, type, author, publishedTime, noindex]);
}
