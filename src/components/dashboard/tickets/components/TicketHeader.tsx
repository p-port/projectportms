
import { Button } from "@/components/ui/button";
import { Ticket } from "lucide-react";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TicketHeaderProps {
  onNewTicket: () => void;
  isStaff: boolean;
  onFilterChange?: (status: string) => void;
}

export const TicketHeader = ({ onNewTicket, isStaff, onFilterChange }: TicketHeaderProps) => {
  const [filter, setFilter] = useState<string>("all");
  
  const handleFilterChange = (value: string) => {
    setFilter(value);
    if (onFilterChange) {
      onFilterChange(value);
    }
  };
  
  return (
    <div className="flex justify-between items-center mb-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <h3 className="text-lg font-medium">
          {isStaff ? "Support Tickets" : "Your Support Tickets"}
        </h3>
        
        {isStaff && (
          <Select value={filter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="Filter tickets" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tickets</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
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
