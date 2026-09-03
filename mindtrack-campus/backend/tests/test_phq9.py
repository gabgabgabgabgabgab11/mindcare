import uuid

import pytest
from fastapi.testclient import TestClient

from app.db.session import get_db
from app.main import app
from app.models.profile import Profile
from app.security.supabase_auth import SupabaseUser, get_current_supabase_user
from app.services.phq9_service import (
    InvalidPhq9ResponsesError,
    Phq9Severity,
    score_phq9,
)

client = TestClient(app)


# ---------- Pure scoring logic (no DB, no HTTP) ----------

def test_minimum_score_is_minimal_severity():
    result = score_phq9([0] * 9)
    assert result.total_score == 0
    assert result.severity == Phq9Severity.MINIMAL
    assert result.escalated is False


def test_maximum_score_is_severe_and_escalated():
    result = score_phq9([3] * 9)
    assert result.total_score == 27
    assert result.severity == Phq9Severity.SEVERE
    assert result.escalated is True



def test_severity_band_boundaries():
    # 4 -> minimal, 5 -> mild, 9 -> mild, 10 -> moderate, 14 -> moderate,
    # 15 -> moderately_severe, 19 -> moderately_severe, 20 -> severe

    assert score_phq9(
        [0, 0, 0, 0, 3, 1, 0, 0, 0]
    ).severity == Phq9Severity.MINIMAL  # total 4

    assert score_phq9(
        [1, 0, 0, 0, 3, 1, 0, 0, 0]
    ).severity == Phq9Severity.MILD  # total 5

    assert score_phq9(
        [3, 3, 3, 0, 0, 0, 0, 0, 0]
    ).severity == Phq9Severity.MILD  # total 9

    assert score_phq9(
        [3, 3, 3, 1, 0, 0, 0, 0, 0]
    ).severity == Phq9Severity.MODERATE  # total 10

    assert score_phq9(
        [3, 3, 3, 3, 2, 0, 0, 0, 0]
    ).severity == Phq9Severity.MODERATE  # total 14

    assert score_phq9(
        [3, 3, 3, 3, 3, 0, 0, 0, 0]
    ).severity == Phq9Severity.MODERATELY_SEVERE  # total 15

    assert score_phq9(
        [3, 3, 3, 3, 3, 3, 1, 0, 0]
    ).severity == Phq9Severity.MODERATELY_SEVERE  # total 19

    assert score_phq9(
        [3, 3, 3, 3, 3, 3, 2, 0, 0]
    ).severity == Phq9Severity.SEVERE  # total 20


def test_item_nine_nonzero_escalates_even_at_low_total():
    # Total score is very low (minimal band) but item 9 (index 8) is
    # nonzero -> must still escalate. This is the case that matters most.
    responses = [0, 0, 0, 0, 0, 0, 0, 0, 1]
    result = score_phq9(responses)
    assert result.severity == Phq9Severity.MINIMAL
    assert result.escalated is True


def test_wrong_number_of_responses_raises():
    with pytest.raises(InvalidPhq9ResponsesError):
        score_phq9([0] * 8)


def test_out_of_range_response_raises():
    with pytest.raises(InvalidPhq9ResponsesError):
        score_phq9([0, 0, 0, 0, 0, 0, 0, 0, 4])  # 4 is not a valid response


# ---------- Endpoint auth/role gating ----------

def test_submit_without_token_returns_401():
    response = client.post("/api/v1/assessments/phq9", json={"responses": [0] * 9})
    assert response.status_code == 401


def test_submit_as_admin_returns_403():
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
        response = client.post("/api/v1/assessments/phq9", json={"responses": [0] * 9})
        assert response.status_code == 403
    finally:
        app.dependency_overrides.clear()


def test_submit_response_never_contains_total_score():
    student_id = str(uuid.uuid4())

    def override_user():
        return SupabaseUser(id=student_id, email="student@example.com")

    class _Session:
        def get(self, model, pk):
            return Profile(id=uuid.UUID(student_id), role="student")

        def add(self, obj):
            pass

        def flush(self):
            pass

        def commit(self):
            pass

        def refresh(self, obj):
            import uuid as _uuid
            from datetime import datetime, timezone

            if getattr(obj, "id", None) is None:
                obj.id = _uuid.uuid4()
            if getattr(obj, "created_at", None) is None:
                obj.created_at = datetime.now(timezone.utc)

    def override_db():
        yield _Session()

    app.dependency_overrides[get_current_supabase_user] = override_user
    app.dependency_overrides[get_db] = override_db
    try:
        response = client.post(
            "/api/v1/assessments/phq9",
            json={"responses": [1, 1, 0, 2, 0, 0, 0, 0, 0]},
        )
        body = response.json()
        assert "total_score" not in body
        assert "qualitative_feedback" in body
        assert len(body["qualitative_feedback"]) > 0
    finally:
        app.dependency_overrides.clear()


def test_submit_with_wrong_response_count_returns_422():
    student_id = str(uuid.uuid4())

    def override_user():
        return SupabaseUser(id=student_id, email="student@example.com")

    class _Session:
        def get(self, model, pk):
            return Profile(id=uuid.UUID(student_id), role="student")

    def override_db():
        yield _Session()

    app.dependency_overrides[get_current_supabase_user] = override_user
    app.dependency_overrides[get_db] = override_db
    try:
        response = client.post("/api/v1/assessments/phq9", json={"responses": [0] * 5})
        assert response.status_code == 422
    finally:
        app.dependency_overrides.clear()


def test_get_result_cross_user_returns_404_not_403():
    from app.models.assessment import AssessmentResult

    owner_id = uuid.uuid4()
    requester_id = uuid.uuid4()
    result_id = uuid.uuid4()

    existing_result = AssessmentResult(
        id=result_id,
        response_id=uuid.uuid4(),
        user_id=owner_id,
        assessment_code="phq9",
        total_score=10,
        severity_band="moderate",
        escalated=False,
    )

    def override_user():
        return SupabaseUser(id=str(requester_id), email="other-student@example.com")

    class _Session:
        def get(self, model, pk):
            if model.__name__ == "Profile":
                return Profile(id=requester_id, role="student")
            if model.__name__ == "AssessmentResult" and pk == result_id:
                return existing_result
            return None

    def override_db():
        yield _Session()

    app.dependency_overrides[get_current_supabase_user] = override_user
    app.dependency_overrides[get_db] = override_db
    try:
        response = client.get(f"/api/v1/assessments/phq9/{result_id}")
        assert response.status_code == 404  # not 403 — see Step 1 explanation
    finally:
        app.dependency_overrides.clear()