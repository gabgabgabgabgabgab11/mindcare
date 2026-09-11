# Basis and References — Phase 17: Resources

## Source
Master Backend Prompt, Section 22 (RESOURCES) and Section 4 permission
matrix (Resources: Student=Read, Admin=CRUD).

## Design choice: no automated content generation
Status: enforced by construction, not just documented. resource_repository.py
has zero calls into app/nlp/ or any LLM. Every Resource row is admin-authored
via the admin CRUD routes only. This directly implements the master prompt's
explicit instruction: "Do not generate medical advice automatically."

## Design choice: inactive resources 404 for students, not just filtered
An inactive resource returns 404 on GET /api/v1/resources/{id} for a
student, identical to a resource that never existed - consistent with
the ownership-mismatch 404 pattern already used for journals/assessments
(no information leak about "this exists but is hidden").

## Not clinically adjacent
Unlike Phases 10-16, this phase does not touch any validated instrument,
NLP output, or wellness-priority signal - no psychologist validation
dependency is being introduced here.