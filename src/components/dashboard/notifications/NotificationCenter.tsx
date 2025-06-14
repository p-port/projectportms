
import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShopInvitationModal } from "./ShopInvitationModal";

interface Notification {
  id: string;
  title: string;
  content: string;
  created_at: string;
  is_read: boolean;
  type: string;
  reference_id?: string;
}

export const NotificationCenter = ({ userId }: { userId?: string }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [invitationModal, setInvitationModal] = useState<{
    isOpen: boolean;
    invitationId: string;
    shopName: string;
  }>({
    isOpen: false,
    invitationId: '',
    shopName: ''
  });

  // Check for pending shop invitations when component mounts or user comes online
  const checkPendingInvitations = async () => {
    if (!userId) return;

    try {
      // Get user's email to check for pending invitations
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();

      if (!profile?.email) return;

      // Check for pending shop invitations
      const { data: pendingInvitations } = await supabase
        .from('shop_invitations')
        .select(`
          id,
          shops (
            name
          )
        `)
        .eq('email', profile.email)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString());

      if (pendingInvitations && pendingInvitations.length > 0) {
        // Show the first pending invitation
        const invitation = pendingInvitations[0];
        setInvitationModal({
          isOpen: true,
          invitationId: invitation.id,
          shopName: invitation.shops?.name || 'Unknown Shop'
        });
      }
    } catch (error) {
      console.error('Error checking pending invitations:', error);
    }
  };

  // Fetch notifications
  useEffect(() => {
    if (!userId) return;

    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        
        setNotifications(data || []);
        
        // Count unread notifications
        const unread = (data || []).filter(n => !n.is_read).length;
        setUnreadCount(unread);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
    checkPendingInvitations();

    // Subscribe to new notifications
    const channel = supabase
      .channel('notifications-changes')
      .on('postgres_changes', 
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        }, 
        (payload) => {
          // @ts-ignore - payload.new typing issue
          setNotifications(prev => [payload.new, ...prev].slice(0, 10));
          setUnreadCount(prev => prev + 1);
          toast.info("You have a new notification");
        }
      )
      .subscribe();

    // Also listen for shop invitation changes
    const invitationChannel = supabase
      .channel('invitation-changes')
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'shop_invitations'
        },
        (payload) => {
          // Check if this invitation is for the current user
          checkPendingInvitations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(invitationChannel);
    };
  }, [userId]);

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
  };

  const handleNavigateToReference = async (notification: Notification) => {
    // Mark notification as read first
    markAsRead(notification.id);
    
    // Handle different notification types
    if (notification.type === 'shop_invitation' && notification.reference_id) {
      // Get shop details for the invitation
      try {
        const { data: invitation, error } = await supabase
          .from('shop_invitations')
          .select(`
            id,
            shops (
              name
            )
          `)
          .eq('id', notification.reference_id)
          .single();

        if (error) throw error;

        setInvitationModal({
          isOpen: true,
          invitationId: notification.reference_id,
          shopName: invitation.shops?.name || 'Unknown Shop'
        });
      } catch (error) {
        console.error('Error fetching invitation details:', error);
        toast.error('Failed to load invitation details');
      }
    } else if (notification.type === 'ticket' && notification.reference_id) {
      // Set the active tab to support and close notification
      const event = new CustomEvent('navigate-to-tab', { detail: 'support' });
      window.dispatchEvent(event);
      toast.info(`Opening support tickets`);
    } else if (notification.type === 'verification') {
      // Navigate to account tab
      const event = new CustomEvent('navigate-to-tab', { detail: 'account' });
      window.dispatchEvent(event);
      toast.success(`Account verified successfully!`);
    } else {
      // Generic fallback
      toast.info(`Notification: ${notification.title}`);
    }
    
    setIsOpen(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handleInvitationResponse = () => {
    // Refresh notifications after responding to invitation
    if (userId) {
      const fetchNotifications = async () => {
        try {
          const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(10);

          if (error) throw error;
          
          setNotifications(data || []);
          
          // Count unread notifications
          const unread = (data || []).filter(n => !n.is_read).length;
          setUnreadCount(unread);
        } catch (error) {
          console.error('Error fetching notifications:', error);
        }
      };

      fetchNotifications();
    }
  };

  return (
    <>
      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge variant="destructive" className="absolute -top-1 -right-1 min-w-[18px] h-[18px] p-0 flex items-center justify-center text-xs">
                {unreadCount}
              </Badge>
            )}
            <span className="sr-only">Notifications</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <div className="p-2 border-b">
            <h3 className="font-medium text-sm">Notifications</h3>
          </div>
          <div className="max-h-80 overflow-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`p-3 m-2 cursor-pointer hover:bg-muted/50 ${!notification.is_read ? 'bg-muted/20' : ''}`}
                  onClick={() => handleNavigateToReference(notification)}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="font-medium text-sm">{notification.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">{notification.content}</div>
                      <div className="text-xs text-muted-foreground mt-1">{formatDate(notification.created_at)}</div>
                    </div>
                    {!notification.is_read && (
                      <div className="w-2 h-2 bg-primary rounded-full mt-1.5" />
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
          {notifications.length > 0 && (
            <div className="p-2 border-t">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-xs"
                onClick={async () => {
                  try {
                    // Mark all as read
                    const { error } = await supabase
                      .from('notifications')
                      .update({ is_read: true })
                      .eq('user_id', userId)
                      .eq('is_read', false);

                    if (error) throw error;

                    // Update local state
                    setNotifications(prev => 
                      prev.map(n => ({ ...n, is_read: true }))
                    );
                    setUnreadCount(0);
                  } catch (error) {
                    console.error('Error marking all as read:', error);
                  }
                }}
              >
                Mark all as read
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      <ShopInvitationModal
        isOpen={invitationModal.isOpen}
        onClose={() => setInvitationModal(prev => ({ ...prev, isOpen: false }))}
        invitationId={invitationModal.invitationId}
        shopName={invitationModal.shopName}
        userId={userId || ''}
        onResponse={handleInvitationResponse}
      />
    </>
  );
};
