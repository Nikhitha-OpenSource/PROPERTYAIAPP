"""PROPIQ AI — structlog setup with Azure Application Insights"""
import logging
import structlog
from app.config import settings


def setup_logging():
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_log_level,
            structlog.stdlib.add_logger_name,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )

    # Azure Application Insights
    if settings.AZURE_APPINSIGHTS_CONNECTION_STRING:
        try:
            from opencensus.ext.azure.log_exporter import AzureLogHandler
            logger = logging.getLogger()
            logger.addHandler(AzureLogHandler(
                connection_string=settings.AZURE_APPINSIGHTS_CONNECTION_STRING
            ))
        except (ImportError, ValueError):
            pass
