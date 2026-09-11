# Milestone 2 Review — Core Wellness System

**Milestone:** 2 — Core Wellness System  
**Phases:** 10–14  
**Status:** READY FOR NEXT MILESTONE, with a specific UAT caveat described below.

---

## 1. Completed Features

- **PHQ-9 Backend (Phase 10):** Instrument and severity bands verified against Kroenke et al. (2001); server-side-only scoring; item-9 self-harm escalation independent of total severity; full CRUD-style endpoints for questions, submit, history, and get-by-id.
- **GAD-7 Backend (Phase 11):** Instrument and severity bands verified against Spitzer et al. (2006); two-tier signal with further evaluation at `>=10` and escalation at `>=15`; generalized `assessment_repository` shared by both instruments.
- **Journal Backend (Phase 12):** Full CRUD, application-layer Fernet encryption verified against a real database row, no admin-facing routes, and genuine hard-delete on withdrawal.
- **NLP Backend (Phase 13):** VADER-based sentiment analysis, PII-pattern preprocessing, a dedicated `uncertain` state distinct from `neutral`, a short-text confidence gate, derived-metadata-only storage in `journal_analysis`, and failure isolation so NLP errors cannot block journal saves.
- **Wellness Prioritization (Phase 14):** Transparent rule-based engine with `LOW`, `MODERATE`, `ELEVATED`, and `INSUFFICIENT_DATA`; `contributing_factors` explainability; on-demand computation with no stale-cache risk; and explicit, unconditional draft/pending-validation labeling on every response.
- **Documentation infrastructure:** `docs/DECISIONS.md` contains ADR-001 through ADR-004; `docs/TECHNICAL_DEBT.md` contains TD-001 through TD-009, including the researched Tagalog/HF Inference Providers investigation; and consistent Basis and References documents exist for Phases 10–14.

The per-phase Basis and References documents are a particular strength of this milestone and should continue into Milestone 3.

## 2. Tested Features

- **63 automated tests passing:** 44 new tests in this milestone and 19 carried from Milestone 1, with zero regressions.
- Every severity-band boundary is explicitly tested for both instruments.
- PHQ-9 item-specific escalation and GAD-7 band-only escalation paths are tested.
- Cross-user ownership is tested as `404`, rather than `403`, across assessments and journals.
- Encryption is tested with a pure round trip and manually verified against the real Supabase row.
- NLP classification direction, the `uncertain` state, and the absence of original raw text in the result object are tested.
- Every branch of the wellness-priority rule ladder is covered individually.
- RBAC `401`/`403` gating is tested consistently across new route families.
- Manual real-Supabase verification was performed at each phase that touched live infrastructure.

## 3. Untested Features and Coverage Gaps

- No automated test exercises Supabase's real network calls anywhere. This is the carried limitation tracked in TD-006. Mocking remains correct for unit tests, but the integration gap is real.
- No automated test exercises the complete real database join chain behind `GET /wellness/priority` across PHQ-9, GAD-7, and `journal_analysis`. The pure-function logic is tested with hand-built `AssessmentSnapshot` objects, and one real-account check was performed manually. The SQL joins in `wellness_repository.py` therefore have real-world proof from one manual run, not an automated integration test.
- CORS rejection remains manual-only, as tracked in TD-005.
- No load or concurrency testing has been performed for the cross-table wellness query under realistic data volume.

## 4. Known Bugs

No bugs are currently open. The following issues were found and resolved during this milestone:

1. `validation_exception_handler`, a Phase 9 bug surfaced in Phase 12, failed to serialize custom Pydantic `field_validator` errors because Pydantic v2 embeds the raw `ValueError` in `ctx`. The handler was fixed with `jsonable_encoder`.
2. A dangling `@pytest.mark.parametrize` decorator and an out-of-range test value (`4`, invalid for a 0–3 scale) were found in `test_severity_band_boundaries` and corrected.
3. VADER classified the single word `okay` as moderately positive, with a compound score of approximately `0.226`, which defeated the intended short or weak text test. An explicit word-count gate was added independently of confidence magnitude.

## 5. Security Issues

No security issues are currently open. This milestone introduced nothing new beyond the Milestone 1 items already flagged as resolved or monitored:

- Rate-limit key scope remains correct.
- `service_role` key discipline remains correct.

## 6. Technical Debt

See `docs/TECHNICAL_DEBT.md`, TD-001 through TD-009. There are no net-new technical-debt entries from Phase 14. The Wellness Prioritization open questions are recorded as expert-validation dependencies rather than technical debt: they are disclosed, unvalidated design choices, not shortcuts hidden behind incomplete implementation.

TD-009, covering Tagalog and NLP support, remains the most substantial open item and has a documented, specific deferral rather than a vague future-work note.

## 7. Documentation Status

- `docs/DEVELOPMENT_LOG.md` is current through Day 14.
- `docs/DECISIONS.md` contains four ADRs and is in good shape.
- `docs/TECHNICAL_DEBT.md` is current and well maintained.
- Basis and References documents exist for Phases 10–14 and provide valuable traceability.
- The following Section 52 documentation has not yet been started: `API_ENDPOINTS.md`, `DATABASE_SCHEMA.md`, `SECURITY.md`, `PRIVACY.md`, `TESTING.md`, and `ARCHITECTURE.md`.

After adding four new tables, three new service modules, and more than 15 new endpoints, this documentation gap is now large enough to slow anyone, including the psychologist validator, who needs to understand the system without reading source code directly.

## 8. Research and Requirement Alignment

- Every clinically sourced element, including item wording, scoring, bands, and thresholds, is traceable to a cited source in its phase's Basis and References document. No invented clinical content has been introduced.
- Non-diagnostic terminology is enforced consistently: `severity_band` and `priority` are used, while `diagnosis` and `risk score` are avoided.
- No feature exceeds the MVP scope defined in the Development Plan or Frontend Guideline.
- Counselor-role exclusion and the OSS-admin-only architecture remain intact.
- The Journal feature has zero admin routes, providing strong enforcement of the panel's required revision.

## 9. Clinical and Expert Validation Dependencies

This is the most important section of the review. Four design choices, each individually flagged as not yet validated in its own phase, now sit underneath the single Wellness Priority a real student would see:

1. PHQ-9 item-9 and severe-band escalation logic from Phase 10.
2. GAD-7's two-tier signal at scores 10 and 15 from Phase 11.
3. NLP's `uncertain` confidence threshold of `0.15` and short-text gate of fewer than three words from Phase 13.
4. The Wellness Prioritization combination ladder itself from Phase 14, including the `0.5` negative-sentiment ratio threshold, five-entry trend window, and overall tiering logic.

Each item is a system design choice built on top of validated instruments or documented NLP behavior; none should be mistaken for part of the underlying instrument validation. The code correctly discloses this through `clinical_validation_status` on every response, but correct labeling is not equivalent to expert review.

A single consolidated session with the psychologist validator is recommended. The session should walk through the actual rule ladder in `backend/app/services/wellness_prioritization.py` and consider the four choices together, including trade-offs such as whether the sentiment threshold should be more or less sensitive than the GAD-7 threshold.

## 10. Recommended Improvements

1. Schedule the consolidated psychologist review and treat it as a soft gate on UAT exposure of these features, not on continued backend development.
2. Add ADR-005 for the computed-on-demand Wellness Priority design, documenting the freshness versus compute-cost trade-off.
3. Start `API_ENDPOINTS.md`, `DATABASE_SCHEMA.md`, `SECURITY.md`, and `PRIVACY.md` before Milestone 3 adds Freedom Wall and Admin surface area to the existing undocumented base.
4. Add one real integration test covering the full `wellness/priority` join chain against a test database.
5. Resolve the carried-over automated CORS test tracked in TD-005.

## 11. Milestone Status

**READY FOR NEXT MILESTONE** for continued backend development. Milestone 3 can proceed with Privacy and Consent, Resources, Freedom Wall, Notifications, and Audit Logs, which are largely non-clinical infrastructure and can be developed independently.

There is one explicit caveat, not a blanket blocker: the four unvalidated design choices in Section 9 should not be presented to real students during UAT until the consolidated psychologist review has occurred. This is a gate on UAT and demonstration, not on writing more code.
