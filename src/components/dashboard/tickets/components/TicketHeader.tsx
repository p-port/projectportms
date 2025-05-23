
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface TicketHeaderProps {
  onNewTicket: () => void;
  filter: 'all' | 'assigned' | 'open' | 'closed';
  setFilter: (filter: 'all' | 'assigned' | 'open' | 'closed') => void;
  isStaff: boolean;
  searchQuery?: string;
  onSearch?: (query: string) => void;
}

export const TicketHeader = ({ 
  onNewTicket, 
  filter, 
  setFilter, 
  isStaff,
  searchQuery = "",
  onSearch
}: TicketHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between gap-4">
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-semibold">Support Tickets</h2>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        {isStaff && onSearch && (
          <div className="relative flex items-center">
            <Search className="absolute left-2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tickets..." 
              className="pl-8 h-9 w-full sm:w-[180px]"
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>
        )}
        
        <Select
          value={filter}
          onValueChange={(value) => setFilter(value as any)}
        >
          <SelectTrigger className="h-9 w-full sm:w-[140px]">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tickets</SelectItem>
            {isStaff && (
              <SelectItem value="assigned">Assigned to Me</SelectItem>
            )}
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        
        <Button onClick={onNewTicket} size="sm" className="h-9">
          <PlusCircle className="h-4 w-4 mr-2" />
          New Ticket
        </Button>
      </div>
    </div>
  );
};
