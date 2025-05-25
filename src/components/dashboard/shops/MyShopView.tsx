
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Building2, MapPin, Users, Edit, Save, X } from "lucide-react";
import { Shop } from "@/types/shop";
import { useAuthCheck } from "@/hooks/useAuthCheck";

interface MyShopViewProps {
  userId?: string;
}

export const MyShopView = ({ userId }: MyShopViewProps) => {
  const [shop, setShop] = useState<Shop | null>(null);
  const [shopOwner, setShopOwner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Shop>>({});
  const { userRole } = useAuthCheck();

  const [isShopOwner, setIsShopOwner] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchMyShop();
      checkShopOwnership();
    }
  }, [userId]);

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
      const { error } = await supabase
        .from('shops')
        .update(editForm)
        .eq('id', shop.id);

      if (error) throw error;
      
      setShop({ ...shop, ...editForm });
      setEditing(false);
      toast.success("Shop information updated successfully");
    } catch (error) {
      console.error("Error updating shop:", error);
      toast.error("Failed to update shop information");
    }
  };

  const canEdit = isShopOwner || userRole === 'admin';

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading shop information...</div>
        </CardContent>
      </Card>
    );
  }

  if (!shop) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            My Shop
          </CardTitle>
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
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {editing ? (
                  <Input
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="text-lg font-semibold"
                  />
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
                      onChange={(e) => setEditForm({ ...editForm, region: e.target.value })}
                      className="w-32"
                    />
                    <Input
                      placeholder="District"
                      value={editForm.district || ''}
                      onChange={(e) => setEditForm({ ...editForm, district: e.target.value })}
                      className="w-32"
                    />
                  </div>
                ) : (
                  `${shop.region}, ${shop.district}`
                )}
              </CardDescription>
            </div>
            {canEdit && (
              <div className="flex gap-2">
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
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
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
                <Input
                  type="number"
                  value={editForm.employee_count || ''}
                  onChange={(e) => setEditForm({ ...editForm, employee_count: parseInt(e.target.value) })}
                />
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
                    onChange={(e) => setEditForm({ ...editForm, business_phone: e.target.value })}
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
                    onChange={(e) => setEditForm({ ...editForm, mobile_phone: e.target.value })}
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
                    onChange={(e) => setEditForm({ ...editForm, fax_number: e.target.value })}
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
                    onChange={(e) => setEditForm({ ...editForm, tax_email: e.target.value })}
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
              <Textarea
                value={editForm.full_address || ''}
                onChange={(e) => setEditForm({ ...editForm, full_address: e.target.value })}
                rows={3}
              />
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
              <Input
                value={editForm.business_registration_number || ''}
                onChange={(e) => setEditForm({ ...editForm, business_registration_number: e.target.value })}
              />
            ) : (
              <p className="text-sm mt-1">{shop.business_registration_number || 'Not provided'}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
