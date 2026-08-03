// ============================================================
//  hooks/useWebSocket.js
//
//  Automatically uses the correct WebSocket URL:
//    Dev:  ws://localhost:4000  (connects to backend directly)
//    Prod: wss://your-app.railway.app  (same host as the page)
//
//  In production, backend and frontend share one host, so we
//  connect to the same hostname/port as the current page.
// ============================================================

import { useEffect, useRef } from 'react';

export function useWebSocket(onMessage) {
  const wsRef = useRef(null);
  const onMsgRef = useRef(onMessage);
  onMsgRef.current = onMessage;

  useEffect(() => {
    let reconnectTimer;

    function connect() {
      // In dev, Vite serves on 5173 but WS must go to backend on 4000.
      // In prod, everything is on the same port.
      const isDev = window.location.port === '5173';
      const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const host  = isDev
        ? `${proto}://localhost:4000`
        : `${proto}://${window.location.host}`;

      const ws = new WebSocket(host);
      wsRef.current = ws;

      ws.onmessage = e => {
        try { onMsgRef.current?.(JSON.parse(e.data)); } catch {}
      };
      ws.onclose = () => {
        reconnectTimer = setTimeout(connect, 3000);
      };
      ws.onerror = () => {};
    }

    connect();
    return () => {
      clearTimeout(reconnectTimer);
      wsRef.current?.close();
    };
  }, []);

  return wsRef;
}
