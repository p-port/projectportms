
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { Shop } from "@/types/shop";
import { 
  ArrowLeft, Building2, MapPin, Users, Phone, 
  Mail, FileText, Smartphone, Printer, Edit
} from "lucide-react";
import { toast } from "sonner";
import { useAuthCheck } from "@/hooks/useAuthCheck";

export const ShopDetailView = () => {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [memberCount, setMemberCount] = useState(0);
  const [isOwner, setIsOwner] = useState(false);
  const { userRole, userId } = useAuthCheck();

  useEffect(() => {
    if (shopId) {
      fetchShopDetails();
      fetchMemberCount();
    }
  }, [shopId, userId]);

  const fetchShopDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('id', shopId)
        .single();

      if (error) throw error;
      setShop(data);
      
      // Check if current user is the owner of this shop
      if (userId && data.owner_id === userId) {
        setIsOwner(true);
      }
    } catch (error) {
      console.error('Error fetching shop details:', error);
      toast.error('Failed to load shop details');
    } finally {
      setLoading(false);
    }
  };

  const fetchMemberCount = async () => {
    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .eq('shop_id', shopId);

      if (error) throw error;
      setMemberCount(count || 0);
    } catch (error) {
      console.error('Error fetching member count:', error);
    }
  };

  const canEdit = userRole === 'admin' || isOwner;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Shop not found</p>
        <Button onClick={() => navigate('/shop-management')} className="mt-4">
          Back to Shops
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/shop-management')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Shops
        </Button>
        <h1 className="text-2xl font-bold">Shop Details</h1>
        {canEdit && (
          <Button
            variant="outline"
            size="sm"
            className="ml-auto flex items-center gap-2"
            onClick={() => navigate(`/shop-edit/${shopId}`)}
          >
            <Edit className="h-4 w-4" />
            Edit Shop
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-500" />
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
              <label className="text-sm font-medium text-muted-foreground">Employee Count</label>
              <p className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {shop.employee_count} employees ({memberCount} registered)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-green-500" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {shop.business_phone && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Business Phone</label>
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <a href={`tel:${shop.business_phone}`} className="text-blue-600 hover:underline">
                    {shop.business_phone}
                  </a>
                </p>
              </div>
            )}
            
            {shop.mobile_phone && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Mobile Phone</label>
                <p className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  <a href={`tel:${shop.mobile_phone}`} className="text-blue-600 hover:underline">
                    {shop.mobile_phone}
                  </a>
                </p>
              </div>
            )}
            
            {shop.fax_number && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Fax Number</label>
                <p className="flex items-center gap-2">
                  <Printer className="h-4 w-4" />
                  {shop.fax_number}
                </p>
              </div>
            )}
            
            {shop.tax_email && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tax Email</label>
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <a href={`mailto:${shop.tax_email}`} className="text-blue-600 hover:underline">
                    {shop.tax_email}
                  </a>
                </p>
              </div>
            )}
            
            {shop.full_address && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Full Address</label>
                <p className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5" />
                  {shop.full_address}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Business Registration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-500" />
              Business Registration
            </CardTitle>
          </CardHeader>
          <CardContent>
            {shop.business_registration_number ? (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Registration Number</label>
                <p className="font-mono text-sm bg-muted px-2 py-1 rounded">{shop.business_registration_number}</p>
              </div>
            ) : (
              <p className="text-muted-foreground">No registration number on file</p>
            )}
          </CardContent>
        </Card>

        {/* Services Offered */}
        <Card>
          <CardHeader>
            <CardTitle>Services Offered</CardTitle>
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
