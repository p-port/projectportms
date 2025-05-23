
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Reply } from "lucide-react";
import { useState } from "react";
import { MessageComposer } from "./MessageComposer";

interface MessageDetailProps {
  message: {
    id: string;
    subject: string;
    content: string;
    sender_id: string;
    sender_name?: string;
    created_at: string;
  };
  onBack: () => void;
}

export const MessageDetail = ({ message, onBack }: MessageDetailProps) => {
  const [replying, setReplying] = useState(false);

  if (replying) {
    return (
      <MessageComposer 
        onClose={() => setReplying(false)}
        replyTo={{
          userId: message.sender_id,
          userName: message.sender_name || 'User',
          subject: `Re: ${message.subject}`
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <Button variant="outline" size="sm" onClick={() => setReplying(true)}>
          <Reply className="h-4 w-4 mr-1" /> Reply
        </Button>
      </div>
      
      <div className="border rounded-md p-4 space-y-3">
        <div className="flex justify-between border-b pb-2">
          <div className="font-semibold text-lg">{message.subject || "(No subject)"}</div>
          <div className="text-sm text-muted-foreground">
            {format(new Date(message.created_at), 'PPpp')}
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">From:</span>
          <span>{message.sender_name || 'Unknown'}</span>
        </div>
        
        <div className="pt-4 whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    </div>
  );
};
