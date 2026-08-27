import os

from app.core.config import Settings, get_settings


def test_default_environment_is_development():
    settings = Settings(_env_file=None)  # ignore local .env, test defaults only
    assert settings.ENVIRONMENT == "development"
    assert settings.is_production is False


def test_environment_can_be_overridden(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "production")
    settings = Settings(_env_file=None)
    assert settings.ENVIRONMENT == "production"
    assert settings.is_production is True


def test_get_settings_is_cached():
    # get_settings() uses lru_cache — calling it twice must return
    # the exact same object, not just an equal one.
    assert get_settings() is get_settings()