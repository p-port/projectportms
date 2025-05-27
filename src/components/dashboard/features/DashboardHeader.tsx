
import { NotificationCenter } from "../notifications/NotificationCenter";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface DashboardHeaderProps {
  userName?: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  translations: any;
  userId?: string;
}

export const DashboardHeader = ({
  userName,
  searchQuery,
  onSearchChange,
  translations,
  userId
}: DashboardHeaderProps) => {
  const isMobile = useIsMobile();

  // Extract display name - prioritize the actual name over email
  const getDisplayName = (name?: string) => {
    if (!name) return "User";
    
    // If it looks like an email, extract the part before @
    if (name.includes("@")) {
      return name.split("@")[0];
    }
    
    // Use the full name as display name
    return name;
  };

  const navigateToHome = () => {
    // Navigate to main dashboard by dispatching custom event
    window.dispatchEvent(new CustomEvent('navigate-to-tab', { detail: 'jobs' }));
  };

  return (
    <div className="space-y-4">
      <div className={`flex ${isMobile ? 'flex-col gap-2' : 'flex-row items-center'} justify-between`}>
        <div className={isMobile ? 'text-center' : ''}>
          <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold tracking-tight`}>
            {translations.dashboard || "Dashboard"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {translations.welcome || "Welcome"}, {getDisplayName(userName)}!
          </p>
        </div>
        <div className={`flex items-center gap-2 ${isMobile ? 'justify-center' : ''}`}>
          <NotificationCenter userId={userId} />
        </div>
      </div>
      <div className="flex justify-start">
        <Button variant="outline" size={isMobile ? "sm" : "default"} onClick={navigateToHome}>
          <Home className="h-4 w-4 mr-2" />
          {isMobile ? "" : "Home"}
        </Button>
      </div>
    </div>
  );
};
