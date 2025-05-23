
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase, RpcFunctions } from "@/integrations/supabase/client";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Store, UserSearch, Shield, Home } from "lucide-react";
import { Shop } from "@/types/shop";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ShopMemberManagement } from "../components/dashboard/shops/ShopMemberManagement";

interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
}

export function ShopOwnerDetail() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [availableUsers, setAvailableUsers] = useState<Profile[]>([]);
  const [currentOwner, setCurrentOwner] = useState<Profile | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    if (!shopId) return;
    fetchShopDetails();
    fetchAvailableUsers();
  }, [shopId]);

  const fetchShopDetails = async () => {
    try {
      setLoading(true);
      // Fetch shop details
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('*')
        .eq('id', shopId)
        .single();

      if (shopError) throw shopError;
      setShop(shopData);

      // If there's an owner, fetch their details
      if (shopData.owner_id) {
        const { data: ownerData, error: ownerError } = await supabase
          .from('profiles')
          .select('id, name, email, role')
          .eq('id', shopData.owner_id)
          .single();

        if (!ownerError && ownerData) {
          setCurrentOwner(ownerData);
        }
      } else {
        setCurrentOwner(null);
      }
    } catch (error) {
      console.error("Error fetching shop details:", error);
      toast.error("Failed to load shop details");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      // Fetch all users who could be assigned as owners
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, role')
        .eq('approved', true)
        .order('name');

      if (error) throw error;
      setAvailableUsers(data || []);
    } catch (error) {
      console.error("Error fetching available users:", error);
      toast.error("Failed to load available users");
    }
  };

  const assignOwner = async () => {
    if (!selectedUserId || !shopId) {
      toast.error("Please select a user to assign as owner");
      return;
    }

    setIsAssigning(true);
    try {
      console.log("Assigning owner:", { shopId, selectedUserId });
      
      // Use RPC function to bypass RLS
      const { data, error: rpcError } = await supabase
        .rpc('assign_shop_owner' as RpcFunctions, { 
          shop_id: shopId, 
          owner_id: selectedUserId 
        });
      
      console.log("RPC response:", { data, error: rpcError });
        
      if (rpcError) {
        console.error("RPC Error details:", rpcError);
        throw rpcError;
      }
      
      // Update the user profile to assign to this shop
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ shop_id: shopId, approved: true })
        .eq('id', selectedUserId);
        
      if (profileError) {
        console.error("Profile update error:", profileError);
        throw profileError;
      }
      
      toast.success("Shop owner successfully assigned");
      
      // Refresh data
      fetchShopDetails();
      setSelectedUserId(null);
    } catch (error: any) {
      console.error("Error assigning shop owner:", error);
      toast.error(`Failed to assign shop owner: ${error.message || JSON.stringify(error)}`);
    } finally {
      setIsAssigning(false);
    }
  };

  const removeOwner = async () => {
    if (!shop || !shop.owner_id) return;
    
    if (!confirm("Are you sure you want to remove the current owner? This will not remove them from the shop's staff.")) {
      return;
    }
    
    setIsRemoving(true);
    try {
      console.log("Removing owner from shop:", { shopId });
      
      // Use RPC function to bypass RLS
      const { data, error: rpcError } = await supabase
        .rpc('remove_shop_owner' as RpcFunctions, { 
          shop_id: shopId
        });
      
      console.log("RPC response:", { data, error: rpcError });
        
      if (rpcError) {
        console.error("RPC Error details:", rpcError);
        throw rpcError;
      }
      
      toast.success("Shop owner successfully removed");
      
      // Refresh data
      fetchShopDetails();
    } catch (error: any) {
      console.error("Error removing shop owner:", error);
      toast.error(`Failed to remove shop owner: ${error.message || JSON.stringify(error)}`);
    } finally {
      setIsRemoving(false);
    }
  };

  // Filter users based on search query
  const filteredUsers = availableUsers.filter(user => {
    if (!searchQuery) return true;
    
    const search = searchQuery.toLowerCase();
    return (
      (user.name?.toLowerCase().includes(search) || false) ||
      (user.email?.toLowerCase().includes(search) || false)
    );
  });

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <div className="flex space-x-2 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/shop-owners")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Shop Owners
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
            >
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
          </div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Store className="h-6 w-6" />
            Shop Owner Management
          </h1>
          <p className="text-muted-foreground">
            {shop?.name ? `Managing ownership for ${shop.name}` : 'Loading shop details...'}
          </p>
        </div>
      </header>

      {loading ? (
        <Card>
          <CardContent className="py-10 text-center">
            <div>Loading shop details...</div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                {currentOwner ? 'Current Owner' : 'No Owner Assigned'}
              </CardTitle>
              <CardDescription>
                {currentOwner 
                  ? 'The current owner has full control over this shop'
                  : 'This shop has no owner assigned. Assign an owner using the form below.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentOwner ? (
                <div className="space-y-4">
                  <div>
                    <div className="font-medium mb-1">Name</div>
                    <div>{currentOwner.name || 'Not provided'}</div>
                  </div>
                  <div>
                    <div className="font-medium mb-1">Email</div>
                    <div>{currentOwner.email}</div>
                  </div>
                  <div>
                    <div className="font-medium mb-1">Role</div>
                    <div className="capitalize">{currentOwner.role || 'mechanic'}</div>
                  </div>
                  <div className="pt-2">
                    <Button 
                      variant="destructive" 
                      onClick={removeOwner}
                    >
                      Remove as Owner
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground">
                  No owner is currently assigned to this shop.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserSearch className="h-4 w-4" />
                Assign New Owner
              </CardTitle>
              <CardDescription>
                Search for a user and assign them as the owner of this shop
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Input
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="mb-2"
                  />
                  
                  <Select
                    value={selectedUserId || ""}
                    onValueChange={setSelectedUserId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name || 'Unnamed'} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  onClick={assignOwner} 
                  disabled={!selectedUserId}
                >
                  Assign as Owner
                </Button>
              </div>
            </CardContent>
          </Card>

          {shopId && (
            <ShopMemberManagement shopId={shopId} isAdmin={true} />
          )}
        </>
      )}
    </div>
  );
};
