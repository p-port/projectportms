
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Send, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { format } from "date-fns";
import { toast } from "sonner";

interface Message {
  id: string;
  content: string;
  is_from_support: boolean;
  created_at: string;
}

const translations = {
  en: {
    supportChat: "Support Chat",
    typeMessage: "Type your message...",
    send: "Send",
    close: "Close",
    supportTeam: "Support Team",
    you: "You",
    welcomeMessage: "Hello! How can we help you today?",
    loginPrompt: "Please log in to use the support chat.",
    loginButton: "Log In",
    noMessages: "No messages yet. Start a conversation!",
    justNow: "just now",
    messageSent: "Message sent",
    errorSending: "Error sending message. Please try again."
  },
  ko: {
    supportChat: "지원팀 채팅",
    typeMessage: "메시지를 입력하세요...",
    send: "보내기",
    close: "닫기",
    supportTeam: "지원팀",
    you: "나",
    welcomeMessage: "안녕하세요! 어떻게 도와드릴까요?",
    loginPrompt: "지원팀 채팅을 이용하려면 로그인하세요.",
    loginButton: "로그인",
    noMessages: "아직 메시지가 없습니다. 대화를 시작하세요!",
    justNow: "방금",
    messageSent: "메시지가 전송되었습니다",
    errorSending: "메시지 전송 중 오류가 발생했습니다. 다시 시도하세요."
  }
};

export const SupportChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [language] = useLocalStorage("language", "en");
  const t = translations[language as keyof typeof translations];

  useEffect(() => {
    // Check for authenticated user
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        setUser(data.session.user);
      }
    };
    
    checkUser();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Load messages when chat is opened and user is logged in
    if (isOpen && user) {
      loadMessages();
    }
  }, [isOpen, user]);

  useEffect(() => {
    // Scroll to bottom when messages change or chat is opened
    scrollToBottom();
  }, [messages, isOpen]);

  const loadMessages = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('support_chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      
      if (data) {
        setMessages(data);
        
        // If no messages, add welcome message
        if (data.length === 0) {
          const welcomeMessage: Message = {
            id: 'welcome',
            content: t.welcomeMessage,
            is_from_support: true,
            created_at: new Date().toISOString()
          };
          setMessages([welcomeMessage]);
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !user) return;
    
    const newMessage = {
      content: message.trim(),
      is_from_support: false,
      user_id: user.id
    };
    
    // Optimistically add message to UI
    const tempMessage: Message = {
      id: 'temp-' + Date.now(),
      ...newMessage,
      created_at: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, tempMessage]);
    setMessage("");
    
    try {
      const { data, error } = await supabase
        .from('support_chat_messages')
        .insert(newMessage)
        .select()
        .single();
        
      if (error) throw error;
      
      // Replace temp message with real one
      if (data) {
        setMessages(prev => 
          prev.map(msg => msg.id === tempMessage.id ? data : msg)
        );
        toast.success(t.messageSent);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      toast.error(t.errorSending);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return t.justNow;
    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffMinutes < 24 * 60) return format(date, 'HH:mm');
    return format(date, 'MMM d');
  };

  return (
    <>
      {/* Chat Button */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button 
          size="icon" 
          className="h-14 w-14 rounded-full shadow-lg"
          onClick={() => setIsOpen(true)}
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-80 sm:w-96 shadow-xl">
          <Card>
            <CardHeader className="py-3 px-4 flex flex-row justify-between items-center">
              <CardTitle className="text-lg">{t.supportChat}</CardTitle>
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            
            <CardContent className="p-0">
              {user ? (
                <div className="h-80 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 && !loading ? (
                    <div className="text-center text-muted-foreground py-8">
                      {t.noMessages}
                    </div>
                  ) : (
                    messages.map(msg => (
                      <div 
                        key={msg.id}
                        className={`flex flex-col ${msg.is_from_support ? 'items-start' : 'items-end'}`}
                      >
                        <div className={`max-w-[80%] rounded-lg px-3 py-2 ${
                          msg.is_from_support 
                            ? 'bg-muted text-muted-foreground' 
                            : 'bg-primary text-primary-foreground'
                        }`}>
                          {msg.content}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {msg.is_from_support ? t.supportTeam : t.you} • {formatMessageTime(msg.created_at)}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <div className="h-80 flex flex-col items-center justify-center p-4">
                  <p className="text-center text-muted-foreground mb-4">
                    {t.loginPrompt}
                  </p>
                  <Button onClick={() => window.location.href = "/auth"}>
                    {t.loginButton}
                  </Button>
                </div>
              )}
            </CardContent>
            
            {user && (
              <CardFooter className="p-4 pt-0">
                <div className="flex w-full gap-2">
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t.typeMessage}
                    className="min-h-10 flex-1"
                    disabled={loading}
                  />
                  <Button 
                    size="icon" 
                    onClick={sendMessage}
                    disabled={!message.trim() || loading}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            )}
          </Card>
        </div>
      )}
    </>
  );
};
