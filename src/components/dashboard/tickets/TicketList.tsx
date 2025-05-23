
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TicketHeader } from "./components/TicketHeader";
import { EmptyTicketState } from "./components/EmptyTicketState";
import { TicketTable } from "./components/TicketTable";
import { TicketDetail } from "./TicketDetail";
import { TicketForm } from "./TicketForm";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

export interface Ticket {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  creator_id: string;
  assigned_to: string | null;
  creator_name?: string;
  assignee_name?: string;
}

export interface TicketMessage {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  sender_name?: string;
}

export const TicketList = ({ userId, userRole }: { userId?: string, userRole?: string }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [ticketFilter, setTicketFilter] = useState<string>("all");
  const { toast } = useToast();

  const isStaff = userRole === "admin" || userRole === "support";

  useEffect(() => {
    loadTickets();

    // Subscribe to new tickets and updates
    const channel = supabase
      .channel('tickets-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'support_tickets' },
        () => loadTickets()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, userRole, ticketFilter]);

  const loadTickets = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('support_tickets')
        .select(`
          *,
          creator:creator_id(name),
          assignee:assigned_to(name)
        `)
        .order('created_at', { ascending: false });
      
      // Apply filters based on role and selected filter
      if (!isStaff) {
        // Mechanics can only see their own tickets
        query = query.eq('creator_id', userId);
      } else if (ticketFilter === "assigned" && userRole === "support") {
        // Support staff can filter to see tickets assigned to them
        query = query.eq('assigned_to', userId);
      } else if (ticketFilter === "unassigned" && isStaff) {
        // Staff can see unassigned tickets
        query = query.is('assigned_to', null);
      } else if (ticketFilter === "open" && isStaff) {
        // Staff can see open tickets
        query = query.eq('status', 'open');
      }

      const { data, error } = await query;

      if (error) throw error;

      // Format tickets to include creator and assignee names
      const formattedTickets = data.map(ticket => ({
        ...ticket,
        creator_name: ticket.creator ? (ticket.creator as any).name : 'Unknown',
        assignee_name: ticket.assignee ? (ticket.assignee as any).name : null
      }));

      setTickets(formattedTickets);
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast({
        title: "Error loading tickets",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTicketSelect = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setShowNewTicketForm(false);
  };

  const handleCreateTicket = () => {
    setSelectedTicket(null);
    setShowNewTicketForm(true);
  };

  const handleTicketCreated = () => {
    setShowNewTicketForm(false);
    loadTickets();
    toast({
      title: "Ticket Created",
      description: "Your support ticket has been submitted"
    });
  };

  const handleBackToList = () => {
    setSelectedTicket(null);
    setShowNewTicketForm(false);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Support Tickets</h3>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="w-full h-16" />
          ))}
        </div>
      </div>
    );
  }

  if (selectedTicket) {
    return (
      <TicketDetail 
        ticket={selectedTicket} 
        onBack={handleBackToList} 
        userId={userId}
        userRole={userRole}
        onUpdate={loadTickets}
      />
    );
  }

  if (showNewTicketForm) {
    return (
      <TicketForm 
        onSubmit={handleTicketCreated} 
        onCancel={handleBackToList}
        userId={userId}
      />
    );
  }

  return (
    <div className="space-y-4">
      <TicketHeader 
        onNewTicket={handleCreateTicket} 
        isStaff={isStaff} 
      />

      {isStaff && (
        <Tabs value={ticketFilter} onValueChange={setTicketFilter} className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="all">All Tickets</TabsTrigger>
            <TabsTrigger value="unassigned">Unassigned</TabsTrigger>
            <TabsTrigger value="open">Open</TabsTrigger>
            {userRole === "support" && (
              <TabsTrigger value="assigned">Assigned to Me</TabsTrigger>
            )}
          </TabsList>
        </Tabs>
      )}

      {tickets.length === 0 ? (
        <EmptyTicketState onNewTicket={handleCreateTicket} />
      ) : (
        <TicketTable 
          tickets={tickets} 
          onSelectTicket={handleTicketSelect} 
          isStaff={isStaff}
        />
      )}
    </div>
  );
};
