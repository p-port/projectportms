
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface DashboardHeaderProps {
  userName: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  translations: {
    dashboard: string;
    welcome: string;
    searchPlaceholder: string;
  };
}

export const DashboardHeader = ({ 
  userName, 
  searchQuery, 
  onSearchChange, 
  translations 
}: DashboardHeaderProps) => {
  // Extract first name only if userName contains spaces
  const displayName = userName && userName.includes(" ") 
    ? userName.split(" ")[0] 
    : userName;

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold">{translations.dashboard}</h2>
        <p className="text-muted-foreground">
          {translations.welcome}, {displayName || "User"}
        </p>
      </div>
      
      <div className="relative w-full sm:w-64 mt-2 sm:mt-0">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input 
          type="search"
          placeholder={translations.searchPlaceholder} 
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8"
        />
      </div>
    </div>
  );
};
