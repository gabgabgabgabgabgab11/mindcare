import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { CompanionHeader } from '../components/CompanionHeader';
import { listNotifications, markNotificationRead } from '../services/studentApi';
import type { Notification as NotificationItem } from '../types';

const heartPostId = (notification: NotificationItem) =>
  /^mantra_wall_hearts:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i.exec(notification.notification_type)?.[1];

export const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listNotifications().then(setNotifications).catch(() => setError('Notifications could not be loaded.')).finally(() => setIsLoading(false));
  }, []);

  const handleRead = async (notification: NotificationItem) => {
    try {
      if (!notification.is_read) {
      const updated = await markNotificationRead(notification.id);
      setNotifications((current) => current.map((item) => item.id === updated.id ? updated : item));
      }
    } catch {
      setError('That notification could not be marked as read.');
    }
    const postId = heartPostId(notification);
    if (postId) navigate(`/mantra-wall#post-${postId}`);
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <CompanionHeader
        title="Notifications"
        description="Updates and reminders connected to your MindCare account."
      />
      {error && <p className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm font-medium text-red-700 dark:text-red-400">{error}</p>}
      {isLoading && <Card className="text-sm text-gray-500 dark:text-slate-400 p-6">Loading notifications...</Card>}
      {!isLoading && !error && notifications.length === 0 && (
        <Card className="py-12 text-center border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <p className="font-bold text-gray-900 dark:text-white">You are all caught up</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">New account updates and reminders will appear here.</p>
        </Card>
      )}
      {!isLoading && notifications.length > 0 && (
        <div className="flex flex-col gap-3">
          {notifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => void handleRead(notification)}
              className={`rounded-2xl border p-5 text-left transition-colors cursor-pointer ${
                notification.is_read
                  ? 'border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800'
                  : 'border-brand-100 dark:border-brand-900/50 bg-brand-50/70 dark:bg-brand-950/30 hover:bg-brand-100 dark:hover:bg-brand-950/50'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white">{notification.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-slate-300">{notification.message}</p>
                </div>
                {!notification.is_read && <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-600 dark:bg-brand-400" aria-label="Unread" />}
              </div>
              <p className="mt-3 text-xs text-gray-400 dark:text-slate-400">{new Date(notification.created_at).toLocaleString()}</p>
              {heartPostId(notification) && <p className="mt-2 text-xs font-bold text-brand-700 dark:text-brand-300">View your share →</p>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
