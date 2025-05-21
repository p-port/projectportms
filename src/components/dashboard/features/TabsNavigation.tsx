
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { MessageSquare, User } from "lucide-react";

interface TabsNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobile: boolean;
  activeJobs: number;
  completedJobs: number;
  unreadMessages: number;
  translations: {
    activeJobs: string;
    completed: string;
    newJob: string;
    customers: string;
  };
}

export const TabsNavigation = ({
  activeTab,
  setActiveTab,
  isMobile,
  activeJobs,
  completedJobs,
  unreadMessages,
  translations
}: TabsNavigationProps) => {
  if (isMobile) {
    return (
      <>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active-jobs">{translations.activeJobs} ({activeJobs})</TabsTrigger>
          <TabsTrigger value="completed-jobs">{translations.completed} ({completedJobs})</TabsTrigger>
        </TabsList>
        
        <div className="grid grid-cols-2 gap-2 mt-2 mb-2">
          <Button 
            variant="outline" 
            className={activeTab === "new-job" ? "bg-muted" : ""} 
            onClick={() => setActiveTab("new-job")}
          >
            {translations.newJob}
          </Button>
          <Button 
            variant="outline" 
            className={activeTab === "search" ? "bg-muted" : ""} 
            onClick={() => setActiveTab("search")}
          >
            Search
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mb-2">
          <Button 
            variant="outline" 
            className={activeTab === "messages" ? "bg-muted" : ""} 
            onClick={() => setActiveTab("messages")}
          >
            <MessageSquare className="mr-1 h-4 w-4" />
            Messages
            {unreadMessages > 0 && (
              <span className="ml-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadMessages}
              </span>
            )}
          </Button>
          <Button 
            variant="outline" 
            className={activeTab === "account" ? "bg-muted" : ""} 
            onClick={() => setActiveTab("account")}
          >
            <User className="mr-1 h-4 w-4" />
            Account
          </Button>
        </div>
      </>
    );
  } 

  return (
    <TabsList className="grid w-full grid-cols-6">
      <TabsTrigger value="active-jobs">{translations.activeJobs} ({activeJobs})</TabsTrigger>
      <TabsTrigger value="completed-jobs">{translations.completed} ({completedJobs})</TabsTrigger>
      <TabsTrigger value="new-job">{translations.newJob}</TabsTrigger>
      <TabsTrigger value="search">Search</TabsTrigger>
      <TabsTrigger value="messages" className="relative">
        Messages
        {unreadMessages > 0 && (
          <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadMessages}
          </span>
        )}
      </TabsTrigger>
      <TabsTrigger value="account">Account</TabsTrigger>
    </TabsList>
  );
};
