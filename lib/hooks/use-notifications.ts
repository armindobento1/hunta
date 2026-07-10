import { useEffect, useMemo, useState } from "react";

import type { SocialNotification } from "@/lib/domain/engagement";
import { markNotificationRead, subscribeToNotifications } from "@/lib/firebase/engagement-repository";
import { useAuth } from "@/lib/hooks/use-auth";

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<SocialNotification[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!user) return;
    return subscribeToNotifications(user.uid, setNotifications, (cause) => setError(cause.message));
  }, [user]);
  const unreadCount = useMemo(() => notifications.filter((entry) => !entry.readAt).length, [notifications]);
  return {
    notifications, unreadCount, error,
    markRead(id: string) {
      if (!user) return;
      void markNotificationRead(user.uid, id).catch((cause: unknown) =>
        setError(cause instanceof Error ? cause.message : "Could not mark notification read."));
    },
  };
}
