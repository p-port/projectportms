
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Store, User, Mail, BadgeCheck, Clock } from "lucide-react";
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
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Account Information
          </CardTitle>
          <CardDescription>Manage your profile details and account settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Email Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium">Email Address</h3>
              </div>
              <Input value={profile.email || ""} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground mt-1">Your email address is used for login and cannot be changed</p>
            </div>

            {/* Name Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium">Display Name</h3>
              </div>
              <div className="flex gap-2">
                <Input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Your name"
                  className="flex-grow"
                />
                <Button onClick={handleUpdateProfile} disabled={isSaving || name === profile.name}>
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">This name will be displayed to other users</p>
            </div>

            {/* Role Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium">Account Role</h3>
              </div>
              <div className="bg-muted px-3 py-2 rounded text-sm capitalize flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-500" />
                <span>{profile.role || "mechanic"}</span>
              </div>
              <p className="text-xs text-muted-foreground">Your role determines what actions you can perform in the system</p>
            </div>

            {/* Status Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium">Account Status</h3>
              </div>
              <div className={`flex items-center gap-2 px-3 py-2 rounded text-sm ${profile.approved ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
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
              {!profile.approved && (
                <p className="text-xs text-muted-foreground">Your account is awaiting approval from an administrator</p>
              )}
            </div>
            
            {/* Shop Association */}
            {shopDetails && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-medium">Shop Association</h3>
                </div>
                <div className="bg-blue-50 px-3 py-2 rounded text-sm flex items-center gap-2">
                  <Store className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-700">{shopDetails.name}</span>
                  {shopDetails.isOwner && (
                    <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded ml-auto flex items-center gap-1">
                      <Shield className="h-3 w-3" /> Owner
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Role Switcher Component */}
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
            switching: "Switching...",
            roleSwitchDescription: "Test the application with different permission levels."
          }}
        />
      )}
    </div>
  );
};
