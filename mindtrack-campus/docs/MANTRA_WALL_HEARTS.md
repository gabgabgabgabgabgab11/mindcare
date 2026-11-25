# Persistent Mantra Wall hearts and rejected post approval

The previous Send Heart button stored only React component state. It sent no API request and reset to zero when the component remounted. Hearts are now stored per authenticated account and post in `mantra_wall_hearts`.

`PUT /api/v1/mantra-wall/posts/{post_id}/heart` receives `{"hearted": true}` or `{"hearted": false}`. It requires authenticated active consent. Only approved posts can receive heart changes. The backend supplies the actor identity; clients cannot select another account. It returns only the total count and whether the requesting account sent a heart. List responses batch-load counts and the requesting account's state, without returning reacting account identities.

The composite primary key prevents duplicate hearts. Updates lock the post row on PostgreSQL and accept a desired state rather than toggling blindly, so retries do not double-count. The UI waits for the saved result, disables the pending action, and displays an error if saving fails. Counts refresh when the wall loads or a heart is saved; this does not introduce live cross-browser subscriptions.

Admins can open **All Posts**, filter **Rejected**, and choose **Approve rejected post**. This uses the existing admin-protected moderation endpoint, including its audit and author-notification behavior. Student queries then include the approved post. Historical automated filter reasons remain available to moderators.

## Heart notifications

When another account adds a new heart, the author receives an in-app notification identifying the share by a short excerpt and its current heart total. Each post has one reusable notification identified by `mantra_wall_hearts:<post UUID>` in the existing string notification type. Another account's new heart updates the total, moves the notification to the newest position, and makes it unread. Repeated saves do not create duplicates or reset the read state. Self-hearts do not create alerts. Removing a heart updates an existing total without creating a new alert or resetting its read state.

Selecting the notification marks it read and opens the corresponding wall card, which is scrolled into view and highlighted. Other account identities are not included in the message. Notifications are loaded when the Notifications page opens or refreshes; this does not add push delivery or live subscriptions. Existing hearts are not backfilled into historical notifications.

**The notification enhancement requires no additional Alembic migration.** It uses the existing notifications table and the hearts table from `c03a91e84d72`. Deploy its frontend and backend together. Notification and heart changes commit in the same transaction. Validation includes separate-share notifications, current counts, repeat requests, self-hearts, removals, and read-state behavior; 36 Mantra Wall and notification tests pass, along with the frontend build and targeted notification/wall lint.

## Production deployment

This heart fix **does require a schema migration**, unlike the year-level update.

1. Publish the updated code and make its migration available in the deployment environment. Do not run migration commands from an older checkout.
2. Before serving the updated backend, run `alembic current`, then `alembic upgrade head` using the established production migration process and production database connection.
3. Verify `alembic current` reports **c03a91e84d72**. It follows **b684a2d1f930** and adds only the hearts table and its constraints; it does not rewrite existing posts.
4. Deploy the updated backend, then frontend. The new post-list query requires the hearts table, so migrate before the updated API receives traffic.
5. Test with a test account: send a heart, refresh the page, confirm it stays selected, remove it, refresh again, and confirm it remains removed. Check that another account sees the total without the first account's identity.
6. As an admin, approve a rejected test post through All Posts → Rejected, then reload the student wall and verify visibility.

The migration enables RLS on the new table without browser Data API policies. Verify the FastAPI database role has the intended access under the production role configuration; do not expose per-account heart records to public browser roles. Account and post foreign keys cascade heart removal if those rows are deleted. Downgrading this migration removes saved hearts.

## Validation

The frontend production build and 37 backend tests pass, including existing Mantra Wall API tests, new persistence and moderation tests, and year-level tests. Migration SQL was generated offline and the revision graph has one head. PostgreSQL concurrency, deployed RLS behavior, and live browser persistence still require the production smoke check; no production schema or records were modified here.

Existing React-hook lint findings remain in the admin moderation and other previously affected pages. The heart component, student wall, API client, and shared types pass targeted lint.
