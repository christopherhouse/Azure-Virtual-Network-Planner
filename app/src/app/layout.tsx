import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/app-context";
import { AppInsightsProvider } from "@/components/providers/app-insights-provider";
import { WebApplicationJsonLd, OrganizationJsonLd, FAQJsonLd } from "@/components/seo/json-ld";
import { generateMetadata as generateSeoMetadata, seoConfig } from "@/lib/seo-config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Viewport configuration for mobile optimization
 * Separate from metadata per Next.js 14+ best practices
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

/**
 * Root metadata - applies to all pages
 * Individual pages can override specific fields
 */
export const metadata: Metadata = {
  ...generateSeoMetadata('home'),
  
  // Additional metadata not in the generator
  applicationName: seoConfig.siteName,
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  
  // Icons configuration
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  
  // App-specific metadata
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: seoConfig.siteName,
  },
  
  // Format detection
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  
  // Category for app stores and directories
  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr">
      <head>
        {/* Structured Data for rich search results */}
        <WebApplicationJsonLd />
        <OrganizationJsonLd />
        <FAQJsonLd />
        
        {/* Preconnect to external resources for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS prefetch for Azure CDN if used */}
        <link rel="dns-prefetch" href="https://azureedge.net" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppInsightsProvider>
          <AppProvider>{children}</AppProvider>
        </AppInsightsProvider>
      </body>
    </html>
  );
}
