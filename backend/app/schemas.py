from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl


City = Literal["Barcelona", "Dubai"]
PropertyType = Literal["Apartment", "Villa", "Townhouse", "Studio"]


class PropertyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    city: City
    neighborhood: str
    property_type: PropertyType
    title: str
    currency: Literal["EUR", "AED"]
    price_local: float = Field(gt=0)
    price_eur: float = Field(gt=0)
    area_sqm: float = Field(gt=0)
    price_per_sqm_eur: float = Field(gt=0)
    annual_rent_eur: float = Field(ge=0)
    gross_yield_pct: float = Field(ge=0)
    bedrooms: int | None = Field(default=None, ge=0)
    bathrooms: float | None = Field(default=None, ge=0)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    source_name: str
    source_url: HttpUrl | None = None
    observed_at: datetime


class PropertyListResponse(BaseModel):
    items: list[PropertyOut]
    total: int
    data_mode: Literal["database", "demo"]


class MarketSummary(BaseModel):
    city: City
    listings: int
    median_price_eur: float
    median_price_per_sqm_eur: float
    average_gross_yield_pct: float


class TrendPoint(BaseModel):
    month: date
    Barcelona: float | None = None
    Dubai: float | None = None


class RoiRequest(BaseModel):
    purchase_price_eur: float = Field(gt=0)
    monthly_rent_eur: float = Field(ge=0)
    annual_costs_eur: float = Field(default=0, ge=0)
    vacancy_rate_pct: float = Field(default=5, ge=0, le=100)
    acquisition_costs_pct: float = Field(default=10, ge=0, le=100)


class RoiResponse(BaseModel):
    gross_yield_pct: float
    net_yield_pct: float
    annual_gross_income_eur: float
    annual_net_income_eur: float
    total_cash_required_eur: float
    payback_years: float | None


class NearbyQueryResult(BaseModel):
    property: PropertyOut
    distance_m: float

