import uuid

from sqlalchemy.orm import Session

from app.models.profile import Profile


def get_or_create_profile(db: Session, user_id: str) -> Profile:
    """Fetches the profile for a Supabase user id, creating a default
    student profile on first login if none exists yet.

    Known simplification (docs/TECHNICAL_DEBT.md TD-002): profile
    provisioning happens here in application code rather than via a
    Postgres trigger on auth.users. Acceptable for capstone scope.
    """
    profile = db.get(Profile, uuid.UUID(user_id))
    if profile is None:
        profile = Profile(id=uuid.UUID(user_id), role="student")
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile