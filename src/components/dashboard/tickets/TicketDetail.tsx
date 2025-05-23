
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Send, Clock, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  sender_name?: string;
}

interface Ticket {
  id: string;
  title: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
  creator_id: string;
  creator_name?: string;
  assigned_to: string | null;
  assigned_name?: string | null;
}

interface TicketDetailProps {
  ticketId: string;
  onBack: () => void;
  userRole: string;
}

export const TicketDetail = ({ ticketId, onBack, userRole }: TicketDetailProps) => {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [staffMembers, setStaffMembers] = useState([]);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  
  const isSupport = userRole === 'support' || userRole === 'admin';

  useEffect(() => {
    fetchTicketDetails();
    fetchTicketMessages();
    if (isSupport) {
      fetchSupportStaff();
    }
  }, [ticketId]);

  const fetchTicketDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('id', ticketId)
        .single();
        
      if (error) throw error;
      
      // Safely get creator name
      let creatorName = 'Unknown';
      if (data.creator_id) {
        const { data: creatorData } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', data.creator_id)
          .single();
          
        if (creatorData) {
          creatorName = creatorData.name || 'Unknown';
        }
      }
      
      // Safely get assignee name
      let assigneeName = undefined;
      if (data.assigned_to) {
        const { data: assigneeData } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', data.assigned_to)
          .single();
          
        if (assigneeData) {
          assigneeName = assigneeData.name;
        }
      }
      
      // Ensure status is of the correct type
      const status = data.status as 'open' | 'in_progress' | 'resolved' | 'closed';
      const priority = data.priority as 'low' | 'normal' | 'high' | 'urgent';
      
      setTicket({
        ...data,
        creator_name: creatorName,
        assigned_name: assigneeName,
        status,
        priority
      });
    } catch (error) {
      console.error('Error fetching ticket details:', error);
      toast.error("Failed to load ticket details");
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      
      // Get sender names for each message
      const messagesWithSenders = await Promise.all(
        data.map(async (msg) => {
          let senderName = 'Unknown';
          if (msg.sender_id) {
            const { data: senderData } = await supabase
              .from('profiles')
              .select('name')
              .eq('id', msg.sender_id)
              .single();
            
            if (senderData) {
              senderName = senderData.name || 'Unknown';
            }
          }
          
          return {
            ...msg,
            sender_name: senderName
          };
        })
      );
      
      setMessages(messagesWithSenders);
    } catch (error) {
      console.error('Error fetching ticket messages:', error);
      toast.error("Failed to load ticket messages");
    }
  };

  const fetchSupportStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('role', ['support', 'admin'])
        .eq('approved', true);
        
      if (error) throw error;
      setStaffMembers(data);
    } catch (error) {
      console.error('Error fetching support staff:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    setSendingMessage(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      await supabase
        .from('ticket_messages')
        .insert({
          content: newMessage,
          ticket_id: ticketId,
          sender_id: user.id
        });
        
      // After successful message send, refresh the messages
      await fetchTicketMessages();
      setNewMessage('');
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  const assignTicket = async () => {
    if (!selectedStaff) return;
    
    setAssigning(true);
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ assigned_to: selectedStaff })
        .eq('id', ticketId);
        
      if (error) throw error;
      
      toast.success("Ticket assigned successfully");
      setShowAssignDialog(false);
      fetchTicketDetails();
    } catch (error) {
      console.error('Error assigning ticket:', error);
      toast.error("Failed to assign ticket");
    } finally {
      setAssigning(false);
    }
  };

  const updateTicketStatus = async (status: 'open' | 'in_progress' | 'resolved' | 'closed') => {
    setStatusUpdating(true);
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status })
        .eq('id', ticketId);
        
      if (error) throw error;
      
      toast.success(`Ticket marked as ${status}`);
      fetchTicketDetails();
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast.error("Failed to update ticket status");
    } finally {
      setStatusUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-blue-500">{status}</Badge>;
      case 'in_progress':
        return <Badge className="bg-yellow-500">in progress</Badge>;
      case 'resolved':
        return <Badge className="bg-green-500">{status}</Badge>;
      case 'closed':
        return <Badge variant="outline">{status}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'low':
        return <Badge variant="outline" className="border-blue-500 text-blue-500">{priority}</Badge>;
      case 'normal':
        return <Badge variant="outline">{priority}</Badge>;
      case 'high':
        return <Badge variant="outline" className="border-orange-500 text-orange-500">{priority}</Badge>;
      case 'urgent':
        return <Badge variant="outline" className="border-red-500 text-red-500">{priority}</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  if (loading) {
    return <div className="flex justify-center p-6">Loading ticket details...</div>;
  }

  if (!ticket) {
    return (
      <div className="space-y-4">
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">Ticket not found</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        {isSupport && (
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={statusUpdating}>
                  {statusUpdating ? "Updating..." : "Set Status"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => updateTicketStatus('open')}>
                  <AlertCircle className="mr-2 h-4 w-4 text-blue-500" />
                  Open
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateTicketStatus('in_progress')}>
                  <Clock className="mr-2 h-4 w-4 text-yellow-500" />
                  In Progress
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateTicketStatus('resolved')}>
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  Resolved
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateTicketStatus('closed')}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Closed
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button 
              variant="outline"
              onClick={() => setShowAssignDialog(true)}
            >
              {ticket.assigned_to ? "Reassign" : "Assign"}
            </Button>
          </div>
        )}
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-xl">{ticket.title}</CardTitle>
            <div className="flex gap-2">
              {getStatusBadge(ticket.status)}
              {getPriorityBadge(ticket.priority)}
            </div>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <div>Opened by: {ticket.creator_name || 'Unknown'}</div>
            <div>Created: {format(new Date(ticket.created_at), 'PPP')}</div>
            <div>
              Assigned to: {ticket.assigned_name || 'Unassigned'}
            </div>
          </div>
        </CardHeader>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Messages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {messages.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No messages yet</p>
          ) : (
            messages.map((msg) => (
              <div 
                key={msg.id}
                className={`p-4 rounded-lg border ${
                  msg.sender_id === ticket.creator_id ? 'bg-muted' : 'bg-primary/5'
                }`}
              >
                <div className="flex justify-between mb-2">
                  <div className="font-medium">{msg.sender_name || 'Unknown'}</div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(msg.created_at), 'PPp')}
                  </div>
                </div>
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            ))
          )}
          
          {ticket.status !== 'closed' && (
            <div className="pt-4">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Write your message..."
                rows={3}
                className="mb-2"
              />
              <div className="flex justify-end">
                <Button 
                  onClick={sendMessage} 
                  disabled={!newMessage.trim() || sendingMessage}
                >
                  {sendingMessage ? 'Sending...' : 'Send'} 
                  <Send className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Ticket</DialogTitle>
            <DialogDescription>
              Select a support staff member to assign this ticket to.
            </DialogDescription>
          </DialogHeader>
          
          <Select
            value={selectedStaff}
            onValueChange={setSelectedStaff}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select staff member" />
            </SelectTrigger>
            <SelectContent>
              {staffMembers.map((staff: any) => (
                <SelectItem key={staff.id} value={staff.id}>
                  {staff.name || staff.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={assignTicket} 
              disabled={!selectedStaff || assigning}
            >
              {assigning ? 'Assigning...' : 'Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
