import uuid

from sqlalchemy.orm import Session

from app.models.privacy import PrivacySettings


def get_or_create_privacy_settings(db: Session, user_id: uuid.UUID) -> PrivacySettings:
    settings = db.get(PrivacySettings, user_id)
    if settings is None:
        settings = PrivacySettings(user_id=user_id)  # defaults: tracking on, anonymize on
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


def update_privacy_settings(
    db: Session,
    user_id: uuid.UUID,
    allow_activity_tracking: bool,
    anonymize_activity: bool,
    journal_insights_enabled: bool | None = None,
) -> PrivacySettings:
    settings = get_or_create_privacy_settings(db, user_id)
    settings.allow_activity_tracking = allow_activity_tracking
    settings.anonymize_activity = anonymize_activity
    if journal_insights_enabled is not None:
        settings.journal_insights_enabled = journal_insights_enabled
    db.commit()
    db.refresh(settings)
    return settings


def get_deidentified_flag(db: Session, user_id: uuid.UUID) -> bool:
    """The enforcement hook for every future aggregate/admin query.
    Any endpoint that surfaces cross-student aggregate data MUST call
    this (or a bulk equivalent) and exclude/de-identify accordingly —
    this must never be left to the frontend to respect."""
    settings = db.get(PrivacySettings, user_id)
    return settings.anonymize_activity if settings else True


def are_journal_insights_enabled(db: Session, user_id: uuid.UUID) -> bool:
    settings = db.get(PrivacySettings, user_id)
    return settings.journal_insights_enabled if settings else False
