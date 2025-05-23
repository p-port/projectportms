
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield } from "lucide-react";
import { Shop } from "@/types/shop";

interface ShopOwnerManagerProps {
  userId: string;
  currentOwnerStatus: boolean;
  shopId?: string | null;
}

export const ShopOwnerManager = ({ userId, currentOwnerStatus, shopId }: ShopOwnerManagerProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isOwner, setIsOwner] = useState(currentOwnerStatus);
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string>(shopId || '');
  const [userShop, setUserShop] = useState<Shop | null>(null);

  useEffect(() => {
    fetchShops();
    if (shopId) {
      fetchUserShop();
    }
  }, [shopId]);

  const fetchShops = async () => {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .order('name', { ascending: true });
        
      if (error) throw error;
      setShops(data || []);
    } catch (error) {
      console.error("Error fetching shops:", error);
    }
  };

  const fetchUserShop = async () => {
    if (!shopId) return;
    
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('id', shopId)
        .single();
        
      if (error) throw error;
      setUserShop(data);
      
      // Check if user is the owner
      setIsOwner(data.owner_id === userId);
    } catch (error) {
      console.error("Error fetching shop:", error);
    }
  };

  const assignAsOwner = async () => {
    if (!selectedShopId) {
      toast.error("Please select a shop first");
      return;
    }
    
    setIsLoading(true);
    try {
      // Update the shop to set the user as owner
      const { error: shopError } = await supabase
        .from('shops')
        .update({ owner_id: userId })
        .eq('id', selectedShopId);
        
      if (shopError) throw shopError;
      
      // Update the user profile to assign to this shop
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ shop_id: selectedShopId, approved: true })
        .eq('id', userId);
        
      if (profileError) throw profileError;
      
      setIsOwner(true);
      toast.success("User assigned as shop owner");
      
      // Fetch updated shop info
      fetchUserShop();
    } catch (error) {
      console.error("Error assigning owner:", error);
      toast.error("Failed to assign as shop owner");
    } finally {
      setIsLoading(false);
    }
  };

  const removeAsOwner = async () => {
    if (!userShop) return;
    
    if (!confirm("Are you sure you want to remove this user as the shop owner? This action cannot be undone.")) {
      return;
    }
    
    setIsLoading(true);
    try {
      // Update the shop to remove the owner
      const { error: shopError } = await supabase
        .from('shops')
        .update({ owner_id: null })
        .eq('id', userShop.id);
        
      if (shopError) throw shopError;
      
      setIsOwner(false);
      toast.success("User removed as shop owner");
      
      // Fetch updated shop info
      fetchUserShop();
    } catch (error) {
      console.error("Error removing owner:", error);
      toast.error("Failed to remove shop owner");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-amber-500" />
          <CardTitle className="text-lg">Shop Ownership</CardTitle>
        </div>
        <CardDescription>
          Manage shop owner permissions for this user
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isOwner ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="font-medium">Current Shop:</div>
              <div className="text-muted-foreground">{userShop?.name}</div>
            </div>
            <Button 
              variant="destructive" 
              onClick={removeAsOwner} 
              disabled={isLoading}
            >
              Remove as Shop Owner
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Shop</label>
              <Select
                value={selectedShopId}
                onValueChange={setSelectedShopId}
                disabled={isLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a shop" />
                </SelectTrigger>
                <SelectContent>
                  {shops.map((shop) => (
                    <SelectItem key={shop.id} value={shop.id}>
                      {shop.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={assignAsOwner} 
              disabled={isLoading || !selectedShopId}
            >
              {isLoading ? "Assigning..." : "Assign as Shop Owner"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
