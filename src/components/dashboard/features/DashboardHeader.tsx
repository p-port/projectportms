
import { NotificationCenter } from "../notifications/NotificationCenter";
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
    </div>
  );
};
