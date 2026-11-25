from uuid import uuid4

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from app.api.routes import profile as route
from app.models.profile import Profile


class Session:
    def __init__(self):
        self.commits = 0

    def commit(self):
        self.commits += 1

    def refresh(self, obj):
        pass


@pytest.fixture
def student(monkeypatch):
    monkeypatch.setattr(route, "log_event", lambda *args, **kwargs: None)
    return Profile(id=uuid4(), role="student", program="BSIT", year_level="1", section="A")


def test_year_level_can_be_saved_without_program_or_section(student):
    db = Session()
    result = route.update_profile(route.ProfileUpdateRequest(year_level=2), student, db)
    assert (result.program, result.year_level, result.section) == ("BSIT", "2", None)
    assert db.commits == 1


def test_year_level_can_be_saved_before_program_is_provided(student):
    student.program = None
    student.year_level = None
    student.section = None
    result = route.update_profile(route.ProfileUpdateRequest(year_level=1), student, Session())
    assert result.year_level == "1"
    assert result.program is None


def test_same_year_preserves_existing_section(student):
    result = route.update_profile(route.ProfileUpdateRequest(year_level=1), student, Session())
    assert result.section == "A"


def test_program_change_preserves_year_but_clears_old_section(student):
    result = route.update_profile(route.ProfileUpdateRequest(program="BSHM"), student, Session())
    assert (result.program, result.year_level, result.section) == ("BSHM", "1", None)


@pytest.mark.parametrize("year", [0, 5, -1])
def test_out_of_range_year_is_rejected(year):
    with pytest.raises(ValidationError):
        route.ProfileUpdateRequest(year_level=year)


def test_invalid_section_is_rejected_without_saving(student):
    db = Session()
    with pytest.raises(HTTPException) as error:
        route.update_profile(route.ProfileUpdateRequest(year_level=2, section="Z"), student, db)
    assert error.value.status_code == 422
    assert student.year_level == "1"
    assert db.commits == 0


def test_full_valid_academic_update_still_works(student):
    result = route.update_profile(route.ProfileUpdateRequest(program="BSIT", year_level=2, section="B"), student, Session())
    assert (result.program, result.year_level, result.section) == ("BSIT", "2", "B")
