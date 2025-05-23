
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

interface EmptyMessageStateProps {
  onNewMessage: () => void;
}

export const EmptyMessageState = ({ onNewMessage }: EmptyMessageStateProps) => {
  return (
    <div className="text-center p-8 border rounded-md bg-muted/20">
      <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
      <p className="mt-2 text-muted-foreground">No messages yet</p>
      <Button onClick={onNewMessage} variant="outline" className="mt-4">
        Send your first message
      </Button>
    </div>
  );
};
