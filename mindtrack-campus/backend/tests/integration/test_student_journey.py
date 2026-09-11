import pytest
import uuid
from sqlalchemy import text
from app.models.profile import Profile
from app.security.encryption import decrypt_text
from app.services.audit_log_repository import list_audit_logs, log_event
from app.services.consent_repository import sign_consent
from app.services.journal_repository import create_journal, to_response_dict as journal_dict
from app.services.mantra_wall_repository import create_post, list_visible_posts, moderate_post
from app.services.privacy_repository import get_deidentified_flag, update_privacy_settings
from app.services.wellness_checkin_repository import create_checkin

pytestmark = pytest.mark.integration


def _make_profile(db_session, role="student"):
    user_id = uuid.uuid4()
    db_session.execute(text("INSERT INTO auth.users (id) VALUES (:id)"), {"id": user_id})
    profile = Profile(id=user_id, role=role)
    db_session.add(profile)
    db_session.commit()
    db_session.refresh(profile)
    return profile


def test_full_student_journey_against_real_database(db_session):
    student = _make_profile(db_session, role="student")
    other_student = _make_profile(db_session, role="student")
    admin = _make_profile(db_session, role="admin")

    # 1. Consent
    sign_consent(db_session, student.id, version="1.0")

    # 2. Journal - verify REAL encryption at rest, not just that the
    # API round-trips it (this is the check that was previously only
    # ever done manually via Supabase Table Editor).
    journal = create_journal(db_session, student.id, "This is a private thought.")
    assert journal.content != "This is a private thought."  # stored ciphertext
    assert decrypt_text(journal.content) == "This is a private thought."
    log_event(db_session, "journal_created", "Journal entry created", actor_id=student.id)

    # 3. Mood check-in
    checkin = create_checkin(db_session, student.id, mood_score=4, note="Okay day.")
    assert checkin.note != "Okay day."  # also encrypted at rest

    # 4. Mantra Wall post - verify the real visibility rule against
    # actual SQL, not the naive fake session used everywhere else.
    post = create_post(db_session, student.id, "win", "Passed my thesis defense!", nickname=None)
    assert post.moderation_status == "pending"

    visible_to_other = list_visible_posts(db_session, other_student.id)
    assert post.id not in [p.id for p in visible_to_other], (
        "SECURITY: a pending post was visible to another student before admin approval"
    )

    moderate_post(db_session, post.id, admin.id, "approved")
    log_event(db_session, "mantra_wall_moderation", "Post approved", actor_id=admin.id)

    visible_to_other_after = list_visible_posts(db_session, other_student.id)
    assert post.id in [p.id for p in visible_to_other_after], (
        "Approved post did not become visible to another student"
    )

    # 5. Privacy settings + the deidentification enforcement hook (TD-013)
    update_privacy_settings(db_session, student.id, allow_activity_tracking=True, anonymize_activity=True)
    assert get_deidentified_flag(db_session, student.id) is True

    # 6. Audit trail actually reflects what happened
    logs = list_audit_logs(db_session, actor_id=student.id)
    event_types = {log.event_type for log in logs}
    assert "journal_created" in event_types
    for log in logs:
        assert "private thought" not in log.description, "Journal content leaked into an audit log"

    admin_logs = list_audit_logs(db_session, actor_id=admin.id)
    assert any(log.event_type == "mantra_wall_moderation" for log in admin_logs)