
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
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
      <h2 className="text-2xl sm:text-3xl font-bold">{translations.dashboard}</h2>
      <p className="text-muted-foreground">{translations.welcome}, {userName || "Mechanic"}</p>
    </div>
  );
};
