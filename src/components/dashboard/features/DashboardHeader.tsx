
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
  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h2 className="text-2xl sm:text-3xl font-bold">{translations.dashboard}</h2>
        <p className="text-muted-foreground">{translations.welcome}, {userName || "Mechanic"}</p>
      </div>

      <div className="flex w-full items-center space-x-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={translations.searchPlaceholder}
            className="pl-8"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
    </>
  );
};
