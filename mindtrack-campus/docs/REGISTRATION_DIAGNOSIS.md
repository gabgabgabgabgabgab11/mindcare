# Registration diagnosis — 2026-11-25

## Confirmed evidence

The production browser screenshot shows `POST /auth/v1/signup` returning HTTP **429 Too Many Requests** from the production Supabase project. The response JSON has not yet been supplied, so the specific limit is unconfirmed. Response headers alone do not distinguish an email limit from another Auth request limit.

The separate “No API key found” message does not establish that the app omitted its key. Opening a Supabase endpoint directly in a browser does not send the SDK's `apikey` header. The app initializes `createClient` with its public key; no service-role key belongs in the frontend.

Registration calls Supabase Auth directly, not the Render backend. Upgrading the Render instance does not change Supabase Auth quotas.

## Code fixes

- Show actionable messages for provider error codes, including email limits, general rate limits, email delivery restrictions, disabled signup, and password requirements. Include safe error codes for support without raw provider messages.
- Catch thrown network errors and restore the loading state in `finally`.
- Prevent duplicate in-flight submissions with both a ref guard and an explicit disabled state. The shared Button spreads `disabled` after its loading-derived attribute, so callers must include `isSubmitting` in the disabled prop.
- Trim surrounding email whitespace; preserve password characters exactly.
- Avoid claiming a new account definitely exists when signup returns an ambiguous confirmation result.

## Production checks still required

1. In the existing failed `signup` Network request, open **Response**, not Headers. Read only its JSON error code and message; do not share the payload, password, tokens, or API keys.
2. If the code is `over_email_send_rate_limit`, inspect the production project's Auth email/SMTP configuration and email rate limits. Supabase's built-in sender is limited to 2 emails per hour across the project and is intended for testing. Configure custom SMTP with a verified sender for real student registrations, then review its sending quota. Repeatedly clicking signup consumes attempts and does not resolve the limit.
3. If `email_address_not_authorized`, check custom SMTP: the built-in sender restricts recipients to project team addresses. Adding students as project team members is not a solution.
4. If `over_request_rate_limit`, inspect Auth logs and the relevant request limit. Students using the same campus network may share an outward IP; this is a possibility to verify, not a confirmed cause. Avoid automatically retrying registration.
5. Confirm new email signups are enabled, production password rules match the UI, and any CAPTCHA requirement has an implemented client flow. Do not disable email verification or security protections as a workaround.
6. If the response instead identifies a database/hook error, inspect Auth and Postgres logs for that attempt. This repository creates app profiles through the backend; production-only Auth triggers or hooks have not been inspected.

Use the production Supabase project selected by the deployed frontend. The local frontend environment points to a different project, so local success does not validate production configuration.

## Validation and limits

Frontend production build, targeted ESLint, and 18 focused Node tests pass. Error mapping has tests for email quotas, SMTP restrictions, generic 429, disabled signup, network failure, and private-message suppression. No live student accounts were created, no emails were sent, and no production Auth settings were changed. Browser preview could not reach the local server, so rendered visual verification remains outstanding.

References:

- [Supabase Auth error codes](https://supabase.com/docs/guides/auth/debugging/error-codes)
- [Supabase Auth rate limits](https://supabase.com/docs/guides/auth/rate-limits)
- [Supabase custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
