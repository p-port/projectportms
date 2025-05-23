
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShopMemberManagement } from "./ShopMemberManagement";
import { Badge } from "@/components/ui/badge";
import { Building, CheckCircle } from "lucide-react";

interface ShopMemberManagementForOwnersProps {
  userId: string;
}

export const ShopMemberManagementForOwners = ({ userId }: ShopMemberManagementForOwnersProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [shopInfo, setShopInfo] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);
  
  useEffect(() => {
    fetchShopInfo();
  }, [userId]);
  
  const fetchShopInfo = async () => {
    try {
      setIsLoading(true);
      
      // First, get the user's shop_id
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (profileError) throw profileError;
      
      if (!profileData.shop_id) {
        setIsLoading(false);
        return;
      }
      
      // Then get the shop details
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('*')
        .eq('id', profileData.shop_id)
        .single();
        
      if (shopError) throw shopError;
      
      setShopInfo(shopData);
      
      // Check if this user is the shop owner
      setIsOwner(shopData.owner_id === userId);
      
    } catch (error) {
      console.error("Error fetching shop info:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center">Loading shop information...</div>
        </CardContent>
      </Card>
    );
  }
  
  if (!shopInfo) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center">
            <p className="text-muted-foreground">You are not associated with any shop.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              <CardTitle>{shopInfo.name}</CardTitle>
            </div>
            {isOwner && (
              <Badge className="bg-amber-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Owner
              </Badge>
            )}
          </div>
          <CardDescription>
            Region: {shopInfo.region}, District: {shopInfo.district}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-1">
              <p className="text-sm font-medium">Shop ID</p>
              <p className="text-sm text-muted-foreground">{shopInfo.id}</p>
            </div>
            <div className="grid gap-1">
              <p className="text-sm font-medium">Invite Code</p>
              <p className="text-sm font-mono bg-muted p-2 rounded">{shopInfo.unique_identifier}</p>
            </div>
            <div className="grid gap-1">
              <p className="text-sm font-medium">Services</p>
              <div className="flex flex-wrap gap-1">
                {shopInfo.services && shopInfo.services.map((service: string) => (
                  <Badge key={service} variant="outline" className="text-xs">
                    {service}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {isOwner && shopInfo && (
        <ShopMemberManagement shopId={shopInfo.id} isAdmin={false} />
      )}
      
      {!isOwner && (
        <Card>
          <CardContent className="py-6">
            <div className="text-center">
              <p className="text-muted-foreground">You need to be a shop owner to manage shop members.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
