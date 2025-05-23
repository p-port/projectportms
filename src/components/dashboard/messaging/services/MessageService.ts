
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
    .subscribe();

  return channel;
};
