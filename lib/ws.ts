export function connectWS(
  onMsg: (data: any) => void,
  onStatusChange: (status: 'connecting' | 'connected' | 'disconnected') => void,
) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws`;

  let ws: WebSocket | null = null;
  let reconnectTimeout: number | null = null;

  function connect() {
    onStatusChange('connecting');
    console.log(`Attempting to connect to WebSocket at ${wsUrl}...`);
    
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connection established.');
      onStatusChange('connected');
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        onMsg(message);
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      // The onclose event will handle the reconnection logic.
    };

    ws.onclose = (event) => {
      console.log(`WebSocket connection closed. Code: ${event.code}, Reason: ${event.reason}`);
      onStatusChange('disconnected');
      
      // Don't attempt to reconnect if the close was intentional (e.g., component unmount).
      // A code of 1000 is a normal closure.
      if (event.code !== 1000) {
        if (!reconnectTimeout) {
          console.log('Attempting to reconnect in 5 seconds...');
          reconnectTimeout = window.setTimeout(connect, 5000);
        }
      }
    };
  }

  connect();

  // Return a controller object with a close method for cleanup.
  return {
    close: () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (ws) {
        // Use code 1000 for a normal, intentional closure.
        ws.close(1000, 'Component unmounting');
      }
    },
  };
}
