
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Save, UserCog } from "lucide-react";
import { ShopOwnerManager } from "../shops/ShopOwnerManager";
import { ShopMemberManagement } from "../shops/ShopMemberManagement";

export const UserDetails = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isShopOwner, setIsShopOwner] = useState(false);
  
  useEffect(() => {
    if (!userId) return;
    fetchUserDetails();
  }, [userId]);
  
  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (profileError) throw profileError;
      
      // If user has a shop_id, check if they are the owner
      if (profileData.shop_id) {
        const { data: shopData, error: shopError } = await supabase
          .from('shops')
          .select('*')
          .eq('id', profileData.shop_id)
          .single();
          
        if (!shopError && shopData) {
          setIsShopOwner(shopData.owner_id === userId);
        }
      }
      
      setUser(profileData);
    } catch (error) {
      console.error("Error fetching user details:", error);
      toast.error("Failed to load user details");
      navigate("/user-management");
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (field: string, value: any) => {
    setUser({ ...user, [field]: value });
  };
  
  const saveChanges = async () => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('profiles')
        .update({
          name: user.name,
          email: user.email,
          role: user.role,
          approved: user.approved
        })
        .eq('id', userId);
        
      if (error) throw error;
      
      toast.success("User updated successfully");
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user");
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Details</CardTitle>
          <CardDescription>Loading user information...</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Not Found</CardTitle>
          <CardDescription>The requested user could not be found.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate("/user-management")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to User Management
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="mb-2"
            onClick={() => navigate("/user-management")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <UserCog className="h-6 w-6" />
            User Details
          </h1>
          <p className="text-muted-foreground">
            Manage user permissions and shop assignment
          </p>
        </div>
      </header>
      
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Edit user profile information and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={user.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  value={user.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  disabled
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <Select
                  value={user.role || 'mechanic'}
                  onValueChange={(value) => handleChange('role', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mechanic">Mechanic</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between space-x-2">
                <label className="text-sm font-medium">Account Status</label>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={user.approved || false}
                    onCheckedChange={(checked) => handleChange('approved', checked)}
                  />
                  <span>{user.approved ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button
                onClick={saveChanges}
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <ShopOwnerManager 
        userId={userId!} 
        currentOwnerStatus={isShopOwner} 
        shopId={user.shop_id}
      />
      
      {user.shop_id && (
        <ShopMemberManagement shopId={user.shop_id} isAdmin={true} />
      )}
    </div>
  );
};
