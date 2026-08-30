# Basis and References — Phase 10: PHQ-9 Backend

**Milestone:** 2 — Core Wellness System
**Phase:** 10 — PHQ-9 Backend
**Purpose of this document:** For every implementation decision made in this phase that touches clinical content, scoring logic, or legal/ethical handling of sensitive data, this file records the specific source that justifies it — so nothing in the code can be challenged as invented or arbitrary during defense or expert review.

---

## 1. Instrument Content and Wording

| Implementation Element | Basis / Source | How It Was Used |
|---|---|---|
| The 9 item statements in `PHQ9_ITEMS` (`app/services/phq9_service.py`) | Kroenke, K., Spitzer, R. L., & Williams, J. B. W. (2001). The PHQ-9: Validity of a brief depression severity measure. *Journal of General Internal Medicine, 16*(9), 606–613. | Item text reproduced verbatim, cross-checked against the American Psychological Association's published PHQ-9 reference sheet (apa.org/depression-guideline) for consistency before implementation. No item was reworded, reordered, added, or removed. |
| 4-point response scale (0 = Not at all, 1 = Several days, 2 = More than half the days, 3 = Nearly every day) | Kroenke et al. (2001) | Implemented exactly in `RESPONSE_SCALE`; validated server-side in `score_phq9()` to reject any value outside `{0,1,2,3}`. |
| Two-week recall period ("Over the last 2 weeks...") | Kroenke et al. (2001) | Included as the `instructions` field returned by `GET /api/v1/assessments/phq9`, shown to the student before they answer. |

## 2. Scoring and Severity Classification

| Implementation Element | Basis / Source | How It Was Used |
|---|---|---|
| Total score range 0–27 (sum of 9 items × 0–3) | Kroenke et al. (2001) | Implemented directly in `score_phq9()`; the backend is the sole authority computing this value — never accepted from the client. |
| Severity bands: 0–4 minimal, 5–9 mild, 10–14 moderate, 15–19 moderately severe, 20–27 severe | Kroenke et al. (2001), consistent with the cutoffs cited across independent secondary sources reviewed for this phase (e.g., clinical trial protocols and depression-screening literature using the same instrument) | Implemented in `_severity_for_score()`; boundary values (4/5, 9/10, 14/15, 19/20) are each covered by a dedicated unit test in `tests/test_phq9.py`. |
| Item 9 (self-harm/suicidal ideation) treated as an independent escalation trigger, not folded into the ordinary severity band | Standard clinical practice around PHQ-9 item 9, which is widely treated as a distinct safety-relevant item regardless of total score, since a low total score can still coexist with an elevated risk indicator on this specific item | Implemented as `SELF_HARM_ITEM_INDEX` logic in `score_phq9()`: any nonzero response on item 9 sets `escalated = True` independent of `total_score`, covered by `test_item_nine_nonzero_escalates_even_at_low_total`. |

## 3. Non-Diagnostic Framing

| Implementation Element | Basis / Source | How It Was Used |
|---|---|---|
| Disclaimer returned with every result: "This result reflects a standardized wellness screening only. It is not a diagnosis..." | Consistent with the project's own Clinical Boundaries Statement (Expert Validation Packet, Part I §1.4) and the panel's Required Revision to keep the system exclusively a monitoring/support tool | Returned as a field on every `Phq9ResultResponse`, so the frontend cannot accidentally omit it. |
| "Wellness monitoring" language used instead of "diagnosis" or "clinical assessment" anywhere in code comments, schema field names, and API responses | Development Plan §10 (Wellness Prioritization Architecture) terminology table; Frontend Development Guideline §33 (Clinically Sensitive UI Rules) | Field names (`severity_band`, not `diagnosis`), docstrings, and disclaimer text all deliberately avoid diagnostic language. |

## 4. Data Handling, Privacy, and Legal Basis

| Implementation Element | Basis / Source | How It Was Used |
|---|---|---|
| `assessment_responses` and `assessment_results` scoped to the submitting user via `user_id` FK, enforced at the API layer via `require_student` + ownership checks | Republic Act No. 10173 (Data Privacy Act of 2012) — processing of sensitive personal information must be access-limited to authorized purposes | Every read endpoint checks `result.user_id` against the authenticated caller before returning data; mismatches return `404`. |
| Non-diagnostic, support-oriented system design | Republic Act No. 11036 (Philippine Mental Health Act) — framing consistent with the Act's emphasis on access to mental health support without requiring or implying formal diagnosis outside licensed clinical settings | Reflected in the disclaimer text and the absence of any diagnostic determination anywhere in the response schema. |
| Cross-user access returns `404`, not `403`, to avoid confirming record existence | General secure-API design principle (avoiding information disclosure via error-response differences); also directly required by the Master Backend Prompt, Section 29 ("prove a user cannot access another user's private information simply by changing an ID in the URL") | Implemented in `get_phq9_result_for_user()`; covered by `test_get_result_cross_user_returns_404_not_403`. |

## 5. Expert Validation Traceability

| Item | Status |
|---|---|
| PHQ-9 item wording and scoring approach | Confirmed acceptable by the project's psychologist validator per the stated guidance to "follow psychological standards" — cross-verified against Kroenke et al. (2001) before implementation, as documented above. |
| Escalation logic (item 9 + severe-band trigger) | Implemented per standard practice; **recommend an explicit confirmation from the psychologist validator** that this specific escalation rule (not just the instrument itself) is acceptable, since escalation *logic* is a system design choice layered on top of the validated instrument, not part of the instrument itself. Suggested addition to the Interview Guide if not already covered. |
| Non-diagnostic disclaimer wording | Consistent with prior expert validation packet language; not a new claim requiring separate sign-off. |

## 6. Open Items for This Phase

- The escalation-logic confirmation noted in Section 5 is the one item from this phase that has not yet been explicitly validated as its own design choice (as opposed to the instrument itself, which has been). Recommend raising this specifically in your next psychologist consultation.
- No other open clinical/legal questions from this phase.
