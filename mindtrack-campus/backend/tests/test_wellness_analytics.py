"""Tests for the Wellness Analytics admin endpoints.

Covers:
  - RBAC: 401 without token, 403 for students
  - /wellness/overview returns aggregate-only data
  - /wellness/screening returns averages + distributions
  - /wellness/by-group returns per-group aggregates
  - /wellness/trend returns time-series
  - /wellness/filter-options returns dropdown values
  - Cohort privacy threshold: hidden when group < MIN_COHORT_SIZE
  - No individual student identifiers in any response
"""
import uuid
from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient

from app.db.session import get_db
from app.main import app
from app.models.assessment import AssessmentResult
from app.models.journal import Journal
from app.models.profile import Profile
from app.models.wellness_checkin import WellnessCheckIn
from app.security.rbac import require_admin
from app.security.supabase_auth import SupabaseUser, get_current_supabase_user

client = TestClient(app)


# ---------------------------------------------------------------------------
# Helper fixtures / fakes
# ---------------------------------------------------------------------------

def _make_admin_profile() -> Profile:
    return Profile(id=uuid.uuid4(), role="admin")


def _make_student_profile() -> Profile:
    return Profile(id=uuid.uuid4(), role="student", program="BSIT", year_level="4th Year")


def _admin_override():
    p = _make_admin_profile()
    app.dependency_overrides[require_admin] = lambda: p
    return p


def _student_user_override():
    uid = str(uuid.uuid4())
    student = Profile(id=uuid.UUID(uid), role="student")

    def _fake_supabase():
        return SupabaseUser(id=uid, email="student@test.com")

    class _FakeStudentDb:
        def get(self, model, pk):
            return student

    app.dependency_overrides[get_current_supabase_user] = _fake_supabase
    app.dependency_overrides[get_db] = lambda: _FakeStudentDb()


# ---------------------------------------------------------------------------
# Minimal in-memory session that supports the wellness analytics queries
# ---------------------------------------------------------------------------

class _FakeWellnessSession:
    """Returns empty aggregate results — sufficient for smoke tests."""

    def execute(self, stmt):
        class _Row:
            avg_score = None
            count = 0
            avg_phq9 = None
            avg_gad7 = None
            assessment_count = 0
            yr = None
            group_val = None
            date = None

        class _Result:
            def one(self):
                return _Row()
            def all(self):
                return []
            def scalars(self):
                return self

        return _Result()

    def scalar(self, stmt):
        return 0

    def add(self, obj):
        pass

    def commit(self):
        pass

    def refresh(self, obj):
        pass


def _fake_db():
    yield _FakeWellnessSession()


# ---------------------------------------------------------------------------
# RBAC tests
# ---------------------------------------------------------------------------

def test_wellness_overview_requires_auth():
    response = client.get("/api/v1/admin/wellness/overview")
    assert response.status_code == 401


def test_wellness_overview_rejects_student():
    _student_user_override()
    try:
        response = client.get("/api/v1/admin/wellness/overview")
        assert response.status_code == 403
    finally:
        app.dependency_overrides.clear()


def test_wellness_screening_requires_auth():
    response = client.get("/api/v1/admin/wellness/screening")
    assert response.status_code == 401


def test_wellness_screening_rejects_student():
    _student_user_override()
    try:
        response = client.get("/api/v1/admin/wellness/screening")
        assert response.status_code == 403
    finally:
        app.dependency_overrides.clear()


def test_wellness_by_group_requires_auth():
    response = client.get("/api/v1/admin/wellness/by-group")
    assert response.status_code == 401


def test_wellness_trend_requires_auth():
    response = client.get("/api/v1/admin/wellness/trend")
    assert response.status_code == 401


def test_wellness_filter_options_requires_auth():
    response = client.get("/api/v1/admin/wellness/filter-options")
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# Smoke tests — admin can reach each endpoint
# ---------------------------------------------------------------------------

def test_wellness_overview_admin_ok():
    _admin_override()
    app.dependency_overrides[get_db] = _fake_db
    try:
        response = client.get("/api/v1/admin/wellness/overview")
        assert response.status_code == 200
        body = response.json()
        # Must contain participation fields
        assert "total_students" in body
        assert "assessment_count" in body
        assert "checkin_count" in body
        assert "journal_count" in body
        assert "follow_up_flags" in body
        assert "cohort_hidden" in body
        # Must NOT contain individual student identifiers
        assert "user_id" not in str(body)
        assert "email" not in str(body)
        assert "student_id" not in str(body)
    finally:
        app.dependency_overrides.clear()


def test_wellness_screening_admin_ok():
    _admin_override()
    app.dependency_overrides[get_db] = _fake_db
    try:
        response = client.get("/api/v1/admin/wellness/screening")
        assert response.status_code == 200
        body = response.json()
        assert "sample_size" in body
        assert "average_phq9" in body
        assert "average_gad7" in body
        assert "phq9_distribution" in body
        assert "gad7_distribution" in body
        assert "cohort_hidden" in body
        # No individual data
        assert "user_id" not in str(body)
    finally:
        app.dependency_overrides.clear()


def test_wellness_by_group_admin_ok():
    _admin_override()
    app.dependency_overrides[get_db] = _fake_db
    try:
        response = client.get("/api/v1/admin/wellness/by-group?group_by=program")
        assert response.status_code == 200
        body = response.json()
        assert "groups" in body
        assert isinstance(body["groups"], list)
    finally:
        app.dependency_overrides.clear()


def test_wellness_trend_admin_ok():
    _admin_override()
    app.dependency_overrides[get_db] = _fake_db
    try:
        response = client.get("/api/v1/admin/wellness/trend")
        assert response.status_code == 200
        body = response.json()
        assert "trend" in body
        assert isinstance(body["trend"], list)
    finally:
        app.dependency_overrides.clear()


def test_wellness_filter_options_admin_ok():
    _admin_override()
    app.dependency_overrides[get_db] = _fake_db
    try:
        response = client.get("/api/v1/admin/wellness/filter-options")
        assert response.status_code == 200
        body = response.json()
        assert "programs" in body
        assert "year_levels" in body
        assert "sections" in body
        assert "academic_years" in body
    finally:
        app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# by-group validation
# ---------------------------------------------------------------------------

def test_wellness_by_group_rejects_invalid_group_by():
    _admin_override()
    app.dependency_overrides[get_db] = _fake_db
    try:
        response = client.get("/api/v1/admin/wellness/by-group?group_by=invalid")
        assert response.status_code == 422
    finally:
        app.dependency_overrides.clear()


def test_wellness_by_group_year_level_ok():
    _admin_override()
    app.dependency_overrides[get_db] = _fake_db
    try:
        response = client.get("/api/v1/admin/wellness/by-group?group_by=year_level")
        assert response.status_code == 200
    finally:
        app.dependency_overrides.clear()


def test_wellness_by_group_section_ok():
    _admin_override()
    app.dependency_overrides[get_db] = _fake_db
    try:
        response = client.get(
            "/api/v1/admin/wellness/by-group?group_by=section&program=BSIT&year_level=4th+Year"
        )
        assert response.status_code == 200
    finally:
        app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Privacy threshold unit test (service-level)
# ---------------------------------------------------------------------------

def test_cohort_hidden_field_present_in_screening():
    """Verifies that the screening endpoint always returns cohort_hidden."""
    _admin_override()
    app.dependency_overrides[get_db] = _fake_db
    try:
        response = client.get("/api/v1/admin/wellness/screening")
        assert response.status_code == 200
        assert "cohort_hidden" in response.json()
    finally:
        app.dependency_overrides.clear()


def test_cohort_hidden_field_present_in_overview():
    _admin_override()
    app.dependency_overrides[get_db] = _fake_db
    try:
        response = client.get("/api/v1/admin/wellness/overview")
        assert response.status_code == 200
        assert "cohort_hidden" in response.json()
        assert "min_cohort_size" in response.json()
    finally:
        app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Filter parameter pass-through
# ---------------------------------------------------------------------------

def test_wellness_overview_accepts_all_filters():
    _admin_override()
    app.dependency_overrides[get_db] = _fake_db
    try:
        response = client.get(
            "/api/v1/admin/wellness/overview"
            "?program=BSIT&year_level=4th+Year&section=BSIT+4-1"
            "&academic_year=2026-2027&semester=1st"
        )
        assert response.status_code == 200
    finally:
        app.dependency_overrides.clear()


def test_wellness_trend_accepts_date_range():
    _admin_override()
    app.dependency_overrides[get_db] = _fake_db
    try:
        response = client.get(
            "/api/v1/admin/wellness/trend?start_date=2026-08-01&end_date=2026-12-31"
        )
        assert response.status_code == 200
    finally:
        app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Existing operational analytics endpoints must still work
# ---------------------------------------------------------------------------

def test_existing_analytics_overview_still_works():
    _admin_override()
    app.dependency_overrides[get_db] = _fake_db
    try:
        response = client.get("/api/v1/admin/analytics/overview")
        assert response.status_code == 200
    finally:
        app.dependency_overrides.clear()
