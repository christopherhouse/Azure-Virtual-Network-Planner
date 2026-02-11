/**
 * Server-side Application Insights telemetry for Next.js API routes
 * Uses the Node.js SDK for server-side tracking
 */

import * as appInsights from 'applicationinsights';

let isInitialized = false;

/**
 * Initialize Application Insights for server-side telemetry
 * This is safe to call multiple times - it will only initialize once
 */
export function initializeServerTelemetry(): void {
  if (isInitialized) {
    return;
  }

  const connectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;

  if (!connectionString) {
    // Silently skip initialization if no connection string
    // This allows the app to run locally without App Insights
    return;
  }

  try {
    appInsights
      .setup(connectionString)
      .setAutoCollectRequests(true)
      .setAutoCollectPerformance(true, true)
      .setAutoCollectExceptions(true)
      .setAutoCollectDependencies(true)
      .setAutoCollectConsole(false)
      .setUseDiskRetryCaching(true)
      .setSendLiveMetrics(false)
      .start();

    isInitialized = true;
  } catch {
    // Silently fail - telemetry is optional
  }
}

/**
 * Get the default client for tracking telemetry
 * Returns null if App Insights is not initialized
 */
export function getTelemetryClient(): appInsights.TelemetryClient | null {
  if (!isInitialized) {
    initializeServerTelemetry();
  }

  return appInsights.defaultClient || null;
}

/**
 * Track a page view from server-side
 * @param name - The name of the page view
 * @param url - The URL of the page
 * @param properties - Additional custom properties
 */
export function trackPageView(
  name: string,
  url: string,
  properties?: Record<string, string>
): void {
  const client = getTelemetryClient();
  if (!client) return;

  // Use trackEvent instead since server-side page views
  // require the full PageViewTelemetry object with 'id'
  // This achieves the same visibility in App Insights
  client.trackEvent({
    name: `PageView:${name}`,
    properties: {
      ...properties,
      url,
      applicationName: 'Azure VNet Planner',
      source: 'server',
      telemetryType: 'pageView',
    },
  });
}

/**
 * Track a custom event from server-side
 * @param name - The name of the event
 * @param properties - Additional custom properties
 * @param measurements - Numeric measurements
 */
export function trackEvent(
  name: string,
  properties?: Record<string, string>,
  measurements?: Record<string, number>
): void {
  const client = getTelemetryClient();
  if (!client) return;

  client.trackEvent({
    name,
    properties: {
      ...properties,
      applicationName: 'Azure VNet Planner',
      source: 'server',
    },
    measurements,
  });
}

/**
 * Flush pending telemetry to ensure it's sent before response completes
 * Use this for short-lived operations like health checks
 */
export async function flushTelemetry(): Promise<void> {
  const client = getTelemetryClient();
  if (!client) return;

  return new Promise<void>(resolve => {
    client.flush();
    // Give a brief moment for the flush to complete
    setTimeout(resolve, 100);
  });
}
