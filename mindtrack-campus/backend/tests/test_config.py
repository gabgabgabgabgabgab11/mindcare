import os

from app.core.config import Settings, get_settings

# Dummy values for fields that no longer have defaults (by design - see
# config.py). These tests only care about ENVIRONMENT behavior, so any
# syntactically-valid placeholder is fine here.
_REQUIRED_TEST_ENV = {
    "DATABASE_URL": "postgresql+psycopg2://test:test@localhost:5432/test",
    "SUPABASE_URL": "https://test.supabase.co",
    "SUPABASE_ANON_KEY": "test-anon-key",
    "JOURNAL_ENCRYPTION_KEY": "test-encryption-key",
}


def test_default_environment_is_development():
    settings = Settings(_env_file=None, **_REQUIRED_TEST_ENV)
    assert settings.ENVIRONMENT == "development"
    assert settings.is_production is False


def test_environment_can_be_overridden(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "production")
    settings = Settings(_env_file=None, **_REQUIRED_TEST_ENV)
    assert settings.ENVIRONMENT == "production"
    assert settings.is_production is True


def test_get_settings_is_cached():
    assert get_settings() is get_settings()