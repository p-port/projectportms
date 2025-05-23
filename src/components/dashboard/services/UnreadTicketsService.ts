
import { supabase } from "@/integrations/supabase/client";

export const fetchUnreadTicketsCount = async (userId: string | undefined, userRole: string) => {
  try {
    if (!userId) return 0;
    
    // For support and admin roles, count all unread tickets
    if (userRole === 'admin' || userRole === 'support') {
      const { count: createdCount, error: createdError } = await supabase
        .from('support_tickets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open');
      
      if (createdError) throw createdError;
      
      return createdCount || 0;
    } 
    
    // For regular users, count only their own unread tickets
    else {
      const { count, error } = await supabase
        .from('support_tickets')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', userId)
        .eq('status', 'open');
        
      if (error) throw error;
      return count || 0;
    }
  } catch (error) {
    console.error('Error loading unread tickets count:', error);
    return 0;
  }
};

export const subscribeToTicketUpdates = (
  userId: string | undefined,
  userRole: string,
  onNewTicket: () => void,
  onTicketRead: () => void
) => {
  if (!userId) return null;
  
  const channel = supabase
    .channel('tickets-changes')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'support_tickets' },
      (payload) => {
        // For support/admin, notify on any new ticket
        // For regular users, only notify if it's their ticket
        if ((userRole === 'admin' || userRole === 'support') || 
            payload.new.creator_id === userId) {
          onNewTicket();
        }
      }
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'ticket_messages' },
      async (payload) => {
        // Get the ticket to determine who should be notified
        const { data: ticket } = await supabase
          .from('support_tickets')
          .select('*')
          .eq('id', payload.new.ticket_id)
          .single();
        
        if (!ticket) return;
        
        // Notify if:
        // 1. User is support/admin, or
        // 2. User is the ticket creator and message is not from them
        if ((userRole === 'admin' || userRole === 'support') || 
            (ticket.creator_id === userId && payload.new.sender_id !== userId)) {
          onNewTicket();
        }
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'support_tickets' },
      (payload) => {
        // When a ticket is closed or status changes
        if (payload.new.status === 'closed' && payload.old.status === 'open') {
          if ((userRole === 'admin' || userRole === 'support') || 
              payload.new.creator_id === userId) {
            onTicketRead();
          }
        }
      }
    )
    .subscribe();
    
  return channel;
};
