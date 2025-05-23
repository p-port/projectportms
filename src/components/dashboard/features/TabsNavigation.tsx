
import { Briefcase, Check, MessageSquarePlus, User, Wrench, Store, Users, Search, Building } from "lucide-react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TabsNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobile: boolean;
  activeJobs: number;
  completedJobs: number;
  unreadTickets: number;
  translations: any;
  userRole?: string;
  isShopOwner?: boolean;
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
  isShopOwner = false
}: TabsNavigationProps) => {
  const isAdmin = userRole === 'admin';
  
  return (
    <TabsList className="flex flex-wrap">
      <TabsTrigger value="active-jobs" onClick={() => setActiveTab("active-jobs")} className="flex gap-2 items-center">
        <Wrench className="h-4 w-4" />
        {translations.activeJobs}
        <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium">
          {activeJobs}
        </span>
      </TabsTrigger>
      <TabsTrigger value="completed" onClick={() => setActiveTab("completed")} className="flex gap-2 items-center">
        <Check className="h-4 w-4" />
        {translations.completed}
        <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium">
          {completedJobs}
        </span>
      </TabsTrigger>
      <TabsTrigger value="new-job" onClick={() => setActiveTab("new-job")} className="flex gap-2 items-center">
        <Briefcase className="h-4 w-4" />
        {translations.newJob}
      </TabsTrigger>
      <TabsTrigger value="customers" onClick={() => setActiveTab("customers")} className="flex gap-2 items-center">
        <Search className="h-4 w-4" />
        {translations.search || "Search"}
      </TabsTrigger>
      {isAdmin && (
        <TabsTrigger value="shops" onClick={() => setActiveTab("shops")} className="flex gap-2 items-center">
          <Store className="h-4 w-4" />
          {translations.shops || "Shops"}
        </TabsTrigger>
      )}
      {isShopOwner && (
        <TabsTrigger value="my-shop" onClick={() => setActiveTab("my-shop")} className="flex gap-2 items-center">
          <Building className="h-4 w-4" />
          {translations.myShop || "My Shop"}
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
