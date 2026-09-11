# Basis and References — Phase 12: Journal Backend

**Milestone:** 2 — Core Wellness System  
**Phase:** 12 — Journal Backend  
**Purpose of this document:** For every implementation decision made in this phase that touches data security, access control, privacy, or sensitive data handling, this file records the specific source that justifies it — so nothing in the code can be challenged as invented or arbitrary during defense or expert review.

---

## 1. Encryption Approach

| Implementation Element | Basis / Source | How It Was Used |
|---|---|---|
| Application-layer encryption using `Fernet` (AES-128-CBC + HMAC authentication) | `cryptography` library's own documentation, which explicitly recommends Fernet for "encrypting data with a symmetric key where you don't need more advanced features" — an accurate description of this use case. Chosen over hand-rolled AES usage specifically to avoid the well-documented risk of implementing encryption primitives incorrectly (e.g., IV reuse, missing authentication) — a known, common source of real-world cryptographic vulnerabilities in custom implementations. | Implemented in `app/security/encryption.py` using `cryptography.fernet.Fernet`; all journal content is encrypted before storage and decrypted only when retrieved by the owning user. |
| Encrypting at the application layer rather than relying solely on Postgres/Supabase's storage-level encryption | Master Backend Prompt, Section 17: "Explain how journal text should be protected" — storage-level (at-rest disk) encryption protects against physical disk theft but not against a misconfigured database role or leaked credential with query access; application-layer encryption protects against both. | Journal text is encrypted before entering the database via the `JournalEntry` model's pre-commit hooks; the database stores only ciphertext. A leaked database credential still cannot expose journal content without the application-layer key. |

## 2. Access Control Design

| Implementation Element | Basis / Source | How It Was Used |
|---|---|---|
| Zero admin-facing journal endpoints | Master Backend Prompt, Section 5: "Do NOT expose private student journal content unnecessarily," and Section 17: "Admin users must NOT automatically receive unrestricted access." Implemented as a structural absence (no route exists) rather than a permission check, which is a stronger guarantee than "admin *could* access this but is blocked by RBAC." | No `GET /api/v1/admin/journals/*` or similar routes are defined in `app/api/routes/journals.py`. The code structure itself prevents accidental administrative disclosure. |
| `404` (not `403`) on cross-user journal access | Same reasoning as Phases 10–11: avoids confirming record existence to a non-owner. Prevents enumeration attacks that could reveal which students have submitted journal entries. | Implemented in `get_journal_entry_for_user()`: any access to a journal entry not belonging to the authenticated user returns `404`. Covered by dedicated unit test verifying this behavior. |
| Real deletion (not soft-delete) for journal content | Consistent with the informed consent form's "Voluntary Participation" provisions regarding a participant's right to withdraw data — for journal content specifically, genuine deletion is the more defensible interpretation of "withdrawal" than a soft-delete flag that leaves data recoverable. | Implemented as a true SQL `DELETE` operation (not a logical flag) in the `DELETE /api/v1/journals/{entry_id}` endpoint. Once deleted, the journal entry and its encryption key reference are unrecoverable. |
| Ownership validation enforced at the API layer before any decryption attempt | Defense-in-depth principle — do not attempt to decrypt data that is not authorized for access in the first place, to minimize the attack surface. | Implemented as an early check in `get_journal_entry_for_user()`: the user's authentication `user_id` is cross-referenced against the journal entry's `user_id` FK *before* any `decrypt()` call is executed. |

## 3. Content Validation

| Implementation Element | Basis / Source | How It Was Used |
|---|---|---|
| 1–5000 character bounds for journal content | No external clinical standard applies here (this is a free-text journaling feature, not a validated instrument) — bounds are a system design choice balancing expressive freedom against basic abuse/storage protection, consistent with Master Backend Prompt Section 17's requirement to validate "input length, empty content, malformed payload." | Implemented in `JournalSchema` with `min_length=1` and `max_length=5000`; the backend rejects submissions outside this range and returns `422 Unprocessable Entity` with a specific error message. |
| Whitespace-only content rejected | Logical extension of the 1-character minimum — a journal entry consisting only of spaces, tabs, or newlines is not substantive content and should be rejected at validation time rather than stored and later retrieved. | Validated in `JournalSchema.validate_content()` (or equivalent) using `.strip()` to detect and reject entries that become empty after whitespace removal. |

## 4. Data Handling, Privacy, and Legal Basis

| Implementation Element | Basis / Source | How It Was Used |
|---|---|---|
| Journal entries scoped to the submitting user via `user_id` FK, enforced at the API layer via `require_student` + ownership checks | Republic Act No. 10173 (Data Privacy Act of 2012) — processing of sensitive personal information must be access-limited to authorized purposes. Journal entries are among the most sensitive personal data a student might provide (reflective, unguarded writing); access must be restricted strictly to the student who wrote them. | Every read endpoint checks `journal_entry.user_id` against the authenticated caller before returning any data (encrypted or decrypted); mismatches return `404`. |
| Non-diagnostic, reflective-practice framing of journaling | Consistent with the Expert Validation Packet (Appendix, Journaling module) and the psychologist's general validation — journaling is framed as a reflective, non-clinical practice, not as a diagnostic or therapeutic tool. The backend does not attempt to analyze, score, or interpret journal content. | Journal entries are stored and returned as-is; no NLP processing, sentiment analysis, or clinical interpretation is performed. Field naming (`journal_entry`, not `clinical_note`) and schema structure deliberately avoid clinical language. |
| Encrypted storage prevents casual administrative inspection | Practical extension of RA 10173 — even if a system administrator or database operator has legitimate access to the database (e.g., for backups or troubleshooting), application-layer encryption ensures they cannot casually read journal content without the application-layer encryption key. | Journal text is stored as a `Fernet` ciphertext blob in the database; viewing the raw database rows reveals no journal content. |

## 5. Expert Validation Traceability

| Item | Status |
|---|---|
| Encryption/access-control design | Not a clinical-content question — falls under technical security design, not requiring psychologist validation. Already reviewed against the project's own Security Architecture (Development Plan §5) and Data Privacy Act (RA 10173) obligations. No new clinical claim is introduced; this is purely implementation architecture for protecting existing clinical/personal data. |
| Framing of journaling as a "reflective, non-clinical practice" | Already addressed in the Expert Validation Packet (Appendix, Journaling module) and the psychologist's general validation — no new clinical claim introduced in this phase's backend implementation. |
| Deletion semantics (real deletion vs. soft-delete) | Not a clinical question — this is a legal/ethical design choice (operationalizing informed consent withdrawal rights) grounded in RA 10173 and the project's own consent framework. No separate expert clinical validation required. |

## 6. Open Items for This Phase

- **Operational risk, not a validation question:** If `JOURNAL_ENCRYPTION_KEY` is ever lost or accidentally rotated, all existing journal entries become permanently undecryptable — there is no recovery mechanism by design (this is what makes the encryption meaningful). 

  **Recommendation:** Store a secure backup of this key outside of `.env` (e.g., a password manager shared among the four team members, or a secure key-management service) *before* any real student data is collected during UAT. This should also be logged as a Technical Debt item (suggest **TD-008**: *no key-rotation or key-recovery strategy exists*) if not already planned for resolution before full deployment. A future phase should address key-rotation strategy and encrypted-key-recovery procedures.

- No other open clinical/legal questions from this phase.
