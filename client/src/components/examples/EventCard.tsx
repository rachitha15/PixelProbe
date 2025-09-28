import EventCard from '../EventCard';

export default function EventCardExample() {
  const mockEvent = {
    id: "evt_1234567890",
    name: "product_viewed",
    timestamp: new Date().toISOString(),
    customerId: "cust_abc123",
    url: "https://demo-store.myshopify.com/products/awesome-widget",
    data: {
      product: {
        id: "prod_12345",
        title: "Awesome Widget",
        price: 29.99,
        vendor: "Widget Co",
        type: "gadget"
      },
      customer: {
        id: "cust_abc123",
        email: "customer@example.com",
        firstName: "John",
        lastName: "Doe"
      },
      context: {
        page: {
          title: "Awesome Widget - Demo Store",
          url: "https://demo-store.myshopify.com/products/awesome-widget"
        },
        timestamp: new Date().toISOString()
      }
    }
  };
  
  return <EventCard event={mockEvent} />;
}