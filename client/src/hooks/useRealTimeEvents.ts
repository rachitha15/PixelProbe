import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWebSocket } from './useWebSocket';
import { analyticsApi } from '../services/analyticsApi';
import { PixelEvent } from '@shared/schema';

interface UseRealTimeEventsOptions {
  initialLimit?: number;
  shopDomain?: string;
  eventName?: string;
}

export function useRealTimeEvents(options: UseRealTimeEventsOptions = {}) {
  const { initialLimit = 50, shopDomain, eventName } = options;
  const [realtimeEvents, setRealtimeEvents] = useState<PixelEvent[]>([]);
  const [isLiveStreamEnabled, setIsLiveStreamEnabled] = useState(true);

  // Fetch initial events from API
  const { 
    data: eventsResponse, 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['events', { limit: initialLimit, shopDomain, eventName }],
    queryFn: () => analyticsApi.getEvents({ 
      limit: initialLimit, 
      shopDomain, 
      eventName 
    }),
    refetchInterval: isLiveStreamEnabled ? 30000 : false, // Refetch every 30s when live
  });

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((message: any) => {
    if (message.type === 'pixel_event' && message.data) {
      const newEvent = message.data as PixelEvent;
      
      // Only add if live stream is enabled and matches filters
      if (isLiveStreamEnabled) {
        if (shopDomain && newEvent.shopDomain !== shopDomain) return;
        if (eventName && newEvent.name !== eventName) return;
        
        setRealtimeEvents(prev => {
          // Add new event to the beginning and limit total events
          const updated = [newEvent, ...prev];
          return updated.slice(0, initialLimit);
        });
      }
    }
  }, [isLiveStreamEnabled, shopDomain, eventName, initialLimit]);

  // Memoize WebSocket callback functions to prevent reconnections
  const webSocketOptions = useMemo(() => ({
    onMessage: handleWebSocketMessage,
    onConnect: () => {
      console.log('[RealTimeEvents] WebSocket connected');
      // Send subscription message if needed
      if (shopDomain || eventName) {
        // We need to access sendMessage from inside the options, so we'll handle this in useEffect
      }
    },
    onDisconnect: () => {
      console.log('[RealTimeEvents] WebSocket disconnected');
    },
    onError: (error: Event) => {
      console.error('[RealTimeEvents] WebSocket error:', error);
    }
  }), [handleWebSocketMessage, shopDomain, eventName]);

  // WebSocket connection to Render backend
  const { isConnected, error: wsError, sendMessage } = useWebSocket(
    'wss://pixelprobe.onrender.com/ws',
    webSocketOptions
  );

  // Handle subscription when connection is established
  useEffect(() => {
    if (isConnected && (shopDomain || eventName)) {
      sendMessage({
        type: 'subscribe',
        filters: { shopDomain, eventName }
      });
    }
  }, [isConnected, shopDomain, eventName, sendMessage]);

  // Combine initial events with realtime events
  const allEvents = [
    ...realtimeEvents,
    ...(eventsResponse?.events || [])
  ].reduce((unique, event) => {
    // Remove duplicates based on event ID
    if (!unique.find(e => e.id === event.id)) {
      unique.push(event);
    }
    return unique;
  }, [] as PixelEvent[]);

  // Sort by timestamp (newest first)
  allEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const toggleLiveStream = useCallback(() => {
    setIsLiveStreamEnabled(prev => !prev);
  }, []);

  const refreshEvents = useCallback(() => {
    setRealtimeEvents([]); // Clear realtime events
    refetch(); // Refetch from API
  }, [refetch]);

  return {
    events: allEvents.slice(0, initialLimit), // Limit total displayed events
    isLoading,
    isError,
    error: error || wsError,
    isConnected,
    isLiveStreamEnabled,
    toggleLiveStream,
    refreshEvents,
    hasMore: eventsResponse?.pagination?.hasMore || false
  };
}