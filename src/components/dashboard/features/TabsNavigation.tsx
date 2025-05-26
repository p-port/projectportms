
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
  
  if (isMobile) {
    return (
      <div className="overflow-x-auto">
        <TabsList className="flex w-max min-w-full">
          <TabsTrigger value="customers" onClick={() => setActiveTab("customers")} className="flex flex-col gap-1 items-center px-3 py-2 text-xs">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Search</span>
          </TabsTrigger>
          
          <TabsTrigger value="jobs" onClick={() => setActiveTab("jobs")} className="flex flex-col gap-1 items-center px-3 py-2 text-xs">
            <Briefcase className="h-4 w-4" />
            <span className="hidden sm:inline">{translations.jobs || "Jobs"}</span>
          </TabsTrigger>
          
          <TabsTrigger value="shops" onClick={() => setActiveTab("shops")} className="flex flex-col gap-1 items-center px-3 py-2 text-xs">
            <Store className="h-4 w-4" />
            <span className="hidden sm:inline">{translations.shops || "Shops"}</span>
          </TabsTrigger>
          
          {isAdmin && (
            <TabsTrigger value="users" onClick={() => setActiveTab("users")} className="flex flex-col gap-1 items-center px-3 py-2 text-xs">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">{translations.users || "Users"}</span>
            </TabsTrigger>
          )}
          
          <TabsTrigger value="support" onClick={() => setActiveTab("support")} className="flex flex-col gap-1 items-center px-3 py-2 text-xs relative">
            <MessageSquarePlus className="h-4 w-4" />
            <span className="hidden sm:inline">Support</span>
            {unreadTickets > 0 && (
              <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full px-1 text-xs font-medium min-w-[16px] h-4 flex items-center justify-center">
                {unreadTickets}
              </span>
            )}
          </TabsTrigger>
          
          <TabsTrigger value="account" onClick={() => setActiveTab("account")} className="flex flex-col gap-1 items-center px-3 py-2 text-xs">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Account</span>
          </TabsTrigger>
        </TabsList>
      </div>
    );
  }
  
  return (
    <TabsList className="flex flex-wrap">
      {/* Search icon with tooltip at the very left */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <TabsTrigger value="customers" onClick={() => setActiveTab("customers")} className="flex gap-2 items-center px-2">
              <Search className="h-4 w-4" />
              Search
            </TabsTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Search customers, motorcycles & jobs</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TabsTrigger value="jobs" onClick={() => setActiveTab("jobs")} className="flex gap-2 items-center">
        <Briefcase className="h-4 w-4" />
        {translations.jobs || "Jobs"}
      </TabsTrigger>
      
      {/* Show shops tab for all users so they can see their invitations and shop info */}
      <TabsTrigger value="shops" onClick={() => setActiveTab("shops")} className="flex gap-2 items-center">
        <Store className="h-4 w-4" />
        {translations.shops || "Shops"}
      </TabsTrigger>
      
      {isAdmin && (
        <TabsTrigger value="users" onClick={() => setActiveTab("users")} className="flex gap-2 items-center">
          <Users className="h-4 w-4" />
          {translations.users || "Users"}
        </TabsTrigger>
      )}
      <TabsTrigger value="support" onClick={() => setActiveTab("support")} className="flex gap-2 items-center">
        <MessageSquarePlus className="h-4 w-4" />
        Support
        {unreadTickets > 0 && (
          <span className="bg-destructive text-destructive-foreground rounded-full px-1.5 py-0.5 text-xs font-medium">
            {unreadTickets}
          </span>
        )}
      </TabsTrigger>
      <TabsTrigger value="account" onClick={() => setActiveTab("account")} className="flex gap-2 items-center">
        <User className="h-4 w-4" />
        Account
      </TabsTrigger>
    </TabsList>
  );
};
