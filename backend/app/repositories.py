from collections import defaultdict
from datetime import date
from statistics import mean, median
from typing import Protocol

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

from backend.app.demo_data import DEMO_PROPERTIES
from backend.app.schemas import MarketSummary, PropertyOut, TrendPoint


class MarketRepository(Protocol):
    data_mode: str

    async def list_properties(self, city: str | None, property_type: str | None, max_price_eur: float | None, limit: int) -> list[PropertyOut]: ...
    async def summaries(self) -> list[MarketSummary]: ...
    async def trends(self, months: int) -> list[TrendPoint]: ...
    async def nearby(self, latitude: float, longitude: float, radius_m: int, limit: int) -> list[tuple[PropertyOut, float]]: ...


class MemoryRepository:
    data_mode = "demo"

    async def list_properties(self, city=None, property_type=None, max_price_eur=None, limit=100):
        items = [
            item for item in DEMO_PROPERTIES
            if (not city or item.city == city)
            and (not property_type or item.property_type == property_type)
            and (max_price_eur is None or item.price_eur <= max_price_eur)
        ]
        return items[:limit]

    async def summaries(self):
        results = []
        for city in ("Barcelona", "Dubai"):
            items = [item for item in DEMO_PROPERTIES if item.city == city]
            results.append(MarketSummary(
                city=city,
                listings=len(items),
                median_price_eur=round(median(item.price_eur for item in items), 2),
                median_price_per_sqm_eur=round(median(item.price_per_sqm_eur for item in items), 2),
                average_gross_yield_pct=round(mean(item.gross_yield_pct for item in items), 2),
            ))
        return results

    async def trends(self, months):
        base = [
            ("2025-10-01", 4850, 3710), ("2025-11-01", 4875, 3790),
            ("2025-12-01", 4920, 3840), ("2026-01-01", 4960, 3920),
            ("2026-02-01", 4985, 3980), ("2026-03-01", 5010, 4050),
            ("2026-04-01", 5055, 4110), ("2026-05-01", 5080, 4180),
            ("2026-06-01", 5115, 4260), ("2026-07-01", 5140, 4330),
            ("2026-08-01", 5180, 4410), ("2026-09-01", 5210, 4470),
        ]
        return [TrendPoint(month=date.fromisoformat(m), Barcelona=b, Dubai=d) for m, b, d in base[-months:]]

    async def nearby(self, latitude, longitude, radius_m, limit):
        # Equirectangular approximation is sufficient for deterministic demo mode.
        import math
        distances = []
        for item in DEMO_PROPERTIES:
            x = math.radians(item.longitude - longitude) * math.cos(math.radians((item.latitude + latitude) / 2))
            y = math.radians(item.latitude - latitude)
            distance = math.sqrt(x * x + y * y) * 6_371_000
            if distance <= radius_m:
                distances.append((item, round(distance, 1)))
        return sorted(distances, key=lambda row: row[1])[:limit]


class PostgresRepository:
    data_mode = "database"

    def __init__(self, database_url: str):
        self.engine: AsyncEngine = create_async_engine(database_url, pool_pre_ping=True)

    @staticmethod
    def _property(row) -> PropertyOut:
        return PropertyOut(**dict(row))

    async def list_properties(self, city=None, property_type=None, max_price_eur=None, limit=100):
        query = text("""
            SELECT p.id::text, p.city, n.name AS neighborhood, p.property_type,
                   p.title, p.currency, p.price_local::float, s.price_eur::float,
                   p.area_sqm::float, s.price_per_sqm_eur::float,
                   COALESCE(p.annual_rent_eur, 0)::float AS annual_rent_eur,
                   COALESCE(p.annual_rent_eur / NULLIF(s.price_eur, 0) * 100, 0)::float AS gross_yield_pct,
                   p.bedrooms, p.bathrooms::float, ST_Y(p.geom::geometry) AS latitude,
                   ST_X(p.geom::geometry) AS longitude, p.source_name, p.source_url,
                   s.observed_at
              FROM properties p
              JOIN neighborhoods n ON n.id = p.neighborhood_id
              JOIN LATERAL (
                  SELECT price_eur, price_per_sqm_eur, observed_at
                    FROM price_snapshots
                   WHERE property_id = p.id
                   ORDER BY observed_at DESC LIMIT 1
              ) s ON TRUE
             WHERE p.active
               AND (:city IS NULL OR p.city = :city)
               AND (:property_type IS NULL OR p.property_type = :property_type)
               AND (:max_price IS NULL OR s.price_eur <= :max_price)
             ORDER BY s.observed_at DESC, p.city, n.name
             LIMIT :limit
        """)
        async with self.engine.connect() as connection:
            rows = (await connection.execute(query, {"city": city, "property_type": property_type, "max_price": max_price_eur, "limit": limit})).mappings()
            return [self._property(row) for row in rows]

    async def summaries(self):
        query = text("SELECT * FROM market_summary ORDER BY city")
        async with self.engine.connect() as connection:
            rows = (await connection.execute(query)).mappings()
            return [MarketSummary(**dict(row)) for row in rows]

    async def trends(self, months):
        query = text("""
            WITH monthly AS (
                SELECT date_trunc('month', s.observed_at)::date AS month, p.city,
                       avg(s.price_per_sqm_eur)::float AS value
                  FROM price_snapshots s JOIN properties p ON p.id = s.property_id
                 WHERE s.observed_at >= date_trunc('month', now()) - (:months - 1) * interval '1 month'
                 GROUP BY 1, 2
            )
            SELECT month,
                   max(value) FILTER (WHERE city='Barcelona') AS "Barcelona",
                   max(value) FILTER (WHERE city='Dubai') AS "Dubai"
              FROM monthly GROUP BY month ORDER BY month
        """)
        async with self.engine.connect() as connection:
            rows = (await connection.execute(query, {"months": months})).mappings()
            return [TrendPoint(**dict(row)) for row in rows]

    async def nearby(self, latitude, longitude, radius_m, limit):
        query = text("""
            SELECT p.id::text, p.city, n.name AS neighborhood, p.property_type,
                   p.title, p.currency, p.price_local::float, s.price_eur::float,
                   p.area_sqm::float, s.price_per_sqm_eur::float,
                   COALESCE(p.annual_rent_eur, 0)::float AS annual_rent_eur,
                   COALESCE(p.annual_rent_eur / NULLIF(s.price_eur, 0) * 100, 0)::float AS gross_yield_pct,
                   p.bedrooms, p.bathrooms::float, ST_Y(p.geom::geometry) AS latitude,
                   ST_X(p.geom::geometry) AS longitude, p.source_name, p.source_url,
                   s.observed_at,
                   ST_Distance(p.geom, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography)::float AS distance_m
              FROM properties p
              JOIN neighborhoods n ON n.id = p.neighborhood_id
              JOIN LATERAL (SELECT * FROM price_snapshots WHERE property_id=p.id ORDER BY observed_at DESC LIMIT 1) s ON TRUE
             WHERE ST_DWithin(p.geom, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radius)
             ORDER BY distance_m LIMIT :limit
        """)
        async with self.engine.connect() as connection:
            rows = (await connection.execute(query, {"lat": latitude, "lng": longitude, "radius": radius_m, "limit": limit})).mappings()
            return [(self._property(row), float(row["distance_m"])) for row in rows]

