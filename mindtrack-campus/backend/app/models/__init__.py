# Importing model modules here ensures they register themselves on
# Base.metadata. This module is imported by alembic/env.py so that
# `alembic revision --autogenerate` can see every table that exists.
from app.models.profile import Profile, auth_users  # noqa: F401
from app.models.assessment import AssessmentResponse, AssessmentResult  # noqa: F401
from app.models.journal import Journal  # noqa: F401
from app.models.journal_analysis import JournalAnalysis  # noqa: F401
from app.models.privacy import PrivacySettings  # noqa: F401
from app.models.consent import ConsentRecord  # noqa: F401
from app.models.wellness_checkin import WellnessCheckIn 
from app.models.resource import Resource