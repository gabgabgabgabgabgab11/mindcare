import uuid

from fastapi.testclient import TestClient

from app.db.session import get_db
from app.main import app
from app.models.profile import Profile
from app.security.rbac import require_student
from app.security.supabase_auth import SupabaseUser, get_current_supabase_user
from app.services.wellness_prioritization import (
    AssessmentSnapshot,
    WellnessPriority,
    compute_wellness_priority,
)

client = TestClient(app)


# ---------- Pure rule-engine logic ----------

def test_no_data_at_all_is_insufficient_data():
    result = compute_wellness_priority(None, None, [])
    assert result.priority == WellnessPriority.INSUFFICIENT_DATA


def test_phq9_escalation_forces_elevated_regardless_of_other_inputs():
    phq9 = AssessmentSnapshot(severity_band="minimal", escalated=True)
    result = compute_wellness_priority(phq9, None, [])
    assert result.priority == WellnessPriority.ELEVATED
    assert any("PHQ-9 escalation" in f for f in result.contributing_factors)


def test_gad7_escalation_forces_elevated():
    gad7 = AssessmentSnapshot(severity_band="severe", escalated=True)
    result = compute_wellness_priority(None, gad7, [])
    assert result.priority == WellnessPriority.ELEVATED


def test_severe_phq9_band_without_explicit_escalation_flag_is_still_elevated():
    # Defensive: even if `escalated` were ever computed incorrectly
    # upstream, severity band alone should still catch this case.
    phq9 = AssessmentSnapshot(severity_band="severe", escalated=False)
    result = compute_wellness_priority(phq9, None, [])
    assert result.priority == WellnessPriority.ELEVATED


def test_moderate_phq9_band_alone_is_moderate_not_elevated():
    phq9 = AssessmentSnapshot(severity_band="moderate", escalated=False)
    result = compute_wellness_priority(phq9, None, [])
    assert result.priority == WellnessPriority.MODERATE


def test_negative_sentiment_trend_alone_can_trigger_moderate():
    labels = ["negative", "negative", "negative", "positive", "neutral"]
    result = compute_wellness_priority(None, None, labels)
    assert result.priority == WellnessPriority.MODERATE
    assert any("trended negative" in f for f in result.contributing_factors)


def test_uncertain_labels_are_excluded_from_sentiment_ratio():
    # 2 of 2 USABLE (non-uncertain) entries are negative -> ratio 1.0,
    # should trigger MODERATE even though the list has 5 total entries.
    labels = ["negative", "uncertain", "uncertain", "negative", "uncertain"]
    result = compute_wellness_priority(None, None, labels)
    assert result.priority == WellnessPriority.MODERATE


def test_all_mild_with_positive_sentiment_is_low():
    phq9 = AssessmentSnapshot(severity_band="mild", escalated=False)
    gad7 = AssessmentSnapshot(severity_band="mild", escalated=False)
    labels = ["positive", "positive", "neutral"]
    result = compute_wellness_priority(phq9, gad7, labels)
    assert result.priority == WellnessPriority.LOW


def test_response_always_discloses_draft_validation_status():
    result = compute_wellness_priority(None, None, [])
    assert "pending" in result.clinical_validation_status.lower()
    assert "draft" in result.rule_version.lower()


# ---------- Endpoint auth gating ----------

def test_priority_without_token_returns_401():
    response = client.get("/api/v1/wellness/priority")
    assert response.status_code == 401


def test_priority_as_admin_returns_403():
    admin_id = str(uuid.uuid4())

    def override_user():
        return SupabaseUser(id=admin_id, email="admin@example.com")

    class _Session:
        def get(self, model, pk):
            return Profile(id=uuid.UUID(admin_id), role="admin")

    def override_db():
        yield _Session()

    app.dependency_overrides[get_current_supabase_user] = override_user
    app.dependency_overrides[get_db] = override_db
    try:
        response = client.get("/api/v1/wellness/priority")
        assert response.status_code == 403
    finally:
        app.dependency_overrides.clear()