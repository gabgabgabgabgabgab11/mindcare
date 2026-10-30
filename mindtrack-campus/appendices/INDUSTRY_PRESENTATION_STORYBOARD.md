# MindCare Industry Presentation Storyboard

Use this as the sequence for a live industry presentation. Screens should use demonstration accounts only and must not show real student data.

| Scene | User action | Screen / system response | Presenter evidence |
|---|---|---|---|
| 1. Entry | Student opens MindCare | Responsive login page appears | State that Supabase manages identity and session issuance. |
| 2. Secure sign-in | Student enters valid credentials | Session is restored and student is routed to onboarding/dashboard | Explain Bearer-token validation and protected routes. |
| 3. Failed sign-in | Enter an incorrect password repeatedly | Generic error; after five failed attempts the browser session pauses sign-in for 15 minutes | Clarify provider-side rate limiting/CAPTCHA is an operational Supabase setting. |
| 4. Recovery | Select **Forgot?** and submit email | Generic confirmation; reset email opens secure new-password page | Demonstrate only with a test inbox. |
| 5. Consent/onboarding | Student reads terms and provides consent | Consent-gated features become available | Explain that consent is verified server-side. |
| 6. Daily wellness action | Student records a mood or writes a journal entry | Entry is saved; dashboard refreshes activity/streak | Explain journal and check-in-note encryption. |
| 7. Companion | Student selects a pet and saves a nickname | Nickname appears on dashboard and remains after reload | Explain the nickname is stored in the authenticated profile. |
| 8. Support | Student views resources / professional support | Curated support options appear | State that MindCare is not a diagnostic tool. |
| 9. Peer support | Student submits approved Mantra Wall content | Content is filtered/moderated according to the workflow | Explain positive-only design and moderation safeguards. |
| 10. Administration | Admin signs in | Role-specific analytics, resources, moderation, and audit views appear | Explain role-based access and aggregate privacy controls. |
| 11. Logout | Student or admin selects Log Out | Session is cleared; protected routes redirect to login | Show that a back-button attempt cannot reopen protected data. |

## Presentation checks

1. Use test accounts and synthetic content only.
2. Demonstrate at 125% browser zoom and a mobile-width viewport.
3. Keep the architecture and system-flow diagrams available for questions.
4. State which claims were validated by the psychology consultant, IT validator, and adviser; label pending validation honestly.
