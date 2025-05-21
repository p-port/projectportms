
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { signOut } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LogoutButtonProps {
  onLogout: () => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export const LogoutButton = ({ onLogout, variant = "outline" }: LogoutButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      const { error } = await signOut();
      if (error) {
        toast.error("Error signing out");
        console.error("Logout error:", error);
      } else {
        toast.success("Signed out successfully");
        onLogout();
      }
    } catch (error) {
      console.error("Logout exception:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      variant={variant} 
      size="sm" 
      onClick={handleLogout} 
      disabled={isLoading}
    >
      {isLoading ? "Signing out..." : (
        <>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </>
      )}
    </Button>
  );
};
