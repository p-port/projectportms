
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserPlus, Mail, Users, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ShopUserInvitationProps {
  shopId: string;
}

interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  shop_id: string | null;
}

export const ShopUserInvitation = ({ shopId }: ShopUserInvitationProps) => {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [inviting, setInviting] = useState(false);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Direct invitation states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [directInviting, setDirectInviting] = useState(false);

  useEffect(() => {
    fetchInvitations();
  }, [shopId]);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const searchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, role, shop_id')
        .or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .eq('approved', true)
        .is('shop_id', null) // Only show users not assigned to any shop
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('shop_invitations')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
      toast.error('Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const sendEmailInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setInviting(true);
    try {
      // Generate invitation code
      const invitationCode = Math.random().toString(36).substring(2, 15) + 
                           Math.random().toString(36).substring(2, 15);

      // Get shop name for the notification
      const { data: shopData } = await supabase
        .from('shops')
        .select('name')
        .eq('id', shopId)
        .single();

      const { error } = await supabase
        .from('shop_invitations')
        .insert({
          shop_id: shopId,
          email: email.trim(),
          phone: phone.trim() || null,
          invitation_code: invitationCode,
          invited_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      // Check if user exists and create notification
      const { data: userData } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email.trim())
        .single();

      if (userData) {
        // Create notification for existing user
        await supabase
          .from('notifications')
          .insert({
            user_id: userData.id,
            title: 'Shop Invitation',
            content: `You have been invited to join ${shopData?.name || 'a shop'}. Check your shop section to respond.`,
            type: 'shop',
            reference_id: shopId
          });
      }

      toast.success('Invitation sent successfully!');
      setEmail('');
      setPhone('');
      fetchInvitations();
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      toast.error(error.message || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const sendDirectInvitation = async () => {
    if (!selectedUser) {
      toast.error('Please select a user to invite');
      return;
    }

    setDirectInviting(true);
    try {
      // Directly assign user to shop
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ shop_id: shopId })
        .eq('id', selectedUser.id);

      if (profileError) throw profileError;

      toast.success(`${selectedUser.name || selectedUser.email} has been added to your shop!`);
      setSelectedUser(null);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error: any) {
      console.error('Error adding user to shop:', error);
      toast.error(error.message || 'Failed to add user to shop');
    } finally {
      setDirectInviting(false);
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('shop_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;

      toast.success('Invitation cancelled');
      fetchInvitations();
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      toast.error('Failed to cancel invitation');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Invite Users to Shop
        </CardTitle>
        <CardDescription>
          Add new members to your shop team
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="direct" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="direct">Direct Invitation</TabsTrigger>
            <TabsTrigger value="email">Email Invitation</TabsTrigger>
          </TabsList>
          
          <TabsContent value="direct" className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Search for existing users</label>
                <Input
                  placeholder="Enter user name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {searchResults.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select user to invite:</label>
                  <Select 
                    value={selectedUser?.id || ""} 
                    onValueChange={(value) => {
                      const user = searchResults.find(u => u.id === value);
                      setSelectedUser(user || null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {searchResults.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          <div className="flex flex-col">
                            <span>{user.name || 'Unnamed User'}</span>
                            <span className="text-xs text-muted-foreground">{user.email}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {selectedUser && (
                <div className="flex items-center justify-between p-3 bg-muted rounded">
                  <div>
                    <p className="font-medium">{selectedUser.name || 'Unnamed User'}</p>
                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {selectedUser.role || 'mechanic'}
                    </Badge>
                  </div>
                  <Button 
                    onClick={sendDirectInvitation}
                    disabled={directInviting}
                    size="sm"
                  >
                    {directInviting ? 'Adding...' : 'Add to Shop'}
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="email" className="space-y-4">
            <form onSubmit={sendEmailInvitation} className="space-y-4">
              <div>
                <label htmlFor="email" className="text-sm font-medium mb-2 block">
                  Email Address *
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="text-sm font-medium mb-2 block">
                  Phone Number (Optional)
                </label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              
              <Button type="submit" disabled={inviting} className="w-full">
                <Mail className="h-4 w-4 mr-2" />
                {inviting ? 'Sending...' : 'Send Invitation'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        {/* Pending Invitations */}
        <div className="mt-8">
          <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Pending Invitations
          </h4>
          
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading invitations...</p>
          ) : invitations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending invitations</p>
          ) : (
            <div className="space-y-2">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-3 border rounded"
                >
                  <div>
                    <p className="font-medium">{invitation.email}</p>
                    {invitation.phone && (
                      <p className="text-sm text-muted-foreground">{invitation.phone}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={invitation.status === 'pending' ? 'secondary' : 'default'}>
                        {invitation.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Sent {new Date(invitation.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {invitation.status === 'pending' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => cancelInvitation(invitation.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
