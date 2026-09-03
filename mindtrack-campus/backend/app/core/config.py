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
    DATABASE_URL: str = "postgresql+psycopg2://postgres.htcgjpvlnkknabhygprx:mindtrack-campus@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres"

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

        # --- Supabase Auth (used starting Phase 7) ---
    SUPABASE_URL: str = "https://htcgjpvlnkknabhygprx.supabase.co"
    SUPABASE_ANON_KEY: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0Y2dqcHZsbmtrbmFiaHlncHJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NDM5MTMsImV4cCI6MjEwMzQxOTkxM30.RDIXVQ3yezAwd7zTjVXmtsnlFIAcI34MWKpAV7MLsrY"

    CORS_ORIGINS: str = "http://localhost:5173"
    

    @property
    def cors_origins_list(self) -> list[str]:
        """Comma-separated string -> list, e.g. for multiple prod domains:
        CORS_ORIGINS=https://mindtrack.vercel.app,https://mindtrack-staging.vercel.app
        """
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    JOURNAL_ENCRYPTION_KEY: str = "YnmxnWIQif9bCSwYY1hJiv0B51teRfN9OcR-fXRsvQk="
    CURRENT_CONSENT_VERSION: str = "1.0"

@lru_cache
def get_settings() -> Settings:
    """Cached settings instance — .env is read once per process,
    not re-parsed on every request."""
    return Settings()