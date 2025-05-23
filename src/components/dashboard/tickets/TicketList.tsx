
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TicketHeader } from "./components/TicketHeader";
import { TicketTable } from "./components/TicketTable";
import { EmptyTicketState } from "./components/EmptyTicketState";
import { TicketDetail } from "./TicketDetail"; 
import { NewTicket } from "./NewTicket";

export interface Ticket {
  id: string;
  title: string;
  status: string;
  priority: string;
  creator_id: string;
  created_at: string;
  updated_at: string;
  assigned_to?: string;
  creator_name?: string;
  assigned_name?: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  content: string;
  sender_id: string;
  created_at: string;
  sender_name?: string;
}

interface TicketListProps {
  userId?: string;
  userRole?: string;
}

export const TicketList = ({ userId, userRole = 'mechanic' }: TicketListProps) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [filter, setFilter] = useState<'all' | 'assigned' | 'open' | 'closed'>('all');
  const { toast } = useToast();

  const isStaff = userRole === 'admin' || userRole === 'support';

  const fetchTickets = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('support_tickets')
        .select(`
          *,
          creator:creator_id(name),
          assignee:assigned_to(name)
        `)
        .order('created_at', { ascending: false });
      
      // Filter tickets based on user role
      if (!isStaff) {
        // Regular users can only see their own tickets
        query = query.eq('creator_id', userId);
      }
      
      // Apply additional filters
      if (filter === 'assigned' && isStaff) {
        query = query.eq('assigned_to', userId);
      } else if (filter === 'open') {
        query = query.eq('status', 'open');
      } else if (filter === 'closed') {
        query = query.eq('status', 'closed');
      }
      
      const { data, error } = await query;
        
      if (error) throw error;
      
      // Format tickets with creator and assignee names
      const formattedTickets = data.map(ticket => ({
        ...ticket,
        creator_name: ticket.creator ? (ticket.creator as any).name : 'Unknown',
        assigned_name: ticket.assignee ? (ticket.assignee as any).name : undefined
      }));
      
      setTickets(formattedTickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast({
        title: "Error loading tickets",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchTickets();
    }
  }, [userId, filter]);

  useEffect(() => {
    // Subscribe to new tickets and messages
    if (!userId) return;
    
    const channel = supabase
      .channel('ticket-updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'support_tickets' },
        (payload) => {
          // Regular users should only see their own tickets
          if (!isStaff && payload.new.creator_id !== userId) return;
          
          // Fetch the full ticket with creator name
          fetchTicketById(payload.new.id);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'support_tickets' },
        (payload) => {
          // Update ticket in state
          setTickets(prev => 
            prev.map(ticket => 
              ticket.id === payload.new.id ? { ...ticket, ...payload.new } : ticket
            )
          );
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, isStaff]);

  const fetchTicketById = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          creator:creator_id(name),
          assignee:assigned_to(name)
        `)
        .eq('id', ticketId)
        .single();
      
      if (error) throw error;
      
      const formattedTicket = {
        ...data,
        creator_name: data.creator ? (data.creator as any).name : 'Unknown',
        assigned_name: data.assignee ? (data.assignee as any).name : undefined
      };
      
      // Add to tickets if not already present
      setTickets(prev => {
        if (!prev.some(t => t.id === formattedTicket.id)) {
          return [formattedTicket, ...prev];
        }
        return prev;
      });
      
    } catch (error) {
      console.error('Error fetching ticket:', error);
    }
  };

  const handleTicketCreated = (newTicket: Ticket) => {
    setShowNewTicket(false);
    setTickets(prev => [newTicket, ...prev]);
    toast({
      title: "Ticket Created",
      description: "Your support ticket has been created"
    });
  };
  
  const handleTicketStatusChange = async (ticketId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status })
        .eq('id', ticketId);
        
      if (error) throw error;
      
      // Update ticket in state
      setTickets(prev => 
        prev.map(ticket => 
          ticket.id === ticketId ? { ...ticket, status } : ticket
        )
      );
      
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(prev => prev ? { ...prev, status } : null);
      }
      
      toast({
        title: "Ticket Updated",
        description: `Ticket status changed to ${status}`
      });
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast({
        title: "Error Updating Ticket",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };

  const handleAssignTicket = async (ticketId: string, assignedTo: string | null) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ assigned_to: assignedTo })
        .eq('id', ticketId);
        
      if (error) throw error;
      
      // Fetch the updated ticket to get assignee name
      fetchTicketById(ticketId);
      
      toast({
        title: "Ticket Assigned",
        description: assignedTo ? "Ticket has been assigned" : "Ticket has been unassigned"
      });
    } catch (error) {
      console.error('Error assigning ticket:', error);
      toast({
        title: "Error Assigning Ticket",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };

  if (selectedTicket) {
    return (
      <TicketDetail 
        ticket={selectedTicket} 
        onBack={() => setSelectedTicket(null)}
        onStatusChange={handleTicketStatusChange}
        onAssignTicket={handleAssignTicket}
        currentUserId={userId}
        userRole={userRole}
      />
    );
  }

  if (showNewTicket) {
    return (
      <NewTicket 
        userId={userId} 
        onCancel={() => setShowNewTicket(false)}
        onTicketCreated={handleTicketCreated}
      />
    );
  }

  return (
    <div className="space-y-4">
      <TicketHeader 
        onNewTicket={() => setShowNewTicket(true)} 
        filter={filter}
        setFilter={setFilter}
        isStaff={isStaff}
      />

      {loading ? (
        <div className="flex justify-center p-6">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : tickets.length === 0 ? (
        <EmptyTicketState onNewTicket={() => setShowNewTicket(true)} />
      ) : (
        <TicketTable 
          tickets={tickets} 
          onSelectTicket={setSelectedTicket}
          isStaff={isStaff}
        />
      )}
    </div>
  );
};
