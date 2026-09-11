# Basis and References — Phase 16: Wellness Tracking / Mood Check-ins

**Milestone:** 2 — Core Wellness System  
**Phase:** 16 — Wellness Tracking / Mood Check-ins  
**Status:** DRAFT / NOT PSYCHOLOGIST-VALIDATED as a specific instrument  
**Purpose of this document:** Record the basis for the wellness tracking and mood check-in decisions made in this phase, preserving traceability for expert review, defense, and future maintenance.

---

## 1. Mood Scale Design

| Implementation Element | Basis / Source | How It Was Used |
|---|---|---|
| Five-point mood scale | Dr. Torres's Section 8-9 guidance (interview transcript, [date]) | Mood is captured using five qualitative levels rather than introducing a clinically validated instrument. |
| Label-only presentation; no raw score surfaced alone | Dr. Torres's Section 8-9 guidance (interview transcript, [date]) to avoid raw numeric scores in favor of qualitative or subjective description | The user-facing experience presents the mood label and does not expose an isolated numeric score as though it were a clinical result. |
| Draft, non-validated instrument status | This phase's design status and the absence of psychologist validation for this specific scale | The feature must remain clearly identified as draft and not be presented as a validated clinical measure. |

This design choice should be included in the same consolidated review session as PHQ-9 item-9, the GAD-7 two-tier signal, NLP thresholds, and the Wellness Prioritization ladder.

## 2. Optional Check-in Notes

| Implementation Element | Basis / Source | How It Was Used |
|---|---|---|
| Optional note field | Dr. Torres's Section 9 guidance on allowing students to provide written context | A student may submit a note with a mood check-in, but the note is not required to complete the check-in. |
| Encryption at rest using Fernet | Dr. Torres's Section 9 guidance on confidentiality and encryption of anything a student writes; same architecture as Journal | Check-in notes use the existing Fernet encryption approach used for journal content before persistence. |
| Architecture-level confidentiality decision | This is a technical privacy and security decision, not a clinical instrument decision | No psychologist validation is required for the encryption-at-rest implementation itself. |

## 3. Expert Validation Traceability

| Item | Status |
|---|---|
| Five-point mood scale and label-only presentation | Draft design choice; not psychologist-validated as a specific instrument. |
| Optional encrypted note field | Architecture-level decision; no clinical validation required. |
| Consolidated review with PHQ-9 item-9, GAD-7 two-tier signal, NLP thresholds, and Wellness Prioritization ladder | Open. These items remain flagged for the same future review session. |

## 4. Open Question — Check-in Note Analysis and Referral Pathway

Dr. Torres's Section 4 guidance says that risk-related language, including suicide-related terms, should be detected and given a referral pathway. Phase 13's NLP pipeline currently runs VADER analysis against Journal content, not check-in notes.

Whether check-in notes should also be routed through `analyze_sentiment`, and what a concrete referral pathway means in this system, remains unresolved. Possible future implementations could include a resources page or counselor notification, but neither is decided by this phase. This question is recorded explicitly so it is not silently skipped.

## 5. Explicitly Out of Scope

Mood data does not feed into Wellness Prioritization, including the Phase 14 `compute_wellness_priority` combination ladder. Any integration between mood check-ins and Wellness Prioritization is a separate future decision.

---

## 6. Summary

Phase 16 introduces draft wellness tracking through a five-point, label-only mood check-in and an optional encrypted note. The design follows Dr. Torres's guidance to favor qualitative description and protect anything a student writes, while avoiding presentation of the mood scale as a validated clinical instrument. Analysis of check-in notes and the concrete referral pathway for risk-related language remain open questions, and mood data is intentionally excluded from the Phase 14 Wellness Prioritization ladder.
