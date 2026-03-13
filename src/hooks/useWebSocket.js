import { useEffect, useRef } from "react";
import { BASE_API_URL } from "../constants/labels";

const RECONNECT_DELAY_MS = 3000;

/**
 * useWebSocket — low-level hook that manages a WebSocket connection
 * with automatic reconnect on drop and proper cleanup on unmount.
 *
 * @param {string}   path     - WS path relative to BASE_API_URL (e.g. "/ws/notifications/")
 * @param {object}   options
 * @param {boolean}  [options.enabled=true] - Set to false to skip connecting (e.g. unauthenticated)
 * @param {function} [options.onMessage]    - Called with the parsed JSON payload for every message
 */
export function useWebSocket(path, { enabled = true, onMessage } = {}) {
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const connectRef = useRef(null);

  // Store onMessage in a ref so the connect function never needs to be
  // recreated just because onMessage changes reference (avoids reconnect storms).
  const onMessageRef = useRef(onMessage);
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!enabled) return;

    const protocol = BASE_API_URL.startsWith("https") ? "wss:" : "ws:";
    const host = BASE_API_URL.replace(/^https?:/, "");
    const url = `${protocol}${host}${path}`;

    // Define connect as a plain function stored in a ref — this avoids the
    // TDZ issue that arises when useCallback's onclose tries to reference
    // 'connect' before the const declaration is reached.
    connectRef.current = function connect() {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        clearTimeout(reconnectTimerRef.current);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessageRef.current?.(data);
        } catch (e) {
          console.error("WS parse error:", e);
        }
      };

      ws.onerror = (e) => console.error("WS error:", e);

      // Reconnect on drop — references connectRef.current, which is always the
      // latest function, so no stale closure or TDZ issues.
      ws.onclose = () => {
        reconnectTimerRef.current = setTimeout(
          () => connectRef.current?.(),
          RECONNECT_DELAY_MS,
        );
      };
    };

    connectRef.current();

    return () => {
      clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
      // Prevent a pending reconnect from firing after unmount
      connectRef.current = null;
    };
  }, [enabled, path]);
}
