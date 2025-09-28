import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Copy, ExternalLink } from "lucide-react";
import { useState } from "react";

interface EventData {
  id: string;
  name: string;
  timestamp: string;
  customerId?: string;
  url: string;
  data: Record<string, any>;
}

interface EventCardProps {
  event: EventData;
}

const EVENT_COLORS = {
  page_viewed: "bg-blue-500",
  product_viewed: "bg-green-500", 
  cart_updated: "bg-orange-500",
  checkout_started: "bg-purple-500",
  payment_info_submitted: "bg-indigo-500",
  default: "bg-gray-500"
} as const;

export default function EventCard({ event }: EventCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const eventColor = EVENT_COLORS[event.name as keyof typeof EVENT_COLORS] || EVENT_COLORS.default;
  
  const copyEventData = () => {
    navigator.clipboard.writeText(JSON.stringify(event.data, null, 2));
    console.log('Event data copied to clipboard');
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Card className="p-4 hover-elevate" data-testid={`card-event-${event.id}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${eventColor}`} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground" data-testid={`text-event-name-${event.id}`}>
                {event.name}
              </span>
              <Badge variant="outline" className="text-xs" data-testid={`badge-event-id-${event.id}`}>
                {event.id}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground" data-testid={`text-timestamp-${event.id}`}>
              {formatTimestamp(event.timestamp)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {event.customerId && (
            <Badge variant="secondary" data-testid={`badge-customer-${event.id}`}>
              Customer: {event.customerId}
            </Badge>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            data-testid={`button-expand-${event.id}`}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <div className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
        <ExternalLink className="w-3 h-3" />
        <span className="truncate" data-testid={`text-url-${event.id}`}>{event.url}</span>
      </div>

      {isExpanded && (
        <div className="mt-4 border-t pt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-sm">Event Data</h4>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={copyEventData}
              data-testid={`button-copy-${event.id}`}
            >
              <Copy className="w-3 h-3 mr-1" />
              Copy
            </Button>
          </div>
          <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto font-mono">
            <code data-testid={`code-event-data-${event.id}`}>
              {JSON.stringify(event.data, null, 2)}
            </code>
          </pre>
        </div>
      )}
    </Card>
  );
}