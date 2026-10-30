# Clinical & Ethical Boundaries for MindCare (PUP Santa Maria)

These rules are non-negotiable architectural and clinical guardrails. MindCare is an early-warning and self-monitoring system designed for students, NOT a diagnostic or medical treatment platform.

## 1. No Diagnostic Claims or Medical Terminology
- Never label students with psychiatric diagnoses (e.g., "You have severe depression", "Diagnosed with GAD").
- Map all assessment scores (PHQ-9 and GAD-7) strictly to qualitative tier bands:
  - PHQ-9: `Minimal`, `Mild`, `Moderate`, `Moderately Severe`, `Severe`
  - GAD-7: `Minimal`, `Mild`, `Moderate`, `Severe`
- Accompany all assessment feedback with the mandatory disclaimer:
  > *"This screening is not a clinical diagnosis. Please consult a qualified healthcare or guidance professional for clinical evaluation."*

## 2. Strict Score Suppression (ADR-006)
- Raw numeric assessment integers (e.g., `total_score`, numeric item tallies) must NEVER be exposed to students in the frontend UI or in student-facing API responses.
- Students must only receive qualitative tier feedback, supportive explanations, and actionable coping strategies.

## 3. High-Priority / Crisis Escalation
- If a student triggers elevated or severe scores (especially PHQ-9 Question 9 indicating thoughts of self-harm), prioritize immediate crisis contact information:
  - **National Mental Health Crisis Hotline**: 1553 (Luzon toll-free)
  - **Hopeline Philippines**: 0917-899-8727 / (02) 8804-4673
  - **PUP Santa Maria Guidance & Counseling Office**
- Do NOT simulate automated counselor booking or scheduling (ADR-009). Provide verified direct contact channels.

## 4. Mantra Wall Positivity & Moderation (ADR-007, ADR-008)
- The Mantra Wall is an uplifting, peer-encouragement space, NOT an open unmoderated forum or venting board.
- Posts must undergo automated sentiment filtering and pre-moderation before appearing on the public wall.
- Rejected or harmful posts must be flagged for admin moderation and never broadcast publicly.

## 5. Administrative Scope & Triage Draft Status (ADR-010)
- Administrative triage and wellness tracking views are strictly operational dashboards.
- Machine-generated wellness priority levels (`low`, `moderate`, `elevated`, `insufficient_data`) are preliminary indicators to help counselors prioritize outreach, not definitive psychological risk profiles.
