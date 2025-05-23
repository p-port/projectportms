
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import type { Ticket } from "../TicketList";

interface TicketTableProps {
  tickets: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
  isStaff: boolean;
}

export const TicketTable = ({ tickets, onSelectTicket, isStaff }: TicketTableProps) => {
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return <Badge variant="default">Open</Badge>;
      case 'in_progress':
        return <Badge variant="secondary">In Progress</Badge>;
      case 'resolved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Resolved</Badge>;
      case 'closed':
        return <Badge variant="outline">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'normal':
        return <Badge variant="secondary">Normal</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Status</TableHead>
          <TableHead>Title</TableHead>
          {isStaff && <TableHead>Creator</TableHead>}
          {isStaff && <TableHead>Assigned To</TableHead>}
          <TableHead>Priority</TableHead>
          <TableHead>Last Update</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tickets.map((ticket) => (
          <TableRow 
            key={ticket.id} 
            className="cursor-pointer hover:bg-muted"
            onClick={() => onSelectTicket(ticket)}
          >
            <TableCell>{getStatusBadge(ticket.status)}</TableCell>
            <TableCell className="font-medium">{ticket.title}</TableCell>
            {isStaff && <TableCell>{ticket.creator_name}</TableCell>}
            {isStaff && (
              <TableCell>
                {ticket.assignee_name || <span className="text-muted-foreground text-sm">Unassigned</span>}
              </TableCell>
            )}
            <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {formatDistanceToNow(new Date(ticket.updated_at || ticket.created_at), { addSuffix: true })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
