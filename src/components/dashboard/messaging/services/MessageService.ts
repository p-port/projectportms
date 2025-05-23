
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Message {
  id: string;
  subject: string;
  content: string;
  sender_id: string;
  recipient_id: string;
  is_read: boolean;
  created_at: string;
  sender_name?: string;
}

export const fetchUserMessages = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

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

    return formattedMessages;
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
};

export const fetchSingleMessage = async (messageId: string) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:sender_id(name)
      `)
      .eq('id', messageId)
      .single();

    if (error) throw error;

    if (data) {
      const formattedMessage = {
        ...data,
        sender_name: data.sender ? (data.sender as any).name : 'Unknown'
      };

      return formattedMessage;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching message:', error);
    return null;
  }
};

export const markMessageAsRead = async (messageId: string) => {
  try {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', messageId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error marking message as read:', error);
    return false;
  }
};

export const subscribeToNewMessages = (onNewMessage: (messageId: string) => void) => {
  const channel = supabase
    .channel('messages-channel')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      async (payload) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && payload.new.recipient_id === user.id) {
          onNewMessage(payload.new.id);
        }
      }
    )
    .subscribe((status) => {
      console.log('Messages real-time subscription status:', status);
    });

  return channel;
};

// Enhanced function to subscribe to specific ticket messages with improved real-time updates
export const subscribeToTicketMessages = (
  ticketId: string,
  onNewMessage: (message: any) => void
) => {
  console.log(`Setting up real-time subscription for ticket: ${ticketId}`);
  
  // Create a unique channel name for this ticket
  const channelName = `ticket-messages-${ticketId}-${Date.now()}`;
  
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'ticket_messages',
        filter: `ticket_id=eq.${ticketId}`
      },
      async (payload) => {
        console.log('New ticket message received via real-time:', payload);
        
        try {
          // Get sender name
          let senderName = 'Unknown';
          if (payload.new.sender_id) {
            const { data } = await supabase
              .from('profiles')
              .select('name')
              .eq('id', payload.new.sender_id)
              .single();
              
            if (data) {
              senderName = data.name;
            }
          } else {
            senderName = 'System';
          }
          
          const messageWithSender = {
            ...payload.new,
            sender_name: senderName
          };
          
          console.log('Processed message with sender:', messageWithSender);
          onNewMessage(messageWithSender);
        } catch (error) {
          console.error('Error processing real-time message:', error);
        }
      }
    )
    .subscribe((status) => {
      console.log(`Ticket messages real-time subscription status for ${ticketId}:`, status);
    });

  return channel;
};
