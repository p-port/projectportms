
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
import { Shield, Save } from "lucide-react";

interface RoleSwitcherProps {
  userId: string;
  currentRole: string;
  isAdmin: boolean;
  onRoleSwitch: (newRole: string) => void;
  translations: any;
}

export const RoleSwitcher = ({ 
  userId, 
  currentRole, 
  isAdmin, 
  onRoleSwitch,
  translations 
}: RoleSwitcherProps) => {
  const [selectedRole, setSelectedRole] = useState(currentRole);
  const [isSaving, setIsSaving] = useState(false);

  // Only show role switcher for admin accounts
  if (!isAdmin) return null;

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
    <div className="space-y-4 border p-4 rounded-lg bg-muted/30">
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 text-amber-500" />
        <h3 className="font-medium">{translations.adminTools || "Admin Tools"}</h3>
      </div>
      
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
    </div>
  );
};
