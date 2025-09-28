import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
    period: string;
  };
  description?: string;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
}

export default function MetricsCard({ 
  title, 
  value, 
  change, 
  description,
  variant = 'default' 
}: MetricsCardProps) {
  const getChangeIcon = () => {
    switch (change?.type) {
      case 'increase':
        return <TrendingUp className="w-3 h-3" />;
      case 'decrease':
        return <TrendingDown className="w-3 h-3" />;
      default:
        return <Minus className="w-3 h-3" />;
    }
  };

  const getChangeColor = () => {
    switch (change?.type) {
      case 'increase':
        return 'text-green-600 dark:text-green-400';
      case 'decrease':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-muted-foreground';
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'border-green-200 dark:border-green-800';
      case 'warning':
        return 'border-orange-200 dark:border-orange-800';
      case 'destructive':
        return 'border-red-200 dark:border-red-800';
      default:
        return '';
    }
  };

  return (
    <Card className={`p-6 hover-elevate ${getVariantStyles()}`} data-testid={`card-metric-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground" data-testid="text-metric-title">
            {title}
          </h3>
          {variant !== 'default' && (
            <Badge 
              variant={variant === 'success' ? 'default' : variant === 'warning' ? 'secondary' : 'destructive'}
              className="text-xs"
            >
              {variant}
            </Badge>
          )}
        </div>
        
        <div className="flex items-end justify-between">
          <div>
            <div className="text-2xl font-bold text-foreground" data-testid="text-metric-value">
              {value}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground mt-1" data-testid="text-metric-description">
                {description}
              </p>
            )}
          </div>
          
          {change && (
            <div className={`flex items-center gap-1 text-xs ${getChangeColor()}`} data-testid="text-metric-change">
              {getChangeIcon()}
              <span>{Math.abs(change.value)}%</span>
              <span className="text-muted-foreground">vs {change.period}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}