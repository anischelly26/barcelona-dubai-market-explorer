import logging
from decimal import Decimal

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine

from backend.app.services.normalization import RawListing, normalize_listing


logger = logging.getLogger(__name__)


async def persist_listings(
    engine: AsyncEngine,
    raw_listings: list[RawListing],
    fx_rates: dict[str, Decimal],
) -> dict[str, int]:
    accepted = 0
    rejected = 0
    async with engine.begin() as connection:
        for raw in raw_listings:
            try:
                item = normalize_listing(raw, fx_rates)
                neighborhood_id = await connection.scalar(text("""
                    INSERT INTO neighborhoods (city, name, center)
                    VALUES (:city, :neighborhood, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326))
                    ON CONFLICT (city, name) DO UPDATE SET center = EXCLUDED.center
                    RETURNING id
                """), item)
                item["neighborhood_id"] = neighborhood_id
                property_id = await connection.scalar(text("""
                    INSERT INTO properties (
                        external_id, source_name, source_url, city, neighborhood_id,
                        property_type, title, currency, price_local, area_sqm,
                        annual_rent_eur, bedrooms, bathrooms, geom, content_hash,
                        first_seen_at, last_seen_at, active
                    ) VALUES (
                        :external_id, :source_name, :source_url, :city, :neighborhood_id,
                        :property_type, :title, :currency, :price_local, :area_sqm,
                        :annual_rent_eur, :bedrooms, :bathrooms,
                        ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
                        :content_hash, :observed_at, :observed_at, true
                    )
                    ON CONFLICT (source_name, external_id) DO UPDATE SET
                        price_local = EXCLUDED.price_local,
                        area_sqm = EXCLUDED.area_sqm,
                        annual_rent_eur = EXCLUDED.annual_rent_eur,
                        geom = EXCLUDED.geom,
                        content_hash = EXCLUDED.content_hash,
                        last_seen_at = EXCLUDED.last_seen_at,
                        active = true
                    RETURNING id
                """), item)
                await connection.execute(text("""
                    INSERT INTO price_snapshots (
                        property_id, observed_at, price_local, price_eur,
                        price_per_sqm_eur, fx_rate_to_eur
                    ) VALUES (
                        :property_id, :observed_at, :price_local, :price_eur,
                        :price_per_sqm_eur, :fx_rate
                    ) ON CONFLICT (property_id, observed_at) DO NOTHING
                """), {
                    **item,
                    "property_id": property_id,
                    "fx_rate": float(fx_rates[item["currency"]]),
                })
                accepted += 1
            except (ValueError, TypeError) as exc:
                rejected += 1
                logger.warning("Rejected listing %s: %s", raw.external_id, exc)
    return {"accepted": accepted, "rejected": rejected}

