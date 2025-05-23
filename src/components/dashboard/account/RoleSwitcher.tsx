
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
        <Card className="bg-[#0A0D17] border-[#2A2F45]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-blue-400" />
              <span className="text-white">{translations.adminTools || "Admin Tools"}</span>
            </CardTitle>
            <CardDescription className="text-slate-400">
              Administrative tools and options
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role-switch" className="text-slate-300">{translations.switchRole || "Switch Role"}</Label>
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedRole}
                    onValueChange={setSelectedRole}
                    disabled={isSaving}
                  >
                    <SelectTrigger id="role-switch" className="w-[180px] bg-[#181c2e] border-[#2A2F45] text-white">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#181c2e] border-[#2A2F45] text-white">
                      <SelectItem value="admin" className="text-white">Administrator</SelectItem>
                      <SelectItem value="support" className="text-white">Support Staff</SelectItem>
                      <SelectItem value="mechanic" className="text-white">Mechanic</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={handleRoleSwitch} 
                    disabled={isSaving || selectedRole === currentRole}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    {isSaving ? translations.switching || "Switching..." : translations.switchRole || "Switch"}
                  </Button>
                </div>
                <p className="text-xs text-slate-400">
                  {translations.roleSwitchDescription || "This allows you to test the application with different permission levels."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {shopInfo && shopInfo.shop && (
        <Card className="bg-[#0A0D17] border-[#2A2F45]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Store className="h-5 w-5 text-blue-400" />
              <span className="text-white">Shop Information</span>
            </CardTitle>
            <CardDescription className="text-slate-400">
              Details about your associated repair shop
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-[#181c2e] rounded-md border border-[#2A2F45] p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Store className="h-5 w-5 text-blue-400 mt-1" />
                  <div>
                    <h3 className="font-medium text-white">{shopInfo.shop.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-slate-400 mt-1">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{shopInfo.shop.region}, {shopInfo.shop.district}</span>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 pt-1">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-blue-400" />
                    <span className="text-sm text-slate-300">Shop ID:</span>
                    <span className="font-mono text-xs bg-[#2A2F45] px-2 py-0.5 rounded text-blue-300">
                      {shopInfo.profile.shop_identifier}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-400" />
                    <span className="text-sm text-slate-300">Staff:</span>
                    <span className="text-sm text-white">{shopInfo.shop.employee_count || 1} employee(s)</span>
                  </div>

                  <div className="flex items-start gap-2">
                    <Briefcase className="h-4 w-4 text-blue-400 mt-0.5" />
                    <div>
                      <span className="text-sm text-slate-300">Services:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {shopInfo.shop.services.map((service: string, index: number) => (
                          <span key={index} className="text-xs bg-[#2A2F45] px-2 py-0.5 rounded text-blue-300">
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
        <Card className="bg-[#0A0D17] border-[#2A2F45]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Store className="h-5 w-5 text-blue-400" />
              <span className="text-white">Shop Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 p-4 bg-[#181c2e] rounded-md text-slate-300">
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
