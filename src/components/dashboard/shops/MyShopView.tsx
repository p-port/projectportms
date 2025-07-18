import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shop } from "@/types/shop";
import { useAuthCheck } from "@/hooks/useAuthCheck";
import { ShopLogoUpload } from "./ShopLogoUpload";
import { ShopUserInvitation } from "./ShopUserInvitation";
import { ShopInvitationHandler } from "./ShopInvitationHandler";
import { ShopHeader } from "./components/ShopHeader";
import { ShopOwnerInfo } from "./components/ShopOwnerInfo";
import { ShopBasicInfo } from "./components/ShopBasicInfo";
import { ShopContactInfo } from "./components/ShopContactInfo";
import { ShopAddressInfo } from "./components/ShopAddressInfo";
import { ShopServices } from "./components/ShopServices";
import { ShopBusinessInfo } from "./components/ShopBusinessInfo";
import { AdminApprovalNotice } from "./components/AdminApprovalNotice";
import { EmptyShopState } from "./components/EmptyShopState";

interface MyShopViewProps {
  userId?: string;
}

// Only allow fields that can be edited
type EditableShopFields = Exclude<keyof Shop, 'id' | 'owner_id' | 'created_at'>;

export const MyShopView = ({ userId }: MyShopViewProps) => {
  const [shop, setShop] = useState<Shop | null>(null);
  const [shopOwner, setShopOwner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Shop>>({});
  const [userEmail, setUserEmail] = useState<string>("");
  const { userRole } = useAuthCheck();
  const [isShopOwner, setIsShopOwner] = useState(false);

  const restrictedFields: EditableShopFields[] = [
    'region',
    'district',
    'full_address',
    'name',
    'employee_count',
    'business_registration_number'
  ];

  useEffect(() => {
    if (userId) {
      fetchMyShop();
      checkShopOwnership();
      fetchUserEmail();
    }
  }, [userId]);

  const fetchUserEmail = async () => {
    try {
      // First try to get email from auth user
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
        return;
      }

      // Fallback to profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data?.email) {
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

      const { data: profile } = await supabase
        .from('profiles')
        .select('shop_id')
        .eq('id', userId)
        .maybeSingle();

      if (!profile?.shop_id) {
        setShop(null);
        setLoading(false);
        return;
      }

      const { data: shopData, error } = await supabase
        .from('shops')
        .select('*')
        .eq('id', profile.shop_id)
        .maybeSingle();

      if (error) throw error;

      setShop(shopData);
      setEditForm(shopData || {});

      if (shopData?.owner_id) {
        const { data: ownerData } = await supabase
          .from('profiles')
          .select('name, email')
          .eq('id', shopData.owner_id)
          .maybeSingle();

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
      const updateData: Partial<Shop> = {};
      Object.entries(editForm).forEach(([key, value]) => {
        const fieldKey = key as keyof Shop;
        if (!restrictedFields.includes(fieldKey as EditableShopFields)) {
          (updateData as any)[fieldKey] = value;
        }
      });

      const { error } = await supabase
        .from('shops')
        .update(updateData)
        .eq('id', shop.id);

      if (error) throw error;

      setShop(prev => prev ? { ...prev, ...updateData } : prev);
      setEditing(false);
      toast.success("Shop information updated successfully");
    } catch (error) {
      console.error("Error updating shop:", error);
      toast.error("Failed to update shop information");
    }
  };

  const handleLogoUpdate = (logoUrl: string | null) => {
    if (!shop) return;

    const updated = { ...shop, logo_url: logoUrl };
    setShop(updated);
    setEditForm(prev => ({ ...prev, logo_url: logoUrl }));
  };

  const handleInputChange = (field: keyof Shop, value: Shop[keyof Shop]) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const navigateToHome = () => {
    window.dispatchEvent(new CustomEvent('navigate-to-tab', { detail: 'jobs' }));
  };

  const canEdit = isShopOwner || userRole === 'admin';

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-center">Loading shop information...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Always show shop invitations for mechanics */}
      {userId && (
        <ShopInvitationHandler 
          userId={userId} 
          userEmail={userEmail} 
        />
      )}
      
      {!shop ? (
        <EmptyShopState
          userId={userId}
          userEmail={userEmail}
          onNavigateHome={navigateToHome}
        />
      ) : (
        <>
          <Card>
            <CardHeader>
              <ShopHeader
                shop={shop}
                editing={editing}
                editForm={editForm}
                canEdit={canEdit}
                onEdit={() => setEditing(true)}
                onSave={handleSave}
                onCancel={() => {
                  setEditing(false);
                  setEditForm(shop);
                }}
                onInputChange={handleInputChange}
                onNavigateHome={navigateToHome}
              />
            </CardHeader>
            <CardContent className="space-y-6">
              {isShopOwner && (
                <ShopLogoUpload
                  shopId={shop.id}
                  currentLogoUrl={shop.logo_url ?? undefined}
                  onLogoUpdate={handleLogoUpdate}
                  disabled={editing}
                />
              )}

              <ShopOwnerInfo shopOwner={shopOwner} />
              <ShopBasicInfo
                shop={shop}
                editing={editing}
                editForm={editForm}
                onInputChange={handleInputChange}
              />
              <ShopContactInfo
                shop={shop}
                editing={editing}
                editForm={editForm}
                onInputChange={handleInputChange}
              />
              <ShopAddressInfo
                shop={shop}
                editing={editing}
                editForm={editForm}
                onInputChange={handleInputChange}
              />
              <ShopServices shop={shop} />
              <ShopBusinessInfo
                shop={shop}
                editing={editing}
                editForm={editForm}
                onInputChange={handleInputChange}
              />
              <AdminApprovalNotice isShopOwner={isShopOwner} />
            </CardContent>
          </Card>

          {isShopOwner && <ShopUserInvitation shopId={shop.id} />}
        </>
      )}
    </div>
  );
};
