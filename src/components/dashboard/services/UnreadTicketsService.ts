
import { supabase } from "@/integrations/supabase/client";

export const fetchUnreadTicketsCount = async (userId: string | undefined) => {
  try {
    if (!userId) return 0;
    
    // Determine if user is support staff
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    
    if (profileError) throw profileError;
    
    const isStaff = userProfile?.role === 'admin' || userProfile?.role === 'support';
    
    let query;
    
    if (isStaff) {
      // For support staff, count unread tickets assigned to them or unassigned
      query = supabase
        .from('support_tickets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open');
    } else {
      // For regular users, only count their own open tickets
      query = supabase
        .from('support_tickets')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', userId)
        .eq('status', 'open');
    }
      
    const { count, error } = await query;
      
    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error loading unread tickets count:', error);
    return 0;
  }
};

export const subscribeToTicketUpdates = (
  userId: string | undefined,
  onTicketUpdate: () => void
) => {
  if (!userId) return null;
  
  const channel = supabase
    .channel('tickets-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'support_tickets' },
      () => {
        onTicketUpdate();
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'ticket_messages' },
      () => {
        onTicketUpdate();
      }
    )
    .subscribe();
    
  return channel;
};
