# MindTrack Campus File Structure

This document describes the project-owned file structure of MindTrack Campus.

Generated and environment-specific directories such as `backend/.venv/`, `backend/venv/`, `backend/null/`, `backend/.pytest_cache/`, and Python `__pycache__/` directories are omitted.

```text
mindtrack-campus/
├── backend/
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   ├── alembic.ini
│   ├── README.md
│   ├── requirements.txt
│   ├── alembic/
│   │   ├── README
│   │   ├── env.py
│   │   ├── script.py.mako
│   │   └── versions/
│   │       ├── 27333b47266e_add_profiles_table.py
│   │       ├── 429fc9474422_add_privacy_settings_and_consent_.py
│   │       ├── 4a6c332df6ae_baseline_no_models_yet.py
│   │       ├── 7cb29e8907ea_add_journals_table.py
│   │       ├── af592a3efdcf_add_assessment_responses_and_assessment_.py
│   │       └── c19d77b5f804_add_journal_analysis_table.py
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── routes/
│   │   │       ├── __init__.py
│   │   │       ├── assessments.py
│   │   │       ├── auth.py
│   │   │       ├── consent.py
│   │   │       ├── gad7.py
│   │   │       ├── health.py
│   │   │       ├── journals.py
│   │   │       ├── privacy.py
│   │   │       └── wellness.py
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   └── config.py
│   │   ├── db/
│   │   │   ├── __init__.py
│   │   │   └── session.py
│   │   ├── middleware/
│   │   │   ├── __init__.py
│   │   │   ├── error_handlers.py
│   │   │   └── rate_limit.py
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── assessment.py
│   │   │   ├── consent.py
│   │   │   ├── journal.py
│   │   │   ├── journal_analysis.py
│   │   │   ├── privacy.py
│   │   │   └── profile.py
│   │   ├── nlp/
│   │   │   ├── __init__.py
│   │   │   ├── analyzer.py
│   │   │   ├── preprocessing.py
│   │   │   ├── schemas.py
│   │   │   └── service.py
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── assessment.py
│   │   │   ├── auth.py
│   │   │   ├── consent.py
│   │   │   ├── journal.py
│   │   │   ├── privacy.py
│   │   │   └── wellness.py
│   │   ├── security/
│   │   │   ├── __init__.py
│   │   │   ├── consent_gate.py
│   │   │   ├── encryption.py
│   │   │   ├── rbac.py
│   │   │   └── supabase_auth.py
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── assessment_repository.py
│   │   │   ├── consent_repository.py
│   │   │   ├── gad7_service.py
│   │   │   ├── journal_repository.py
│   │   │   ├── phq9_service.py
│   │   │   ├── privacy_repository.py
│   │   │   ├── profile_service.py
│   │   │   ├── qualitative_feedback.py
│   │   │   ├── wellness_prioritization.py
│   │   │   └── wellness_repository.py
│   │   └── utils/
│   │       └── __init__.py
│   └── tests/
│       ├── __init__.py
│       ├── test_auth.py
│       ├── test_config.py
│       ├── test_consent.py
│       ├── test_error_handling.py
│       ├── test_gad7.py
│       ├── test_health.py
│       ├── test_journals.py
│       ├── test_models.py
│       ├── test_nlp.py
│       ├── test_phq9.py
│       ├── test_privacy.py
│       ├── test_qualitative_feedback.py
│       ├── test_rate_limiting.py
│       ├── test_rbac.py
│       └── test_wellness.py
├── docs/
│   ├── BASIS_AND_REFERENCES_PHASE_10.md
│   ├── BASIS_AND_REFERENCES_PHASE_11.md
│   ├── BASIS_AND_REFERENCES_PHASE_12.md
│   ├── BASIS_AND_REFERENCES_PHASE_13.md
│   ├── BASIS_AND_REFERENCES_PHASE_14.md
│   ├── BASIS_AND_REFERENCES_PHASE_15.md
│   ├── DECISIONS.md
│   ├── DEVELOPMENT_LOG.md
│   ├── MILESTONE_2_REVIEW.md
│   └── TECHNICAL_DEBT.md
└── S/
```

## Directory Overview

- `backend/app/`: FastAPI application code.
- `backend/app/api/routes/`: HTTP API route handlers.
- `backend/app/models/`: SQLAlchemy database models.
- `backend/app/schemas/`: Request and response schemas.
- `backend/app/services/`: Business logic and repository services.
- `backend/app/security/`: Authentication, authorization, consent, and encryption.
- `backend/app/nlp/`: Journal analysis and natural-language processing.
- `backend/alembic/`: Database migration configuration and revisions.
- `backend/tests/`: Automated backend tests.
- `docs/`: Project decisions, development records, references, and technical debt notes.