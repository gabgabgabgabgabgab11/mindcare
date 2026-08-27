from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Centralized, typed application configuration.

    Values are read from environment variables (populated from .env in
    local development). Nothing here should ever contain a hardcoded
    secret — real values live only in .env, which is git-ignored.
    """

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # --- App metadata ---
    APP_NAME: str = "MindTrack Campus API"
    APP_VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"  # development | staging | production

    # --- Database (used starting Phase 4 — defined now so it's ready) ---
    DATABASE_URL: str = ""

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance — .env is read once per process,
    not re-parsed on every request."""
    return Settings()