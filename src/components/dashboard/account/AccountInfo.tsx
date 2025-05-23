
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Shield, Store, User, Mail, BadgeCheck, 
  Clock, MapPin, Users, Briefcase
} from "lucide-react";
import { RoleSwitcher } from "./RoleSwitcher";

interface Profile {
  id: string;
  email: string | null;
  name: string | null;
  role: string | null;
  approved: boolean;
  shop_id: string | null;
}

interface AccountInfoProps {
  userRole?: string;
  userId?: string;
}

interface ShopDetails {
  id: string;
  name: string;
  region: string;
  isOwner: boolean;
  owner_id: string;
}

export const AccountInfo = ({ userRole = "mechanic", userId }: AccountInfoProps) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [shopDetails, setShopDetails] = useState<ShopDetails | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        if (!userId) return;

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          throw error;
        }

        setProfile(data);
        setName(data.name || "");
        
        // If user has a shop_id, fetch the shop details
        if (data.shop_id) {
          const { data: shopData, error: shopError } = await supabase
            .from('shops')
            .select('id, name, region, owner_id')
            .eq('id', data.shop_id)
            .single();
            
          if (!shopError && shopData) {
            setShopDetails({
              id: shopData.id,
              name: shopData.name,
              region: shopData.region,
              isOwner: shopData.owner_id === userId,
              owner_id: shopData.owner_id
            });
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  const handleUpdateProfile = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name })
        .eq('id', profile?.id);

      if (error) throw error;
      toast.success("Profile updated successfully");
      setProfile(prev => prev ? { ...prev, name } : null);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRoleSwitch = (newRole: string) => {
    // Update the profile state with the new role
    setProfile(prev => prev ? { ...prev, role: newRole } : null);
  };

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-4">
        <p className="text-muted-foreground">Could not load profile information</p>
      </div>
    );
  }

  const isAdmin = userRole === "admin";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Personal Information Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-blue-400" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Email Field */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Email</span>
            </div>
            <Input value={profile.email || ""} disabled className="bg-muted" />
          </div>
          
          {/* Name Field with Edit */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Display Name</span>
            </div>
            <div className="flex gap-2">
              <Input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Your name"
                className="flex-grow"
              />
              <Button 
                onClick={handleUpdateProfile} 
                disabled={isSaving || name === profile.name}
                variant="outline"
                size="sm"
              >
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Status Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-blue-400" />
            Account Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Role */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Role</span>
            </div>
            <div className="bg-muted px-3 py-2 rounded-md flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-400" />
              <span className="text-sm capitalize">{profile.role || "mechanic"}</span>
            </div>
          </div>
          
          {/* Approval Status */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BadgeCheck className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Verification</span>
            </div>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
              profile.approved ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
              'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
              {profile.approved ? (
                <>
                  <BadgeCheck className="h-4 w-4" />
                  <span>Approved</span>
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4" />
                  <span>Pending Approval</span>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shop Information Card */}
      {shopDetails && (
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Store className="h-5 w-5 text-blue-400" />
              Shop Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-md p-4">
              <div className="flex flex-wrap md:flex-nowrap gap-4">
                {/* Shop Details */}
                <div className="flex items-start gap-3 flex-grow">
                  <Store className="h-5 w-5 text-blue-400 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="font-medium">{shopDetails.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span>Region: {shopDetails.region}</span>
                    </div>
                    {shopDetails.isOwner && (
                      <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs px-2 py-0.5 rounded mt-2">
                        <Shield className="h-3 w-3" /> Owner
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Shop Stats */}
                <div className="space-y-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4 text-blue-400 shrink-0" />
                    <span className="text-xs text-muted-foreground">Shop ID:</span>
                    <span className="font-mono text-xs bg-muted-foreground/10 px-2 py-0.5 rounded">
                      {shopDetails.id.substring(0, 8)}...
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Shop Association Message */}
      {!shopDetails && !loading && (
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Store className="h-5 w-5 text-blue-400" />
              Shop Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
              <Store className="h-5 w-5 shrink-0" />
              <p className="text-sm">
                You are not currently associated with any shop.
                {isAdmin && " As an admin, you have access to all shops."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Role Switcher (if admin or shop owner) */}
      {(isAdmin || (shopDetails && shopDetails.isOwner)) && (
        <div className="md:col-span-2">
          <RoleSwitcher 
            userId={profile.id} 
            currentRole={profile.role || "mechanic"}
            isAdmin={isAdmin}
            onRoleSwitch={handleRoleSwitch}
            translations={{
              roleSwitchSuccess: "Role switched successfully",
              roleSwitchError: "Failed to switch role",
              adminTools: "Admin Tools",
              switchRole: "Switch Role",
              switching: "Switching...",
              roleSwitchDescription: "Test the application with different permission levels."
            }}
          />
        </div>
      )}
    </div>
  );
};
