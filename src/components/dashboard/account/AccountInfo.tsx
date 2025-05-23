
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Store, User, Mail, BadgeCheck, Clock, MapPin } from "lucide-react";
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
      {/* Account Role Card */}
      <Card className="bg-[#0A0D17] border-[#2A2F45]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white">
            <Shield className="h-5 w-5 text-blue-400" />
            Account Role
          </CardTitle>
          <CardDescription className="text-slate-400">
            Your role determines what actions you can perform in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-[#181c2e] px-4 py-3 rounded-md flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-400" />
            <span className="text-white capitalize">{profile.role || "mechanic"}</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Your role determines what actions you can perform in the system
          </p>
        </CardContent>
      </Card>

      {/* Account Status Card */}
      <Card className="bg-[#0A0D17] border-[#2A2F45]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white">
            <BadgeCheck className="h-5 w-5 text-blue-400" />
            Account Status
          </CardTitle>
          <CardDescription className="text-slate-400">
            Your current account verification status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className={`flex items-center gap-2 px-4 py-3 rounded-md ${profile.approved ? 'bg-[#162c1e] text-green-400' : 'bg-[#2c211c] text-amber-400'}`}>
            {profile.approved ? (
              <>
                <BadgeCheck className="h-5 w-5" />
                <span>Approved</span>
              </>
            ) : (
              <>
                <Clock className="h-5 w-5" />
                <span>Pending Approval</span>
              </>
            )}
          </div>
          {!profile.approved && (
            <p className="text-xs text-slate-400 mt-2">
              Your account is awaiting approval from an administrator
            </p>
          )}
        </CardContent>
      </Card>

      {/* Shop Association Card */}
      {shopDetails && (
        <Card className="bg-[#0A0D17] border-[#2A2F45]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-white">
              <Store className="h-5 w-5 text-blue-400" />
              Shop Association
            </CardTitle>
            <CardDescription className="text-slate-400">
              Your membership in a repair shop
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-[#181c2e] px-4 py-3 rounded-md flex items-center gap-2">
              <Store className="h-5 w-5 text-blue-400" />
              <span className="text-white">{shopDetails.name}</span>
              {shopDetails.isOwner && (
                <span className="bg-[#362e1d] text-amber-400 text-xs px-2 py-0.5 rounded ml-auto flex items-center gap-1">
                  <Shield className="h-3 w-3" /> Owner
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Account Information Card */}
      <Card className="bg-[#0A0D17] border-[#2A2F45]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <User className="h-5 w-5 text-blue-400" />
            Personal Information
          </CardTitle>
          <CardDescription className="text-slate-400">
            Manage your profile details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Email Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-400" />
                <h3 className="font-medium text-slate-200">Email Address</h3>
              </div>
              <Input value={profile.email || ""} disabled className="bg-[#181c2e] border-[#2A2F45] text-slate-300" />
              <p className="text-xs text-slate-400 mt-1">Your email address is used for login and cannot be changed</p>
            </div>

            {/* Name Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-slate-400" />
                <h3 className="font-medium text-slate-200">Display Name</h3>
              </div>
              <div className="flex gap-2">
                <Input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Your name"
                  className="flex-grow bg-[#181c2e] border-[#2A2F45] text-white"
                />
                <Button 
                  onClick={handleUpdateProfile} 
                  disabled={isSaving || name === profile.name}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </div>
              <p className="text-xs text-slate-400">This name will be displayed to other users</p>
            </div>
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
