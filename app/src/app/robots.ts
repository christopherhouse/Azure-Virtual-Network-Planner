import { MetadataRoute } from 'next';
import { seoConfig } from '@/lib/seo-config';

/**
 * Robots.txt configuration for search engine crawlers
 * This tells search engines which pages to crawl and index
 * 
 * Learn more: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = seoConfig.siteUrl;

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/', // Don't index API routes
          '/_next/', // Don't index Next.js internal routes
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
