
import { Button } from "@/components/ui/button";
import { Ticket } from "lucide-react";

interface EmptyTicketStateProps {
  onNewTicket: () => void;
}

export const EmptyTicketState = ({ onNewTicket }: EmptyTicketStateProps) => {
  return (
    <div className="text-center p-8 border rounded-md bg-muted/20">
      <Ticket className="mx-auto h-12 w-12 text-muted-foreground" />
      <p className="mt-2 text-muted-foreground">No tickets yet</p>
      <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
        Create a new support ticket if you need assistance with the app or have questions about your motorcycle service.
      </p>
      <Button onClick={onNewTicket} variant="outline" className="mt-4">
        Create Your First Ticket
      </Button>
    </div>
  );
};
