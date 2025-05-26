
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle, XCircle, Building2 } from "lucide-react";

interface ShopInvitation {
  id: string;
  shop_id: string;
  email: string;
  invitation_code: string;
  status: string;
  created_at: string;
  shops: {
    name: string;
    region: string;
    district: string;
  };
}

interface ShopInvitationHandlerProps {
  userId: string;
  userEmail: string;
}

export const ShopInvitationHandler = ({ userId, userEmail }: ShopInvitationHandlerProps) => {
  const [invitations, setInvitations] = useState<ShopInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actualUserEmail, setActualUserEmail] = useState<string>("");

  useEffect(() => {
    fetchUserEmailAndInvitations();
  }, [userEmail, userId]);

  const fetchUserEmailAndInvitations = async () => {
    try {
      setLoading(true);
      
      // Get the actual user email
      let emailToUse = userEmail;
      
      // If userEmail looks like a fallback (user-xxxxx), try to get real email
      if (userEmail.startsWith('user-')) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          emailToUse = user.email;
        } else {
          // Try profiles table
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', userId)
            .single();
          
          if (profile?.email) {
            emailToUse = profile.email;
          }
        }
      }
      
      setActualUserEmail(emailToUse);
      
      // Only fetch invitations if we have a real email
      if (emailToUse && !emailToUse.startsWith('user-')) {
        await fetchInvitations(emailToUse);
      } else {
        setInvitations([]);
      }
    } catch (error) {
      console.error('Error fetching user email and invitations:', error);
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitations = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('shop_invitations')
        .select(`
          *,
          shops (
            name,
            region,
            district
          )
        `)
        .eq('email', email)
        .eq('status', 'pending');

      if (error) throw error;
      setInvitations(data || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
      setInvitations([]);
    }
  };

  const respondToInvitation = async (invitationId: string, shopId: string, accept: boolean) => {
    try {
      if (accept) {
        // Update user's shop_id
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ shop_id: shopId })
          .eq('id', userId);

        if (profileError) throw profileError;

        // Update invitation status
        const { error: invitationError } = await supabase
          .from('shop_invitations')
          .update({ status: 'accepted' })
          .eq('id', invitationId);

        if (invitationError) throw invitationError;

        toast.success('Shop invitation accepted! Welcome to your new shop.');
        
        // Refresh the page to show the shop
        window.location.reload();
      } else {
        // Decline invitation
        const { error } = await supabase
          .from('shop_invitations')
          .update({ status: 'declined' })
          .eq('id', invitationId);

        if (error) throw error;

        toast.success('Invitation declined.');
        fetchUserEmailAndInvitations();
      }
    } catch (error) {
      console.error('Error responding to invitation:', error);
      toast.error('Failed to respond to invitation');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading invitations...</div>
        </CardContent>
      </Card>
    );
  }

  // Don't show anything if no real email available
  if (!actualUserEmail || actualUserEmail.startsWith('user-')) {
    return null;
  }

  if (invitations.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Shop Invitations
        </CardTitle>
        <CardDescription>
          You have been invited to join the following shops
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {invitations.map((invitation) => (
          <div key={invitation.id} className="border rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium">{invitation.shops.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {invitation.shops.region}, {invitation.shops.district}
                </p>
                <Badge variant="secondary" className="mt-2">
                  Pending Invitation
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => respondToInvitation(invitation.id, invitation.shop_id, true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => respondToInvitation(invitation.id, invitation.shop_id, false)}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Decline
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
