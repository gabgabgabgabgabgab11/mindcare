# Basis and References — Phase 15: Privacy and Consent

**Milestone:** 3 — Supporting System Features  
**Phase:** 15 — Privacy and Consent  
**Purpose of this document:** Record the basis for the privacy and consent architecture implemented in this phase, preserving traceability for technical review, legal/compliance discussion, defense, and future maintenance.

---

## 1. Consent Design

| Implementation Element | Basis / Source | How It Was Used |
|---|---|---|
| Versioned consent, re-required on version change | General data-protection best practice for informed consent under evolving terms; the project's UREC Form 11 Informed Consent Form, which specifies study purpose, voluntary participation, and withdrawal rights that every version of the consent text must continue to honor | Consent is associated with an explicit version. A newer consent version requires a new affirmative action rather than treating an older version as permanently sufficient. |
| Withdrawal is recorded, not deleted | UREC Form 11, Voluntary Participation clause | Withdrawal stops future participation but does not erase the historical fact that consent was previously given. Consent history remains available as an auditable compliance trail. |
| Consent required before any module unlocks | Project Development Plan, §7, Privacy and Consent Architecture | Consent is treated as a prerequisite for access to protected student modules. The `require_consent` dependency provides the enforcement point. |
| Consent status distinguishes current consent from historical consent | Versioned consent design and auditability requirement | A previous consent record does not satisfy the current requirement when its version is outdated or the record has been withdrawn. |

## 2. Privacy Settings

| Implementation Element | Basis / Source | How It Was Used |
|---|---|---|
| `allow_activity_tracking` and `anonymize_activity` toggle names | Capstone prompt documents, Development Plan §7, and Frontend Development Guideline §11 | The exact names are preserved across the API, persistence layer, and client contract. |
| Explanatory text for anonymization | Prior project specifications | The response explains that anonymization hides the student's name and dates while sharing only overall wellness scores. |
| Privacy settings are created with protective, explicit defaults | Privacy-by-design principle and the project's prior privacy-related implementation | New students receive a defined settings row on first access rather than an ambiguous null state. |
| Privacy settings are enforced by the backend | Master Backend Prompt, Section 20: do not rely on the frontend to hide values | Repository and service logic provide the enforcement point for activity tracking and de-identification decisions. |
| Activity-tracking and anonymization controls are user-managed | Republic Act No. 10173, Data Privacy Act of 2012, and the project's privacy architecture | The student can inspect and update these controls through authenticated, ownership-scoped endpoints. |

## 3. Ownership and Access Control

| Implementation Element | Basis / Source | How It Was Used |
|---|---|---|
| One privacy-settings row per student | Project data model and ownership-based access-control pattern | `user_id` identifies the owning profile and is used to retrieve or create exactly one settings record. |
| Authenticated student access only | Existing RBAC architecture | Privacy endpoints use the existing student authentication dependency and reject unauthenticated or non-student callers. |
| Backend de-identification flag lookup | Master Backend Prompt Section 20 and privacy-by-design requirements | Aggregate or administrative features must consult the stored privacy preference before exposing activity-derived data. |
| Consent checks occur at the dependency boundary | Existing FastAPI dependency architecture | Protected endpoints can require consent before their business logic runs, keeping the gate centralized and reusable. |

## 4. Expert Validation Traceability

| Item | Status |
|---|---|
| Consent and privacy architecture | Not a clinical-content question. This is a technical and legal/compliance design decision and does not require psychologist validation. |
| Consent versioning and withdrawal history | Grounded in the project's UREC Form 11 requirements and general data-protection practice. |
| Privacy toggle semantics | Specified by prior project documents and implemented using the exact requested names. |
| Backend enforcement of privacy controls | Required by the Master Backend Prompt and treated as an architectural security requirement. |

## 5. Open Items for This Phase

- No clinical validation items are open for this phase.
- `require_consent` exists as the enforcement mechanism but is not yet wired into every protected module. This is a deliberately sequenced Phase 15B item, not technical debt.
- Phase 15B should identify every module that must be locked before consent and apply the shared consent dependency consistently.

---

## 6. Summary

Phase 15 establishes privacy settings and versioned consent as backend-owned system features. Consent history is retained for auditability, withdrawal affects future participation, and changed consent versions require renewed agreement. Students control activity tracking and anonymization through authenticated endpoints, while downstream aggregate features are responsible for honoring those settings on the backend. The remaining structural task is wiring the reusable consent gate into every protected module during Phase 15B.
