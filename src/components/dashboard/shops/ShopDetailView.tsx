
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Mail, 
  Users, 
  Wrench, 
  Building,
  Fax,
  Smartphone,
  FileText
} from "lucide-react";
import { Shop } from "@/types/shop";

export const ShopDetailView = () => {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (shopId) {
      fetchShopDetails();
    }
  }, [shopId]);

  const fetchShopDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('id', shopId)
        .single();

      if (error) throw error;
      setShop(data as Shop);
    } catch (error) {
      console.error("Error fetching shop details:", error);
      toast.error("Failed to load shop details");
      navigate('/shop-management');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/shop-management')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Shops
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Loading shop details...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/shop-management')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Shops
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Shop not found</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/shop-management')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Shops
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{shop.name}</h1>
            <p className="text-muted-foreground">Shop Details</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Shop Name</label>
              <p className="text-lg font-semibold">{shop.name}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Unique Identifier</label>
              <p className="font-mono text-sm bg-muted px-2 py-1 rounded">{shop.unique_identifier}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Region</label>
                <p>{shop.region}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">District</label>
                <p>{shop.district}</p>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Users className="h-4 w-4" />
                Employee Count
              </label>
              <p>{shop.employee_count} employees</p>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {shop.business_phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Business Phone</label>
                  <p>{shop.business_phone}</p>
                </div>
              </div>
            )}
            
            {shop.mobile_phone && (
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Mobile Phone</label>
                  <p>{shop.mobile_phone}</p>
                </div>
              </div>
            )}
            
            {shop.fax_number && (
              <div className="flex items-center gap-2">
                <Fax className="h-4 w-4 text-muted-foreground" />
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Fax Number</label>
                  <p>{shop.fax_number}</p>
                </div>
              </div>
            )}
            
            {shop.tax_email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tax Email</label>
                  <p>{shop.tax_email}</p>
                </div>
              </div>
            )}
            
            {shop.full_address && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Full Address</label>
                  <p>{shop.full_address}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Business Registration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Business Registration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {shop.business_registration_number && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Registration Number</label>
                <p className="font-mono text-sm bg-muted px-2 py-1 rounded">{shop.business_registration_number}</p>
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Created Date</label>
              <p>{new Date(shop.created_at).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>

        {/* Services Offered */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Services Offered
            </CardTitle>
            <CardDescription>
              All services provided by this shop
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {shop.services.map((service, index) => (
                <Badge key={index} variant="secondary">
                  {service}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
