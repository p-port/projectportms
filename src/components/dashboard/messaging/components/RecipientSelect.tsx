
import { useState, useEffect, useMemo } from "react";
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
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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

const translations = {
  en: {
    to: "To",
    selectRecipient: "Select a recipient",
    pleaseSelect: "Please select a recipient for your message",
    recipients: "Recipients",
    replyingTo: "Replying to",
    loading: "Loading recipients...",
    errorLoadingRecipients: "Unable to load recipient list",
    noRecipients: "No recipients found",
    admin: "Admin",
    support: "Support",
    mechanic: "Mechanic",
    customer: "Customer",
    search: "Search by name or email"
  },
  ko: {
    to: "받는 사람",
    selectRecipient: "수신자 선택",
    pleaseSelect: "메시지를 보낼 수신자를 선택해주세요",
    recipients: "수신자 목록",
    replyingTo: "회신 대상",
    loading: "수신자 목록 로딩 중...",
    errorLoadingRecipients: "수신자 목록을 로드할 수 없습니다",
    noRecipients: "수신자를 찾을 수 없습니다",
    admin: "관리자",
    support: "지원팀",
    mechanic: "정비사",
    customer: "고객",
    search: "이름 또는 이메일로 검색"
  }
};

export const RecipientSelect = ({ 
  value, 
  onChange, 
  disabled = false,
  replyToName
}: RecipientSelectProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const [language] = useLocalStorage("language", "en");
  const t = translations[language as keyof typeof translations];

  const translateRole = (role: string) => {
    const roleKey = role?.toLowerCase() as keyof typeof t;
    return t[roleKey] || role;
  };

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('name');

        if (error) throw error;
        
        // Always ensure users is an array
        setUsers(Array.isArray(data) ? data : []); 
      } catch (error) {
        console.error('Error fetching users:', error);
        toast({
          title: t.errorLoadingRecipients,
          description: String(error),
          variant: "destructive"
        });
        setUsers([]); // Set to empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [toast, language]);

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    // Always return an array
    if (!Array.isArray(users) || users.length === 0) return []; 
    if (!searchQuery) return users;
    
    const query = searchQuery.toLowerCase();
    return users.filter(user => 
      (user.name && user.name.toLowerCase().includes(query)) || 
      (user.email && user.email.toLowerCase().includes(query))
    );
  }, [users, searchQuery]);

  // Find selected user to display their name
  const selectedUser = useMemo(() => {
    if (!Array.isArray(users) || users.length === 0 || !value) return null;
    return users.find(user => user.id === value);
  }, [users, value]);

  return (
    <div className="space-y-2">
      <Label htmlFor="recipient">{t.to}</Label>
      
      {/* Use Popover with Command component for better search UX */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled || loading}
          >
            {value && selectedUser
              ? `${selectedUser.name} (${translateRole(selectedUser.role)})`
              : t.selectRecipient}
            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput 
              placeholder={t.search} 
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            {loading ? (
              <div className="py-6 text-center">
                <Loader2 className="animate-spin w-4 h-4 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{t.loading}</p>
              </div>
            ) : (
              <>
                <CommandEmpty>{t.noRecipients}</CommandEmpty>
                {/* Only render CommandGroup when there are actually items to show */}
                {Array.isArray(filteredUsers) && filteredUsers.length > 0 && (
                  <CommandGroup heading={t.recipients}>
                    {filteredUsers.map(user => (
                      <CommandItem
                        key={user.id}
                        value={user.id}
                        onSelect={() => {
                          onChange(user.id);
                          setOpen(false);
                        }}
                        className="flex justify-between"
                      >
                        <div>
                          <span className={cn(
                            "mr-2",
                            user.id === value && "font-bold"
                          )}>
                            {user.name || "Unknown"}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            ({user.email || "No email"})
                          </span>
                        </div>
                        <span className="text-xs bg-muted px-2 py-1 rounded">
                          {translateRole(user.role || "user")}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </>
            )}
          </Command>
        </PopoverContent>
      </Popover>

      {!value && !replyToName && (
        <p className="text-sm text-amber-500">{t.pleaseSelect}</p>
      )}
      {replyToName && (
        <div className="text-sm text-muted-foreground">
          {t.replyingTo} {replyToName}
        </div>
      )}
    </div>
  );
};
