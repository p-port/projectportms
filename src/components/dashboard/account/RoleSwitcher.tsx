
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
import { Shield, Save, Store, Users, MapPin, Briefcase, Hash } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

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
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-amber-500" />
              <span className="text-amber-700">{translations.adminTools || "Admin Tools"}</span>
            </CardTitle>
            <CardDescription className="text-amber-700/70">
              Administrative tools and options
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role-switch" className="text-amber-800">{translations.switchRole || "Switch Role"}</Label>
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedRole}
                    onValueChange={setSelectedRole}
                    disabled={isSaving}
                  >
                    <SelectTrigger id="role-switch" className="w-[180px] border-amber-200 bg-white">
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
                    className="bg-amber-200 hover:bg-amber-300 text-amber-800"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    {isSaving ? translations.switching || "Switching..." : translations.switchRole || "Switch"}
                  </Button>
                </div>
                <p className="text-xs text-amber-700/70">
                  {translations.roleSwitchDescription || "This allows you to test the application with different permission levels."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {shopInfo && shopInfo.shop && (
        <Card className="border-blue-100 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Store className="h-5 w-5 text-blue-500" />
              <span className="text-blue-700">Shop Information</span>
            </CardTitle>
            <CardDescription className="text-blue-700/70">
              Details about your associated repair shop
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-white rounded-md border border-blue-100 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Store className="h-5 w-5 text-blue-500 mt-1" />
                  <div>
                    <h3 className="font-medium text-blue-900">{shopInfo.shop.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-blue-700/70 mt-1">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{shopInfo.shop.region}, {shopInfo.shop.district}</span>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 pt-1">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-blue-500" />
                    <span className="text-sm text-blue-700">Shop ID:</span>
                    <span className="font-mono text-xs bg-blue-100 px-2 py-0.5 rounded text-blue-800">
                      {shopInfo.profile.shop_identifier}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="text-sm text-blue-700">Staff:</span>
                    <span className="text-sm">{shopInfo.shop.employee_count || 1} employee(s)</span>
                  </div>

                  <div className="flex items-start gap-2">
                    <Briefcase className="h-4 w-4 text-blue-500 mt-0.5" />
                    <div>
                      <span className="text-sm text-blue-700">Services:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {shopInfo.shop.services.map((service: string, index: number) => (
                          <span key={index} className="text-xs bg-blue-100 px-2 py-0.5 rounded text-blue-800">
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {shopInfo && !shopInfo.shop && (
        <Card className="border-blue-100">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Store className="h-5 w-5 text-blue-500" />
              <span>Shop Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-md text-blue-700">
              <Store className="h-5 w-5" />
              <p className="text-sm">
                You are not currently associated with any shop.
                {isAdmin && " As an admin, you have access to all shops."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};
