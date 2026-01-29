'use client';

import { ApplicationInsights, ITelemetryItem } from '@microsoft/applicationinsights-web';
import { ReactPlugin } from '@microsoft/applicationinsights-react-js';

// React plugin instance - exported for use with hooks and context
export const reactPlugin = new ReactPlugin();

// Application Insights instance
let appInsights: ApplicationInsights | null = null;

/**
 * Initialize Application Insights with the React plugin
 * This should be called once at app startup
 */
export function initializeAppInsights(): ApplicationInsights | null {
  // Only initialize in browser environment
  if (typeof window === 'undefined') {
    return null;
  }

  // Get connection string from environment variable
  const connectionString = process.env.NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING;

  if (!connectionString) {
    console.warn(
      'Application Insights connection string not found. ' +
      'Set NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING environment variable to enable telemetry.'
    );
    return null;
  }

  // Return existing instance if already initialized
  if (appInsights) {
    return appInsights;
  }

  try {
    appInsights = new ApplicationInsights({
      config: {
        connectionString,
        extensions: [reactPlugin],
        extensionConfig: {
          [reactPlugin.identifier]: {
            // Enable automatic route tracking for Next.js
          }
        },
        // Enable automatic dependency tracking (fetch/XHR calls)
        enableAutoRouteTracking: true,
        // Enable automatic page view tracking
        autoTrackPageVisitTime: true,
        // Disable AJAX tracking for local requests to reduce noise
        disableFetchTracking: false,
        disableAjaxTracking: false,
        // Enable correlation headers for distributed tracing
        enableCorsCorrelation: true,
        // Enable request header tracking
        enableRequestHeaderTracking: true,
        // Enable response header tracking
        enableResponseHeaderTracking: true,
        // Configure sampling (100% in dev, could reduce in prod)
        samplingPercentage: 100,
        // Disable telemetry if in development and no connection string
        disableTelemetry: false,
      }
    });

    appInsights.loadAppInsights();

    // Add telemetry initializer for custom properties
    appInsights.addTelemetryInitializer((item: ITelemetryItem) => {
      // Add custom properties to all telemetry
      item.data = item.data || {};
      item.data.applicationName = 'Azure VNet Planner';
      item.data.applicationVersion = process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0';
    });

    // Track initial page view
    appInsights.trackPageView({
      name: document.title,
      uri: window.location.href
    });

    // Initialization successful - using warn level as it's allowed by lint rules
    console.warn('[App Insights] Initialized successfully');
    return appInsights;
  } catch (error) {
    console.error('Failed to initialize Application Insights:', error);
    return null;
  }
}

/**
 * Get the Application Insights instance
 * Returns null if not initialized
 */
export function getAppInsights(): ApplicationInsights | null {
  return appInsights;
}

/**
 * Track a custom event
 */
export function trackEvent(name: string, properties?: Record<string, string>) {
  appInsights?.trackEvent({ name }, properties);
}

/**
 * Track an exception/error
 */
export function trackException(error: Error, properties?: Record<string, string>) {
  appInsights?.trackException({ exception: error }, properties);
}

/**
 * Track a page view
 */
export function trackPageView(name: string, uri?: string) {
  appInsights?.trackPageView({ name, uri });
}

/**
 * Track a custom metric
 */
export function trackMetric(name: string, average: number, properties?: Record<string, string>) {
  appInsights?.trackMetric({ name, average }, properties);
}

/**
 * Track a dependency call (API, database, etc.)
 */
export function trackDependency(
  id: string,
  name: string,
  duration: number,
  success: boolean,
  responseCode: number = 200,
  type: string = 'Http',
  target?: string,
  properties?: Record<string, string>
) {
  appInsights?.trackDependencyData({
    id,
    name,
    duration,
    success,
    responseCode,
    type,
    target,
    properties
  });
}

/**
 * Track a trace message
 */
export function trackTrace(message: string, severityLevel?: number, properties?: Record<string, string>) {
  appInsights?.trackTrace({ message, severityLevel }, properties);
}

/**
 * Set the authenticated user context
 */
export function setAuthenticatedUser(userId: string, accountId?: string) {
  appInsights?.setAuthenticatedUserContext(userId, accountId, true);
}

/**
 * Clear the authenticated user context
 */
export function clearAuthenticatedUser() {
  appInsights?.clearAuthenticatedUserContext();
}

/**
 * Flush pending telemetry (useful before page unload)
 */
export function flushTelemetry() {
  appInsights?.flush();
}
