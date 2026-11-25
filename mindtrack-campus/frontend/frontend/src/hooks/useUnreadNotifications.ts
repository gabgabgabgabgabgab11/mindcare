import { useEffect, useState } from 'react';
import { listNotifications } from '../services/studentApi';
import { createUnreadNotificationTracker, NOTIFICATIONS_CHANGED_EVENT } from '../utils/unreadNotifications';

export function useUnreadNotifications(userId: string | undefined, enabled: boolean) {
  const [snapshot, setSnapshot] = useState<{ userId: string; count: number } | null>(null);
  useEffect(() => {
    if (!enabled || !userId) return;
    const tracker = createUnreadNotificationTracker(
      () => listNotifications(true), count => setSnapshot({ userId, count }),
    );
    const refresh = () => { if (document.visibilityState !== 'hidden') void tracker.refresh(); };
    refresh();
    const timer = window.setInterval(refresh, 30_000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, refresh);
    return () => {
      tracker.dispose();
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, refresh);
    };
  }, [userId, enabled]);
  return enabled && snapshot && snapshot.userId === userId ? snapshot.count : 0;
}
