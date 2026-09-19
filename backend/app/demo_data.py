from datetime import UTC, datetime

from backend.app.schemas import PropertyOut


NOW = datetime(2026, 9, 1, tzinfo=UTC)


def item(
    id: str,
    city: str,
    neighborhood: str,
    kind: str,
    price_local: float,
    currency: str,
    price_eur: float,
    area_sqm: float,
    annual_rent_eur: float,
    latitude: float,
    longitude: float,
    bedrooms: int,
) -> PropertyOut:
    return PropertyOut(
        id=id,
        city=city,
        neighborhood=neighborhood,
        property_type=kind,
        title=f"{kind} signal in {neighborhood}",
        currency=currency,
        price_local=price_local,
        price_eur=price_eur,
        area_sqm=area_sqm,
        price_per_sqm_eur=round(price_eur / area_sqm, 2),
        annual_rent_eur=annual_rent_eur,
        gross_yield_pct=round(annual_rent_eur / price_eur * 100, 2),
        bedrooms=bedrooms,
        bathrooms=1 if kind == "Apartment" else 2.5,
        latitude=latitude,
        longitude=longitude,
        source_name="Curated demo dataset",
        source_url=None,
        observed_at=NOW,
    )


DEMO_PROPERTIES = [
    item("bcn-eixample", "Barcelona", "Eixample", "Apartment", 495000, "EUR", 495000, 82, 20400, 41.3902, 2.1639, 3),
    item("bcn-gracia", "Barcelona", "Gracia", "Apartment", 420000, "EUR", 420000, 70, 18060, 41.4036, 2.1568, 2),
    item("bcn-poblenou", "Barcelona", "Poblenou", "Apartment", 540000, "EUR", 540000, 88, 21600, 41.4035, 2.2044, 3),
    item("bcn-sarria", "Barcelona", "Sarria", "Villa", 780000, "EUR", 780000, 112, 27300, 41.3997, 2.1164, 4),
    item("bcn-sant-antoni", "Barcelona", "Sant Antoni", "Apartment", 385000, "EUR", 385000, 66, 17710, 41.3785, 2.1626, 2),
    item("bcn-sants", "Barcelona", "Sants", "Apartment", 330000, "EUR", 330000, 72, 15840, 41.3750, 2.1339, 2),
    item("dub-marina", "Dubai", "Dubai Marina", "Apartment", 1420000, "AED", 355000, 92, 22010, 25.0805, 55.1403, 2),
    item("dub-downtown", "Dubai", "Downtown", "Apartment", 1880000, "AED", 470000, 85, 26790, 25.1972, 55.2744, 2),
    item("dub-jvc", "Dubai", "JVC", "Apartment", 820000, "AED", 205000, 74, 14555, 25.0563, 55.2094, 1),
    item("dub-business-bay", "Dubai", "Business Bay", "Apartment", 1260000, "AED", 315000, 78, 20475, 25.1850, 55.2644, 2),
    item("dub-palm", "Dubai", "Palm Jumeirah", "Villa", 7400000, "AED", 1850000, 320, 79550, 25.1124, 55.1390, 5),
    item("dub-hills", "Dubai", "Dubai Hills", "Villa", 3920000, "AED", 980000, 260, 49980, 25.1130, 55.2477, 4),
]

