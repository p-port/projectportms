
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Store } from "lucide-react";
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

export const AccountInfo = ({ userRole = "mechanic", userId }: AccountInfoProps) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [shopDetails, setShopDetails] = useState<{name: string, isOwner: boolean} | null>(null);

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
            .select('name, owner_id')
            .eq('id', data.shop_id)
            .single();
            
          if (!shopError && shopData) {
            setShopDetails({
              name: shopData.name,
              isOwner: shopData.owner_id === userId
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
      <div className="flex justify-center p-6">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground">Could not load profile information</p>
      </div>
    );
  }

  // Check if the current user is an admin
  const isAdmin = userRole === "admin";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Manage your profile details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Email</label>
              <Input value={profile.email || ""} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Name</label>
              <div className="flex gap-2">
                <Input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Your name"
                />
                <Button onClick={handleUpdateProfile} disabled={isSaving || name === profile.name}>
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Role</label>
              <div className="flex items-center gap-2">
                <div className="bg-muted px-3 py-1.5 rounded text-sm capitalize flex-grow">
                  {profile.role || "mechanic"}
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Account Status</label>
              <div className="bg-muted px-3 py-1.5 rounded text-sm">
                {profile.approved ? "Approved" : "Pending Approval"}
              </div>
            </div>
            
            {shopDetails && (
              <div>
                <label className="text-sm font-medium mb-1 block">Shop Association</label>
                <div className="bg-muted px-3 py-1.5 rounded text-sm flex items-center gap-2">
                  <Store className="h-4 w-4" />
                  <span>{shopDetails.name}</span>
                  {shopDetails.isOwner && (
                    <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded ml-2 flex items-center gap-1">
                      <Shield className="h-3 w-3" /> Owner
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Move the RoleSwitcher component to its own card for better UI organization */}
      {(isAdmin || shopDetails) && (
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
            switching: "Switching..."
          }}
        />
      )}
    </div>
  );
};
