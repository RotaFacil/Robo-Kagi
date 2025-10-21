export function connectWS(
  onMsg: (data: any) => void,
  onStatusChange: (status: 'connecting' | 'connected' | 'disconnected') => void,
) {
  let reconnectDelay = 1000; // Start with 1 second
  const maxReconnectDelay = 30000; // Cap at 30 seconds

  const connect = () => {
    onStatusChange('connecting');
    const ws = new WebSocket(`ws://localhost:8000/ws`);
    
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