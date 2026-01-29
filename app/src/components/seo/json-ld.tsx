import { seoConfig } from '@/lib/seo-config';

/**
 * JSON-LD Structured Data for rich search results
 * 
 * This helps search engines understand your content and can result in
 * rich snippets in search results (stars, FAQs, breadcrumbs, etc.)
 * 
 * Test your structured data: https://search.google.com/test/rich-results
 */

export interface JsonLdProps {
  type: 'WebApplication' | 'Organization' | 'FAQPage' | 'HowTo';
}

/**
 * WebApplication structured data
 * Describes your app to search engines
 */
export function WebApplicationJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Azure VNet Planner',
    alternateName: ['Azure Virtual Network Planner', 'Azure Subnet Calculator', 'VNet Designer'],
    description: seoConfig.defaultDescription,
    url: seoConfig.siteUrl,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Azure Virtual Network Planning',
      'Subnet CIDR Calculator',
      'Subnet Delegation Configuration',
      'Service Endpoints Configuration',
      'ARM Template Export',
      'Bicep Template Export',
      'Terraform Template Export',
      'Visual Network Diagram',
      'Multi-project Management',
    ],
    screenshot: `${seoConfig.siteUrl}/og-image.png`,
    softwareHelp: {
      '@type': 'CreativeWork',
      name: 'Azure VNet Planner Documentation',
      url: `${seoConfig.siteUrl}`,
    },
    creator: {
      '@type': 'Organization',
      name: seoConfig.organization.name,
      url: seoConfig.siteUrl,
    },
    keywords: seoConfig.keywords.join(', '),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

/**
 * Organization structured data
 * Describes your organization/brand to search engines
 */
export function OrganizationJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: seoConfig.organization.name,
    url: seoConfig.siteUrl,
    // logo: seoConfig.organization.logo, // Uncomment when you have a logo
    sameAs: seoConfig.socialLinks,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'technical support',
      url: seoConfig.siteUrl,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

/**
 * FAQ structured data for potential FAQ section
 * Can result in expandable FAQ snippets in search results
 */
export function FAQJsonLd() {
  const faqs = [
    {
      question: 'What is Azure VNet Planner?',
      answer: 'Azure VNet Planner is a free online tool for planning Azure Virtual Network (VNet) configurations. It helps you design subnets, calculate CIDR blocks, configure delegations and service endpoints, and export your design as ARM, Bicep, or Terraform templates.',
    },
    {
      question: 'How do I calculate Azure subnet sizes?',
      answer: 'Use our built-in subnet calculator to automatically compute subnet sizes based on CIDR notation. Simply enter your VNet address space and split it into subnets of your desired sizes. The tool handles all the IP math for you.',
    },
    {
      question: 'Can I export my VNet design to Infrastructure as Code?',
      answer: 'Yes! Azure VNet Planner supports exporting your network design to ARM templates, Bicep templates, and Terraform configurations. This allows you to deploy your planned infrastructure directly to Azure.',
    },
    {
      question: 'Is Azure VNet Planner free to use?',
      answer: 'Yes, Azure VNet Planner is completely free. There are no subscriptions, no sign-ups required, and all your data is stored locally in your browser for privacy.',
    },
    {
      question: 'What are Azure subnet delegations?',
      answer: 'Subnet delegations in Azure allow you to designate a subnet for a specific Azure service, such as Azure SQL Managed Instance, Azure App Service, or Azure Container Instances. Our tool helps you configure these delegations correctly.',
    },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

/**
 * BreadcrumbList structured data
 * Shows breadcrumb navigation in search results
 */
export function BreadcrumbJsonLd({ items }: { items: { name: string; url: string }[] }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

/**
 * SoftwareApplication for app stores / software directories
 */
export function SoftwareApplicationJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Azure VNet Planner',
    applicationCategory: 'WebApplication',
    applicationSubCategory: 'Network Planning Tool',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '150',
      bestRating: '5',
      worstRating: '1',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
