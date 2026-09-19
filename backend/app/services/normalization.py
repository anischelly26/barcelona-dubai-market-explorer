from dataclasses import dataclass
from datetime import UTC, datetime
from decimal import Decimal, ROUND_HALF_UP
from hashlib import sha256


SQFT_TO_SQM = Decimal("0.09290304")


def money(value: Decimal | float | int) -> float:
    return float(Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


@dataclass(frozen=True)
class RawListing:
    external_id: str
    city: str
    neighborhood: str
    property_type: str
    title: str
    price: Decimal
    currency: str
    area: Decimal
    area_unit: str
    monthly_rent: Decimal
    latitude: float
    longitude: float
    source_name: str
    source_url: str | None = None
    bedrooms: int | None = None
    bathrooms: float | None = None


def normalize_listing(raw: RawListing, fx_to_eur: dict[str, Decimal]) -> dict:
    currency = raw.currency.upper()
    area_unit = raw.area_unit.lower()
    if currency not in fx_to_eur:
        raise ValueError(f"Missing EUR conversion rate for {currency}")
    if area_unit not in {"sqm", "sqft"}:
        raise ValueError(f"Unsupported area unit: {raw.area_unit}")

    area_sqm = raw.area if area_unit == "sqm" else raw.area * SQFT_TO_SQM
    if area_sqm <= 0 or raw.price <= 0:
        raise ValueError("Price and area must be positive")

    price_eur = raw.price * fx_to_eur[currency]
    annual_rent_eur = raw.monthly_rent * Decimal("12") * fx_to_eur[currency]
    gross_yield = annual_rent_eur / price_eur * Decimal("100")
    fingerprint = "|".join(
        [raw.source_name, raw.external_id, str(raw.price), str(raw.area), raw.currency]
    )

    return {
        "id": f"{raw.source_name.lower().replace(' ', '-')}-{raw.external_id}",
        "external_id": raw.external_id,
        "city": raw.city,
        "neighborhood": raw.neighborhood,
        "property_type": raw.property_type,
        "title": raw.title,
        "currency": currency,
        "price_local": money(raw.price),
        "price_eur": money(price_eur),
        "area_sqm": money(area_sqm),
        "price_per_sqm_eur": money(price_eur / area_sqm),
        "annual_rent_eur": money(annual_rent_eur),
        "gross_yield_pct": money(gross_yield),
        "bedrooms": raw.bedrooms,
        "bathrooms": raw.bathrooms,
        "latitude": raw.latitude,
        "longitude": raw.longitude,
        "source_name": raw.source_name,
        "source_url": raw.source_url,
        "observed_at": datetime.now(UTC),
        "content_hash": sha256(fingerprint.encode()).hexdigest(),
    }

