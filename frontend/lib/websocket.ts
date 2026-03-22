import { useEffect } from 'react';
import { useStore } from './store';

export function useWebSocket() {
  const { addIncident, setWsConnected, wsConnected } = useStore();

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    const connect = () => {
      let rawUrl = process.env.NEXT_PUBLIC_WS_URL || 'https://5695-200-80-213-210.ngrok-free.app/ws';
      // Auto-convert http/https to ws/wss for ngrok/production URLs
      const url = rawUrl.replace(/^https:\/\//, 'wss://').replace(/^http:\/\//, 'ws://');
      try {
        ws = new WebSocket(url);
      } catch {
        reconnectTimer = setTimeout(connect, 3000);
        return;
      }

      ws.onopen = () => setWsConnected(true);

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data && data.id) addIncident(data);
        } catch { /* ignore malformed */ }
      };

      ws.onclose = () => {
        setWsConnected(false);
        reconnectTimer = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws?.close();
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      if (ws) { ws.onclose = null; ws.close(); }
    };
  }, [addIncident, setWsConnected]);

  return { wsConnected };
}
