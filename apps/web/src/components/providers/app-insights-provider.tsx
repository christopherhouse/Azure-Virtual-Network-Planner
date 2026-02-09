'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AppInsightsContext } from '@microsoft/applicationinsights-react-js';
import {
  initializeAppInsights,
  reactPlugin,
  trackEvent,
  trackException,
  trackPageView,
  trackTrace,
} from '@/lib/app-insights';

interface AppInsightsProviderProps {
  children: ReactNode;
}

/**
 * Context for accessing App Insights helpers throughout the app
 */
interface AppInsightsHelpers {
  trackEvent: typeof trackEvent;
  trackException: typeof trackException;
  trackPageView: typeof trackPageView;
  trackTrace: typeof trackTrace;
  isInitialized: boolean;
}

const AppInsightsHelpersContext = createContext<AppInsightsHelpers>({
  trackEvent: () => {},
  trackException: () => {},
  trackPageView: () => {},
  trackTrace: () => {},
  isInitialized: false,
});

/**
 * Hook to access App Insights tracking functions
 */
export function useAppInsights() {
  return useContext(AppInsightsHelpersContext);
}

/**
 * Provider component that initializes Application Insights
 * and provides tracking functions to child components
 */
export function AppInsightsProvider({ children }: AppInsightsProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize App Insights on mount
    const ai = initializeAppInsights();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional initialization on mount
    setIsInitialized(ai !== null);

    // Cleanup on unmount
    return () => {
      // Flush any pending telemetry before unmount
      ai?.flush();
    };
  }, []);

  // Set up global error handler
  useEffect(() => {
    if (!isInitialized) return;

    const handleError = (event: ErrorEvent) => {
      trackException(event.error || new Error(event.message), {
        source: 'window.onerror',
        filename: event.filename || 'unknown',
        lineno: String(event.lineno || 0),
        colno: String(event.colno || 0),
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      trackException(error, {
        source: 'unhandledrejection',
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [isInitialized]);

  const helpers: AppInsightsHelpers = {
    trackEvent,
    trackException,
    trackPageView,
    trackTrace,
    isInitialized,
  };

  return (
    <AppInsightsHelpersContext.Provider value={helpers}>
      <AppInsightsContext.Provider value={reactPlugin}>{children}</AppInsightsContext.Provider>
    </AppInsightsHelpersContext.Provider>
  );
}
