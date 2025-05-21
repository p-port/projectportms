
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

interface MessageHeaderProps {
  onNewMessage: () => void;
}

export const MessageHeader = ({ onNewMessage }: MessageHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <h3 className="text-lg font-medium">Your Messages</h3>
      <Button onClick={onNewMessage} size="sm">
        <Mail className="mr-2 h-4 w-4" />
        New Message
      </Button>
    </div>
  );
};
