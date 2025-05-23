import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Ticket } from "./TicketList";

interface NewTicketProps {
  userId?: string;
  onCancel: () => void;
  onTicketCreated: (ticket: Ticket) => void;
}

export const NewTicket = ({ userId, onCancel, onTicketCreated }: NewTicketProps) => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("normal");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const validateForm = () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your ticket",
        variant: "destructive"
      });
      return false;
    }

    if (!message.trim()) {
      toast({
        title: "Message required",
        description: "Please enter a message describing your issue",
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!userId || !validateForm()) return;
    
    setSubmitting(true);
    try {
      // First, create the ticket
      const { data: ticketData, error: ticketError } = await supabase
        .from('support_tickets')
        .insert({
          title: title.trim(),
          priority,
          creator_id: userId,
          status: 'open'
        })
        .select()
        .single();

      if (ticketError) {
        console.error("Ticket creation error:", ticketError);
        throw ticketError;
      }
      
      if (!ticketData) {
        throw new Error("Failed to create ticket");
      }
      
      // Then add the first message
      const { error: messageError } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticketData.id,
          content: message.trim(),
          sender_id: userId
        });

      if (messageError) {
        console.error("Message creation error:", messageError);
        throw messageError;
      }

      // Fetch creator name separately since we can't use join directly
      const { data: creatorData } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', userId)
        .single();
      
      const creatorName = creatorData?.name || 'Unknown';
      const initials = creatorName !== 'Unknown' 
        ? creatorName.split(' ').map(name => name[0].toUpperCase()).join('')
        : 'XX';
      const ticketShortId = ticketData.id.substring(0, 6).toUpperCase();
      
      // Format ticket with creator name and ticket number for return
      const formattedTicket: Ticket = {
        ...ticketData,
        creator_name: creatorName,
        ticket_number: `${initials}-${ticketShortId}`
      };

      onTicketCreated(formattedTicket);
      
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        title: "Failed to create ticket",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">New Support Ticket</h3>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Cancel
        </Button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief description of the issue"
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={priority}
              onValueChange={setPriority}
              disabled={submitting}
            >
              <SelectTrigger id="priority">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe your issue in detail"
            disabled={submitting}
            rows={8}
          />
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={handleSubmit}
            disabled={!title.trim() || !message.trim() || submitting}
          >
            <Send className="h-4 w-4 mr-1" />
            {submitting ? "Submitting..." : "Submit Ticket"}
          </Button>
        </div>
      </div>
    </div>
  );
};
