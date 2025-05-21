
import { Button } from "@/components/ui/button";
import { ArrowLeft, Send } from "lucide-react";

interface MessageActionsProps {
  onCancel: () => void;
  onSend: () => void;
  sending: boolean;
}

export const MessageActions = ({ onCancel, onSend, sending }: MessageActionsProps) => {
  return (
    <div className="flex justify-between">
      <Button variant="outline" onClick={onCancel}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Cancel
      </Button>
      <Button onClick={onSend} disabled={sending}>
        <Send className="h-4 w-4 mr-1" /> Send Message
      </Button>
    </div>
  );
};
