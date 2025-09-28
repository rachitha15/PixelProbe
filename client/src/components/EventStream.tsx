import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, Pause, Search, Filter, RotateCcw } from "lucide-react";
import EventCard from "./EventCard";

interface EventData {
  id: string;
  name: string;
  timestamp: string;
  clientId?: string | null;
  shopDomain: string;
  context: any;
  data: Record<string, any>;
}

interface EventStreamProps {
  events?: EventData[];
  isLive?: boolean;
  onToggleLive?: () => void;
}

export default function EventStream({ 
  events = [], 
  isLive = true, 
  onToggleLive 
}: EventStreamProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEventType, setSelectedEventType] = useState<string>("");
  const [filteredEvents, setFilteredEvents] = useState(events);

  // Filter events based on search and event type
  useEffect(() => {
    let filtered = events;

    if (searchTerm) {
      filtered = filtered.filter(event => 
        event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.shopDomain.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.clientId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedEventType) {
      filtered = filtered.filter(event => event.name === selectedEventType);
    }

    setFilteredEvents(filtered);
  }, [events, searchTerm, selectedEventType]);

  const eventTypes = Array.from(new Set(events.map(event => event.name)));

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedEventType("");
  };

  return (
    <div className="space-y-4">
      {/* Controls Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant={isLive ? "default" : "secondary"}
            size="sm"
            onClick={onToggleLive}
            data-testid="button-toggle-live"
          >
            {isLive ? <Pause className="w-3 h-3 mr-1" /> : <Play className="w-3 h-3 mr-1" />}
            {isLive ? "Pause" : "Resume"} Live
          </Button>
          
          {isLive && (
            <Badge variant="outline" className="animate-pulse text-green-600 border-green-600">
              Live
            </Badge>
          )}
        </div>

        <div className="text-sm text-muted-foreground" data-testid="text-event-count">
          {filteredEvents.length} of {events.length} events
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search events, URLs, or customer IDs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
        </div>
        
        <div className="flex gap-2">
          <div className="flex gap-1 flex-wrap">
            {eventTypes.map(eventType => (
              <Button
                key={eventType}
                variant={selectedEventType === eventType ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedEventType(
                  selectedEventType === eventType ? "" : eventType
                )}
                data-testid={`button-filter-${eventType}`}
              >
                <Filter className="w-3 h-3 mr-1" />
                {eventType}
              </Button>
            ))}
          </div>
          
          {(searchTerm || selectedEventType) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              data-testid="button-clear-filters"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Event Stream */}
      <ScrollArea className="h-[600px] w-full border rounded-md">
        <div className="p-4 space-y-4" data-testid="container-event-stream">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground">
                {events.length === 0 ? (
                  "No events captured yet. Events will appear here as they're tracked."
                ) : (
                  "No events match your current filters."
                )}
              </div>
            </div>
          ) : (
            filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}