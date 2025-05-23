
import { supabase } from "@/integrations/supabase/client";

export const fetchUnreadMessagesCount = async (userId: string | undefined) => {
  try {
    if (!userId) return 0;
    
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('is_read', false);
      
    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error loading unread messages count:', error);
    return 0;
  }
};

export const subscribeToMessageUpdates = (
  userId: string | undefined,
  onNewMessage: () => void,
  onMessageRead: () => void
) => {
  if (!userId) return null;
  
  const channel = supabase
    .channel('messages-changes')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      (payload) => {
        if (payload.new.recipient_id === userId) {
          onNewMessage();
        }
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'messages' },
      (payload) => {
        if (payload.new.recipient_id === userId) {
          if (!payload.new.is_read && payload.old.is_read) {
            onNewMessage();
          }
          
          if (payload.new.is_read && !payload.old.is_read) {
            onMessageRead();
          }
        }
      }
    )
    .subscribe();
    
  return channel;
};
