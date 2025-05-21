
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
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Loader2 } from "lucide-react";

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
    customer: "Customer"
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
    customer: "고객"
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
  const { toast } = useToast();
  const [language] = useLocalStorage("language", "en");
  const t = translations[language as keyof typeof translations];

  const translateRole = (role: string) => {
    const roleKey = role.toLowerCase() as keyof typeof t;
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
        
        setUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast({
          title: t.errorLoadingRecipients,
          description: String(error),
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [toast, language]);

  return (
    <div className="space-y-2">
      <Label htmlFor="recipient">{t.to}</Label>
      <Select 
        value={value} 
        onValueChange={onChange}
        disabled={disabled || loading}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={t.selectRecipient} />
        </SelectTrigger>
        <SelectContent>
          {loading ? (
            <div className="py-2 px-2 text-center">
              <Loader2 className="animate-spin w-4 h-4 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{t.loading}</p>
            </div>
          ) : users.length > 0 ? (
            <SelectGroup>
              <SelectLabel>{t.recipients}</SelectLabel>
              {users.map(user => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name} ({translateRole(user.role)})
                </SelectItem>
              ))}
            </SelectGroup>
          ) : (
            <div className="py-2 px-2 text-center">
              <p className="text-sm text-muted-foreground">{t.noRecipients}</p>
            </div>
          )}
        </SelectContent>
      </Select>
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
