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
  ticket_number?: string; // Added unique identifier field
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
  const [searchQuery, setSearchQuery] = useState(""); // Added search query state
  const { toast } = useToast();

  const isStaff = userRole === 'admin' || userRole === 'support';

  const fetchTickets = async () => {
    try {
      setLoading(true);
      
      // First fetch the tickets
      let query = supabase
        .from('support_tickets')
        .select('*')
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
      
      // Apply search if provided and user is staff
      if (isStaff && searchQuery.trim()) {
        query = query.ilike('title', `%${searchQuery}%`);
      }
      
      const { data: ticketsData, error } = await query;
        
      if (error) throw error;
      
      if (!ticketsData || ticketsData.length === 0) {
        setTickets([]);
        setLoading(false);
        return;
      }
      
      // Now fetch creator names
      const creatorIds = [...new Set(ticketsData.map(t => t.creator_id))].filter(Boolean);
      const assigneeIds = [...new Set(ticketsData.map(t => t.assigned_to))].filter(Boolean);
      const allUserIds = [...new Set([...creatorIds, ...assigneeIds])].filter(Boolean);
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', allUserIds);
      
      if (profilesError) throw profilesError;
      
      // Create a map of user IDs to names
      const userNameMap = (profilesData || []).reduce((map, profile) => {
        map[profile.id] = profile.name;
        return map;
      }, {} as Record<string, string>);
      
      // Format tickets with creator and assignee names
      const formattedTickets = ticketsData.map(ticket => {
        // Generate unique ticket number based on creator initials and ID
        const creatorName = ticket.creator_id ? userNameMap[ticket.creator_id] || 'Unknown' : 'Unknown';
        const initials = creatorName !== 'Unknown' 
          ? creatorName.split(' ').map(name => name[0].toUpperCase()).join('')
          : 'XX';
        const ticketShortId = ticket.id.substring(0, 6).toUpperCase();
        
        return {
          ...ticket,
          creator_name: creatorName,
          assigned_name: ticket.assigned_to ? userNameMap[ticket.assigned_to] : undefined,
          ticket_number: `${initials}-${ticketShortId}`
        };
      });
      
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
  }, [userId, filter, searchQuery]); // Added searchQuery dependency

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
              ticket.id === payload.new.id ? { 
                ...ticket, 
                ...payload.new,
                // Preserve names since they're not in the payload
                creator_name: ticket.creator_name,
                assigned_name: payload.new.assigned_to === ticket.assigned_to 
                  ? ticket.assigned_name 
                  : undefined // Clear the name if assigned_to changed, it will be fetched
              } : ticket
            )
          );
          
          // If assigned_to changed, fetch the new assignee name
          if (payload.new.assigned_to && payload.new.assigned_to !== payload.old.assigned_to) {
            fetchAssigneeName(payload.new.id, payload.new.assigned_to);
          }
          
          // Update selected ticket if it's the one being updated
          if (selectedTicket && selectedTicket.id === payload.new.id) {
            setSelectedTicket(prev => {
              if (!prev) return null;
              
              return {
                ...prev,
                ...payload.new,
                creator_name: prev.creator_name,
                assigned_name: payload.new.assigned_to === prev.assigned_to 
                  ? prev.assigned_name 
                  : undefined
              };
            });
            
            if (payload.new.assigned_to && payload.new.assigned_to !== payload.old.assigned_to) {
              fetchAssigneeNameForSelectedTicket(payload.new.id, payload.new.assigned_to);
            }
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, isStaff, selectedTicket]);

  const fetchAssigneeName = async (ticketId: string, assigneeId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', assigneeId)
        .single();
        
      if (data) {
        setTickets(prev => 
          prev.map(ticket => 
            ticket.id === ticketId 
              ? { ...ticket, assigned_name: data.name } 
              : ticket
          )
        );
      }
    } catch (error) {
      console.error('Error fetching assignee name:', error);
    }
  };
  
  const fetchAssigneeNameForSelectedTicket = async (ticketId: string, assigneeId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', assigneeId)
        .single();
        
      if (data && selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket(prev => {
          if (!prev) return null;
          return { ...prev, assigned_name: data.name };
        });
      }
    } catch (error) {
      console.error('Error fetching assignee name for selected ticket:', error);
    }
  };

  const fetchTicketById = async (ticketId: string) => {
    try {
      const { data: ticketData, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('id', ticketId)
        .single();
      
      if (error) throw error;
      
      // Fetch creator name
      const { data: creatorData } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', ticketData.creator_id)
        .single();
        
      // Fetch assignee name if there is one
      let assigneeName: string | undefined = undefined;
      if (ticketData.assigned_to) {
        const { data: assigneeData } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', ticketData.assigned_to)
          .single();
          
        if (assigneeData) {
          assigneeName = assigneeData.name;
        }
      }
      
      const formattedTicket = {
        ...ticketData,
        creator_name: creatorData?.name || 'Unknown',
        assigned_name: assigneeName
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
    
    // Generate the ticket number for the new ticket
    const creatorName = newTicket.creator_name || 'Unknown';
    const initials = creatorName !== 'Unknown' 
      ? creatorName.split(' ').map(name => name[0].toUpperCase()).join('')
      : 'XX';
    const ticketShortId = newTicket.id.substring(0, 6).toUpperCase();
    const ticketWithNumber = {
      ...newTicket,
      ticket_number: `${initials}-${ticketShortId}`
    };
    
    setTickets(prev => [ticketWithNumber, ...prev]);
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

  const handleAssignTicket = async (ticketId: string, assignedTo: string | null): Promise<void> => {
    try {
      // Update the ticket assignment in the database
      const { error } = await supabase
        .from('support_tickets')
        .update({ assigned_to: assignedTo })
        .eq('id', ticketId);
        
      if (error) throw error;
      
      // The real-time subscription will update the UI
      // But we can also update the local state for immediate feedback
      if (!assignedTo) {
        setTickets(prev =>
          prev.map(ticket =>
            ticket.id === ticketId 
              ? { ...ticket, assigned_to: undefined, assigned_name: undefined } 
              : ticket
          )
        );
        
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket(prev => 
            prev ? { ...prev, assigned_to: undefined, assigned_name: undefined } : null
          );
        }
      } else {
        // The assignee name will be updated through the realtime subscription
        fetchAssigneeName(ticketId, assignedTo);
      }
    } catch (error) {
      console.error('Error assigning ticket:', error);
      toast({
        title: "Error Assigning Ticket",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
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
        searchQuery={searchQuery}
        onSearch={handleSearch}
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
