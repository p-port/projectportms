
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { ArrowLeft, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Message } from "./services/MessageService";

interface MessageDetailProps {
  message: Message;
  onBack: () => void;
  onReply?: (replied: boolean) => void;
}

export const MessageDetail = ({ message, onBack, onReply }: MessageDetailProps) => {
  const [replyContent, setReplyContent] = useState("");
  const [sending, setSending] = useState(false);

  const handleReply = async () => {
    if (!replyContent.trim()) return;

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('messages')
        .insert({
          subject: `Re: ${message.subject}`,
          content: replyContent,
          sender_id: user.id,
          recipient_id: message.sender_id
        });

      if (error) throw error;

      setReplyContent("");
      toast.success("Reply sent successfully");
      
      // Notify parent component that a reply was sent
      if (onReply) {
        onReply(true);
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error("Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to messages
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold">{message.subject}</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>From: {message.sender_name || 'Unknown'}</span>
            <span>•</span>
            <span>{format(new Date(message.created_at), 'MMM d, yyyy h:mm a')}</span>
          </div>
        </div>

        <div className="bg-muted p-4 rounded-md whitespace-pre-wrap">
          {message.content}
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">Reply</h3>
          <Textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Write your reply here..."
            rows={5}
          />
          
          <div className="flex justify-end">
            <Button 
              className="flex items-center gap-1"
              onClick={handleReply}
              disabled={!replyContent.trim() || sending}
            >
              {sending ? 'Sending...' : 'Send Reply'}
              <Send className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
