
import { Button } from "@/components/ui/button";
import { TicketIcon } from "lucide-react";

interface EmptyTicketStateProps {
  onNewTicket: () => void;
}

export const EmptyTicketState = ({ onNewTicket }: EmptyTicketStateProps) => {
  return (
    <div className="text-center p-8 border rounded-md bg-muted/20">
      <TicketIcon className="mx-auto h-12 w-12 text-muted-foreground" />
      <p className="mt-2 text-muted-foreground">No tickets yet</p>
      <Button onClick={onNewTicket} variant="outline" className="mt-4">
        Create your first support ticket
      </Button>
    </div>
  );
};
