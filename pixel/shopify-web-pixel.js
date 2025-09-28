/**
 * Shopify Web Pixel Code
 * Captures analytics events and sends them to the dashboard API
 */

(function() {
  'use strict';

  // Configuration
  const API_ENDPOINT = 'YOUR_API_ENDPOINT_HERE/api/events'; // Replace with your actual API endpoint
  const RETRY_ATTEMPTS = 3;
  const RETRY_DELAY = 1000; // 1 second
  const BATCH_SIZE = 10;
  const BATCH_TIMEOUT = 5000; // 5 seconds

  // Event queue for batching
  let eventQueue = [];
  let batchTimeout = null;
  let failedEvents = []; // Store failed events for retry (in-memory only)

  // Get canonical Shopify shop domain
  function getShopDomain() {
    try {
      // First try to get from Shopify global object (most reliable)
      if (typeof Shopify !== 'undefined' && Shopify.shop) {
        return Shopify.shop;
      }

      // Check for meta tag with canonical shop domain
      const shopMeta = document.querySelector('meta[name="shopify-shop-domain"]');
      if (shopMeta) {
        return shopMeta.getAttribute('content');
      }

      // Check if current hostname is .myshopify.com domain
      const hostname = window.location.hostname;
      if (hostname.includes('.myshopify.com')) {
        return hostname;
      }

      // For custom domains, try to find shop identifier in liquid variables
      if (typeof window.ShopifyAnalytics !== 'undefined' && window.ShopifyAnalytics.meta) {
        const meta = window.ShopifyAnalytics.meta;
        if (meta.shop && meta.shop.domain) {
          return meta.shop.domain;
        }
        if (meta.shop && meta.shop.myshopifyDomain) {
          return meta.shop.myshopifyDomain;
        }
      }

      console.warn('[Shopify Pixel] Could not determine canonical shop domain, using hostname');
      return hostname;
    } catch (error) {
      console.warn('[Shopify Pixel] Error determining shop domain:', error);
      return 'unknown';
    }
  }

  // Send event to API with retry logic
  async function sendEvent(eventData, retryCount = 0) {
    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-shop-domain': getShopDomain()
        },
        body: JSON.stringify(eventData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('[Shopify Pixel] Event sent successfully:', result.eventId);
      return result;
    } catch (error) {
      console.error(`[Shopify Pixel] Failed to send event (attempt ${retryCount + 1}):`, error);
      
      if (retryCount < RETRY_ATTEMPTS - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * Math.pow(2, retryCount)));
        return sendEvent(eventData, retryCount + 1);
      } else {
        console.error('[Shopify Pixel] All retry attempts failed for event:', eventData.name);
        // Store failed event for potential retry on next navigation
        failedEvents.push(eventData);
        throw error;
      }
    }
  }

  // Process the event queue with parallel sending
  async function processEventQueue() {
    if (eventQueue.length === 0) return;

    const eventsToSend = eventQueue.splice(0, BATCH_SIZE);
    
    // Send events in parallel using Promise.allSettled
    const sendPromises = eventsToSend.map(eventData => 
      sendEvent(eventData).catch(error => {
        // Errors are already logged in sendEvent, just return null
        return null;
      })
    );

    await Promise.allSettled(sendPromises);

    // Schedule next batch if there are more events
    if (eventQueue.length > 0) {
      setTimeout(processEventQueue, 100);
    }
  }

  // Add event to queue and process if needed
  function queueEvent(eventData) {
    eventQueue.push(eventData);
    
    // Clear existing timeout
    if (batchTimeout) {
      clearTimeout(batchTimeout);
    }

    // Process immediately if queue is full, otherwise wait for timeout
    if (eventQueue.length >= BATCH_SIZE) {
      processEventQueue();
    } else {
      batchTimeout = setTimeout(processEventQueue, BATCH_TIMEOUT);
    }
  }

  // Validate and prepare Shopify event for API
  function prepareEvent(event) {
    // Send the event in the exact format that Shopify provides
    // Only add required fields if absolutely missing, avoid synthetic defaults
    const preparedEvent = Object.assign({}, event);

    // Only add fallbacks for absolutely required fields if missing
    if (!preparedEvent.id) {
      preparedEvent.id = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    if (!preparedEvent.name) {
      console.error('[Shopify Pixel] Event missing required name field:', event);
      preparedEvent.name = 'unknown_event';
    }
    if (!preparedEvent.timestamp) {
      preparedEvent.timestamp = new Date().toISOString();
    }
    if (!preparedEvent.context) {
      preparedEvent.context = {
        document: {
          title: document.title,
          location: {
            href: window.location.href,
            pathname: window.location.pathname
          }
        }
      };
    }
    if (!preparedEvent.data) {
      preparedEvent.data = {};
    }

    // Remove undefined/null fields to clean up payload
    Object.keys(preparedEvent).forEach(key => {
      if (preparedEvent[key] === undefined || preparedEvent[key] === null) {
        delete preparedEvent[key];
      }
    });

    return preparedEvent;
  }

  // Enhanced event handler with error handling
  function handleShopifyEvent(event) {
    try {
      console.log('[Shopify Pixel] Captured event:', event.name, event);
      
      const preparedEvent = prepareEvent(event);
      queueEvent(preparedEvent);
    } catch (error) {
      console.error('[Shopify Pixel] Error handling event:', event.name, error);
    }
  }

  // Subscribe to Shopify analytics events
  function subscribeToEvents() {
    if (typeof analytics === 'undefined') {
      console.error('[Shopify Pixel] Shopify analytics object not available');
      return;
    }

    // Core ecommerce events
    const eventSubscriptions = [
      'page_viewed',
      'product_viewed', 
      'collection_viewed',
      'search_submitted',
      'cart_viewed',
      'product_added_to_cart',
      'product_removed_from_cart',
      'cart_updated',
      'checkout_started',
      'checkout_completed',
      'checkout_address_info_submitted',
      'checkout_contact_info_submitted', 
      'checkout_shipping_info_submitted',
      'payment_info_submitted',
      'form_submitted'
    ];

    eventSubscriptions.forEach(eventName => {
      try {
        analytics.subscribe(eventName, handleShopifyEvent);
        console.log(`[Shopify Pixel] Subscribed to: ${eventName}`);
      } catch (error) {
        console.error(`[Shopify Pixel] Failed to subscribe to ${eventName}:`, error);
      }
    });

    console.log(`[Shopify Pixel] Initialized for shop: ${getShopDomain()}`);
  }

  // Initialize the pixel
  function init() {
    console.log('[Shopify Pixel] Initializing...');
    
    // Wait for analytics to be available
    if (typeof analytics !== 'undefined') {
      subscribeToEvents();
    } else {
      // Poll for analytics availability
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max wait
      
      const checkAnalytics = () => {
        attempts++;
        if (typeof analytics !== 'undefined') {
          subscribeToEvents();
        } else if (attempts < maxAttempts) {
          setTimeout(checkAnalytics, 100);
        } else {
          console.error('[Shopify Pixel] Shopify analytics not available after waiting');
        }
      };
      
      checkAnalytics();
    }
  }

  // Handle page unload - send remaining events
  window.addEventListener('beforeunload', () => {
    const allPendingEvents = [...eventQueue, ...failedEvents];
    
    if (allPendingEvents.length > 0) {
      // Send each event individually using sendBeacon since there's no batch endpoint
      allPendingEvents.forEach(eventData => {
        if (navigator.sendBeacon) {
          const success = navigator.sendBeacon(
            API_ENDPOINT,
            JSON.stringify(eventData)
          );
          if (!success) {
            console.warn('[Shopify Pixel] Failed to send event via sendBeacon:', eventData.name);
          }
        }
      });
    }
  });

  // Process failed events periodically (in-memory only - not persisted across page loads)
  setInterval(() => {
    if (failedEvents.length > 0) {
      console.log(`[Shopify Pixel] Retrying ${failedEvents.length} failed events`);
      eventQueue.push(...failedEvents.splice(0, BATCH_SIZE));
      if (eventQueue.length > 0 && !batchTimeout) {
        batchTimeout = setTimeout(processEventQueue, 1000);
      }
    }
  }, 30000); // Retry failed events every 30 seconds

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();