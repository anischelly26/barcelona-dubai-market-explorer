from decimal import Decimal

import pytest

from backend.app.services.normalization import RawListing, normalize_listing


def test_normalizes_aed_sqft_to_eur_sqm():
    listing = RawListing(
        external_id="42", city="Dubai", neighborhood="Marina", property_type="Apartment",
        title="Marina apartment", price=Decimal("1200000"), currency="AED",
        area=Decimal("1000"), area_unit="sqft", monthly_rent=Decimal("7000"),
        latitude=25.08, longitude=55.14, source_name="Fixture Portal",
    )
    result = normalize_listing(listing, {"AED": Decimal("0.25"), "EUR": Decimal("1")})
    assert result["price_eur"] == 300000
    assert result["area_sqm"] == pytest.approx(92.9, abs=0.01)
    assert result["price_per_sqm_eur"] == pytest.approx(3229.17, abs=0.01)
    assert result["gross_yield_pct"] == 7.0


def test_rejects_unknown_units():
    listing = RawListing(
        external_id="1", city="Barcelona", neighborhood="Eixample", property_type="Apartment",
        title="Test", price=Decimal("100"), currency="EUR", area=Decimal("10"),
        area_unit="acres", monthly_rent=Decimal("1"), latitude=0, longitude=0,
        source_name="Fixture Portal",
    )
    with pytest.raises(ValueError, match="Unsupported area unit"):
        normalize_listing(listing, {"EUR": Decimal("1")})

