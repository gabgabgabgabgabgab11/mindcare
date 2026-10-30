# Security & Data Privacy Guardrails for MindCare

MindCare handles sensitive mental health and wellness data under the Philippine Data Privacy Act (RA 10173). Maintain strict data confidentiality, cryptographic integrity, and compliance boundaries.

## 1. Field-Level Encryption for Personal Notes (ADR-004)
- Journal entries and free-form personal notes must be encrypted before persistence in PostgreSQL using Fernet symmetric encryption (`cryptography.fernet.MultiFernet` with active key rotation support).
- Plaintext journal content must never be written to database disk unencrypted.
- Database logs and query traces must never log plaintext sensitive fields.

## 2. Transient NLP Sentiment Analysis
- Natural Language Processing (VADER sentiment analysis, keyword detection) runs in-memory during request processing.
- Extracted sentiment scores are stored, but raw journal text submitted for NLP must never be logged or cached in external telemetry systems.

## 3. Anonymity & PII Protection
- User-identifiable information (student names, email addresses, student IDs) must be decoupled from public resources (e.g., Mantra Wall posts are strictly anonymous).
- Audit logs (`app/models/audit_log.py`) must NEVER store passwords, auth tokens, session cookies, or plaintext mental health entries.

## 4. Consent & Account Self-Determination (ADR-003)
- Informed consent is mandatory prior to accessing wellness tracking and journal features.
- If a student withdraws consent or requests data deletion, their mood check-ins, journal entries, and assessment records must be purged or anonymized in compliance with RA 10173.
- Students must have full control over data export and privacy preferences via `/privacy-settings`.

## 5. Truthful Backend Representations (ADR-010)
- Never create fake client-side mock mutations for non-existent backend APIs (e.g., fake user suspension or mock password reset).
- When an administrative action requires the Supabase Auth console or direct infrastructure operations, provide clear, truthful operational guidance instead of deceptive mock UI state.
