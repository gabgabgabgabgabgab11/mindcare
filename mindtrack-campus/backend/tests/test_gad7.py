import uuid

import pytest
from fastapi.testclient import TestClient

from app.db.session import get_db
from app.main import app
from app.models.profile import Profile
from app.security.consent_gate import require_consent
from app.security.supabase_auth import (
    SupabaseUser,
    get_current_supabase_user,
)
from app.services.gad7_service import (
    Gad7Severity,
    InvalidGad7ResponsesError,
    score_gad7,
)

client = TestClient(app)


# ============================================================
# PURE SCORING LOGIC
# ============================================================

def test_minimum_score_is_minimal_severity():
    result = score_gad7([0] * 7)

    assert result.total_score == 0
    assert result.severity == Gad7Severity.MINIMAL
    assert result.escalated is False
    assert result.recommend_further_evaluation is False


def test_maximum_score_is_severe_and_escalated():
    result = score_gad7([3] * 7)

    assert result.total_score == 21
    assert result.severity == Gad7Severity.SEVERE
    assert result.escalated is True


def test_severity_band_boundaries():
    assert score_gad7(
        [1, 1, 1, 1, 0, 0, 0]
    ).severity == Gad7Severity.MINIMAL

    assert score_gad7(
        [1, 1, 1, 1, 1, 0, 0]
    ).severity == Gad7Severity.MILD

    assert score_gad7(
        [2, 2, 2, 2, 1, 0, 0]
    ).severity == Gad7Severity.MILD

    assert score_gad7(
        [2, 2, 2, 2, 1, 1, 0]
    ).severity == Gad7Severity.MODERATE

    assert score_gad7(
        [2, 2, 2, 2, 2, 2, 2]
    ).severity == Gad7Severity.MODERATE

    assert score_gad7(
        [3, 2, 2, 2, 2, 2, 2]
    ).severity == Gad7Severity.SEVERE


def test_further_evaluation_threshold_is_ten():
    just_below = score_gad7(
        [1, 1, 1, 1, 1, 1, 3]
    )

    just_at = score_gad7(
        [2, 2, 2, 2, 1, 0, 1]
    )

    assert just_below.recommend_further_evaluation is False
    assert just_at.recommend_further_evaluation is True


def test_wrong_number_of_responses_raises():
    with pytest.raises(InvalidGad7ResponsesError):
        score_gad7([0] * 6)


def test_out_of_range_response_raises():
    with pytest.raises(InvalidGad7ResponsesError):
        score_gad7([0, 0, 0, 0, 0, 0, 5])


# ============================================================
# AUTHENTICATION
# ============================================================

def test_submit_without_token_returns_401():
    response = client.post(
        "/api/v1/assessments/gad7",
        json={"responses": [0] * 7},
    )

    assert response.status_code == 401


# ============================================================
# ROLE GATING
# ============================================================

def test_submit_as_admin_returns_403():
    admin_id = str(uuid.uuid4())

    def override_user():
        return SupabaseUser(
            id=admin_id,
            email="admin@example.com",
        )

    class _Session:
        def get(self, model, pk):
            return Profile(
                id=uuid.UUID(admin_id),
                role="admin",
            )

    def override_db():
        yield _Session()

    app.dependency_overrides[
        get_current_supabase_user
    ] = override_user

    app.dependency_overrides[
        get_db
    ] = override_db

    try:
        response = client.post(
            "/api/v1/assessments/gad7",
            json={"responses": [0] * 7},
        )

        assert response.status_code == 403

    finally:
        app.dependency_overrides.clear()


# ============================================================
# STUDENT SUBMISSION
# ============================================================

def test_submit_response_never_contains_total_score():
    student_id = str(uuid.uuid4())

    def override_user():
        return SupabaseUser(
            id=student_id,
            email="student@example.com",
        )

    class _Session:
        def get(self, model, pk):
            return Profile(
                id=uuid.UUID(student_id),
                role="student",
            )

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

    app.dependency_overrides[
        get_current_supabase_user
    ] = override_user

    app.dependency_overrides[
        get_db
    ] = override_db

    app.dependency_overrides[
        require_consent
    ] = lambda: Profile(
        id=uuid.UUID(student_id),
        role="student",
    )

    try:
        response = client.post(
            "/api/v1/assessments/gad7",
            json={
                "responses": [1, 1, 0, 2, 0, 0, 0]
            },
        )

        body = response.json()

        assert "total_score" not in body
        assert "qualitative_feedback" in body
        assert len(body["qualitative_feedback"]) > 0

    finally:
        app.dependency_overrides.clear()


# ============================================================
# VALIDATION
# ============================================================

def test_submit_with_wrong_response_count_returns_422():
    student_id = str(uuid.uuid4())

    def override_user():
        return SupabaseUser(
            id=student_id,
            email="student@example.com",
        )

    class _Session:
        def get(self, model, pk):
            return Profile(
                id=uuid.UUID(student_id),
                role="student",
            )

    def override_db():
        yield _Session()

    app.dependency_overrides[
        get_current_supabase_user
    ] = override_user

    app.dependency_overrides[
        get_db
    ] = override_db

    app.dependency_overrides[
        require_consent
    ] = lambda: Profile(
        id=uuid.UUID(student_id),
        role="student",
    )

    try:
        response = client.post(
            "/api/v1/assessments/gad7",
            json={"responses": [0] * 3},
        )

        assert response.status_code == 422

    finally:
        app.dependency_overrides.clear()


# ============================================================
# CROSS-USER ACCESS CONTROL
# ============================================================

def test_get_result_cross_user_returns_404_not_403():
    from app.models.assessment import AssessmentResult

    owner_id = uuid.uuid4()
    requester_id = uuid.uuid4()
    result_id = uuid.uuid4()

    existing_result = AssessmentResult(
        id=result_id,
        response_id=uuid.uuid4(),
        user_id=owner_id,
        assessment_code="gad7",
        total_score=8,
        severity_band="mild",
        escalated=False,
    )

    def override_user():
        return SupabaseUser(
            id=str(requester_id),
            email="other-student@example.com",
        )

    class _Session:
        def get(self, model, pk):
            if model.__name__ == "Profile":
                return Profile(
                    id=requester_id,
                    role="student",
                )

            if (
                model.__name__ == "AssessmentResult"
                and pk == result_id
            ):
                return existing_result

            return None

    def override_db():
        yield _Session()

    app.dependency_overrides[
        get_current_supabase_user
    ] = override_user

    app.dependency_overrides[
        get_db
    ] = override_db

    app.dependency_overrides[
        require_consent
    ] = lambda: Profile(
        id=requester_id,
        role="student",
    )

    try:
        response = client.get(
            f"/api/v1/assessments/gad7/{result_id}"
        )

        assert response.status_code == 404

    finally:
        app.dependency_overrides.clear()


# ============================================================
# CONSENT GATING
# ============================================================

def test_submit_gad7_without_consent_returns_403():
    student_id = str(uuid.uuid4())

    class _NoConsentSession:
        def get(self, model, pk):
            return Profile(
                id=uuid.UUID(student_id),
                role="student",
            )

        def execute(self, stmt):
            class _Result:
                def scalars(self):
                    return self

                def first(self):
                    return None

            return _Result()

    def override_user():
        return SupabaseUser(
            id=student_id,
            email="student@example.com",
        )

    app.dependency_overrides[
        get_current_supabase_user
    ] = override_user

    app.dependency_overrides[
        get_db
    ] = lambda: _NoConsentSession()

    # IMPORTANT:
    # Do NOT override require_consent here.
    # This test needs the real consent gate to reject the user.

    try:
        response = client.post(
            "/api/v1/assessments/gad7",
            json={"responses": [0] * 7},
        )

        assert response.status_code == 403

    finally:
        app.dependency_overrides.clear()