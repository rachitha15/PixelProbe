import MetricsCard from '../MetricsCard';

export default function MetricsCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricsCard
        title="Total Events"
        value="12,543"
        change={{ value: 12.5, type: 'increase', period: 'last 24h' }}
        description="Events captured today"
      />
      
      <MetricsCard
        title="Unique Visitors"
        value="2,847"
        change={{ value: 8.2, type: 'increase', period: 'yesterday' }}
        description="Active shoppers"
        variant="success"
      />
      
      <MetricsCard
        title="Cart Updates"
        value="456"
        change={{ value: 3.1, type: 'decrease', period: 'last week' }}
        description="Items added to cart"
        variant="warning"
      />
      
      <MetricsCard
        title="Conversion Rate"
        value="3.42%"
        change={{ value: 0.5, type: 'neutral', period: 'last month' }}
        description="Purchase completion"
      />
    </div>
  );
}