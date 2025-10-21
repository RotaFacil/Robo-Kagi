

export function connectWS(
  onMsg: (data: any) => void,
  onStatusChange: (status: 'connecting' | 'connected' | 'disconnected') => void,
) {
  let reconnectDelay = 1000; // Start with 1 second
  const maxReconnectDelay = 30000; // Cap at 30 seconds

  const getWsUrl = () => {
    // Uses the VITE_BACKEND_URL environment variable, or falls back to localhost for development.
    // This variable should be configured in your build environment (e.g., .env file) for deployment.
    const backendBase = process.env.VITE_BACKEND_URL || 'http://localhost:8000';
    // Replaces 'http' or 'https' with 'ws' or 'wss' for WebSocket
    return backendBase.replace(/^http/, 'ws') + '/ws';
  };

  const connect = () => {
    onStatusChange('connecting');
    const ws = new WebSocket(getWsUrl());
    
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === 'state') {
            // Initial state for both bots
            onMsg({ type: 'kagi_bot_state', data: { running: msg.data.kagi_bot_running, focus: msg.data.focus } });
            onMsg({ type: 'ai_bot_state', data: { running: msg.data.ai_bot_running } });
            onMsg({ type: 'ai_monitor_list', data: { symbols: msg.data.ai_monitored_symbols } });

        } else {
            onMsg(msg);
        }
      } catch (e) {
        console.error("Failed to parse WebSocket message:", e);
      }
    };

    ws.onopen = () => {
      console.log("WebSocket connected");
      onStatusChange('connected');
      reconnectDelay = 1000; // Reset delay on successful connection
    };

    ws.onclose = () => {
      console.log(`WebSocket disconnected. Reconnecting in ${reconnectDelay / 1000} seconds...`);
      onStatusChange('disconnected');
      setTimeout(connect, reconnectDelay);
      // Increase delay for next attempt
      reconnectDelay = Math.min(reconnectDelay * 2, maxReconnectDelay);
    };

    ws.onerror = () => {
      // The 'onerror' event is automatically followed by the 'onclose' event,
      // which handles the reconnection logic. Logging an error here is redundant
      // and can be alarming when the backend is intentionally offline during development.
      // The UI already provides clear feedback on the connection status.
    };

    return ws;
  }

  return connect();
}