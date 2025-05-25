import { NotificationCenter } from "../notifications/NotificationCenter";

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
  // Extract first name from full name or use email as fallback
  const getDisplayName = (name?: string) => {
    if (!name) return "User";
    
    // If it looks like an email, extract the part before @
    if (name.includes("@")) {
      return name.split("@")[0];
    }
    
    // Otherwise, get the first name (first word)
    return name.split(" ")[0];
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {translations.dashboard}
          </h1>
          <p className="text-muted-foreground">
            {translations.welcome}, {getDisplayName(userName)}!
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NotificationCenter userId={userId} />
        </div>
      </div>
    </div>
  );
};
