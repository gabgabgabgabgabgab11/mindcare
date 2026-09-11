# Basis and References — Phase 11: GAD-7 Backend

**Milestone:** 2 — Core Wellness System  
**Phase:** 11 — GAD-7 Backend

## 1. Instrument Content and Wording

| Implementation Element | Basis / Source | How It Was Used |
|---|---|---|
| The 7 item statements in `GAD7_ITEMS` | Spitzer, R. L., Kroenke, K., Williams, J. B. W., & Löwe, B. (2006). A brief measure for assessing generalized anxiety disorder: The GAD-7. *Archives of Internal Medicine, 166*(10), 1092–1097. | Item text cross-checked against multiple independently published clinical-trial protocol appendices citing the same source, for wording consistency. |
| 4-point response scale, identical structure to PHQ-9 | Spitzer et al. (2006) | Implemented exactly in the same pattern as the PHQ-9 response structure. |
| Two-week recall period | Spitzer et al. (2006) | Included as the assessment instruction text shown to the student before they answer the items. |

## 2. Scoring and Severity Classification

| Implementation Element | Basis / Source | How It Was Used |
|---|---|---|
| Total score range 0–21 | Spitzer et al. (2006) | Used as the instrument's total scoring range for backend validation and result generation. |
| Severity bands: 0–4 minimal, 5–9 mild, 10–14 moderate, 15–21 severe (four bands, not five — unlike PHQ-9) | Spitzer et al. (2006); confirmed consistent across independent secondary sources reviewed (clinical trial protocols, psychometric validation literature) | Implemented in the backend severity logic to match the validated instrument bands. |
| `recommend_further_evaluation` at score ≥10 | Spitzer et al. (2006) — explicitly identified as the optimal sensitivity/specificity cutoff (89%/82%) for further clinical evaluation, distinct from the "severe" band cutoff of 15 | Used as a distinct signal above the ordinary severity band to flag a higher-priority follow-up recommendation. |
| `escalated` tied to the severe band (≥15) rather than any single item | Design decision, not directly from the instrument itself — GAD-7 has no dedicated safety-relevant item analogous to PHQ-9's item 9. Escalation logic for GAD-7 is therefore based purely on overall severity, which is a system design choice layered on top of a validated instrument, not part of the instrument's own validated content. | Implemented as a system-level escalation threshold independent of any single item response. |

## 3. Non-Diagnostic Framing

Identical approach to Phase 10: disclaimer text, `severity_band` (not `diagnosis`) field naming, and terminology consistent with the project's Clinical Boundaries Statement and Frontend Development Guideline §33.

## 4. Data Handling, Privacy, and Legal Basis

Identical basis to Phase 10 (RA 10173, RA 11036, 404-not-403 ownership enforcement) — no new legal/privacy considerations introduced by GAD-7 specifically, since it reuses the same storage and access-control design.

## 5. Expert Validation Traceability

| Item | Status |
|---|---|
| GAD-7 item wording and scoring bands | Consistent with the psychologist validator's general guidance to follow published psychological standards; verified against Spitzer et al. (2006) as documented above. |
| The two-tier signal (`recommend_further_evaluation` at 10, `escalated` at 15) | **Not yet explicitly validated as its own design choice.** This is a new pattern not present in the PHQ-9 implementation (which only had one escalation trigger plus the separate item-9 trigger) — recommend specifically confirming with your psychologist validator whether a two-tier signal is clinically sensible for how the frontend should react at each level (e.g., should ≥10 already prompt a resource-panel nudge, or only ≥15?). |

## 6. Open Items for This Phase

- **Two open validation questions, both worth raising together with Phase 10's open item in your next psychologist consultation:**

1. Is escalating GAD-7 based on severity band alone (with no equivalent to PHQ-9's item-9 safety check) an acceptable design given GAD-7 measures anxiety rather than depression/self-harm risk?
2. Should the `recommend_further_evaluation` (≥10) signal produce any different frontend behavior than a plain "moderate" severity result, or is it purely informational for now until validated otherwise?
