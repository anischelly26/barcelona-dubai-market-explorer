import asyncio
import logging
from decimal import Decimal

from apscheduler.schedulers.blocking import BlockingScheduler
from sqlalchemy.ext.asyncio import create_async_engine

from backend.app.config import get_settings
from backend.app.ingestion.html_adapter import PermittedHtmlAdapter
from backend.app.ingestion.pipeline import persist_listings


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def run_once() -> None:
    settings = get_settings()
    if not settings.database_url or not settings.ingestion_source_url:
        logger.info("Ingestion skipped: MARKET_DATABASE_URL or MARKET_INGESTION_SOURCE_URL is unset")
        return

    adapter = PermittedHtmlAdapter(
        source_name="Configured permitted source",
        user_agent=settings.ingestion_user_agent,
    )
    html = await adapter.fetch(settings.ingestion_source_url)
    raw = adapter.parse(html, settings.ingestion_source_url)
    engine = create_async_engine(settings.database_url, pool_pre_ping=True)
    try:
        result = await persist_listings(
            engine,
            raw,
            {"EUR": Decimal("1"), "AED": Decimal(str(settings.default_aed_eur_rate))},
        )
        logger.info("Ingestion complete: %s", result)
    finally:
        await engine.dispose()


def main() -> None:
    scheduler = BlockingScheduler(timezone="UTC")
    scheduler.add_job(lambda: asyncio.run(run_once()), "cron", hour=2, minute=15, id="daily-ingestion")
    logger.info("Daily ingestion scheduler started (02:15 UTC)")
    scheduler.start()


if __name__ == "__main__":
    main()

