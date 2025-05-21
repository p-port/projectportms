
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MessageComposer } from "./MessageComposer";
import { MessageDetail } from "./MessageDetail";
import { MessageHeader } from "./components/MessageHeader";
import { EmptyMessageState } from "./components/EmptyMessageState";
import { MessageTable } from "./components/MessageTable";
import { 
  fetchUserMessages, 
  fetchSingleMessage, 
  markMessageAsRead,
  subscribeToNewMessages,
  Message
} from "./services/MessageService";

export const MessageList = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [showComposer, setShowComposer] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const fetchedMessages = await fetchUserMessages();
        setMessages(fetchedMessages);
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

    loadMessages();

    // Subscribe to new messages
    const channel = subscribeToNewMessages(async (messageId) => {
      const newMessage = await fetchSingleMessage(messageId);
      if (newMessage) {
        setMessages(prevMessages => [newMessage, ...prevMessages]);
        toast({
          title: "New Message",
          description: `You have received a new message: ${newMessage.subject}`,
        });
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const handleMessageSelect = async (message: Message) => {
    setSelectedMessage(message);
    if (!message.is_read) {
      const success = await markMessageAsRead(message.id);
      if (success) {
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === message.id ? { ...msg, is_read: true } : msg
          )
        );
      }
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
      <MessageHeader onNewMessage={() => setShowComposer(true)} />

      {messages.length === 0 ? (
        <EmptyMessageState onNewMessage={() => setShowComposer(true)} />
      ) : (
        <MessageTable 
          messages={messages} 
          onSelectMessage={handleMessageSelect} 
        />
      )}
    </div>
  );
};
