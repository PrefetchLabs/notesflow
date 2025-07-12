import { useEffect, useState, useCallback, useRef } from 'react';
import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';

interface UseWebSocketProviderOptions {
  url: string;
  roomName: string;
  doc: Y.Doc;
  enabled?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
}

interface UseWebSocketProviderReturn {
  provider: WebsocketProvider | null;
  isConnected: boolean;
  isConnecting: boolean;
  retryCount: number;
  reconnect: () => void;
  disconnect: () => void;
}

const MIN_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 60000; // 60 seconds
const MAX_RETRY_COUNT = 10;
const JITTER_FACTOR = 0.3; // 30% jitter

export function useWebSocketProvider({
  url,
  roomName,
  doc,
  enabled = true,
  onConnect,
  onDisconnect,
  onError
}: UseWebSocketProviderOptions): UseWebSocketProviderReturn {
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const isPageVisibleRef = useRef(true);
  const lastActivityRef = useRef(Date.now());
  const mountedRef = useRef(true);

  // Calculate retry delay with exponential backoff and jitter
  const getRetryDelay = useCallback((attempt: number) => {
    const baseDelay = Math.min(MIN_RETRY_DELAY * Math.pow(2, attempt), MAX_RETRY_DELAY);
    const jitter = baseDelay * JITTER_FACTOR * (Math.random() * 2 - 1);
    return Math.round(baseDelay + jitter);
  }, []);

  // Create WebSocket provider
  const createProvider = useCallback(() => {
    if (!enabled || !mountedRef.current) return null;

    try {
      console.log('[useWebSocketProvider] Creating provider:', { url, roomName });
      setIsConnecting(true);

      const wsProvider = new WebsocketProvider(
        url,
        roomName,
        doc,
        {
          WebSocketPolyfill: WebSocket,
          resyncInterval: 5000,
          maxBackoffTime: 30000,
          params: {},
          protocols: [],
        }
      );

      // Set up event listeners
      wsProvider.on('status', (event: any) => {
        console.log('[useWebSocketProvider] Status:', event.status);
        
        if (event.status === 'connected') {
          if (mountedRef.current) {
            setIsConnected(true);
            setIsConnecting(false);
            setRetryCount(0);
            onConnect?.();
          }
        } else if (event.status === 'disconnected') {
          if (mountedRef.current) {
            setIsConnected(false);
            setIsConnecting(false);
            onDisconnect?.();
          }
        }
      });

      wsProvider.on('sync', (isSynced: boolean) => {
        console.log('[useWebSocketProvider] Sync status:', isSynced);
      });

      wsProvider.on('connection-error', (error: any) => {
        console.warn('[useWebSocketProvider] Connection error:', error);
        onError?.(error);
      });

      wsProvider.on('connection-close', (event: CloseEvent) => {
        console.log('[useWebSocketProvider] Connection closed:', event.code, event.reason);
        if (mountedRef.current) {
          setIsConnected(false);
          setIsConnecting(false);
          
          // Schedule retry if appropriate
          if (enabled && isPageVisibleRef.current && retryCount < MAX_RETRY_COUNT) {
            scheduleRetry();
          }
        }
      });

      return wsProvider;
    } catch (error) {
      console.error('[useWebSocketProvider] Failed to create provider:', error);
      setIsConnecting(false);
      onError?.(error);
      return null;
    }
  }, [url, roomName, doc, enabled, retryCount, onConnect, onDisconnect, onError]);

  // Schedule a retry attempt
  const scheduleRetry = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    const delay = getRetryDelay(retryCount);
    console.log(`[useWebSocketProvider] Scheduling retry in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRY_COUNT})`);

    retryTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current && enabled && isPageVisibleRef.current) {
        setRetryCount(prev => prev + 1);
        reconnect();
      }
    }, delay);
  }, [retryCount, enabled, getRetryDelay]);

  // Reconnect function
  const reconnect = useCallback(() => {
    console.log('[useWebSocketProvider] Reconnecting...');
    
    // Clean up existing provider
    if (provider) {
      provider.destroy();
      setProvider(null);
    }

    // Create new provider
    const newProvider = createProvider();
    if (newProvider) {
      setProvider(newProvider);
    }
  }, [provider, createProvider]);

  // Disconnect function
  const disconnect = useCallback(() => {
    console.log('[useWebSocketProvider] Disconnecting...');
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    if (provider) {
      provider.destroy();
      setProvider(null);
    }

    setIsConnected(false);
    setIsConnecting(false);
    setRetryCount(0);
  }, [provider]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      isPageVisibleRef.current = !document.hidden;
      console.log('[useWebSocketProvider] Page visibility:', isPageVisibleRef.current);

      if (isPageVisibleRef.current && enabled && !isConnected && !provider) {
        // Page became visible and we're not connected
        reconnect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enabled, isConnected, provider, reconnect]);

  // Handle network status changes
  useEffect(() => {
    const handleOnline = () => {
      console.log('[useWebSocketProvider] Network online');
      if (enabled && !isConnected && !provider) {
        reconnect();
      }
    };

    const handleOffline = () => {
      console.log('[useWebSocketProvider] Network offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [enabled, isConnected, provider, reconnect]);

  // Track user activity for smart reconnection
  useEffect(() => {
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
      
      // If user is active and we're disconnected, reset retry delay
      if (!isConnected && enabled && retryCount > 2) {
        console.log('[useWebSocketProvider] User activity detected, resetting retry count');
        setRetryCount(1); // Reset to faster retry
        if (!provider && !isConnecting) {
          reconnect();
        }
      }
    };

    // Track various user activities
    const events = ['keydown', 'mousedown', 'touchstart', 'focus'];
    events.forEach(event => document.addEventListener(event, updateActivity));

    return () => {
      events.forEach(event => document.removeEventListener(event, updateActivity));
    };
  }, [isConnected, enabled, retryCount, provider, isConnecting, reconnect]);

  // Initial connection
  useEffect(() => {
    if (enabled && !provider) {
      const newProvider = createProvider();
      if (newProvider) {
        setProvider(newProvider);
      }
    }

    return () => {
      mountedRef.current = false;
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [enabled]); // Only depend on enabled to avoid recreation

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return {
    provider,
    isConnected,
    isConnecting,
    retryCount,
    reconnect: () => {
      setRetryCount(0);
      reconnect();
    },
    disconnect
  };
}