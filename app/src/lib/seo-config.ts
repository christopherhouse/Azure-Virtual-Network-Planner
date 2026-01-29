/**
 * SEO Configuration for Azure Virtual Network Planner
 * 
 * This file centralizes all SEO-related configuration for easy maintenance.
 * Update these values to match your production environment.
 */

export const seoConfig = {
  // Base site information
  siteName: 'Azure VNet Planner',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://azvnetplanner.chrishou.se',
  
  // Default metadata
  defaultTitle: 'Azure Virtual Network Planner | Free Subnet Calculator & VNet Designer',
  titleTemplate: '%s | Azure VNet Planner',
  
  defaultDescription: 
    'Free Azure Virtual Network planning tool. Design VNets, calculate subnets, configure delegations, ' +
    'and export to ARM, Bicep, or Terraform. The ultimate subnet calculator for Azure engineers.',
  
  // Target keywords (for reference and meta tags)
  keywords: [
    'Azure virtual network',
    'Azure VNet planner',
    'Azure subnet calculator',
    'subnet calculator',
    'Azure networking',
    'CIDR calculator',
    'Azure network design',
    'VNet subnet planning',
    'Azure infrastructure planning',
    'Azure network architecture',
    'IP address calculator',
    'Azure subnet delegation',
    'Azure service endpoints',
    'ARM template generator',
    'Bicep template generator',
    'Terraform Azure VNet',
    'cloud network planning',
    'Azure IaC',
  ],

  // Open Graph defaults
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Azure VNet Planner',
  },

  // Twitter Card configuration
  twitter: {
    cardType: 'summary_large_image',
    // Update these with your actual Twitter handles if you have them
    site: undefined,
    creator: undefined,
  },

  // Social links (for structured data)
  socialLinks: [
    'https://github.com/christopherhouse/Azure-Virtual-Network-Planner',
  ],

  // Organization info (for structured data)
  organization: {
    name: 'Azure VNet Planner',
    // logo: 'https://azurevnetplanner.com/logo.png', // Add your logo URL
  },

  // Author information
  author: {
    name: 'Azure VNet Planner Team',
    // url: 'https://azurevnetplanner.com/about',
  },
};

/**
 * Page-specific SEO configurations
 * Add entries here for different pages/routes
 */
export const pageSeo = {
  home: {
    title: 'Azure Virtual Network Planner | Free Subnet Calculator & VNet Designer',
    description: 
      'Plan Azure Virtual Networks with our free online tool. Calculate subnets, configure delegations, ' +
      'service endpoints, and export to ARM, Bicep, or Terraform templates. Trusted by Azure engineers worldwide.',
    keywords: [
      'Azure virtual network planner',
      'Azure subnet calculator',
      'Azure VNet designer',
      'free Azure network tool',
      'Azure CIDR calculator',
    ],
  },
  // Add more pages as your app grows
  // projects: {
  //   title: 'My VNet Projects',
  //   description: 'Manage your Azure Virtual Network planning projects.',
  // },
};

/**
 * Generates full metadata object for Next.js
 */
export function generateMetadata(page: keyof typeof pageSeo = 'home') {
  const pageConfig = pageSeo[page];
  const allKeywords = [...new Set([...seoConfig.keywords, ...(pageConfig.keywords || [])])];

  return {
    title: pageConfig.title || seoConfig.defaultTitle,
    description: pageConfig.description || seoConfig.defaultDescription,
    keywords: allKeywords,
    authors: [seoConfig.author],
    creator: seoConfig.author.name,
    publisher: seoConfig.organization.name,
    metadataBase: new URL(seoConfig.siteUrl),
    alternates: {
      canonical: '/',
    },
    openGraph: {
      title: pageConfig.title || seoConfig.defaultTitle,
      description: pageConfig.description || seoConfig.defaultDescription,
      url: seoConfig.siteUrl,
      siteName: seoConfig.siteName,
      locale: seoConfig.openGraph.locale,
      type: seoConfig.openGraph.type,
      images: [
        {
          url: '/og-image.png', // Create this image (1200x630px recommended)
          width: 1200,
          height: 630,
          alt: 'Azure VNet Planner - Plan your Azure Virtual Network infrastructure',
        },
      ],
    },
    twitter: {
      card: seoConfig.twitter.cardType,
      title: pageConfig.title || seoConfig.defaultTitle,
      description: pageConfig.description || seoConfig.defaultDescription,
      site: seoConfig.twitter.site,
      creator: seoConfig.twitter.creator,
      images: ['/og-image.png'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large' as const,
        'max-snippet': -1,
      },
    },
    verification: {
      // Add your verification codes when you have them
      // google: 'your-google-verification-code',
      // bing: 'your-bing-verification-code',
    },
  };
}
