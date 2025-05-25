
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, MapPin, Users, Eye, Building2 } from "lucide-react";
import { Shop } from "@/types/shop";

export const ShopsList = () => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [filteredShops, setFilteredShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchShops();
  }, []);

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
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setShops(data || []);
    } catch (error) {
      console.error("Error fetching shops:", error);
      toast.error("Failed to load shops");
    } finally {
      setLoading(false);
    }
  };

  const handleViewShop = (shopId: string) => {
    navigate(`/shop-detail/${shopId}`);
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

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            All Shops
          </CardTitle>
          <CardDescription>Browse and search all registered motorcycle service shops</CardDescription>
        </CardHeader>
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
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {searchTerm 
            ? `Found ${filteredShops.length} of ${shops.length} shops`
            : `Showing all ${shops.length} shops`
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewShop(shop.id)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
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
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredShops.length === 0 && searchTerm && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No shops found</h3>
              <p>Try adjusting your search terms or browse all shops.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
