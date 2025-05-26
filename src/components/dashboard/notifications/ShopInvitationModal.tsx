
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle, XCircle, Building2 } from "lucide-react";

interface ShopInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  invitationId: string;
  shopName: string;
  userId: string;
  onResponse: () => void;
}

export const ShopInvitationModal = ({ 
  isOpen, 
  onClose, 
  invitationId, 
  shopName, 
  userId, 
  onResponse 
}: ShopInvitationModalProps) => {
  const [loading, setLoading] = useState(false);

  const handleResponse = async (accept: boolean) => {
    setLoading(true);
    try {
      // Get invitation details
      const { data: invitation, error: invitationError } = await supabase
        .from('shop_invitations')
        .select('shop_id')
        .eq('id', invitationId)
        .single();

      if (invitationError) throw invitationError;

      if (accept) {
        // Update user's shop_id
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ shop_id: invitation.shop_id })
          .eq('id', userId);

        if (profileError) throw profileError;

        // Update invitation status
        const { error: statusError } = await supabase
          .from('shop_invitations')
          .update({ status: 'accepted' })
          .eq('id', invitationId);

        if (statusError) throw statusError;

        toast.success(`Welcome to ${shopName}! You have successfully joined the shop.`);
        
        // Refresh the page to show the shop
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        // Decline invitation
        const { error } = await supabase
          .from('shop_invitations')
          .update({ status: 'declined' })
          .eq('id', invitationId);

        if (error) throw error;

        toast.success(`Invitation to ${shopName} declined.`);
      }

      onResponse();
      onClose();
    } catch (error) {
      console.error('Error responding to invitation:', error);
      toast.error('Failed to respond to invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            Shop Invitation
          </DialogTitle>
          <DialogDescription>
            You have been invited to join <strong>{shopName}</strong>. 
            Would you like to accept this invitation?
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            By accepting this invitation, you will become a member of {shopName} and will be able to access their job management system.
          </p>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleResponse(false)}
            disabled={loading}
            className="border-red-200 text-red-600 hover:bg-red-50"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Decline
          </Button>
          <Button
            onClick={() => handleResponse(true)}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Accept
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
