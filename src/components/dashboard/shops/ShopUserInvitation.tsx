
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserPlus, Mail, Phone } from "lucide-react";

interface ShopUserInvitationProps {
  shopId: string;
  disabled?: boolean;
}

export const ShopUserInvitation = ({ shopId, disabled }: ShopUserInvitationProps) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);

  const generateInvitationCode = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const sendInvitation = async () => {
    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }

    setSending(true);
    try {
      const invitationCode = generateInvitationCode();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Create invitation record
      const { error: inviteError } = await supabase
        .from('shop_invitations')
        .insert({
          shop_id: shopId,
          email: email.trim(),
          phone: phone.trim() || null,
          invitation_code: invitationCode,
          invited_by: user.id,
          expires_at: expiresAt.toISOString()
        });

      if (inviteError) {
        throw inviteError;
      }

      // Here you would normally send an email with the invitation link
      // For now, we'll show the invitation code to the user
      const invitationLink = `${window.location.origin}/join/${invitationCode}`;
      
      toast.success(`Invitation sent! Share this link: ${invitationLink}`);
      
      // Reset form
      setEmail("");
      setPhone("");
      setOpen(false);
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error('Failed to send invitation');
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Invite Users
        </CardTitle>
        <CardDescription>
          Invite users to join your shop via email
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button disabled={disabled}>
              <Mail className="h-4 w-4 mr-2" />
              Send Invitation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite User to Shop</DialogTitle>
              <DialogDescription>
                Send an invitation link to allow someone to join your shop
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1234567890"
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={sendInvitation} disabled={sending}>
                  {sending ? "Sending..." : "Send Invitation"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
