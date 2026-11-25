# Student year level

Students can select first through fourth year beside Program in Profile. Changes save automatically through `PUT /api/v1/profile`. A failed save leaves the previous year visible and displays a retry message. New students can optionally provide year level during the last introductory onboarding screen. Existing accounts remain unset until a student supplies a value.

The backend already has the nullable `profiles.year_level` column and returns it through the current-user response. This change permits saving year level independently of program and section. Values are stored as strings `1` through `4`; the request uses an integer within that range. Changing program or year clears any previously assigned section, while preserving the other academic field. A provided section must still match the section catalog.

Admin analytics now sends those numeric strings as filter values and displays readable labels. Distinct legacy values returned by the filter-options endpoint remain selectable. This release does not bulk rewrite existing profile data.

## Deployment

Deploy both backend and frontend. **No Alembic migration is included or required**: no database column or schema has changed. Deploying only the frontend against the old backend would cause independent year updates to fail with 422 responses.

Smoke check with a test student: select a year, reload Profile, verify persistence, change the year again, and verify that the admin year filter includes that student's aggregate cohort subject to existing privacy thresholds. Check a new account's optional onboarding selection. Empty profiles should show `Year level not provided` rather than an inferred year.

## Validation

Nine focused backend tests cover independent year updates, unset programs, valid and invalid section updates, unchanged years, program changes, and rejected years outside the existing 1–4 range. The frontend production build passes. Existing React-hook lint issues in Profile, Onboarding, and AdminAnalytics are tracked separately; no live accounts or production database records were modified.
