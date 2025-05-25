
import { Briefcase, Check, MessageSquarePlus, User, Wrench, Store, Users, Search, Hammer } from "lucide-react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

interface TabsNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobile: boolean;
  activeJobs: number;
  completedJobs: number;
  unreadTickets: number;
  translations: any;
  userRole?: string;
  userId?: string;
}

export const TabsNavigation = ({
  activeTab,
  setActiveTab,
  isMobile,
  activeJobs,
  completedJobs,
  unreadTickets,
  translations,
  userRole = 'mechanic',
  userId
}: TabsNavigationProps) => {
  const isAdmin = userRole === 'admin';
  const isSupport = userRole === 'support';
  const [isShopOwner, setIsShopOwner] = useState(false);
  
  // Check if user is a shop owner
  useEffect(() => {
    if (userId) {
      const checkShopOwnership = async () => {
        const { data, error } = await supabase
          .from('shops')
          .select('id')
          .eq('owner_id', userId);
          
        if (!error && data && data.length > 0) {
          setIsShopOwner(true);
        }
      };
      
      checkShopOwnership();
    }
  }, [userId]);
  
  return (
    <TabsList className="flex flex-wrap">
      {/* Search icon with tooltip at the very left */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <TabsTrigger value="customers" onClick={() => setActiveTab("customers")} className="flex gap-2 items-center px-2">
              <Search className="h-4 w-4" />
              <span className="sr-only">{translations.search || "Search"}</span>
            </TabsTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>{translations.searchTooltip || "Search customers, motorcycles & jobs"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TabsTrigger value="jobs" onClick={() => setActiveTab("jobs")} className="flex gap-2 items-center">
        <Briefcase className="h-4 w-4" />
        {translations.jobs || "Jobs"}
        <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium">
          {activeJobs + completedJobs}
        </span>
      </TabsTrigger>
      
      {(isAdmin || isSupport || isShopOwner) && (
        <TabsTrigger value="shops" onClick={() => setActiveTab("shops")} className="flex gap-2 items-center">
          <Store className="h-4 w-4" />
          {translations.shops || "Shops"}
        </TabsTrigger>
      )}
      {isAdmin && (
        <TabsTrigger value="users" onClick={() => setActiveTab("users")} className="flex gap-2 items-center">
          <Users className="h-4 w-4" />
          {translations.users || "Users"}
        </TabsTrigger>
      )}
      <TabsTrigger value="support" onClick={() => setActiveTab("support")} className="flex gap-2 items-center">
        <MessageSquarePlus className="h-4 w-4" />
        {translations.tickets}
        {unreadTickets > 0 && (
          <span className="bg-destructive text-destructive-foreground rounded-full px-1.5 py-0.5 text-xs font-medium">
            {unreadTickets}
          </span>
        )}
      </TabsTrigger>
      <TabsTrigger value="account" onClick={() => setActiveTab("account")} className="flex gap-2 items-center">
        <User className="h-4 w-4" />
        {translations.account}
      </TabsTrigger>
    </TabsList>
  );
};
