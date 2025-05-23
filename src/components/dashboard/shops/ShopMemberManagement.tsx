
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle, XCircle, UserPlus, Mail, Save, X, AlertTriangle } from "lucide-react";
import { Shop } from "@/types/shop";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getUserShopInfo } from "@/integrations/supabase/client";

type ShopMember = {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  status: "pending" | "active";
  isEditing?: boolean;
}

type InvitationData = {
  email: string;
  role: string;
}

export const ShopMemberManagement = ({ shopId, isAdmin = false }: { shopId: string; isAdmin?: boolean }) => {
  const [members, setMembers] = useState<ShopMember[]>([]);
  const [invitationData, setInvitationData] = useState<InvitationData>({ email: "", role: "mechanic" });
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  
  useEffect(() => {
    fetchShopInfo();
    fetchShopMembers();
  }, [shopId]);

  const fetchShopInfo = async () => {
    try {
      // If admin, just fetch the shop
      if (isAdmin) {
        const { data, error } = await supabase
          .from("shops")
          .select("*")
          .eq("id", shopId)
          .single();
          
        if (error) throw error;
        setShop(data);
        return;
      }
      
      // If not admin, check if current user is shop owner
      const userInfo = await getUserShopInfo();
      if (!userInfo || !userInfo.shop) return;
      
      setShop(userInfo.shop);
      
      // Check if current user is the owner
      const { data: userData } = await supabase.auth.getUser();
      setIsOwner(userData.user?.id === userInfo.shop.owner_id);
    } catch (error) {
      console.error("Error fetching shop info:", error);
      toast.error("Failed to load shop information");
    }
  };

  const fetchShopMembers = async () => {
    try {
      setLoading(true);
      // Get all users associated with this shop
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("shop_id", shopId);
        
      if (error) throw error;
      
      const shopMembers: ShopMember[] = data.map((profile) => ({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        status: profile.approved ? "active" : "pending",
        isEditing: false
      }));
      
      setMembers(shopMembers);
    } catch (error) {
      console.error("Error fetching shop members:", error);
      toast.error("Failed to load shop members");
    } finally {
      setLoading(false);
    }
  };
  
  const toggleEdit = (userId: string) => {
    setMembers(members.map(member => 
      member.id === userId 
        ? { ...member, isEditing: !member.isEditing } 
        : member
    ));
  };

  const handleChange = (userId: string, field: keyof ShopMember, value: any) => {
    setMembers(members.map(member => 
      member.id === userId 
        ? { ...member, [field]: value } 
        : member
    ));
  };

  const saveChanges = async (member: ShopMember) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          role: member.role,
          approved: member.status === "active"
        })
        .eq("id", member.id);
        
      if (error) throw error;
      
      toggleEdit(member.id);
      toast.success("Member updated successfully");
    } catch (error) {
      console.error("Error updating member:", error);
      toast.error("Failed to update member");
    }
  };

  const removeMember = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this member from the shop?")) return;
    
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ shop_id: null })
        .eq("id", userId);
        
      if (error) throw error;
      
      setMembers(members.filter(member => member.id !== userId));
      toast.success("Member removed from shop");
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Failed to remove member");
    }
  };

  const inviteMember = async () => {
    if (!invitationData.email || !invitationData.role) {
      toast.error("Please provide an email and role");
      return;
    }

    try {
      // Check if user exists
      const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", invitationData.email)
        .single();

      if (userError && userError.code !== "PGRST116") { // PGRST116 is "No rows returned" which is expected if user doesn't exist
        throw userError;
      }

      if (userData) {
        // User exists, update their shop_id
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ 
            shop_id: shopId,
            role: invitationData.role,
            approved: false // Require approval
          })
          .eq("id", userData.id);
          
        if (updateError) throw updateError;
        
        toast.success("Invitation sent to existing user");
        
        // Add to members list
        const newMember: ShopMember = {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          role: invitationData.role,
          status: "pending"
        };
        
        setMembers([...members, newMember]);
      } else {
        // User doesn't exist, create an invitation (in a real app, would send email)
        toast.info("User does not exist in system yet. In a production app, an invitation email would be sent.");
        
        // For demo purposes, simulate a "pending" invitation
        const dummyId = crypto.randomUUID();
        const newMember: ShopMember = {
          id: dummyId,
          name: null,
          email: invitationData.email,
          role: invitationData.role,
          status: "pending"
        };
        
        setMembers([...members, newMember]);
      }
      
      setShowInviteDialog(false);
      setInvitationData({ email: "", role: "mechanic" });
    } catch (error) {
      console.error("Error inviting member:", error);
      toast.error("Failed to invite member");
    }
  };

  const canManageMembers = isAdmin || isOwner;

  if (!shop) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Shop Members</CardTitle>
          <CardDescription>
            No shop information available
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Shop Members</CardTitle>
            <CardDescription>
              Manage members for {shop.name}
            </CardDescription>
          </div>
          {canManageMembers && (
            <Button 
              variant="outline" 
              className="flex items-center gap-2" 
              onClick={() => setShowInviteDialog(true)}
            >
              <UserPlus className="h-4 w-4" />
              Invite Member
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                {canManageMembers && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={canManageMembers ? 5 : 4} className="text-center py-4">
                    Loading shop members...
                  </TableCell>
                </TableRow>
              ) : members.length > 0 ? (
                members.map(member => (
                  <TableRow key={member.id}>
                    <TableCell>{member.name || "Not registered"}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      {member.isEditing ? (
                        <Select
                          value={member.role || "mechanic"}
                          onValueChange={(value) => handleChange(member.id, "role", value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mechanic">Mechanic</SelectItem>
                            <SelectItem value="support">Support</SelectItem>
                            {/* Admin role is restricted */}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant={member.role === "support" ? "secondary" : "default"}>
                          {member.role || "mechanic"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {member.isEditing ? (
                        <Select
                          value={member.status}
                          onValueChange={(value: "pending" | "active") => handleChange(member.id, "status", value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant={member.status === "active" ? "success" : "warning"}>
                          {member.status}
                        </Badge>
                      )}
                    </TableCell>
                    {canManageMembers && (
                      <TableCell>
                        {member.isEditing ? (
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => saveChanges(member)}>
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => toggleEdit(member.id)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => toggleEdit(member.id)}>
                              Edit
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => removeMember(member.id)}>
                              Remove
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={canManageMembers ? 5 : 4} className="text-center py-4">
                    No shop members found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Member</DialogTitle>
            <DialogDescription>
              Invite a new member to join {shop.name}. They will receive a notification to confirm joining.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="flex items-center gap-4">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Email address"
                value={invitationData.email}
                onChange={(e) => setInvitationData({...invitationData, email: e.target.value})}
              />
            </div>
            
            <div className="grid gap-2">
              <label className="text-sm font-medium">Role</label>
              <Select
                value={invitationData.role}
                onValueChange={(value) => setInvitationData({...invitationData, role: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mechanic">Mechanic</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>Cancel</Button>
            <Button onClick={inviteMember}>Send Invitation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
