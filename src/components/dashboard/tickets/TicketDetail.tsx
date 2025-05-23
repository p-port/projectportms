
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Ticket, TicketMessage } from "./TicketList";
import { format } from "date-fns";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [supportStaff, setSupportStaff] = useState<StaffMember[]>([]);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>(ticket.status);
  const { toast } = useToast();
  
  const isStaff = userRole === 'admin' || userRole === 'support';
  
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        
        // Fetch messages for this ticket
        const { data, error } = await supabase
          .from('ticket_messages')
          .select('*')
          .eq('ticket_id', ticket.id)
          .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
          setMessages([]);
          setLoading(false);
          return;
        }
        
        // Get unique sender IDs
        const senderIds = [...new Set(data.map(message => message.sender_id))].filter(Boolean);
        
        // Fetch sender names
        const { data: sendersData, error: sendersError } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', senderIds);
          
        if (sendersError) throw sendersError;
        
        // Create a map of user IDs to names
        const userNameMap = (sendersData || []).reduce((map, profile) => {
          map[profile.id] = profile.name;
          return map;
        }, {} as Record<string, string>);
        
        // Attach sender names to messages
        const messagesWithSenders = data.map(message => ({
          ...message,
          sender_name: message.sender_id ? userNameMap[message.sender_id] || 'Unknown' : 'System'
        }));
        
        setMessages(messagesWithSenders);
      } catch (error) {
        console.error('Error fetching ticket messages:', error);
        toast({
          title: "Error loading messages",
          description: "Could not load ticket messages",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchMessages();
    
    // Subscribe to new messages
    const channel = supabase
      .channel(`ticket-${ticket.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ticket_messages', filter: `ticket_id=eq.${ticket.id}` },
        async (payload) => {
          const newMessage = payload.new as TicketMessage;
          
          // Fetch sender name
          if (newMessage.sender_id) {
            const { data } = await supabase
              .from('profiles')
              .select('name')
              .eq('id', newMessage.sender_id)
              .single();
              
            if (data) {
              newMessage.sender_name = data.name;
            } else {
              newMessage.sender_name = 'Unknown';
            }
          } else {
            newMessage.sender_name = 'System';
          }
          
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticket.id, toast]);
  
  // Fetch support staff for assignment
  useEffect(() => {
    if (isStaff) {
      const fetchStaff = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('id, name, role')
            .in('role', ['support', 'admin']);
            
          if (error) throw error;
          
          setSupportStaff(data as StaffMember[]);
        } catch (error) {
          console.error('Error fetching support staff:', error);
        }
      };
      
      fetchStaff();
    }
  }, [isStaff]);
  
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    try {
      setSubmitting(true);
      
      // Get current authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      // Create message
      const { error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticket.id,
          content: newMessage.trim(),
          sender_id: user.id
        });
        
      if (error) throw error;

      // If staff member is responding and ticket is 'open', automatically change status to 'in-progress'
      if (isStaff && ticket.status === 'open') {
        await onStatusChange(ticket.id, 'in-progress');
        ticket.status = 'in-progress'; // Update local state
      }
      
      // Clear input after successful send
      setNewMessage("");
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error sending message",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleAssign = async (userId: string) => {
    // If selecting the same person, do nothing
    if (ticket.assigned_to === userId) return;
    
    try {
      await onAssignTicket(ticket.id, userId);
      
      // Update local state to reflect the change immediately
      const assignedStaff = supportStaff.find(staff => staff.id === userId);
      
      // Add a system message about assignment
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('ticket_messages')
          .insert({
            ticket_id: ticket.id,
            content: `Ticket assigned to ${assignedStaff?.name || 'staff member'}`,
            sender_id: user.id
          });
      }
      
      toast({
        title: "Ticket Assigned",
        description: `Ticket has been assigned to ${assignedStaff?.name || 'staff member'}`,
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
  
  const handleUnassign = async () => {
    if (!ticket.assigned_to) return;
    
    try {
      await onAssignTicket(ticket.id, null);
      
      // Add system message about unassignment
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('ticket_messages')
          .insert({
            ticket_id: ticket.id,
            content: `Ticket unassigned`,
            sender_id: user.id
          });
      }
      
      toast({
        title: "Ticket Unassigned",
        description: "Ticket has been unassigned"
      });
      
    } catch (error) {
      console.error('Error unassigning ticket:', error);
      toast({
        title: "Error Unassigning Ticket", 
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };
  
  const handleStatusChange = async (status: string) => {
    if (status === ticket.status) return;
    
    setNewStatus(status);
    setStatusDialogOpen(true);
  };
  
  const confirmStatusChange = async () => {
    try {
      await onStatusChange(ticket.id, newStatus);
      
      // Add system message about status change
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { error } = await supabase
          .from('ticket_messages')
          .insert({
            ticket_id: ticket.id,
            content: `Ticket status changed to ${newStatus}`,
            sender_id: user.id
          });
          
        if (error) {
          console.error('Error adding status change message:', error);
        }
      }
    } catch (error) {
      console.error('Error changing ticket status:', error);
    } finally {
      setStatusDialogOpen(false);
    }
  };
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-destructive';
      case 'low': return 'text-muted-foreground';
      default: return 'text-primary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Tickets
          </Button>
          <span className="text-muted-foreground">|</span>
          <h2 className="text-lg font-medium">Ticket #{ticket.id.substring(0, 8)}</h2>
        </div>
        
        {isStaff && (
          <div className="flex items-center gap-2">
            <Select
              value={ticket.status}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="border rounded-md p-4 space-y-2">
            <h3 className="font-medium">{ticket.title}</h3>
            <div className="text-sm text-muted-foreground">
              Created by {ticket.creator_name} on {format(new Date(ticket.created_at), 'MMM d, yyyy')}
            </div>
            <div className={`text-sm font-medium ${getPriorityColor(ticket.priority)}`}>
              Priority: {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
            </div>
          </div>

          <div className="border rounded-md">
            <div className="p-4 border-b">
              <h4 className="font-medium">Messages</h4>
            </div>
            
            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center">
                  <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">No messages yet</div>
              ) : (
                messages.map((message) => (
                  <div 
                    key={message.id} 
                    className={`p-3 rounded-md ${
                      message.sender_id === currentUserId 
                        ? 'bg-primary/10 ml-8' 
                        : 'bg-muted/50 mr-8'
                    }`}
                  >
                    <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
                      <span className="font-semibold">{message.sender_name}</span>
                      <span>{format(new Date(message.created_at), 'MMM d, h:mm a')}</span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                ))
              )}
            </div>
            
            {ticket.status !== 'closed' && (
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message here..."
                    className="flex-1"
                    rows={3}
                    disabled={submitting}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || submitting}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="border rounded-md p-4">
            <h4 className="font-medium mb-3">Ticket Status</h4>
            <div className="flex items-center gap-2 mb-2">
              <StatusIndicator status={ticket.status} />
              <span className="capitalize">{ticket.status.replace('-', ' ')}</span>
            </div>
            
            {ticket.status === 'closed' && (
              <Alert variant="default" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This ticket is closed. No further replies can be added.
                </AlertDescription>
              </Alert>
            )}
          </div>
          
          {isStaff && (
            <div className="border rounded-md p-4">
              <h4 className="font-medium mb-3">Assignment</h4>
              {ticket.assigned_to ? (
                <div>
                  <p className="text-sm mb-2">
                    Currently assigned to: <span className="font-medium">{ticket.assigned_name}</span>
                  </p>
                  <div className="flex gap-2">
                    <Select onValueChange={handleAssign}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Reassign" />
                      </SelectTrigger>
                      <SelectContent>
                        {supportStaff.map((staff) => (
                          <SelectItem key={staff.id} value={staff.id}>
                            {staff.name} ({staff.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={handleUnassign}>
                      Unassign
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Not currently assigned</p>
                  <Select onValueChange={handleAssign}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Assign to staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {supportStaff.map((staff) => (
                        <SelectItem key={staff.id} value={staff.id}>
                          {staff.name} ({staff.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <AlertDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Ticket Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change the status of this ticket to {" "}
              <span className="font-medium">{newStatus.replace('-', ' ')}</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const StatusIndicator = ({ status }: { status: string }) => {
  switch (status) {
    case 'open':
      return <div className="w-3 h-3 rounded-full bg-blue-500" />;
    case 'in-progress':
      return <div className="w-3 h-3 rounded-full bg-yellow-500" />;
    case 'closed':
      return <div className="w-3 h-3 rounded-full bg-green-500" />;
    default:
      return <div className="w-3 h-3 rounded-full bg-gray-500" />;
  }
};
