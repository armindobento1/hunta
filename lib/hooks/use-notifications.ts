import { useEffect, useMemo, useState } from "react";

import type { SocialNotification } from "@/lib/domain/engagement";
import { markNotificationRead, subscribeToNotifications } from "@/lib/firebase/engagement-repository";
import { useAuth } from "@/lib/hooks/use-auth";

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<SocialNotification[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!user) return;
    return subscribeToNotifications(
      user.uid,
      (value) => {
        setNotifications(value);
        setReady(true);
      },
      (cause) => {
        setError(cause.message);
        setReady(true);
      },
    );
  }, [user]);
  const unreadCount = useMemo(() => notifications.filter((entry) => !entry.readAt).length, [notifications]);
  return {
    notifications, unreadCount, ready, error,
    markRead(id: string) {
      if (!user) return;
      void markNotificationRead(user.uid, id).catch((cause: unknown) =>
        setError(cause instanceof Error ? cause.message : "Could not mark notification read."));
    },
  };
}
