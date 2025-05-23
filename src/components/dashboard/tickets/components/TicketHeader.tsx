
import { Button } from "@/components/ui/button";
import { Ticket } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TicketHeaderProps {
  onNewTicket: () => void;
  filter: 'all' | 'assigned' | 'open' | 'closed';
  setFilter: (filter: 'all' | 'assigned' | 'open' | 'closed') => void;
  isStaff: boolean;
}

export const TicketHeader = ({ onNewTicket, filter, setFilter, isStaff }: TicketHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-4">
        <h3 className="text-lg font-medium">Support Tickets</h3>
        
        {isStaff && (
          <Select value={filter} onValueChange={(value) => setFilter(value as any)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter tickets" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tickets</SelectItem>
              <SelectItem value="assigned">Assigned to me</SelectItem>
              <SelectItem value="open">Open tickets</SelectItem>
              <SelectItem value="closed">Closed tickets</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
      
      <Button onClick={onNewTicket} size="sm">
        <Ticket className="mr-2 h-4 w-4" />
        New Ticket
      </Button>
    </div>
  );
};
