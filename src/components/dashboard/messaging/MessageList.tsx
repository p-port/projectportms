
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Mail, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MessageComposer } from "./MessageComposer";
import { MessageDetail } from "./MessageDetail";

interface Message {
  id: string;
  subject: string;
  content: string;
  sender_id: string;
  recipient_id: string;
  is_read: boolean;
  created_at: string;
  sender_name?: string;
}

export const MessageList = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [showComposer, setShowComposer] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('messages')
          .select(`
            *,
            sender:sender_id(name)
          `)
          .eq('recipient_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Format messages with sender name
        const formattedMessages = data.map(message => ({
          ...message,
          sender_name: message.sender ? (message.sender as any).name : 'Unknown'
        }));

        setMessages(formattedMessages);
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast({
          title: "Error loading messages",
          description: "Please try again later",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel('messages-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          // Only add the message if it's for the current user
          const { data: { user } } = supabase.auth.getUser();
          if (user && payload.new.recipient_id === user.id) {
            // Fetch the complete message with sender info
            fetchSingleMessage(payload.new.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const fetchSingleMessage = async (messageId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:sender_id(name)
      `)
      .eq('id', messageId)
      .single();

    if (error) {
      console.error('Error fetching message:', error);
      return;
    }

    if (data) {
      const formattedMessage = {
        ...data,
        sender_name: data.sender ? (data.sender as any).name : 'Unknown'
      };

      setMessages(prevMessages => [formattedMessage, ...prevMessages]);

      toast({
        title: "New Message",
        description: `You have received a new message: ${data.subject}`,
      });
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId);

      if (error) throw error;

      // Update local state
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === messageId ? { ...msg, is_read: true } : msg
        )
      );
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const handleMessageSelect = (message: Message) => {
    setSelectedMessage(message);
    if (!message.is_read) {
      markAsRead(message.id);
    }
  };

  const handleComposerClose = (messageSent: boolean) => {
    setShowComposer(false);
    if (messageSent) {
      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully"
      });
    }
  };

  const handleBackToList = () => {
    setSelectedMessage(null);
  };

  if (loading) {
    return <div className="flex justify-center p-4">Loading messages...</div>;
  }

  if (selectedMessage) {
    return (
      <MessageDetail 
        message={selectedMessage} 
        onBack={handleBackToList} 
      />
    );
  }

  if (showComposer) {
    return <MessageComposer onClose={handleComposerClose} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Your Messages</h3>
        <Button onClick={() => setShowComposer(true)} size="sm">
          <Mail className="mr-2 h-4 w-4" />
          New Message
        </Button>
      </div>

      {messages.length === 0 ? (
        <div className="text-center p-8 border rounded-md bg-muted/20">
          <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">No messages yet</p>
          <Button onClick={() => setShowComposer(true)} variant="outline" className="mt-4">
            Send your first message
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>From</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {messages.map((message) => (
              <TableRow 
                key={message.id} 
                className="cursor-pointer hover:bg-muted"
                onClick={() => handleMessageSelect(message)}
              >
                <TableCell>
                  {!message.is_read ? (
                    <Badge variant="default">New</Badge>
                  ) : (
                    <Badge variant="outline">Read</Badge>
                  )}
                </TableCell>
                <TableCell className="font-medium">
                  {message.sender_name}
                </TableCell>
                <TableCell>{message.subject || "(No subject)"}</TableCell>
                <TableCell>
                  {format(new Date(message.created_at), 'MMM d, yyyy')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};
