
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RecipientSelect } from "./components/RecipientSelect";
import { MessageForm } from "./components/MessageForm";
import { MessageActions } from "./components/MessageActions";

interface MessageComposerProps {
  onClose: (messageSent?: boolean) => void;
  replyTo?: {
    userId: string;
    userName: string;
    subject: string;
  };
}

export const MessageComposer = ({ onClose, replyTo }: MessageComposerProps) => {
  const [subject, setSubject] = useState(replyTo?.subject || "");
  const [content, setContent] = useState("");
  const [recipient, setRecipient] = useState(replyTo?.userId || "");
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const validateMessage = () => {
    if (!recipient) {
      toast({
        title: "Recipient required",
        description: "Please select a recipient for your message",
        variant: "destructive"
      });
      return false;
    }

    if (!content.trim()) {
      toast({
        title: "Message content required",
        description: "Please enter a message",
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };

  const handleSend = async () => {
    if (!validateMessage()) return;
    
    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('messages')
        .insert({
          subject,
          content,
          sender_id: user.id,
          recipient_id: recipient
        });

      if (error) throw error;

      onClose(true);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Failed to send message",
        description: "Please try again later",
        variant: "destructive"
      });
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">New Message</h3>
        <Button variant="ghost" size="sm" onClick={() => onClose()}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        <RecipientSelect 
          value={recipient}
          onChange={setRecipient}
          disabled={!!replyTo}
          replyToName={replyTo?.userName}
        />

        <MessageForm 
          subject={subject}
          content={content}
          onSubjectChange={setSubject}
          onContentChange={setContent}
        />

        <MessageActions 
          onCancel={() => onClose()}
          onSend={handleSend}
          sending={sending}
        />
      </div>
    </div>
  );
};
