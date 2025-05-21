
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

interface Message {
  id: string;
  subject: string;
  content: string;
  sender_id: string;
  recipient_id: string;
  is_read: boolean;
  created_at: string;
  sender_name?: string;
}

interface MessageTableProps {
  messages: Message[];
  onSelectMessage: (message: Message) => void;
}

export const MessageTable = ({ messages, onSelectMessage }: MessageTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Status</TableHead>
          <TableHead>From</TableHead>
          <TableHead>Subject</TableHead>
          <TableHead>Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {messages.map((message) => (
          <TableRow 
            key={message.id} 
            className="cursor-pointer hover:bg-muted"
            onClick={() => onSelectMessage(message)}
          >
            <TableCell>
              {!message.is_read ? (
                <Badge variant="default">New</Badge>
              ) : (
                <Badge variant="outline">Read</Badge>
              )}
            </TableCell>
            <TableCell className="font-medium">
              {message.sender_name}
            </TableCell>
            <TableCell>{message.subject || "(No subject)"}</TableCell>
            <TableCell>
              {format(new Date(message.created_at), 'MMM d, yyyy')}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
