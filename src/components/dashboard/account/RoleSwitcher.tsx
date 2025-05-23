
import { useState, useEffect } from "react";
import { supabase, getUserShopInfo } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield, Save, Store } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RoleSwitcherProps {
  userId: string;
  currentRole: string;
  isAdmin?: boolean;
  onRoleSwitch?: (newRole: string) => void;
  translations?: any;
}

export const RoleSwitcher = ({ 
  userId, 
  currentRole,
  isAdmin = false, 
  onRoleSwitch = () => {}, 
  translations = {
    roleSwitchSuccess: "Role switched successfully",
    roleSwitchError: "Failed to switch role",
    adminTools: "Admin Tools",
    switchRole: "Switch Role",
    switching: "Switching...",
    roleSwitchDescription: "This allows you to test the application with different permission levels."
  }
}: RoleSwitcherProps) => {
  const [selectedRole, setSelectedRole] = useState(currentRole);
  const [isSaving, setIsSaving] = useState(false);
  const [shopInfo, setShopInfo] = useState<any>(null);

  useEffect(() => {
    // Fetch shop info for the current user
    const fetchShopInfo = async () => {
      const info = await getUserShopInfo();
      setShopInfo(info);
    };

    fetchShopInfo();
  }, [userId]);

  // Only show role switcher for admin accounts
  if (!isAdmin && !shopInfo) return null;

  const handleRoleSwitch = async () => {
    if (selectedRole === currentRole) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: selectedRole })
        .eq('id', userId);

      if (error) throw error;
      
      onRoleSwitch(selectedRole);
      toast.success(translations.roleSwitchSuccess || "Role switched successfully");
      
    } catch (error) {
      console.error("Error switching role:", error);
      toast.error(translations.roleSwitchError || "Failed to switch role");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-amber-500" />
              <span>{translations.adminTools || "Admin Tools"}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="role-switch">{translations.switchRole || "Switch Role"}</Label>
              <div className="flex items-center gap-2">
                <Select
                  value={selectedRole}
                  onValueChange={setSelectedRole}
                  disabled={isSaving}
                >
                  <SelectTrigger id="role-switch" className="w-[180px]">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="support">Support Staff</SelectItem>
                    <SelectItem value="mechanic">Mechanic</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={handleRoleSwitch} 
                  disabled={isSaving || selectedRole === currentRole}
                >
                  <Save className="h-4 w-4 mr-1" />
                  {isSaving ? translations.switching || "Switching..." : translations.switchRole || "Switch"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {translations.roleSwitchDescription || "This allows you to test the application with different permission levels."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {shopInfo && shopInfo.shop && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-4 w-4 text-blue-500" />
              <span>Shop Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-1">
                <span className="text-muted-foreground">Shop Name:</span>
                <span>{shopInfo.shop.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <span className="text-muted-foreground">Region:</span>
                <span>{shopInfo.shop.region}, {shopInfo.shop.district}</span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <span className="text-muted-foreground">Shop ID:</span>
                <span className="font-mono text-xs">{shopInfo.profile.shop_identifier}</span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <span className="text-muted-foreground">Services:</span>
                <span>{shopInfo.shop.services.join(", ")}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {shopInfo && !shopInfo.shop && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-4 w-4 text-blue-500" />
              <span>Shop Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You are not currently associated with any shop.
              {isAdmin && " As an admin, you have access to all shops."}
            </p>
          </CardContent>
        </Card>
      )}
    </>
  );
};
