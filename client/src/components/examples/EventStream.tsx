import EventStream from '../EventStream';

export default function EventStreamExample() {
  // TODO: remove mock functionality
  const mockEvents = [
    {
      id: "evt_001",
      name: "page_viewed",
      timestamp: new Date(Date.now() - 30000).toISOString(),
      customerId: "cust_123",
      url: "https://demo-store.myshopify.com/",
      data: {
        page: { title: "Home Page", url: "/" },
        customer: { id: "cust_123", email: "john@example.com" }
      }
    },
    {
      id: "evt_002", 
      name: "product_viewed",
      timestamp: new Date(Date.now() - 45000).toISOString(),
      customerId: "cust_456",
      url: "https://demo-store.myshopify.com/products/widget",
      data: {
        product: { id: "prod_123", title: "Super Widget", price: 29.99 },
        customer: { id: "cust_456", email: "jane@example.com" }
      }
    },
    {
      id: "evt_003",
      name: "cart_updated", 
      timestamp: new Date(Date.now() - 60000).toISOString(),
      customerId: "cust_789",
      url: "https://demo-store.myshopify.com/cart",
      data: {
        cart: { 
          total_price: 59.98,
          item_count: 2,
          items: [
            { product_id: "prod_123", quantity: 2, price: 29.99 }
          ]
        },
        customer: { id: "cust_789", email: "bob@example.com" }
      }
    },
    {
      id: "evt_004",
      name: "checkout_started",
      timestamp: new Date(Date.now() - 90000).toISOString(), 
      customerId: "cust_101",
      url: "https://demo-store.myshopify.com/checkout",
      data: {
        checkout: { total_price: 149.99, currency: "USD" },
        customer: { id: "cust_101", email: "alice@example.com" }
      }
    }
  ];

  const handleToggleLive = () => {
    console.log('Toggle live stream');
  };

  return (
    <EventStream 
      events={mockEvents}
      isLive={true}
      onToggleLive={handleToggleLive}
    />
  );
}