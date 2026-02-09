# SEO Implementation Guide for Azure VNet Planner

This document outlines the SEO implementation and provides guidance for ongoing optimization.

## What's Been Implemented

### 1. **Rich Metadata** ([seo-config.ts](src/lib/seo-config.ts))
- Optimized title tags with target keywords
- Compelling meta descriptions
- Comprehensive keyword targeting
- Open Graph tags for Facebook/LinkedIn sharing
- Twitter Card tags for Twitter sharing
- Canonical URLs to prevent duplicate content

### 2. **Structured Data / JSON-LD** ([json-ld.tsx](src/components/seo/json-ld.tsx))
- `WebApplication` schema - tells Google this is a web app
- `Organization` schema - establishes brand identity
- `FAQPage` schema - can result in FAQ snippets in search results
- `SoftwareApplication` schema - for software directories

### 3. **Technical SEO**
- [sitemap.ts](src/app/sitemap.ts) - Dynamic sitemap generation at `/sitemap.xml`
- [robots.ts](src/app/robots.ts) - Crawler guidance at `/robots.txt`
- [manifest.ts](src/app/manifest.ts) - PWA manifest for mobile optimization
- Dynamic OG images generated at build time

### 4. **Semantic HTML**
- Proper heading hierarchy
- ARIA labels for accessibility
- Hidden SEO content with relevant keywords

---

## Action Items for You

### Required: Update Your Domain

1. **Set your production URL** in `.env` (create from `.env.example`):
   ```env
   NEXT_PUBLIC_SITE_URL=https://your-actual-domain.com
   ```

2. **Update [seo-config.ts](src/lib/seo-config.ts)** with your actual:
   - Domain name
   - Twitter handle (if you have one)
   - Social media links

### Required: Create Icon Assets

Add these files to `public/`:

| File | Size | Purpose |
|------|------|---------|
| `icon-192.png` | 192×192 | Android icon, PWA |
| `icon-512.png` | 512×512 | PWA splash |
| `apple-touch-icon.png` | 180×180 | iOS home screen |
| `screenshot-wide.png` | 1280×720 | PWA store listing |
| `screenshot-narrow.png` | 750×1334 | PWA store listing |

> 💡 **Tip**: Use [Favicon.io](https://favicon.io/) or [RealFaviconGenerator](https://realfavicongenerator.net/) to generate all icon sizes from one image.

### Optional: Google Search Console Setup

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add your property (domain)
3. Verify ownership (add DNS record or HTML tag)
4. Get verification code and add to [seo-config.ts](src/lib/seo-config.ts):
   ```typescript
   verification: {
     google: 'your-verification-code',
   },
   ```
5. Submit your sitemap: `https://yourdomain.com/sitemap.xml`

### Optional: Bing Webmaster Tools

1. Go to [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. Add and verify your site
3. Add verification code to [seo-config.ts](src/lib/seo-config.ts)

---

## Target Keywords

The app is optimized for these search terms:

| Primary Keywords | Secondary Keywords |
|-----------------|-------------------|
| Azure virtual network | VNet subnet planning |
| Azure subnet calculator | Azure network architecture |
| Azure VNet planner | IP address calculator |
| Azure networking | ARM template generator |
| subnet calculator | Bicep template generator |
| CIDR calculator | Terraform Azure VNet |

---

## Testing Your SEO

### Test Structured Data
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Schema.org Validator](https://validator.schema.org/)

### Test Social Sharing
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)

### Test Mobile & Performance
- [Google PageSpeed Insights](https://pagespeed.web.dev/)
- [Google Mobile-Friendly Test](https://search.google.com/test/mobile-friendly)

---

## Ongoing SEO Tips

1. **Content is King**: Consider adding:
   - A blog with Azure networking tutorials
   - Documentation/help pages
   - A features page with detailed descriptions

2. **Build Backlinks**: 
   - Submit to developer tool directories
   - Write guest posts on Azure/cloud blogs
   - Share on Reddit (r/azure, r/devops)
   - Post on Hacker News

3. **Monitor Performance**:
   - Check Google Search Console weekly
   - Track keyword rankings
   - Monitor Core Web Vitals

4. **Keep Content Fresh**:
   - Update features regularly
   - Add new Azure services as they're released
   - Keep the FAQ section current

---

## File Structure

```
src/
├── app/
│   ├── layout.tsx          # Root metadata, JSON-LD injection
│   ├── page.tsx            # Semantic HTML structure
│   ├── sitemap.ts          # Dynamic sitemap
│   ├── robots.ts           # Crawler rules
│   ├── manifest.ts         # PWA manifest
│   ├── opengraph-image.tsx # Dynamic OG image
│   └── twitter-image.tsx   # Dynamic Twitter card
├── components/
│   └── seo/
│       └── json-ld.tsx     # Structured data components
└── lib/
    └── seo-config.ts       # Centralized SEO configuration
```

---

## Need Help?

- [Next.js Metadata Documentation](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Schema.org Documentation](https://schema.org/)
