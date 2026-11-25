# Login diagnosis and authenticator rollback

Checked 25 November 2026 against the local source and the deployed public site `https://mind-care.site`.

## Prioritized change

Removed the login QR code, TOTP setup/challenge flow, frontend AAL2 gate, and backend AAL2 requirement. Supabase still verifies bearer tokens on the backend; email/password authentication, authorization, ownership checks, and the seven-day browser inactivity policy remain. Existing authenticator factors stored in Supabase are not bulk-deleted by this change.

## Measured public response times

The deployed site's public JavaScript identified the API as `https://mindcare-q03f.onrender.com`. No user credentials, private journal data, or authenticated records were used for these measurements.

| Request | HTTP status | Time to first byte | Total |
|---|---:|---:|---:|
| Website HTML | 200 | 0.923 s | 0.924 s |
| Website entry JavaScript, compressed transfer | 200 | 0.353 s | 0.512 s |
| API `/health`, first probe | 200 | 63.049 s | 63.049 s |
| API `/health`, immediate repeat | 200 | 0.226 s | 0.226 s |
| API `/health/db` | 200 | 2.691 s | 2.692 s |

The database endpoint returned `database: connected`. These are a few observations from this computer/network, not load-test percentiles or authenticated-login benchmarks. The first and warm health requests were deliberately sequential.

The roughly one-minute first response followed by a fast repeat is strong evidence consistent with a Render cold start. The live service's plan/settings were not inspected, so the observations alone do not prove its billing tier. Render documents that Free web services spin down after 15 idle minutes and take about a minute to spin up again. See [Render Free service documentation](https://render.com/docs/free) and [Render FAQ](https://render.com/docs/faq).

## Code findings and fixes

1. **Auth callback lock re-entry:** The old `onAuthStateChange` callback awaited Supabase assurance-level calls. Its account API calls also reached `getSession()` indirectly through the axios interceptor. This matches Supabase's documented deadlock pattern. The callback is now synchronous and schedules account work after it returns. [Supabase troubleshooting](https://supabase.com/kb/troubleshooting/why-is-my-supabase-api-call-not-returning-PGzXw0).
2. **Duplicate account requests:** Bootstrap, sign-in, and tab-focus notifications could independently reload the account. The new account loader shares pending work and reuses a successful result for the same session. Sign-out invalidates the cache and stale results. Repeated token refreshes do not extend the inactivity timer.
3. **Unbounded/hidden profile loading:** Account and consent requests previously had no timeout, profile-load failures could leave the login spinner running, and the password form disappeared after the first authentication step. Account/consent requests now each have a 15-second timeout; errors offer an explicit retry. Authenticated pages show a loading status rather than a blank page. Server/network errors are not counted as incorrect-password attempts.
4. **Backend round trips remain:** Each protected API request still verifies the token with Supabase over HTTP and performs its database work. Student bootstrap still loads `/auth/me` followed by consent status. Removing QR authentication does not remove those network/DB costs. They need authenticated timing traces before any further optimization is claimed.
5. **Large initial JavaScript:** The local build still reports a roughly 1.68 MB entry bundle before compression (about 474 KB gzip). Page imports include dashboard/reporting dependencies. Route-level lazy loading and image optimization are sensible future work, especially on mobile, but the measured minute-long API startup dominates this particular observation. No reduction in bundle size is claimed by this rollback.

## Upgrade decision

- **Render:** If this is a Free web service and users need a fast first login after idle periods, move the API to an always-on paid instance. This should address free-tier spin-down, not the separate application deadlock. Check current service settings, deployment logs, and resource graphs before choosing a larger instance.
- **Supabase:** The public connectivity check succeeded. There is no evidence here that a Supabase upgrade is needed to resolve this login problem. Free-project pausing after low activity over a week is a separate condition and should not be confused with Render's 15-minute idle spin-down. [Supabase pausing documentation](https://supabase.com/docs/guides/platform/free-project-pausing).
- **Verify after release:** Try an existing account that previously enrolled an authenticator and a normal password account. Confirm password-only login, admin/student routing, expired-session behavior, and account-load retry. Compare first versus warm authenticated request timings in browser developer tools without recording passwords or tokens. Supabase project-level hooks or RLS policies that independently require AAL2 were not inspected; if any exist, reconcile those settings with the rollback.

## Validation

- Frontend production build passed after removing the QR flow.
- Thirteen frontend regression tests passed: account-load sharing/caching/retry/race behavior, synchronous auth notification callback, and seven-day inactivity boundaries.
- Ten focused backend authentication/role tests passed, including accepting a provider-verified password session and rejecting invalid/unverified tokens.
- Existing dependency deprecation/build-size warnings are separate from the rollback.

The live public bundle still contained the old QR prompt when diagnosis began. Source edits take effect for users only after both the frontend and backend are deployed. A successful Git push is not by itself proof that either deployment completed.
