# Basis and References — Phase 13: NLP Backend

**Milestone:** 2 — Core Wellness System  
**Phase:** 13 — NLP Backend  
**Purpose of this document:** For every implementation decision made in this phase that affects sentiment analysis logic, confidence handling, privacy, or non-diagnostic framing, this file records the specific basis that supports it. This preserves traceability for expert review, defense, and future tuning.

---

## 1. Model Selection

| Implementation Element | Basis / Source | How It Was Used |
|---|---|---|
| VADER (Valence Aware Dictionary and sEntiment Reasoner) used as the sentiment analysis approach | Hutto, C. J., & Gilbert, E. (2014). VADER: A Parsimonious Rule-based Model for Sentiment Analysis of Social Media Text. *Proceedings of the Eighth International AAAI Conference on Weblogs and Social Media.* | Chosen in line with the project's own Development Plan (§9, NLP Architecture) and the Master Backend Prompt Section 18, which explicitly instructs the team to "start with the simplest appropriate NLP approach" and avoid unnecessary machine learning without a trainable dataset. |
| Lexicon/rule-based approach preferred over a trained transformer model | Master Backend Prompt Section 18 | The project has no labeled sentiment dataset. A rule-based model is explainable, every score can be traced to lexicon entries and rules, and it supports the project's need for an assistive, non-diagnostic framing. |

## 2. Classification Thresholds

| Implementation Element | Basis / Source | How It Was Used |
|---|---|---|
| Compound score ≥ 0.05 → positive; ≤ -0.05 → negative; between → candidate-neutral | Standard VADER convention, consistently documented across the official VADER documentation (vadersentiment.readthedocs.io) and independently confirmed across multiple academic and technical sources reviewed during this phase | Implemented as the default sentiment classification threshold in the NLP service and reflected in the output labeling logic. |
| `CONFIDENCE_THRESHOLD = 0.15` producing an `uncertain` label distinct from `neutral` | Project design decision, not a VADER-defined threshold | Introduced deliberately to distinguish low-confidence sentiment from a genuine neutral reading, consistent with the requirement in the Master Backend Prompt to address what happens when confidence is low rather than silently treating weak signal as confident neutrality. This is a disclosed starting point, not a validated clinical or statistical cutoff, and is expected to be tuned during UAT. |

## 3. Data Minimization

| Implementation Element | Basis / Source | How It Was Used |
|---|---|---|
| `journal_analysis` stores no raw text, only label/confidence/model version | Master Backend Prompt, Section 10 (Journal): "Clearly distinguish: Private journal content from Derived NLP metadata... Explain what metadata can safely be stored"; Section 18 (NLP): NLP output must never include the analyzed text itself. | Implemented structurally: the analysis table does not store the original journal body, only derived metadata. |
| PII pattern stripping (emails, URLs, phone-like numbers) before analysis | Additional project-initiated safety measure, consistent with the Data Privacy Act (RA 10173) data-minimization principle | Sensitive identifiers are scrubbed before sentiment scoring to reduce the chance that identifying details influence model logic or are incidentally logged during analysis. |

## 4. Non-Diagnostic Framing

| Implementation Element | Basis / Source | How It Was Used |
|---|---|---|
| Disclaimer text on every analysis response: "...not a diagnosis and does not reflect professional clinical judgment" | Consistent with the project's Clinical Boundaries Statement and the psychologist validator's guidance throughout Phases 10–12; sentiment output is framed as a trend indicator rather than a clinical determination. | Stored in the NLP service response schema and returned on every sentiment-analysis result to ensure the frontend cannot omit the warning. |
| Sentiment output treated as a trend indicator, not a diagnosis or clinical prediction | Development Plan §10 terminology table: Screening vs. Sentiment Analysis vs. Wellness Prioritization vs. Clinical Diagnosis | Used to shape API text, response docs, and developer-facing descriptions so the system remains assistive and non-diagnostic. |

## 5. Expert Validation Traceability

| Item | Status |
|---|---|
| Use of VADER as the sentiment engine, and its known limitations (English-centric, lexicon-based, no deep contextual understanding) | Consistent with the NLP reliability concern raised in the Interview Guide (Q8, Section III). The psychologist validator's guidance to "follow psychological standards you can see on the internet" was given in the context of the screening instruments (PHQ-9/GAD-7); it has not yet been explicitly re-confirmed specifically for the NLP component. |
| The `uncertain` label and 0.15 confidence threshold | Not yet validated. This is a project-specific design choice with no external clinical source. It should be reviewed explicitly with the psychologist validator, since it is the single most “invented” numerical choice in the system so far. |
| Taglish/Filipino-language limitation | VADER's lexicon is English-only. Per the Development Plan (§9), a custom Filipino/Taglish lexicon extension was identified as future work, not implemented in this phase. This is a disclosed limitation, not a defect. Recommend logging this as Technical Debt item **TD-009**. |

## 6. Open Items for This Phase

- Combine this phase's validation questions with Phase 10/11's open items into a single consolidated review list before the next psychologist consultation: (1) PHQ-9 escalation logic, (2) GAD-7 two-tier signal, (3) NLP `uncertain` threshold. These are all system design choices layered on top of validated source material and benefit from one focused review session.
- Add **TD-009** for the English-only NLP limitation and Taglish/Filipino challenge in `docs/TECHNICAL_DEBT.md`.

---

## 7. Summary

This phase follows the project's explicit instruction to start with the simplest appropriate NLP approach. VADER is a defensible, explainable, rule-based method that fits the data constraints of the project and supports the non-diagnostic framing required by the system. The main unresolved design element is the project-specific `uncertain` confidence threshold, which should be reviewed with the psychologist validator before being treated as a stable clinical or product decision.
