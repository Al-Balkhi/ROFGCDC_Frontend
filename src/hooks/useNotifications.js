import { useState, useEffect, useCallback } from "react";
import { notificationsAPI } from "../services/api";
import { useWebSocket } from "./useWebSocket";

/**
 * useNotifications — encapsulates REST fetch + real-time WebSocket push
 * for the notifications bell in Header.jsx.
 *
 * Replaces ~80 lines of duplicated state/effects in Header.jsx with a
 * clean, testable hook. The WebSocket will auto-reconnect on disconnect
 * (handled by useWebSocket internally).
 *
 * @param {object|null} user - Authenticated user from authStore; WS is disabled when null.
 * @returns {{ notifications, unreadCount, markAsRead, markAllAsRead, refetch }}
 */
export function useNotifications(user) {
  const [notifications, setNotifications] = useState([]);

  // ---- REST: initial fetch ----
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationsAPI.getNotifications();
      setNotifications(res.data.results ?? res.data);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line -- fetchNotifications is async; setState runs in its callback, not inline
    fetchNotifications();
  }, [fetchNotifications]);

  // ---- WebSocket: real-time push ----
  // handleWsMessage is defined with useCallback so its reference is stable.
  // useWebSocket stores it in a ref internally, preventing reconnects on re-renders.
  const handleWsMessage = useCallback((data) => {
    if (data.type === "notification") {
      // Prepend incoming notification to the list so newest is always first
      setNotifications((prev) => [data.message, ...prev]);
    }
  }, []);

  useWebSocket("/ws/notifications/", {
    enabled: !!user,
    onMessage: handleWsMessage,
  });

  // ---- Actions ----
  const markAsRead = useCallback(
    async (id) => {
      try {
        await notificationsAPI.markAsRead(id);
        fetchNotifications();
      } catch (err) {
        console.error("Error marking notification as read:", err);
      }
    },
    [fetchNotifications],
  );

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsAPI.markAllAsRead();
      fetchNotifications();
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}
