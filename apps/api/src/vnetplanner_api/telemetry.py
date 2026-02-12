"""OpenTelemetry configuration for Azure Monitor integration."""

import logging
import os

from opentelemetry import trace
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

logger = logging.getLogger(__name__)


def configure_telemetry() -> None:
    """Configure OpenTelemetry with Azure Monitor exporter.

    The Application Insights connection string is read from the
    APPLICATIONINSIGHTS_CONNECTION_STRING environment variable.
    If not set, telemetry is disabled with a warning.

    Also configures Azure SDK distributed tracing for dependency tracking
    (Cosmos DB, Storage, etc.).
    """
    connection_string = os.getenv("APPLICATIONINSIGHTS_CONNECTION_STRING")

    if not connection_string:
        logger.warning(
            "APPLICATIONINSIGHTS_CONNECTION_STRING not set. "
            "Telemetry will not be exported to Azure Monitor."
        )
        return

    try:
        from azure.core.settings import settings
        from azure.core.tracing.ext.opentelemetry_span import OpenTelemetrySpan
        from azure.monitor.opentelemetry.exporter import AzureMonitorTraceExporter

        # Create resource with service info
        resource = Resource.create(
            {
                "service.name": "vnetplanner-api",
                "service.version": "0.5.2",
            }
        )

        # Set up tracer provider
        tracer_provider = TracerProvider(resource=resource)

        # Configure Azure Monitor exporter
        exporter = AzureMonitorTraceExporter(connection_string=connection_string)
        tracer_provider.add_span_processor(BatchSpanProcessor(exporter))

        # Set the global tracer provider
        trace.set_tracer_provider(tracer_provider)

        # Enable Azure SDK distributed tracing for dependency tracking
        # This instruments Cosmos DB, Storage, and other Azure SDK calls
        settings.tracing_implementation = OpenTelemetrySpan

        logger.info("OpenTelemetry configured with Azure Monitor exporter")
        logger.info("Azure SDK distributed tracing enabled")

    except Exception as e:
        logger.error(f"Failed to configure Azure Monitor telemetry: {e}")
        raise
