import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';

/**
 * The app now serves the public site too: the home page (offers) and the free
 * audit start page should be found by search engines and AI assistants. The
 * signed-in product, per-visitor audit reports and APIs stay out of the index
 * (those pages also send noindex; see vercel.json and page metadata).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/audit$'],
        disallow: ['/dashboard', '/api/', '/audit/', '/sign-in', '/sign-up', '/forgot-password', '/reset-password', '/invite'],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
