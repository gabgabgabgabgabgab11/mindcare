export const NOTIFICATIONS_CHANGED_EVENT = 'mindcare:notifications-changed';

export function createUnreadNotificationTracker(
  fetchUnread: () => Promise<{ is_read: boolean }[]>,
  onCount: (count: number) => void,
) {
  let disposed = false;
  let queued = false;
  let pending: Promise<void> | null = null;
  return {
    refresh(): Promise<void> {
      if (disposed) return Promise.resolve();
      if (pending) { queued = true; return pending; }
      pending = (async () => {
        do {
          queued = false;
          try {
            const notifications = await fetchUnread();
            if (!disposed && !queued) onCount(notifications.filter(item => !item.is_read).length);
          } catch {
            // A temporary error must not falsely clear the last known badge.
          }
        } while (!disposed && queued);
      })().finally(() => { pending = null; });
      return pending;
    },
    dispose() { disposed = true; queued = false; },
  };
}
