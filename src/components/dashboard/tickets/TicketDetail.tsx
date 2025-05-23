
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Send, User, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import type { Ticket, TicketMessage } from "./TicketList";

interface TicketDetailProps {
  ticket: Ticket;
  onBack: () => void;
  userId?: string;
  userRole?: string;
  onUpdate: () => void;
}

export const TicketDetail = ({ 
  ticket, 
  onBack, 
  userId, 
  userRole, 
  onUpdate 
}: TicketDetailProps) => {
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [reply, setReply] = useState("");
  const [status, setStatus] = useState(ticket.status);
  const [priority, setPriority] = useState(ticket.priority);
  const [assignee, setAssignee] = useState(ticket.assigned_to);
  const [availableStaff, setAvailableStaff] = useState<{id: string, name: string}[]>([]);
  const [isInfoOpen, setIsInfoOpen] = useState(true);
  const { toast } = useToast();
  
  const isStaff = userRole === "admin" || userRole === "support";
  const isAdmin = userRole === "admin";
  const isMechanic = userRole === "mechanic" || !userRole;

  useEffect(() => {
    loadMessages();
    
    if (isAdmin) {
      loadSupportStaff();
    }

    // Subscribe to new messages
    const channel = supabase
      .channel('ticket-messages')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'ticket_messages',
          filter: `ticket_id=eq.${ticket.id}`
        },
        () => loadMessages()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticket.id]);

  const loadMessages = async () => {
    if (!ticket.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ticket_messages')
        .select(`
          *,
          sender:sender_id(name)
        `)
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: true });
        
      if (error) throw error;

      const formattedMessages = data.map(message => ({
        ...message,
        sender_name: message.sender ? (message.sender as any).name : 'Unknown'
      }));
      
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading ticket messages:', error);
      toast({
        title: "Error loading ticket details",
        description: "Could not load the ticket messages",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSupportStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, role')
        .in('role', ['support', 'admin']);
        
      if (error) throw error;
      
      setAvailableStaff(data);
    } catch (error) {
      console.error('Error loading support staff:', error);
    }
  };

  const handleSendReply = async () => {
    if (!reply.trim() || !userId) return;
    
    setSending(true);
    try {
      const { error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticket.id,
          content: reply,
          sender_id: userId
        });

      if (error) throw error;
      
      setReply("");
      loadMessages();
    } catch (error) {
      console.error('Error sending reply:', error);
      toast({
        title: "Failed to send message",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const handleUpdateTicket = async () => {
    if (!isStaff) return;
    
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({
          status,
          priority,
          assigned_to: assignee,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticket.id);

      if (error) throw error;
      
      toast({
        title: "Ticket updated",
        description: "The ticket details have been updated"
      });
      
      onUpdate();
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast({
        title: "Failed to update ticket",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return <Badge variant="default">Open</Badge>;
      case 'in_progress':
        return <Badge variant="secondary">In Progress</Badge>;
      case 'resolved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Resolved</Badge>;
      case 'closed':
        return <Badge variant="outline">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'normal':
        return <Badge variant="secondary">Normal</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getNameInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
      </div>
      
      <div className="flex justify-between items-start">
        <h2 className="text-xl font-semibold">{ticket.title}</h2>
        {getStatusBadge(status)}
      </div>

      <Collapsible open={isInfoOpen} onOpenChange={setIsInfoOpen} className="mb-6">
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Created by {ticket.creator_name} on {format(new Date(ticket.created_at), 'PPP')}
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm">
              {isInfoOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
        </div>
        
        <CollapsibleContent>
          <Card className="mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Ticket Information</CardTitle>
            </CardHeader>
            <CardContent className="pb-2 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-sm text-muted-foreground">Priority</p>
                  {isStaff ? (
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="mt-1">{getPriorityBadge(priority)}</div>
                  )}
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {isStaff ? (
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="mt-1">{getStatusBadge(status)}</div>
                  )}
                </div>

                {isAdmin && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Assigned To</p>
                    <Select value={assignee || ""} onValueChange={setAssignee}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Unassigned</SelectItem>
                        {availableStaff.map(staff => (
                          <SelectItem key={staff.id} value={staff.id}>{staff.name} ({staff.role})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {!isAdmin && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Assigned To</p>
                    <p>{ticket.assignee_name || "Unassigned"}</p>
                  </div>
                )}
              </div>
            </CardContent>
            {isStaff && (
              <CardFooter>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleUpdateTicket} 
                  className="ml-auto"
                >
                  Update Ticket
                </Button>
              </CardFooter>
            )}
          </Card>
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Conversation</h3>
        
        {loading ? (
          <div className="text-center p-4">Loading messages...</div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isCurrentUser = message.sender_id === userId;
              return (
                <div 
                  key={message.id}
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] ${isCurrentUser ? 'order-2' : 'order-2'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      {!isCurrentUser && (
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {getNameInitials(message.sender_name || 'UN')}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <span className="text-sm font-medium">
                        {message.sender_name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(message.created_at), 'PPp')}
                      </span>
                    </div>
                    <div className={`p-3 rounded-lg ${
                      isCurrentUser 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}>
                      {message.content}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Only show reply box if the ticket isn't closed */}
        {status !== 'closed' && (
          <div className="mt-6 space-y-2">
            <Label htmlFor="reply">Reply</Label>
            <div className="flex gap-2">
              <Textarea 
                id="reply"
                value={reply} 
                onChange={(e) => setReply(e.target.value)} 
                placeholder="Type your reply..." 
                className="flex-1"
              />
              <Button 
                onClick={handleSendReply} 
                disabled={sending || !reply.trim()}
              >
                <Send className="h-4 w-4 mr-1" /> Send
              </Button>
            </div>
          </div>
        )}
        
        {status === 'closed' && (
          <div className="bg-muted p-4 text-center rounded-md mt-4">
            This ticket is closed. No further replies can be added.
          </div>
        )}
      </div>
    </div>
  );
};
