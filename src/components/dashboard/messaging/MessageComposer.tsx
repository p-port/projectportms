
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Select, 
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface MessageComposerProps {
  onClose: (messageSent?: boolean) => void;
  replyTo?: {
    userId: string;
    userName: string;
    subject: string;
  };
}

export const MessageComposer = ({ onClose, replyTo }: MessageComposerProps) => {
  const [subject, setSubject] = useState(replyTo?.subject || "");
  const [content, setContent] = useState("");
  const [recipient, setRecipient] = useState(replyTo?.userId || "");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('name');

        if (error) throw error;
        
        setUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast({
          title: "Error loading recipients",
          description: "Unable to load recipient list",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [toast]);

  const handleSend = async () => {
    if (!recipient) {
      toast({
        title: "Recipient required",
        description: "Please select a recipient for your message",
        variant: "destructive"
      });
      return;
    }

    if (!content.trim()) {
      toast({
        title: "Message content required",
        description: "Please enter a message",
        variant: "destructive"
      });
      return;
    }

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('messages')
        .insert({
          subject,
          content,
          sender_id: user.id,
          recipient_id: recipient
        });

      if (error) throw error;

      onClose(true);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Failed to send message",
        description: "Please try again later",
        variant: "destructive"
      });
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">New Message</h3>
        <Button variant="ghost" size="sm" onClick={() => onClose()}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="recipient">To</Label>
          <Select 
            value={recipient} 
            onValueChange={setRecipient}
            disabled={!!replyTo || loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a recipient" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Recipients</SelectLabel>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({user.role})
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {replyTo && (
            <div className="text-sm text-muted-foreground">
              Replying to {replyTo.userName}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Input 
            id="subject" 
            value={subject} 
            onChange={e => setSubject(e.target.value)} 
            placeholder="Message subject" 
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">Message</Label>
          <Textarea 
            id="content" 
            value={content} 
            onChange={e => setContent(e.target.value)} 
            placeholder="Type your message here..." 
            rows={8}
          />
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => onClose()}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Cancel
          </Button>
          <Button onClick={handleSend} disabled={sending}>
            <Send className="h-4 w-4 mr-1" /> Send Message
          </Button>
        </div>
      </div>
    </div>
  );
};
