import { MetadataRoute } from 'next';
import { seoConfig } from '@/lib/seo-config';

/**
 * Web App Manifest for PWA support and SEO
 * This enables "Add to Home Screen" and improves mobile experience
 *
 * Learn more: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/manifest
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Azure Virtual Network Planner',
    short_name: 'VNet Planner',
    description: seoConfig.defaultDescription,
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#0078d4', // Azure blue
    orientation: 'portrait-primary',
    categories: ['developer tools', 'utilities', 'productivity'],
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    screenshots: [
      {
        src: '/screenshot-wide.png',
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Azure VNet Planner Dashboard',
      },
      {
        src: '/screenshot-narrow.png',
        sizes: '750x1334',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Azure VNet Planner Mobile View',
      },
    ],
  };
}
