/**
 * Health check endpoint for Azure Front Door probes
 *
 * Supports HEAD requests for minimal performance impact on health probes.
 * Also supports GET requests which return JSON body.
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

/**
 * Common health check logic for both HEAD and GET
 */
async function performHealthCheck(method: string): Promise<void> {
  const timestamp = new Date().toISOString();

  // Track as page view for App Insights usage analytics
  trackPageView('Health Check', '/healthz', {
    method,
    timestamp,
    probe: 'azure-front-door',
  });

  // Track as custom event for operational dashboards
  trackEvent(
    'HealthCheckProbe',
    {
      method,
      timestamp,
      endpoint: '/healthz',
      status: 'healthy',
      probe: 'azure-front-door',
    },
    {
      responseTimeMs: 0, // Actual response time could be measured if needed
    }
  );

  // Flush telemetry to ensure it's sent before response completes
  // This is important for health checks which are short-lived
  await flushTelemetry();
}

/**
 * HEAD /healthz
 *
 * Minimal response for Azure Front Door health probes.
 * Returns only headers, no body, for maximum efficiency.
 */
export async function HEAD(): Promise<NextResponse> {
  try {
    await performHealthCheck('HEAD');

    return new NextResponse(null, {
      status: 200,
      headers: {
        'X-Health-Status': 'healthy',
        'X-Service': 'vnetplanner-web',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch {
    return new NextResponse(null, {
      status: 503,
      headers: {
        'X-Health-Status': 'unhealthy',
        'X-Service': 'vnetplanner-web',
      },
    });
  }
}

/**
 * GET /healthz
 *
 * Full health check response with JSON body.
 * Useful for debugging and manual health verification.
 */
export async function GET(): Promise<NextResponse> {
  try {
    await performHealthCheck('GET');

    return NextResponse.json(
      {
        status: 'healthy',
        service: 'vnetplanner-web',
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch {
    return NextResponse.json(
      {
        status: 'unhealthy',
        service: 'vnetplanner-web',
        timestamp: new Date().toISOString(),
      },
      {
        status: 503,
      }
    );
  }
}
