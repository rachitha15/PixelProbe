# Shopify Web Pixel Implementation

This directory contains the JavaScript code for capturing Shopify analytics events and sending them to the dashboard API.

## Files

- `shopify-web-pixel.js` - The main web pixel code for Shopify stores
- `test-pixel.html` - Local testing example
- `README.md` - This documentation

## Setup Instructions

### 1. Deploy Your API

First, ensure your dashboard API is deployed and accessible. The API endpoint should be available at a public URL (e.g., `https://your-domain.com/api/events`).

### 2. Configure the Pixel Code

1. Open `shopify-web-pixel.js`
2. Replace `YOUR_API_ENDPOINT_HERE` with your actual API endpoint:
   ```javascript
   const API_ENDPOINT = 'https://your-domain.com/api/events';
   ```

### 3. Add Web Pixel to Shopify

#### Option A: Custom Pixel (Recommended for POC)

1. Go to your Shopify admin
2. Navigate to **Settings** → **Customer events**
3. Click **Add custom pixel**
4. Give it a name (e.g., "Analytics Dashboard Pixel")
5. Copy and paste the content of `shopify-web-pixel.js`
6. Click **Save**

#### Option B: App Integration (For Production Apps)

If you're building a Shopify app, integrate this pixel code into your app's web pixel functionality.

## Captured Events

The pixel automatically captures these Shopify analytics events:

### Page Events
- `page_viewed` - When any page is viewed
- `collection_viewed` - When a collection page is viewed
- `product_viewed` - When a product page is viewed

### Search Events  
- `search_submitted` - When a search is performed

### Cart Events
- `cart_viewed` - When cart page is viewed
- `product_added_to_cart` - When product is added to cart
- `product_removed_from_cart` - When product is removed from cart
- `cart_updated` - When cart contents change

### Checkout Events
- `checkout_started` - When checkout process begins
- `checkout_address_info_submitted` - When address info is entered
- `checkout_contact_info_submitted` - When contact info is entered
- `checkout_shipping_info_submitted` - When shipping info is entered
- `payment_info_submitted` - When payment info is entered
- `checkout_completed` - When order is completed

### Form Events
- `form_submitted` - When forms are submitted

## Event Data Structure

Each captured event is sent to your API in the exact format that Shopify provides via `analytics.subscribe()`. The API backend handles transformation to storage format. Example event structure:

```json
{
  "id": "evt_1234567890_abc123def",
  "clientId": "client_abc123",
  "name": "product_viewed",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "seq": 1,
  "type": "standard",
  "version": "1.0",
  "source": "web_pixel",
  "shopId": "shop_123",
  "context": {
    "document": {
      "title": "Example Product",
      "location": {
        "href": "https://shop.myshopify.com/products/example",
        "pathname": "/products/example"
      }
    },
    "navigator": {
      "userAgent": "Mozilla/5.0..."
    }
  },
  "data": {
    "productVariant": {
      "id": "variant_123",
      "title": "Default Title",
      "price": {
        "amount": "29.99",
        "currencyCode": "USD"
      },
      "product": {
        "id": "123456789",
        "title": "Example Product",
        "vendor": "Example Vendor",
        "type": "example-type"
      }
    }
  }
}
```

**Note**: 
- The shop domain is sent via the `x-shop-domain` HTTP header, not in the request body
- Events are sent in the exact format Shopify provides via `analytics.subscribe()` without synthetic defaults
- Only missing required fields (id, name, timestamp, context, data) get fallback values

## Features

### Reliability
- **Automatic retries** with exponential backoff
- **Event queuing** to handle burst traffic  
- **Parallel processing** for optimal throughput
- **Failed event retry** during page session (in-memory only)
- **Error handling** for network issues
- **sendBeacon** for reliable page unload events

### Performance  
- **Non-blocking** event capture
- **Parallel async** API calls using Promise.allSettled
- **Efficient batching** of multiple events
- **Session-based retry** of failed events (not persisted across page loads)

### Monitoring
- **Console logging** for debugging
- **Error tracking** for failed events
- **Shop domain detection** for multi-store setups

## Testing

### Local Testing

1. Open `test-pixel.html` in your browser
2. Open browser developer tools → Console
3. Test the pixel functions manually
4. Verify events are sent to your API

### Shopify Testing

1. Install the pixel in a development store
2. Browse the store and perform actions
3. Monitor your dashboard for real-time events
4. Check browser console for any errors

## Troubleshooting

### Common Issues

**Events not appearing in dashboard:**
- Check browser console for errors
- Verify API endpoint URL is correct
- Ensure CORS is properly configured on your API
- Check network tab for failed requests

**CORS errors:**
- Your API must include proper CORS headers
- The API already includes CORS support for `/api/*` routes

**Pixel not loading:**
- Verify the JavaScript code is valid
- Check Shopify admin for pixel status
- Look for syntax errors in browser console

**Shop domain detection issues:**
- The pixel automatically detects shop domain using multiple methods:
  1. `Shopify.shop` global variable (most reliable)
  2. `ShopifyAnalytics.meta.shop.domain` or `.myshopifyDomain`
  3. Meta tag: `<meta name="shopify-shop-domain" content="shop.myshopify.com">`
  4. Hostname detection for .myshopify.com domains
- For custom domains, ensure Shopify's liquid variables are available or add the meta tag

### Debug Mode

Enable additional logging by adding this to the top of the pixel code:
```javascript
window.SHOPIFY_PIXEL_DEBUG = true;
```

## Security Considerations

- The pixel only sends analytics data, no sensitive information
- All data is sent over HTTPS
- Shop domain is automatically detected and included
- No customer personal data is captured beyond what Shopify provides

## Rate Limiting

The pixel includes built-in rate limiting:
- Maximum 10 events per batch
- 5-second batch timeout
- Exponential backoff on failures
- Uses `sendBeacon` for reliable page unload events

## Production Deployment

For production use:

1. Deploy your dashboard API to a reliable hosting provider
2. Use a custom domain with SSL certificate
3. Monitor API performance and error rates
4. Set up proper logging and alerting
5. Test thoroughly in a development store first

## Support

For issues related to:
- **Shopify pixel API**: Check Shopify's developer documentation
- **Dashboard API**: Check your server logs and API health endpoint
- **Event capture**: Enable debug mode and check browser console