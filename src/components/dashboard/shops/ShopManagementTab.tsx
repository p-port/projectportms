
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, UserPlus, UserX } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Shop } from "@/types/shop";

interface ShopMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface ShopManagementTabProps {
  userId: string;
}

export const ShopManagementTab = ({ userId }: ShopManagementTabProps) => {
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<ShopMember[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  // Fetch shop data and check if current user is the owner
  useEffect(() => {
    const fetchShopData = async () => {
      try {
        setLoading(true);
        
        // Get user's shop info
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('shop_id')
          .eq('id', userId)
          .single();
        
        if (profileError) throw profileError;
        
        if (!profileData?.shop_id) {
          setLoading(false);
          return; // User doesn't have a shop
        }
        
        // Get shop details
        const { data: shopData, error: shopError } = await supabase
          .from('shops')
          .select('*')
          .eq('id', profileData.shop_id)
          .single();
          
        if (shopError) throw shopError;
        
        setShop(shopData);
        
        // Check if current user is the shop owner
        setIsOwner(shopData.owner_id === userId);
        
        // Fetch shop members (all users associated with this shop)
        const { data: membersData, error: membersError } = await supabase
          .from('profiles')
          .select('id, name, email, role')
          .eq('shop_id', profileData.shop_id)
          .order('name');
          
        if (membersError) throw membersError;
        
        setMembers(membersData as ShopMember[]);
      } catch (error) {
        console.error('Error fetching shop data:', error);
        toast.error("Failed to load shop information");
      } finally {
        setLoading(false);
      }
    };
    
    fetchShopData();
  }, [userId]);

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteEmail.trim() || !shop) return;
    
    try {
      setIsInviting(true);
      
      // Check if user with this email exists
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id, shop_id')
        .eq('email', inviteEmail.trim())
        .single();
      
      if (userError) {
        toast.error("User with this email not found");
        return;
      }
      
      if (userData.shop_id) {
        toast.error("This user is already part of a shop");
        return;
      }
      
      // Assign user to this shop
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ shop_id: shop.id })
        .eq('id', userData.id);
        
      if (updateError) throw updateError;
      
      toast.success("User invited to shop successfully");
      
      // Refresh members list
      const { data: membersData } = await supabase
        .from('profiles')
        .select('id, name, email, role')
        .eq('shop_id', shop.id)
        .order('name');
        
      setMembers(membersData as ShopMember[]);
      
      setInviteEmail(""); // Clear input
    } catch (error) {
      console.error('Error inviting member:', error);
      toast.error("Failed to invite member");
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!shop || memberId === userId) return;
    
    // Prevent removing the owner
    if (shop.owner_id === memberId) {
      toast.error("Cannot remove the shop owner");
      return;
    }
    
    try {
      // Remove user from shop
      const { error } = await supabase
        .from('profiles')
        .update({ shop_id: null })
        .eq('id', memberId);
        
      if (error) throw error;
      
      toast.success("Member removed from shop");
      
      // Update local state
      setMembers(members.filter(member => member.id !== memberId));
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error("Failed to remove member");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-6">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!shop) {
    return (
      <Alert variant="default" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You are not currently associated with any shop.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Shop Details</CardTitle>
          <CardDescription>Information about your shop</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="divide-y divide-border">
            <div className="py-3 grid grid-cols-3 gap-4">
              <dt className="text-sm font-medium text-muted-foreground">Shop Name</dt>
              <dd className="text-sm col-span-2">{shop.name}</dd>
            </div>
            <div className="py-3 grid grid-cols-3 gap-4">
              <dt className="text-sm font-medium text-muted-foreground">Region</dt>
              <dd className="text-sm col-span-2">{shop.region}</dd>
            </div>
            <div className="py-3 grid grid-cols-3 gap-4">
              <dt className="text-sm font-medium text-muted-foreground">District</dt>
              <dd className="text-sm col-span-2">{shop.district}</dd>
            </div>
            <div className="py-3 grid grid-cols-3 gap-4">
              <dt className="text-sm font-medium text-muted-foreground">Shop ID</dt>
              <dd className="text-sm col-span-2 font-mono">{shop.unique_identifier}</dd>
            </div>
            <div className="py-3 grid grid-cols-3 gap-4">
              <dt className="text-sm font-medium text-muted-foreground">Your Status</dt>
              <dd className="text-sm col-span-2">
                {isOwner ? (
                  <span className="text-amber-500 font-medium">Shop Owner</span>
                ) : (
                  <span>Staff Member</span>
                )}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Shop Members</CardTitle>
          <CardDescription>People who have access to this shop</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                {isOwner && <TableHead className="w-[100px]">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isOwner ? 4 : 3} className="text-center">
                    No members found
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.name}
                      {shop.owner_id === member.id && (
                        <span className="ml-2 text-xs text-amber-500 font-medium">(Owner)</span>
                      )}
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell className="capitalize">{member.role}</TableCell>
                    {isOwner && (
                      <TableCell>
                        {shop.owner_id !== member.id && member.id !== userId && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {isOwner && (
            <form onSubmit={handleInviteMember} className="mt-6 flex gap-2">
              <Input
                placeholder="User email to invite"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={isInviting || !inviteEmail.trim()}>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
