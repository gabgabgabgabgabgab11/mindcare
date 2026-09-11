# Basis and References — Phase 14: Wellness Prioritization

**Milestone:** 2 — Core Wellness System  
**Phase:** 14 — Wellness Prioritization  
**Purpose of this document:** For every implementation decision made in this phase that affects the combined wellness-priority output, this file records the basis that supports it. This is the consolidation point for the prior phases' validation questions and preserves traceability for expert review, defense, and future tuning.

---

## 1. Terminology

| Implementation Element | Basis / Source | How It Was Used |
|---|---|---|
| "Wellness Priority" with the values `LOW`, `MODERATE`, `ELEVATED`, and `INSUFFICIENT_DATA` | Development Plan §10, terminology table distinguishing Screening, Sentiment Analysis, Wellness Prioritization, Clinical Diagnosis, and Clinical Triage; Master Backend Prompt Section 19 | Used as the name of the combined system output. This feature is not called clinical triage or a risk score. |
| `INSUFFICIENT_DATA` as a distinct state from `LOW` | General good-practice principle in screening and monitoring system design: absence of data should not be visually or semantically indistinguishable from a reassuring result | Returned when no assessment or journal data is available. This is a defensible design principle, not a citation-backed clinical rule. |

## 2. Combination Logic

The rule ladder is project-authored. It combines already-derived PHQ-9, GAD-7, and NLP outputs; it does not create a new clinical instrument or diagnosis.

| Implementation Element | Basis / Source | How It Was Used |
|---|---|---|
| `ELEVATED` when either instrument's escalation flag is set | Project-authored combination rule built on Phase 10 and Phase 11 outputs | An escalation signal from either instrument is sufficient to produce an elevated wellness priority. |
| `ELEVATED` for PHQ-9 `moderately_severe` or `severe` | Project-authored combination rule built on Phase 10's cited PHQ-9 severity bands | These PHQ-9 bands are treated as elevated contributing signals in the combined output. |
| `ELEVATED` for GAD-7 `severe` | Project-authored combination rule built on Phase 11's cited GAD-7 severity bands | The severe GAD-7 band is treated as an elevated contributing signal in the combined output. |
| Worst available signal dominates the combined output | General logical principle commonly used in multi-instrument screening contexts | Elevated checks run before moderate checks so a stronger signal is not hidden by a lower-priority result. The specific rule ladder has not been reviewed as its own artifact by the psychologist validator. |
| `MODERATE` when either instrument is in its moderate band | Project design choice built on Phase 10 and Phase 11 severity bands | A moderate PHQ-9 or GAD-7 result contributes to a moderate wellness priority unless an elevated trigger has already applied. |
| `MODERATE` when at least 50% of recent non-uncertain journal entries are negative | Project design choice; `NEGATIVE_TREND_THRESHOLD = 0.5` is a configurable value, not derived from an external source | The negative ratio is calculated from up to `SENTIMENT_TREND_WINDOW = 5` recent sentiment labels, excluding `uncertain` entries. |
| `LOW` when usable data contains no elevated or moderate indicator | Project-authored fallback behavior | Represents the absence of detected elevated or moderate indicators in the available data. It is not a clinical determination. |

This combination logic is not independently sourced from clinical literature. It is a project-authored rule set built on the already-cited severity bands from Phases 10 and 11 and the NLP output from Phase 13. The threshold and window values were selected for reasonableness and configurability, not clinical validation.

## 3. Explainability

| Implementation Element | Basis / Source | How It Was Used |
|---|---|---|
| `contributing_factors` is included on every response | Master Backend Prompt's top-level project priorities, including the requirement to prioritize explainability; Senior Engineer Rule in Section 19 requiring transparent wellness status | Every result identifies the assessment or sentiment signals that caused the returned priority, including the no-data and no-indicator cases. |
| `rule_version` is included on every response | Project maintainability and traceability requirement for configurable decision logic | Identifies the active draft rule set so future changes can be distinguished from earlier outputs. |
| `clinical_validation_status` is included on every response | Master Backend Prompt Section 19 and the Frontend Development Guideline's Clinically Sensitive UI Rules (§33) | Keeps the pending expert review visible to API consumers and prevents the frontend from presenting the draft combination logic as validated clinical judgment. |

## 4. Expert Validation Traceability — This Phase Is the Consolidation Point

| Item | Status |
|---|---|
| PHQ-9 instrument and scoring | Validated (Phase 10). |
| GAD-7 instrument and scoring | Validated (Phase 11). |
| PHQ-9 item-9 escalation logic | Design choice, not yet separately confirmed; flagged in Phase 10. |
| GAD-7 two-tier signal (further-evaluation versus escalation) | Design choice, not yet separately confirmed; flagged in Phase 11. |
| NLP `uncertain` confidence threshold and short-text gate | Design choice, not yet separately confirmed; flagged in Phase 13. |
| This phase's combination logic, including the priority ladder, `0.5` sentiment threshold, and five-entry window | Design choice, explicitly unvalidated. This is the accumulation point for the open validation questions from Phases 10, 11, and 13. |

The wellness priority a student sees is the direct output of all these decisions together. Validating each contributing piece in isolation does not automatically validate their combination.

## 5. Open Items for This Phase

- This is the single most important open item across the project so far. Every prior phase's unvalidated design choice converges here: a `MODERATE` or `ELEVATED` result shown to a real student is the direct output of this combination logic.
- Make the next psychologist consultation's centerpiece a line-by-line review of the exact rule ladder in `backend/app/services/wellness_prioritization.py`, rather than validating each contributing piece in isolation and assuming the combination is automatically appropriate.
- Until that review occurs, `clinical_validation_status` must remain on every API response, unmodified, and the frontend must surface it in accordance with the Frontend Development Guideline's Clinically Sensitive UI Rules (§33). This is the honest representation of the feature's current validation status, not optional polish.

---

## 6. Summary

Phase 14 consolidates PHQ-9, GAD-7, and journal sentiment outputs into a transparent, non-diagnostic Wellness Priority. The ladder is intentionally configurable and exposes its contributing factors and draft validation status. The combination logic, escalation assumptions, sentiment threshold, and five-entry window remain project design choices pending explicit psychologist review; until then, the system must continue to disclose that status wherever the result is exposed.
