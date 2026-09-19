from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="MARKET_", extra="ignore")

    app_name: str = "Barcelona-Dubai Market Explorer API"
    environment: str = "development"
    database_url: str | None = None
    cors_origins: str = "http://localhost:3000,http://localhost:5173"
    default_aed_eur_rate: float = Field(default=0.25, gt=0)
    ingestion_source_url: str | None = None
    ingestion_user_agent: str = "MarketExplorerResearchBot/1.0 (+portfolio project)"

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()

