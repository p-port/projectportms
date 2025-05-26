
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
  expires_at: string;
  shops: {
    name: string;
    region: string;
    district: string;
  };
}

interface ShopInvitationHandlerProps {
  userId: string;
  userEmail?: string;
}

export const ShopInvitationHandler = ({ userId, userEmail }: ShopInvitationHandlerProps) => {
  const [invitations, setInvitations] = useState<ShopInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvitations();
  }, [userId]);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      
      // Get user's email from auth or profile
      const { data: { user } } = await supabase.auth.getUser();
      let email = user?.email;
      
      if (!email) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', userId)
          .single();
        email = profile?.email;
      }

      if (!email) {
        console.log('No email found for user, cannot check invitations');
        setInvitations([]);
        return;
      }

      // First, clean up expired invitations (older than 1 hour)
      await supabase
        .from('shop_invitations')
        .update({ status: 'expired' })
        .eq('status', 'pending')
        .lt('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

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
        .eq('status', 'pending')
        .gt('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()); // Only get invitations from last hour

      if (error) throw error;
      setInvitations(data || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  };

  const respondToInvitation = async (invitationId: string, shopId: string, accept: boolean) => {
    try {
      if (accept) {
        // Update user's shop_id and set as approved
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            shop_id: shopId,
            approved: true // Auto-approve when accepting shop invitation
          })
          .eq('id', userId);

        if (profileError) throw profileError;

        // Update invitation status
        const { error: invitationError } = await supabase
          .from('shop_invitations')
          .update({ 
            status: 'accepted',
            accepted_at: new Date().toISOString()
          })
          .eq('id', invitationId);

        if (invitationError) throw invitationError;

        toast.success('Shop invitation accepted! Welcome to your new shop.');
        
        // Remove the accepted invitation from state immediately
        setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
        
        // Refresh the page to show the shop
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        // Decline invitation
        const { error } = await supabase
          .from('shop_invitations')
          .update({ status: 'declined' })
          .eq('id', invitationId);

        if (error) throw error;

        toast.success('Invitation declined.');
        
        // Remove the declined invitation from state immediately
        setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
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

  if (invitations.length === 0) {
    return null;
  }

  return (
    <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
          <Building2 className="h-5 w-5" />
          Shop Invitations
        </CardTitle>
        <CardDescription className="text-blue-600 dark:text-blue-300">
          You have been invited to join the following shops
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {invitations.map((invitation) => (
          <div key={invitation.id} className="border border-blue-300 dark:border-blue-700 rounded-lg p-4 bg-blue-100 dark:bg-blue-900">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-lg text-blue-900 dark:text-blue-100">{invitation.shops.name}</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {invitation.shops.region}, {invitation.shops.district}
                </p>
                <Badge variant="secondary" className="mt-2 bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200">
                  Pending Invitation
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => respondToInvitation(invitation.id, invitation.shop_id, true)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => respondToInvitation(invitation.id, invitation.shop_id, false)}
                  className="border-red-400 text-red-700 hover:bg-red-100 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-950"
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
