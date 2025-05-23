
import { Button } from "@/components/ui/button";
import { Ticket } from "lucide-react";

interface TicketHeaderProps {
  onNewTicket: () => void;
  isStaff: boolean;
}

export const TicketHeader = ({ onNewTicket, isStaff }: TicketHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <h3 className="text-lg font-medium">
        {isStaff ? "Support Tickets" : "Your Support Tickets"}
      </h3>
      <Button onClick={onNewTicket} size="sm">
        <Ticket className="mr-2 h-4 w-4" />
        New Ticket
      </Button>
    </div>
  );
};
