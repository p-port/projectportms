
import { NotificationCenter } from "../notifications/NotificationCenter";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {translations.dashboard || "Dashboard"}
          </h1>
          <p className="text-muted-foreground">
            {translations.welcome || "Welcome"}, {getDisplayName(userName)}!
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={navigateToHome}>
            <Home className="h-4 w-4 mr-2" />
            Home
          </Button>
          <NotificationCenter userId={userId} />
        </div>
      </div>
    </div>
  );
};
