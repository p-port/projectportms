
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TicketMessage, Ticket, TicketStatus, TicketPriority } from "./TicketList";

interface TicketDetailProps {
  ticketId: string;
  onBack: () => void;
  onStatusChange: (ticketId: string, status: TicketStatus) => Promise<void>;
  onAssignTicket: (ticketId: string, assignedTo: string | null) => Promise<void>;
  currentUserId?: string;
  userRole?: string;
}

export const TicketDetail = ({
  ticketId,
  onBack,
  onStatusChange,
  onAssignTicket,
  currentUserId,
  userRole = "mechanic",
}: TicketDetailProps) => {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [staffUsers, setStaffUsers] = useState<{ id: string; name: string }[]>([]);
  const { toast } = useToast();
  
  const isStaff = userRole === "admin" || userRole === "support";

  useEffect(() => {
    fetchTicketDetails();
    
    if (isStaff) {
      fetchStaffUsers();
    }
    
    // Set up realtime subscription for new messages
    const channel = supabase
      .channel(`ticket-${ticketId}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'ticket_messages', filter: `ticket_id=eq.${ticketId}` },
        (payload) => {
          // Fetch the new message with sender name
          fetchNewMessage(payload.new.id);
        })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId]);

  const fetchTicketDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch ticket data
      const { data: ticketData, error: ticketError } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('id', ticketId)
        .single();
        
      if (ticketError) throw ticketError;
      
      // Fetch creator name
      const { data: creatorData } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', ticketData.creator_id)
        .single();
      
      // Fetch assignee name if assigned
      let assigneeName = undefined;
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
      
      // Format ticket with names
      const formattedTicket: Ticket = {
        ...ticketData,
        status: ticketData.status as TicketStatus,
        priority: ticketData.priority as TicketPriority,
        creator_name: creatorData?.name || 'Unknown',
        assigned_name: assigneeName
      };
      
      setTicket(formattedTicket);
      
      // Fetch messages for this ticket
      const { data: messagesData, error: messagesError } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });
        
      if (messagesError) throw messagesError;
      
      if (messagesData && messagesData.length > 0) {
        // Get all unique sender IDs
        const senderIds = [...new Set(messagesData.map(m => m.sender_id))].filter(Boolean) as string[];
        
        // Fetch all sender names in one query
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', senderIds);
          
        // Create a map of user IDs to names
        const userNameMap = (profilesData || []).reduce((map, profile) => {
          map[profile.id] = profile.name;
          return map;
        }, {} as Record<string, string>);
        
        // Format messages with sender names
        const formattedMessages = messagesData.map(message => ({
          ...message,
          sender_name: message.sender_id ? userNameMap[message.sender_id] || 'Unknown' : 'System'
        }));
        
        setMessages(formattedMessages);
      }
      
    } catch (error) {
      console.error('Error fetching ticket details:', error);
      toast({
        title: "Error loading ticket",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchNewMessage = async (messageId: string) => {
    try {
      const { data: messageData, error } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('id', messageId)
        .single();
        
      if (error) throw error;
      
      // Fetch sender name
      const { data: senderData } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', messageData.sender_id)
        .single();
        
      const formattedMessage: TicketMessage = {
        ...messageData,
        sender_name: senderData?.name || 'Unknown'
      };
      
      setMessages(prev => [...prev, formattedMessage]);
      
    } catch (error) {
      console.error('Error fetching new message:', error);
    }
  };

  const fetchStaffUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name')
        .in('role', ['support', 'admin'])
        .eq('approved', true);
        
      if (error) throw error;
      
      setStaffUsers(data || []);
      
    } catch (error) {
      console.error('Error fetching staff users:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUserId || !ticket) return;
    
    setSendingMessage(true);
    try {
      const { error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticket.id,
          content: newMessage.trim(),
          sender_id: currentUserId
        });
        
      if (error) throw error;
      
      setNewMessage("");
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error sending message",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleStatusChange = async (status: TicketStatus) => {
    if (!ticket) return;
    await onStatusChange(ticket.id, status);
  };
  
  const handleAssignTicket = async (userId: string | null) => {
    if (!ticket) return;
    await onAssignTicket(ticket.id, userId);
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Ticket not found</p>
        <Button onClick={onBack} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to tickets
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to tickets
        </Button>
        
        {isStaff && (
          <div className="flex items-center gap-2">
            <Select 
              value={ticket.status || "open"} 
              onValueChange={(value) => handleStatusChange(value as TicketStatus)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            
            <Select 
              value={ticket.assigned_to || "unassigned"} 
              onValueChange={(value) => handleAssignTicket(value === "unassigned" ? null : value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Assign to..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {staffUsers.map(user => (
                  <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      
      <div className="bg-card rounded-lg p-4 sm:p-6 border">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-semibold mb-1">{ticket.title}</h2>
            <div className="text-sm text-muted-foreground">
              Opened by {ticket.creator_name} · {new Date(ticket.created_at).toLocaleString()}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={ticket.priority === 'high' || ticket.priority === 'urgent' ? "destructive" : "outline"}>
              {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)} Priority
            </Badge>
            
            <Badge variant={
              ticket.status === 'open' ? "default" :
              ticket.status === 'in_progress' ? "secondary" :
              ticket.status === 'resolved' ? "success" : "outline"
            }>
              {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
            </Badge>
          </div>
        </div>
        
        {ticket.assigned_to && (
          <div className="mb-6 text-sm bg-accent text-accent-foreground p-3 rounded-md">
            Assigned to: {ticket.assigned_name || 'Support Agent'}
          </div>
        )}
        
        <div className="space-y-4 max-h-[500px] overflow-y-auto p-1">
          {messages.map((message, index) => (
            <div key={message.id} className="bg-muted p-4 rounded-lg">
              <div className="flex justify-between items-start gap-4">
                <div className="font-medium">{message.sender_name}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(message.created_at).toLocaleString()}
                </div>
              </div>
              <div className="mt-1 whitespace-pre-wrap">{message.content}</div>
            </div>
          ))}
          
          {messages.length === 0 && (
            <div className="text-center p-4 text-muted-foreground">
              No messages yet.
            </div>
          )}
        </div>
        
        <div className="mt-6">
          <Textarea
            placeholder="Type your message here..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            rows={4}
            disabled={sendingMessage}
          />
          <div className="mt-2 flex justify-end">
            <Button 
              onClick={handleSendMessage} 
              disabled={!newMessage.trim() || sendingMessage}
            >
              <Send className="mr-2 h-4 w-4" />
              {sendingMessage ? "Sending..." : "Send Message"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
