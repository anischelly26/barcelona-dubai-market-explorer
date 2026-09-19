from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Query, Request
from fastapi.middleware.cors import CORSMiddleware

from backend.app.config import Settings, get_settings
from backend.app.repositories import MemoryRepository, PostgresRepository
from backend.app.schemas import (
    MarketSummary,
    NearbyQueryResult,
    PropertyListResponse,
    RoiRequest,
    RoiResponse,
    TrendPoint,
)
from backend.app.services.roi import calculate_roi


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    app.state.repository = (
        PostgresRepository(settings.database_url)
        if settings.database_url
        else MemoryRepository()
    )
    yield
    engine = getattr(app.state.repository, "engine", None)
    if engine:
        await engine.dispose()


app = FastAPI(
    title="Barcelona-Dubai Market Explorer API",
    version="1.0.0",
    description="Normalized property data, geospatial search, comparative analytics and ROI calculations.",
    lifespan=lifespan,
)
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


def repository(request: Request):
    return request.app.state.repository


@app.get("/health", tags=["operations"])
async def health(request: Request):
    return {"status": "ok", "data_mode": request.app.state.repository.data_mode}


@app.get("/v1/properties", response_model=PropertyListResponse, tags=["properties"])
async def properties(
    request: Request,
    city: str | None = Query(default=None, pattern="^(Barcelona|Dubai)$"),
    property_type: str | None = Query(default=None, pattern="^(Apartment|Villa|Townhouse|Studio)$"),
    max_price_eur: float | None = Query(default=None, gt=0),
    limit: int = Query(default=100, ge=1, le=500),
    repo=Depends(repository),
):
    items = await repo.list_properties(city, property_type, max_price_eur, limit)
    return PropertyListResponse(items=items, total=len(items), data_mode=repo.data_mode)


@app.get("/v1/analytics/summary", response_model=list[MarketSummary], tags=["analytics"])
async def summaries(repo=Depends(repository)):
    return await repo.summaries()


@app.get("/v1/analytics/trends", response_model=list[TrendPoint], tags=["analytics"])
async def trends(months: int = Query(default=12, ge=3, le=60), repo=Depends(repository)):
    return await repo.trends(months)


@app.post("/v1/analytics/roi", response_model=RoiResponse, tags=["analytics"])
async def roi(payload: RoiRequest):
    return calculate_roi(payload)


@app.get("/v1/properties/nearby", response_model=list[NearbyQueryResult], tags=["geospatial"])
async def nearby(
    latitude: float = Query(ge=-90, le=90),
    longitude: float = Query(ge=-180, le=180),
    radius_m: int = Query(default=5000, ge=100, le=100_000),
    limit: int = Query(default=25, ge=1, le=100),
    repo=Depends(repository),
):
    rows = await repo.nearby(latitude, longitude, radius_m, limit)
    return [NearbyQueryResult(property=item, distance_m=distance) for item, distance in rows]

