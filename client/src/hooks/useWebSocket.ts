import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

export function useWebSocket(url: string, options: UseWebSocketOptions = {}) {
  const {
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    reconnectAttempts = 5,
    reconnectInterval = 3000
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isIntentionalCloseRef = useRef(false);

  const connect = useCallback(() => {
    // Don't create a new connection if one already exists and is connecting/open
    if (wsRef.current && (wsRef.current.readyState === WebSocket.CONNECTING || wsRef.current.readyState === WebSocket.OPEN)) {
      console.log('[WebSocket] Connection already exists, skipping connect');
      return;
    }

    try {
      // Convert http/https to ws/wss
      const wsUrl = url.replace(/^http/, 'ws');
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      isIntentionalCloseRef.current = false;

      ws.onopen = () => {
        console.log('[WebSocket] Connected to:', wsUrl);
        setIsConnected(true);
        setError(null);
        reconnectCountRef.current = 0;
        onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          onMessage?.(message);
        } catch (err) {
          console.error('[WebSocket] Failed to parse message:', err);
        }
      };

      ws.onclose = (event) => {
        console.log('[WebSocket] Disconnected with code:', event.code, 'reason:', event.reason);
        setIsConnected(false);
        wsRef.current = null;
        onDisconnect?.();

        // Don't reconnect if the close was intentional or if it's a normal close
        const isNormalClose = event.code === 1000 || event.code === 1001;
        const shouldReconnect = !isIntentionalCloseRef.current && 
                               !isNormalClose && 
                               reconnectCountRef.current < reconnectAttempts;

        if (shouldReconnect) {
          const delay = reconnectInterval * Math.pow(2, reconnectCountRef.current);
          console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectCountRef.current + 1}/${reconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectCountRef.current++;
            connect();
          }, delay);
        } else if (!isIntentionalCloseRef.current && reconnectCountRef.current >= reconnectAttempts) {
          setError('Connection failed after maximum retry attempts');
        }
      };

      ws.onerror = (event) => {
        console.error('[WebSocket] Error:', event);
        setError('WebSocket connection error');
        onError?.(event);
      };

    } catch (err) {
      console.error('[WebSocket] Failed to create connection:', err);
      setError('Failed to create WebSocket connection');
    }
  }, [url, onMessage, onConnect, onDisconnect, onError, reconnectAttempts, reconnectInterval]);

  const disconnect = useCallback(() => {
    isIntentionalCloseRef.current = true; // Mark as intentional close
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close(1000, 'Intentional disconnect');
    }
    
    wsRef.current = null;
    setIsConnected(false);
    reconnectCountRef.current = reconnectAttempts; // Prevent auto-reconnect
  }, [reconnectAttempts]);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    console.warn('[WebSocket] Cannot send message - not connected');
    return false;
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    error,
    sendMessage,
    disconnect,
    reconnect: connect
  };
}