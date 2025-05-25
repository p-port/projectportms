
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Building2, MapPin, Users, Edit, Save, X, AlertTriangle, Home } from "lucide-react";
import { Shop } from "@/types/shop";
import { useAuthCheck } from "@/hooks/useAuthCheck";
import { ShopLogoUpload } from "./ShopLogoUpload";
import { ShopUserInvitation } from "./ShopUserInvitation";
import { ShopInvitationHandler } from "./ShopInvitationHandler";

interface MyShopViewProps {
  userId?: string;
}

export const MyShopView = ({ userId }: MyShopViewProps) => {
  const [shop, setShop] = useState<Shop | null>(null);
  const [shopOwner, setShopOwner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Shop>>({});
  const [userEmail, setUserEmail] = useState<string>("");
  const { userRole } = useAuthCheck();

  const [isShopOwner, setIsShopOwner] = useState(false);

  // Fields that require admin approval to change
  const restrictedFields = ['region', 'district', 'full_address', 'name', 'employee_count', 'business_registration_number'];

  useEffect(() => {
    if (userId) {
      fetchMyShop();
      checkShopOwnership();
      fetchUserEmail();
    }
  }, [userId]);

  const fetchUserEmail = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();
        
      if (!error && data) {
        setUserEmail(data.email);
      }
    } catch (error) {
      console.error('Error fetching user email:', error);
    }
  };

  const checkShopOwnership = async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('id')
        .eq('owner_id', userId);
        
      if (!error && data && data.length > 0) {
        setIsShopOwner(true);
      }
    } catch (error) {
      console.error('Error checking shop ownership:', error);
    }
  };

  const fetchMyShop = async () => {
    try {
      setLoading(true);
      
      // First get user's shop ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('shop_id')
        .eq('id', userId)
        .single();
        
      if (!profile?.shop_id) {
        setShop(null);
        setLoading(false);
        return;
      }
      
      // Then get shop details
      const { data: shopData, error } = await supabase
        .from('shops')
        .select('*')
        .eq('id', profile.shop_id)
        .single();

      if (error) throw error;
      
      setShop(shopData);
      setEditForm(shopData);
      
      // Get shop owner details
      if (shopData.owner_id) {
        const { data: ownerData } = await supabase
          .from('profiles')
          .select('name, email')
          .eq('id', shopData.owner_id)
          .single();
          
        setShopOwner(ownerData);
      }
      
    } catch (error) {
      console.error("Error fetching shop:", error);
      toast.error("Failed to load shop information");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!shop || !editForm) return;
    
    try {
      // Only allow updating non-restricted fields
      const updateData: Partial<Shop> = {};
      Object.keys(editForm).forEach(key => {
        if (!restrictedFields.includes(key)) {
          updateData[key as keyof Shop] = editForm[key as keyof Shop];
        }
      });

      const { error } = await supabase
        .from('shops')
        .update(updateData)
        .eq('id', shop.id);

      if (error) throw error;
      
      setShop({ ...shop, ...updateData });
      setEditing(false);
      toast.success("Shop information updated successfully");
    } catch (error) {
      console.error("Error updating shop:", error);
      toast.error("Failed to update shop information");
    }
  };

  const handleLogoUpdate = (logoUrl: string | null) => {
    if (shop) {
      setShop({ ...shop, logo_url: logoUrl });
    }
  };

  const handleInputChange = (field: keyof Shop, value: string | number | string[]) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const canEdit = isShopOwner || userRole === 'admin';

  const navigateToHome = () => {
    // Navigate to main dashboard by dispatching custom event
    window.dispatchEvent(new CustomEvent('navigate-to-tab', { detail: 'jobs' }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-center">Loading shop information...</div>
            <Button variant="outline" size="sm" onClick={navigateToHome}>
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!shop) {
    return (
      <div className="space-y-6">
        {/* Show shop invitations if user has any */}
        {userId && userEmail && (
          <ShopInvitationHandler userId={userId} userEmail={userEmail} />
        )}
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                My Shop
              </CardTitle>
              <Button variant="outline" size="sm" onClick={navigateToHome}>
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </div>
            <CardDescription>
              You are not currently assigned to any shop
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Please contact your administrator to be assigned to a shop.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              {shop.logo_url && (
                <img 
                  src={shop.logo_url} 
                  alt={`${shop.name} logo`}
                  className="w-16 h-16 object-cover rounded border"
                />
              )}
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {editing ? (
                    <div className="space-y-1">
                      <Input
                        value={editForm.name || ''}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="text-lg font-semibold"
                        disabled={true}
                      />
                      <div className="flex items-center gap-1 text-xs text-orange-600">
                        <AlertTriangle className="h-3 w-3" />
                        Requires admin approval to change
                      </div>
                    </div>
                  ) : (
                    shop.name
                  )}
                </CardTitle>
                <CardDescription className="flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" />
                  {editing ? (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Region"
                        value={editForm.region || ''}
                        onChange={(e) => handleInputChange('region', e.target.value)}
                        className="w-32"
                        disabled={true}
                      />
                      <Input
                        placeholder="District"
                        value={editForm.district || ''}
                        onChange={(e) => handleInputChange('district', e.target.value)}
                        className="w-32"
                        disabled={true}
                      />
                    </div>
                  ) : (
                    `${shop.region}, ${shop.district}`
                  )}
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={navigateToHome}>
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
              {canEdit && (
                <>
                  {editing ? (
                    <>
                      <Button size="sm" onClick={handleSave}>
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => {
                        setEditing(false);
                        setEditForm(shop);
                      }}>
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo Upload - Only for shop owners */}
          {isShopOwner && (
            <ShopLogoUpload
              shopId={shop.id}
              currentLogoUrl={shop.logo_url}
              onLogoUpdate={handleLogoUpdate}
              disabled={editing}
            />
          )}

          {/* Shop Owner */}
          <div>
            <h4 className="text-sm font-medium mb-2">Shop Owner</h4>
            {shopOwner ? (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Owner</Badge>
                <span>{shopOwner.name}</span>
                <span className="text-muted-foreground">({shopOwner.email})</span>
              </div>
            ) : (
              <p className="text-muted-foreground">No owner assigned</p>
            )}
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Employee Count</label>
              {editing ? (
                <div className="space-y-1">
                  <Input
                    type="number"
                    value={editForm.employee_count || ''}
                    onChange={(e) => handleInputChange('employee_count', parseInt(e.target.value) || 0)}
                    disabled={true}
                  />
                  <div className="flex items-center gap-1 text-xs text-orange-600">
                    <AlertTriangle className="h-3 w-3" />
                    Requires admin approval
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <Users className="h-4 w-4" />
                  {shop.employee_count} employees
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Shop ID</label>
              <div className="text-xs text-muted-foreground mt-1">
                {shop.unique_identifier}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Contact Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Business Phone</label>
                {editing ? (
                  <Input
                    value={editForm.business_phone || ''}
                    onChange={(e) => handleInputChange('business_phone', e.target.value)}
                  />
                ) : (
                  <p className="text-sm mt-1">{shop.business_phone || 'Not provided'}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Mobile Phone</label>
                {editing ? (
                  <Input
                    value={editForm.mobile_phone || ''}
                    onChange={(e) => handleInputChange('mobile_phone', e.target.value)}
                  />
                ) : (
                  <p className="text-sm mt-1">{shop.mobile_phone || 'Not provided'}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Fax Number</label>
                {editing ? (
                  <Input
                    value={editForm.fax_number || ''}
                    onChange={(e) => handleInputChange('fax_number', e.target.value)}
                  />
                ) : (
                  <p className="text-sm mt-1">{shop.fax_number || 'Not provided'}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Tax Email</label>
                {editing ? (
                  <Input
                    type="email"
                    value={editForm.tax_email || ''}
                    onChange={(e) => handleInputChange('tax_email', e.target.value)}
                  />
                ) : (
                  <p className="text-sm mt-1">{shop.tax_email || 'Not provided'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="text-sm font-medium">Full Address</label>
            {editing ? (
              <div className="space-y-1">
                <Textarea
                  value={editForm.full_address || ''}
                  onChange={(e) => handleInputChange('full_address', e.target.value)}
                  rows={3}
                  disabled={true}
                />
                <div className="flex items-center gap-1 text-xs text-orange-600">
                  <AlertTriangle className="h-3 w-3" />
                  Requires admin approval to change
                </div>
              </div>
            ) : (
              <p className="text-sm mt-1">{shop.full_address || 'Not provided'}</p>
            )}
          </div>

          {/* Services */}
          <div>
            <label className="text-sm font-medium mb-2 block">Services Offered</label>
            <div className="flex flex-wrap gap-1">
              {shop.services?.map((service, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {service}
                </Badge>
              ))}
            </div>
          </div>

          {/* Business Registration */}
          <div>
            <label className="text-sm font-medium">Business Registration Number</label>
            {editing ? (
              <div className="space-y-1">
                <Input
                  value={editForm.business_registration_number || ''}
                  onChange={(e) => handleInputChange('business_registration_number', e.target.value)}
                  disabled={true}
                />
                <div className="flex items-center gap-1 text-xs text-orange-600">
                  <AlertTriangle className="h-3 w-3" />
                  Requires admin approval to change
                </div>
              </div>
            ) : (
              <p className="text-sm mt-1">{shop.business_registration_number || 'Not provided'}</p>
            )}
          </div>

          {/* Restricted Fields Notice */}
          {isShopOwner && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-orange-800">Admin Approval Required</p>
                  <p className="text-orange-700 mt-1">
                    To change shop name, region, district, address, employee count, or business registration number, 
                    please create a support ticket for administrator approval.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Invitation - Only for shop owners */}
      {isShopOwner && (
        <ShopUserInvitation shopId={shop.id} />
      )}
    </div>
  );
};
