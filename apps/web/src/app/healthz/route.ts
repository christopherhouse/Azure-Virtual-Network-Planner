/**
 * Health check endpoint for Azure Front Door probes
 *
 * Exercises dependencies (API) and reports their status.
 * Returns 200 if API is reachable, 503 if API is unavailable.
 *
 * Supports HEAD requests for minimal performance impact on health probes.
 * Also supports GET requests which return JSON body with dependency status.
 *
 * Tracks requests in Application Insights as:
 * - Page view: For visibility in App Insights > Usage > Page views
 * - Custom event: For operational health monitoring dashboards
 */

import { NextResponse } from 'next/server';
import {
  trackPageView,
  trackEvent,
  flushTelemetry,
  initializeServerTelemetry,
} from '@/lib/server-telemetry';

// Ensure telemetry is initialized when this module loads
initializeServerTelemetry();

// API health check URL - can be overridden via environment variable
// Server-side only (no NEXT_PUBLIC_ prefix)
const API_HEALTH_URL =
  process.env.API_HEALTH_URL || 'https://api.azvnetplanner.chrishou.se/healthz';

// Timeout for API health check (ms)
const HEALTH_CHECK_TIMEOUT = 5000;

interface HealthCheckResult {
  apiHealthy: boolean;
  apiStatus?: string;
  apiResponseTime?: number;
  error?: string;
}

/**
 * Check API health by calling its /healthz endpoint
 */
async function checkApiHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT);

    const response = await fetch(API_HEALTH_URL, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    if (response.ok) {
      const data = await response.json();
      return {
        apiHealthy: data.status === 'healthy',
        apiStatus: data.status,
        apiResponseTime: responseTime,
      };
    }

    return {
      apiHealthy: false,
      apiStatus: 'unhealthy',
      apiResponseTime: responseTime,
      error: `API returned ${response.status}`,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return {
      apiHealthy: false,
      apiResponseTime: responseTime,
      error: errorMessage.includes('abort') ? 'Timeout' : errorMessage,
    };
  }
}

/**
 * Common health check logic for both HEAD and GET
 */
async function performHealthCheck(method: string): Promise<HealthCheckResult> {
  const timestamp = new Date().toISOString();
  const healthResult = await checkApiHealth();

  const status = healthResult.apiHealthy ? 'healthy' : 'unhealthy';

  // Track as page view for App Insights usage analytics
  trackPageView('Health Check', '/healthz', {
    method,
    timestamp,
    probe: 'azure-front-door',
    apiHealthy: String(healthResult.apiHealthy),
  });

  // Track as custom event for operational dashboards
  trackEvent(
    'HealthCheckProbe',
    {
      method,
      timestamp,
      endpoint: '/healthz',
      status,
      probe: 'azure-front-door',
      apiStatus: healthResult.apiStatus || 'unknown',
      error: healthResult.error || '',
    },
    {
      responseTimeMs: healthResult.apiResponseTime || 0,
    }
  );

  // Flush telemetry to ensure it's sent before response completes
  // This is important for health checks which are short-lived
  await flushTelemetry();

  return healthResult;
}

/**
 * HEAD /healthz
 *
 * Minimal response for Azure Front Door health probes.
 * Returns only headers, no body, for maximum efficiency.
 * Returns 200 if API is healthy, 503 if API is unavailable.
 */
export async function HEAD(): Promise<NextResponse> {
  const healthResult = await performHealthCheck('HEAD');
  const isHealthy = healthResult.apiHealthy;

  return new NextResponse(null, {
    status: isHealthy ? 200 : 503,
    headers: {
      'X-Health-Status': isHealthy ? 'healthy' : 'unhealthy',
      'X-Service': 'vnetplanner-web',
      'X-API-Status': healthResult.apiStatus || 'unknown',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

/**
 * GET /healthz
 *
 * Full health check response with JSON body.
 * Exercises API dependency and reports its status.
 * Returns 200 if API is healthy, 503 if API is unavailable.
 */
export async function GET(): Promise<NextResponse> {
  const healthResult = await performHealthCheck('GET');
  const isHealthy = healthResult.apiHealthy;

  const responseBody = {
    status: isHealthy ? 'healthy' : 'degraded',
    service: 'vnetplanner-web',
    timestamp: new Date().toISOString(),
    dependencies: {
      api: healthResult.apiHealthy,
    },
    ...(healthResult.apiResponseTime && {
      metrics: {
        apiResponseTimeMs: healthResult.apiResponseTime,
      },
    }),
    ...(!isHealthy &&
      healthResult.error && {
        error: healthResult.error,
      }),
  };

  return NextResponse.json(responseBody, {
    status: isHealthy ? 200 : 503,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
