
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, MapPin, Users, Building2 } from "lucide-react";
import { Shop } from "@/types/shop";
import { useAuthCheck } from "@/hooks/useAuthCheck";

export const ShopsList = () => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [filteredShops, setFilteredShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { userRole, userId } = useAuthCheck();

  useEffect(() => {
    fetchShops();
  }, [userRole, userId]);

  useEffect(() => {
    // Filter shops based on search term
    if (!searchTerm) {
      setFilteredShops(shops);
    } else {
      const filtered = shops.filter(shop =>
        shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.unique_identifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.services.some(service => service.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredShops(filtered);
    }
  }, [searchTerm, shops]);

  const fetchShops = async () => {
    try {
      setLoading(true);
      
      let query = supabase.from('shops').select('*');
      
      // If user is not admin or support, only show their shop
      if (userRole !== 'admin' && userRole !== 'support' && userId) {
        // Get user's shop through their profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('shop_id')
          .eq('id', userId)
          .single();
          
        if (profile?.shop_id) {
          query = query.eq('id', profile.shop_id);
        } else {
          // User has no shop assigned
          setShops([]);
          setLoading(false);
          return;
        }
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setShops(data || []);
    } catch (error) {
      console.error("Error fetching shops:", error);
      toast.error("Failed to load shops");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading shops...</div>
        </CardContent>
      </Card>
    );
  }

  const canSeeAllShops = userRole === 'admin' || userRole === 'support';

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {canSeeAllShops ? "All Shops" : "My Shop"}
          </CardTitle>
          <CardDescription>
            {canSeeAllShops 
              ? "Browse and search all registered motorcycle service shops"
              : "Your assigned motorcycle service shop"
            }
          </CardDescription>
        </CardHeader>
        {canSeeAllShops && (
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search shops by name, location, services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {searchTerm 
            ? `Found ${filteredShops.length} of ${shops.length} shops`
            : `Showing ${canSeeAllShops ? 'all' : ''} ${shops.length} shop${shops.length !== 1 ? 's' : ''}`
          }
        </p>
      </div>

      {/* Shops Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredShops.map((shop) => (
          <Card key={shop.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{shop.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" />
                    {shop.region}, {shop.district}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                {shop.employee_count} employees
              </div>
              
              <div>
                <p className="text-sm font-medium mb-2">Services:</p>
                <div className="flex flex-wrap gap-1">
                  {shop.services.slice(0, 3).map((service, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {service}
                    </Badge>
                  ))}
                  {shop.services.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{shop.services.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground">
                ID: {shop.unique_identifier}
              </div>
              
              {shop.full_address && (
                <div className="text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 inline mr-1" />
                  {shop.full_address}
                </div>
              )}
              
              {(shop.business_phone || shop.mobile_phone) && (
                <div className="text-xs text-muted-foreground">
                  Phone: {shop.business_phone || shop.mobile_phone}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredShops.length === 0 && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">
                {searchTerm ? "No shops found" : 
                 canSeeAllShops ? "No shops registered yet" : "No shop assigned"}
              </h3>
              <p>
                {searchTerm ? "Try adjusting your search terms or browse all shops." :
                 canSeeAllShops ? "Register the first shop to get started." : "Contact your administrator to assign you to a shop."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
