
import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Send, 
  Clock,
  CheckCircle2, 
  AlertCircle, 
  User, 
  UserPlus,
  UserMinus
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Ticket, TicketMessage } from "./TicketList";

interface StaffMember {
  id: string;
  name: string;
  role: string;
}

interface TicketDetailProps {
  ticket: Ticket;
  onBack: () => void;
  onStatusChange: (ticketId: string, status: string) => Promise<void>;
  onAssignTicket: (ticketId: string, userId: string | null) => Promise<void>;
  currentUserId?: string;
  userRole?: string;
}

export const TicketDetail = ({
  ticket,
  onBack,
  onStatusChange,
  onAssignTicket,
  currentUserId,
  userRole = 'mechanic'
}: TicketDetailProps) => {
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const isStaff = userRole === 'admin' || userRole === 'support';
  const isAssigned = !!ticket.assigned_to;
  const isAssignedToCurrentUser = ticket.assigned_to === currentUserId;

  useEffect(() => {
    fetchMessages();
    
    // Load staff list for assignment (admin/support only)
    if (isStaff) {
      fetchStaffList();
    }
    
    // Subscribe to new messages
    const channel = supabase
      .channel(`ticket-${ticket.id}-messages`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'ticket_messages',
          filter: `ticket_id=eq.${ticket.id}`
        },
        async (payload) => {
          fetchMessageWithSender(payload.new.id);
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticket.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ticket_messages')
        .select(`
          *,
          sender:sender_id(name)
        `)
        .eq('ticket_id', ticket.id)
        .order('created_at');
        
      if (error) throw error;
      
      // Format messages with sender name
      const formattedMessages = data.map(message => ({
        ...message,
        sender_name: message.sender ? (message.sender as any).name : 'Unknown'
      }));
      
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error loading ticket messages",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessageWithSender = async (messageId: string) => {
    try {
      const { data, error } = await supabase
        .from('ticket_messages')
        .select(`
          *,
          sender:sender_id(name)
        `)
        .eq('id', messageId)
        .single();
        
      if (error) throw error;
      
      const formattedMessage = {
        ...data,
        sender_name: data.sender ? (data.sender as any).name : 'Unknown'
      };
      
      setMessages(prev => [...prev, formattedMessage]);
    } catch (error) {
      console.error('Error fetching message:', error);
    }
  };

  const fetchStaffList = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, role')
        .in('role', ['admin', 'support'])
        .eq('approved', true);
        
      if (error) throw error;
      
      setStaffList(data as StaffMember[]);
    } catch (error) {
      console.error('Error fetching staff list:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUserId) return;
    
    setSending(true);
    try {
      const { data, error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticket.id,
          content: newMessage.trim(),
          sender_id: currentUserId
        })
        .select()
        .single();
        
      if (error) throw error;
      
      setNewMessage("");
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Failed to send message",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleAssignment = async (staffId: string | null) => {
    await onAssignTicket(ticket.id, staffId);
    setShowAssignDialog(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getStatusBadge = () => {
    switch (ticket.status) {
      case 'open':
        return <Badge variant="destructive" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Open</Badge>;
      case 'in-progress':
        return <Badge variant="default" className="flex items-center gap-1 bg-amber-500"><Clock className="h-3 w-3" /> In Progress</Badge>;
      case 'closed':
        return <Badge variant="outline" className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Closed</Badge>;
      default:
        return <Badge variant="secondary">{ticket.status}</Badge>;
    }
  };

  const getPriorityBadge = () => {
    switch (ticket.priority) {
      case 'high':
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertCircle className="h-3 w-3" /> High</Badge>;
      case 'normal':
        return <Badge variant="secondary">Normal</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (e) {
      return dateString;
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Tickets
        </Button>
        
        {isStaff && (
          <div className="flex items-center gap-2">
            <Select
              value={ticket.status}
              onValueChange={(value) => onStatusChange(ticket.id, value)}
              disabled={loading}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  {isAssigned ? (
                    <>
                      <UserMinus className="h-4 w-4 mr-1" /> 
                      {isAssignedToCurrentUser ? "Unassign Me" : "Reassign"}
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-1" /> Assign
                    </>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign Ticket</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="text-sm text-muted-foreground">
                    Select a staff member to assign this ticket to:
                  </div>
                  
                  {isAssigned && (
                    <Button 
                      variant="destructive" 
                      className="w-full justify-start"
                      onClick={() => handleAssignment(null)}
                    >
                      <UserMinus className="mr-2 h-4 w-4" />
                      Unassign Ticket
                    </Button>
                  )}
                  
                  <div className="space-y-2">
                    {staffList.map((staff) => (
                      <Button 
                        key={staff.id} 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => handleAssignment(staff.id)}
                      >
                        <User className="mr-2 h-4 w-4" />
                        {staff.name} 
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({staff.role})
                        </span>
                        {ticket.assigned_to === staff.id && (
                          <CheckCircle2 className="ml-auto h-4 w-4 text-green-500" />
                        )}
                      </Button>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      <div className="border rounded-md p-4 space-y-3">
        <div className="flex justify-between items-start border-b pb-3">
          <div>
            <h3 className="text-xl font-semibold">{ticket.title}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <span>Created by {ticket.creator_name}</span>
              <span>•</span>
              <span>{formatDate(ticket.created_at)}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <div className="flex items-center gap-2">
              {getStatusBadge()}
              {getPriorityBadge()}
            </div>
            {ticket.assigned_name && (
              <div className="text-sm flex items-center">
                <User className="h-3 w-3 mr-1" />
                Assigned to: {ticket.assigned_name}
              </div>
            )}
          </div>
        </div>

        <div className="h-[400px] overflow-y-auto p-2 space-y-4">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex justify-center items-center h-full text-muted-foreground">
              No messages yet
            </div>
          ) : (
            messages.map(message => {
              const isCurrentUser = message.sender_id === currentUserId;
              return (
                <div 
                  key={message.id}
                  className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}
                >
                  <div className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    isCurrentUser 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}>
                    {message.content}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {message.sender_name} • {formatDate(message.created_at)}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {ticket.status !== 'closed' && (
          <div className="pt-3 border-t">
            <div className="flex items-end gap-2">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="flex-1"
                disabled={sending || loading}
                rows={3}
              />
              <Button 
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending}
                className="mb-1"
              >
                <Send className="h-4 w-4 mr-1" />
                Send
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
