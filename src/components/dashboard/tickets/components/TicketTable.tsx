
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Ticket } from "../TicketList";
import { Badge } from "@/components/ui/badge";

interface TicketTableProps {
  tickets: Ticket[];
  onSelectTicket: (ticketId: string) => void; // Updated to accept ticketId instead of Ticket object
  isStaff: boolean;
}

export const TicketTable = ({ tickets, onSelectTicket, isStaff }: TicketTableProps) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-blue-500">{status}</Badge>;
      case 'in_progress':
        return <Badge className="bg-yellow-500">in progress</Badge>;
      case 'resolved':
        return <Badge className="bg-green-500">{status}</Badge>;
      case 'closed':
        return <Badge variant="outline">{status}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'low':
        return <Badge variant="outline" className="border-blue-500 text-blue-500">{priority}</Badge>;
      case 'normal':
        return <Badge variant="outline">{priority}</Badge>;
      case 'high':
        return <Badge variant="outline" className="border-orange-500 text-orange-500">{priority}</Badge>;
      case 'urgent':
        return <Badge variant="outline" className="border-red-500 text-red-500">{priority}</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };
  
  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Created</TableHead>
            {isStaff && <TableHead>Created By</TableHead>}
            {isStaff && <TableHead>Assigned To</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => (
            <TableRow 
              key={ticket.id} 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onSelectTicket(ticket.id)} // Now passing just the ticketId
            >
              <TableCell className="font-mono text-xs">
                {ticket.id.split('-')[0]}...
              </TableCell>
              <TableCell>{ticket.title}</TableCell>
              <TableCell>{getStatusBadge(ticket.status)}</TableCell>
              <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
              <TableCell>{format(new Date(ticket.created_at), 'MMM d')}</TableCell>
              {isStaff && <TableCell>{ticket.creator_name || 'Unknown'}</TableCell>}
              {isStaff && <TableCell>{ticket.assigned_name || 'Unassigned'}</TableCell>}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
