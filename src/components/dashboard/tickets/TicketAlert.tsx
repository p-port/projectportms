
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Check, X } from "lucide-react";

interface TicketAlertProps {
  userId?: string;
  userRole?: string;
}

interface PendingTicket {
  id: string;
  title: string;
  creator_name?: string;
  created_at: string;
  priority: string;
}

export const TicketAlert = ({ userId, userRole }: TicketAlertProps) => {
  const [pendingTickets, setPendingTickets] = useState<PendingTicket[]>([]);
  const [showAlert, setShowAlert] = useState(false);

  const isSupport = userRole === 'admin' || userRole === 'support';

  useEffect(() => {
    if (!isSupport || !userId) return;

    // Subscribe to new ticket notifications
    const channel = supabase
      .channel('ticket-alerts')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'support_tickets',
          filter: 'status=eq.open'
        },
        async (payload) => {
          // Get creator name
          const { data: creatorData } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', payload.new.creator_id)
            .single();

          const newTicket = {
            id: payload.new.id,
            title: payload.new.title,
            creator_name: creatorData?.name || 'Unknown User',
            created_at: payload.new.created_at,
            priority: payload.new.priority
          };

          setPendingTickets(prev => [...prev, newTicket]);
          setShowAlert(true);
          
          // Show toast notification
          toast.info(`New support ticket: ${newTicket.title}`, {
            action: {
              label: "View",
              onClick: () => setShowAlert(true)
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isSupport, userId]);

  const handleAcceptTicket = async (ticketId: string) => {
    try {
      // Assign ticket to current user and change status
      const { error } = await supabase
        .from('support_tickets')
        .update({ 
          assigned_to: userId,
          status: 'in_progress'
        })
        .eq('id', ticketId);

      if (error) throw error;

      // Remove from pending list
      setPendingTickets(prev => prev.filter(t => t.id !== ticketId));
      
      toast.success("Ticket accepted and assigned to you");
      
      // If no more pending tickets, hide alert
      if (pendingTickets.length === 1) {
        setShowAlert(false);
      }
    } catch (error) {
      console.error('Error accepting ticket:', error);
      toast.error("Failed to accept ticket");
    }
  };

  const handleDismissTicket = (ticketId: string) => {
    setPendingTickets(prev => prev.filter(t => t.id !== ticketId));
    
    if (pendingTickets.length === 1) {
      setShowAlert(false);
    }
  };

  const handleDismissAll = () => {
    setPendingTickets([]);
    setShowAlert(false);
  };

  if (!isSupport || !showAlert || pendingTickets.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <Bell className="h-4 w-4" />
            New Support Tickets
          </CardTitle>
          <CardDescription className="text-orange-700">
            {pendingTickets.length} new ticket{pendingTickets.length > 1 ? 's' : ''} waiting for assignment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {pendingTickets.slice(0, 3).map((ticket) => (
            <div key={ticket.id} className="p-3 bg-white rounded border">
              <div className="space-y-2">
                <div>
                  <p className="font-medium text-sm">{ticket.title}</p>
                  <p className="text-xs text-muted-foreground">
                    From: {ticket.creator_name} • Priority: {ticket.priority}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => handleAcceptTicket(ticket.id)}
                    className="flex-1"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Accept
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleDismissTicket(ticket.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          
          {pendingTickets.length > 3 && (
            <p className="text-xs text-muted-foreground text-center">
              +{pendingTickets.length - 3} more tickets
            </p>
          )}
          
          <div className="flex gap-2 pt-2">
            <Button size="sm" variant="outline" onClick={handleDismissAll} className="flex-1">
              Dismiss All
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
