
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Clock, CheckCircle2, AlertCircle, User, Hash } from "lucide-react";
import { Ticket } from "../TicketList";

interface TicketTableProps {
  tickets: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
  isStaff: boolean;
}

export const TicketTable = ({ tickets, onSelectTicket, isStaff }: TicketTableProps) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="destructive" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Open</Badge>;
      case 'in-progress':
        return <Badge variant="default" className="flex items-center gap-1 bg-amber-500"><Clock className="h-3 w-3" /> In Progress</Badge>;
      case 'closed':
        return <Badge variant="outline" className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Closed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertCircle className="h-3 w-3" /> High</Badge>;
      case 'normal':
        return <Badge variant="secondary">Normal</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return null;
    }
  };

  return (
    <Table className="border rounded-md">
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Status</TableHead>
          {isStaff && <TableHead>Requester</TableHead>}
          <TableHead className="w-[40%]">Title</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Date</TableHead>
          {isStaff && <TableHead>Assigned To</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {tickets.map((ticket) => (
          <TableRow 
            key={ticket.id} 
            className="cursor-pointer hover:bg-muted"
            onClick={() => onSelectTicket(ticket)}
          >
            <TableCell className="font-mono text-xs">
              {ticket.ticket_number || 'Unknown'}
            </TableCell>
            <TableCell>
              {getStatusBadge(ticket.status)}
            </TableCell>
            {isStaff && (
              <TableCell className="font-medium">
                {ticket.creator_name}
              </TableCell>
            )}
            <TableCell className="font-medium">{ticket.title}</TableCell>
            <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
            <TableCell>
              {format(new Date(ticket.created_at), 'MMM d, yyyy')}
            </TableCell>
            {isStaff && (
              <TableCell>
                {ticket.assigned_name ? (
                  <div className="flex items-center">
                    <User className="h-3 w-3 mr-1 text-muted-foreground" />
                    {ticket.assigned_name}
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">Unassigned</span>
                )}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
