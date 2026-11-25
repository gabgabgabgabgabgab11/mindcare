# Seven-day session inactivity

The browser application signs the current browser session out after seven days without app activity. A fresh sign-in uses email and password. The QR/authenticator enrollment and challenge flow has been removed from the application; no backend AAL2 requirement remains.

Activity includes pointer presses, typing, scrolling, touch interaction, returning to a visible/focused app, and reopening the app before the timeout. Automatic token refreshes, API polling, and background timers do not extend the window. Activity is shared across tabs for the same Supabase session; separate login sessions have independent windows. Expired sessions are checked before restoration and before authenticated application API requests, so the first interaction after the timeout cannot reset the expired window. An idle open tab checks once per minute, and resume/request checks enforce the boundary immediately on use.

Existing sessions without an activity timestamp receive a seven-day window starting when the updated app is first used. Signing out manually still ends the session immediately. Blocked browser storage uses an in-memory fallback, which cannot survive a reload.

## Hosted configuration still to verify

The browser timer is a convenience/access safeguard, not authoritative server-side session revocation. Browser storage can be altered or deleted. This source change does not configure or deploy the hosted Supabase project.

For supported hosted plans, configure **Auth settings → Inactivity timeout = 168 hours (7 days)**, and ensure a shorter fixed session lifetime does not override the intended behavior. Do not extend access-token expiry to seven days; retain short-lived access tokens and automatic refresh.

Supabase defines provider inactivity by time since token refresh, rather than physical user interaction. The browser activity timer supplements it so an unattended visible tab does not stay alive indefinitely through automatic refresh. Supabase documents that session timeouts are available on Pro plans and above and are checked on refresh; an already-issued access token can remain valid until its expiry. Check the project plan and live settings before claiming a server-enforced seven-day policy.

Official reference: https://supabase.com/docs/guides/auth/sessions

## Verification

From `frontend/frontend`, run `node --test tests/sessionInactivity.test.mjs` and `npm run build`.

For a browser smoke test, sign in, locate `mindcare:last-activity:<session_id>` in browser local storage, and set it to a timestamp more than seven days ago. Reload: protected content should not open and email/password sign-in should be required. Repeat with a timestamp less than seven days old: the verified session should resume. Test two tabs to confirm activity in one keeps the shared session active. Never put tokens or authenticator secrets into test reports.
