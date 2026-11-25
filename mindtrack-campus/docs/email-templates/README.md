# MindCare authentication email

`confirm-signup.html` is the production Supabase Confirm signup email body. It matches the landing page's mint background, emerald accents, slate typography, rounded surfaces, and gentle tone. Table layouts, inline CSS, and system fonts keep it independent of the React app and make it suitable for email clients. Some email clients simplify rounded corners or alter colors in dark mode.

## Apply

1. In the production Supabase project, open Authentication → Emails → Templates → Confirm sign up.
2. Back up the existing body before replacing it.
3. Set the subject to `Welcome to MindCare — confirm your email`.
4. Paste the complete contents of `confirm-signup.html` into the HTML/source body editor and save.
5. Leave `{{ .ConfirmationURL }}` intact in both links and the fallback text. Supabase replaces this with the actual verification link. Do not replace it with the website address or a real user's token.
6. Check Authentication → URL Configuration: the production Site URL should point to `https://mind-care.site`, or the intended production destination, rather than localhost. This template preserves the existing confirmation flow.
7. Preview in Supabase, then send one test signup email to an address you control. Check the button, fallback link, mobile layout, and final confirmation destination. Keep email-provider click tracking disabled for Auth links, as advised by Supabase.

Saving this file or pushing it to Git does not apply it to hosted Supabase. The dashboard template must be saved separately. No production template was changed automatically.

Reference: https://supabase.com/docs/guides/auth/auth-email-templates
