
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase, getUserShopInfo } from "@/integrations/supabase/client";
import { 
  Shield, User, Mail, BadgeCheck, 
  Clock, Key, Lock, Building2
} from "lucide-react";
import { RoleSwitcher } from "./RoleSwitcher";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Shop } from "@/types/shop";

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
  const [changeEmailOpen, setChangeEmailOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [shopInfo, setShopInfo] = useState<Shop | null>(null);
  const [loadingShop, setLoadingShop] = useState(false);

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
        
        // Fetch shop info if the user has a shop_id
        if (data.shop_id) {
          await fetchShopInfo(data.shop_id);
        } else {
          // If user doesn't have a shop_id, try to get it from the getUserShopInfo function
          const userShopInfo = await getUserShopInfo();
          if (userShopInfo && userShopInfo.shop) {
            setShopInfo(userShopInfo.shop);
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

  const fetchShopInfo = async (shopId: string) => {
    try {
      setLoadingShop(true);
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('id', shopId)
        .single();

      if (error) throw error;
      setShopInfo(data);
    } catch (error) {
      console.error("Error fetching shop info:", error);
    } finally {
      setLoadingShop(false);
    }
  };

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

  const emailForm = useForm({
    defaultValues: {
      email: profile?.email || "",
      currentPassword: "",
    }
  });

  const passwordForm = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }
  });

  const handleEmailChange = async (values: { email: string; currentPassword: string }) => {
    setIsChangingEmail(true);
    try {
      // First sign in to verify the current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile?.email || '',
        password: values.currentPassword
      });

      if (signInError) throw signInError;

      // Then update the email
      const { error } = await supabase.auth.updateUser({
        email: values.email
      });

      if (error) throw error;
      toast.success("Email update request sent. Please check your inbox to confirm.");
      setChangeEmailOpen(false);
      emailForm.reset();
    } catch (error: any) {
      toast.error(error.message || "Failed to update email");
    } finally {
      setIsChangingEmail(false);
    }
  };

  const handlePasswordChange = async (values: { currentPassword: string; newPassword: string; confirmPassword: string }) => {
    if (values.newPassword !== values.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsChangingPassword(true);
    try {
      // First sign in to verify the current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile?.email || '',
        password: values.currentPassword
      });

      if (signInError) throw signInError;

      // Then update the password
      const { error } = await supabase.auth.updateUser({
        password: values.newPassword
      });

      if (error) throw error;
      toast.success("Password updated successfully");
      setChangePasswordOpen(false);
      passwordForm.reset();
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setIsChangingPassword(false);
    }
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

      {/* Account Management Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-blue-400" />
            Account Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Role */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-4 w-4 text-muted-foreground" />
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

          {/* Account Actions */}
          <div className="pt-2">
            <div className="flex items-center gap-2 mb-2">
              <Key className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Account Actions</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Dialog open={changeEmailOpen} onOpenChange={setChangeEmailOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    Change Email
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Change Email Address</DialogTitle>
                  </DialogHeader>
                  <Form {...emailForm}>
                    <form onSubmit={emailForm.handleSubmit(handleEmailChange)} className="space-y-4">
                      <FormField
                        control={emailForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Email Address</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="email@example.com" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={emailForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <FormControl>
                              <Input {...field} type="password" placeholder="••••••••" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setChangeEmailOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isChangingEmail}>
                          {isChangingEmail ? "Updating..." : "Update Email"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5" />
                    Change Password
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                  </DialogHeader>
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-4">
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <FormControl>
                              <Input {...field} type="password" placeholder="••••••••" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <Input {...field} type="password" placeholder="••••••••" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl>
                              <Input {...field} type="password" placeholder="••••••••" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setChangePasswordOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isChangingPassword}>
                          {isChangingPassword ? "Updating..." : "Update Password"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shop Information Card */}
      <Card className="md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5 text-blue-400" />
            Shop Information
          </CardTitle>
          <CardDescription>
            Information about your assigned shop
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingShop ? (
            <div className="flex justify-center p-4">
              <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : shopInfo ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium mb-1">Shop Name</div>
                  <div className="bg-muted px-3 py-2 rounded-md">{shopInfo.name}</div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">Unique Identifier</div>
                  <div className="bg-muted px-3 py-2 rounded-md font-mono">{shopInfo.unique_identifier}</div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">Region</div>
                  <div className="bg-muted px-3 py-2 rounded-md">{shopInfo.region}</div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">District</div>
                  <div className="bg-muted px-3 py-2 rounded-md">{shopInfo.district}</div>
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium mb-1">Services Offered</div>
                <div className="flex flex-wrap gap-2">
                  {shopInfo.services.map((service, i) => (
                    <Badge key={i} variant="secondary">{service}</Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium mb-1">Employee Count</div>
                <div className="bg-muted px-3 py-2 rounded-md">{shopInfo.employee_count}</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Building2 className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>You are not associated with any shop</p>
              <p className="text-sm mt-1">Contact an administrator to get assigned to a shop</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Switcher (if admin or shop owner) */}
      {isAdmin && (
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
