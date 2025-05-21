
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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
import { Label } from "@/components/ui/label";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface RecipientSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  replyToName?: string;
}

export const RecipientSelect = ({ 
  value, 
  onChange, 
  disabled = false,
  replyToName
}: RecipientSelectProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
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

  return (
    <div className="space-y-2">
      <Label htmlFor="recipient">To</Label>
      <Select 
        value={value} 
        onValueChange={onChange}
        disabled={disabled || loading}
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
      {replyToName && (
        <div className="text-sm text-muted-foreground">
          Replying to {replyToName}
        </div>
      )}
    </div>
  );
};
