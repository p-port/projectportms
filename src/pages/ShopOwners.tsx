
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Building, Store, Shield, Home } from "lucide-react";
import { Shop } from "@/types/shop";
import { useAuthCheck } from "@/hooks/useAuthCheck";

interface ShopOwnerData {
  shopId: string;
  shopName: string;
  ownerId: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  region: string;
  district: string;
}

export function ShopOwners() {
  const [loading, setLoading] = useState(true);
  const [shopOwners, setShopOwners] = useState<ShopOwnerData[]>([]);
  const navigate = useNavigate();
  const { userRole } = useAuthCheck();

  useEffect(() => {
    // Only allow admin and support users to access this page
    if (userRole && userRole !== 'admin' && userRole !== 'support') {
      toast.error("Access denied. Only administrators and support staff can access this page.");
      navigate('/dashboard');
      return;
    }
    
    if (userRole) {
      fetchShopOwners();
    }
  }, [userRole, navigate]);

  const fetchShopOwners = async () => {
    try {
      setLoading(true);
      // Fetch shops with their owner details
      const { data: shops, error: shopsError } = await supabase
        .from('shops')
        .select('*')
        .order('name', { ascending: true });

      if (shopsError) throw shopsError;

      const shopsWithOwners: ShopOwnerData[] = [];
      
      // For each shop, fetch the owner details if there is an owner
      for (const shop of shops) {
        let ownerName = null;
        let ownerEmail = null;
        
        if (shop.owner_id) {
          // Fetch the owner's profile details
          const { data: ownerProfile, error: ownerError } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('id', shop.owner_id)
            .single();
            
          if (!ownerError && ownerProfile) {
            ownerName = ownerProfile.name;
            ownerEmail = ownerProfile.email;
          }
        }
        
        shopsWithOwners.push({
          shopId: shop.id,
          shopName: shop.name,
          ownerId: shop.owner_id,
          ownerName: ownerName,
          ownerEmail: ownerEmail,
          region: shop.region,
          district: shop.district
        });
      }
      
      setShopOwners(shopsWithOwners);
    } catch (error) {
      console.error("Error fetching shop owners:", error);
      toast.error("Failed to load shop owners");
    } finally {
      setLoading(false);
    }
  };

  const handleManageOwner = (shopId: string) => {
    // Navigate to the shop management page with owner assignment tab
    navigate(`/shop-owner/${shopId}`);
  };

  const navigateToUser = (userId: string | null) => {
    if (userId) {
      navigate(`/user-management/${userId}`);
    }
  };

  // Don't render anything if user doesn't have permission
  if (userRole && userRole !== 'admin' && userRole !== 'support') {
    return null;
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <div className="flex space-x-2 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
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
            Shop Owners Management
          </h1>
          <p className="text-muted-foreground">
            View and manage shop ownership across the platform
          </p>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Shop Owners
          </CardTitle>
          <CardDescription>
            All shops and their assigned owners
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shop Name</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>District</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                // Loading skeletons
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : shopOwners.length > 0 ? (
                shopOwners.map((shopOwner) => (
                  <TableRow key={shopOwner.shopId}>
                    <TableCell>{shopOwner.shopName}</TableCell>
                    <TableCell>{shopOwner.region}</TableCell>
                    <TableCell>{shopOwner.district}</TableCell>
                    <TableCell>
                      {shopOwner.ownerId ? (
                        <Button 
                          variant="link" 
                          onClick={() => navigateToUser(shopOwner.ownerId)}
                          className="p-0 h-auto text-left font-normal"
                        >
                          {shopOwner.ownerName || 'Unknown'}
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">No owner assigned</span>
                      )}
                    </TableCell>
                    <TableCell>{shopOwner.ownerEmail || '-'}</TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleManageOwner(shopOwner.shopId)}
                        className="flex items-center gap-1"
                      >
                        <Shield className="h-3.5 w-3.5" />
                        Manage Owner
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                    No shops found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
