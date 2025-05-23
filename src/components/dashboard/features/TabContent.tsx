
import { useState, useEffect } from "react";
import { TabsContent } from "@/components/ui/tabs";
import { JobList } from "@/components/dashboard/JobList";
import { NewJobForm } from "@/components/dashboard/NewJobForm";
import { SearchPanel } from "@/components/dashboard/SearchPanel";
import { AccountInfo } from "@/components/dashboard/account/AccountInfo";
import { MessageList } from "@/components/dashboard/messaging/MessageList";
import { TicketList } from "@/components/dashboard/tickets/TicketList";
import { UserManagement } from "@/components/dashboard/admin/UserManagement";
import { ShopsList } from "@/components/dashboard/shops/ShopsList";
import { ShopManagementTab } from "@/components/dashboard/shops/ShopManagementTab";
import { supabase } from "@/integrations/supabase/client";

interface TabContentProps {
  activeJobs: any[];
  completedJobs: any[];
  allJobs: any[];
  setJobs: (jobs: any[]) => void;
  handleAddJob: (job: any) => void;
  userId?: string;
  userRole?: string;
  translations: any;
}

export const TabContent = ({
  activeJobs,
  completedJobs,
  allJobs,
  setJobs,
  handleAddJob,
  userId,
  userRole = 'mechanic',
  translations
}: TabContentProps) => {
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
    <div className="mt-2">
      <TabsContent value="active-jobs">
        <JobList
          jobs={activeJobs}
          allJobs={allJobs}
          setJobs={setJobs}
          jobType="active"
          translations={translations}
          emptyStateMessage={translations.noActiveJobs}
          emptyStateAction={translations.createNewJob}
        />
      </TabsContent>
      
      <TabsContent value="completed">
        <JobList
          jobs={completedJobs}
          allJobs={allJobs}
          setJobs={setJobs}
          jobType="completed"
          translations={translations}
          emptyStateMessage={translations.noCompletedJobs}
          emptyStateAction={translations.completedJobsAppear}
        />
      </TabsContent>
      
      <TabsContent value="new-job">
        <NewJobForm onSubmit={handleAddJob} />
      </TabsContent>
      
      <TabsContent value="customers">
        <SearchPanel />
      </TabsContent>
      
      <TabsContent value="support">
        <TicketList userId={userId} userRole={userRole} />
      </TabsContent>
      
      <TabsContent value="shops">
        {userRole === 'admin' ? (
          <ShopsList />
        ) : (
          <ShopManagementTab userId={userId || ''} />
        )}
      </TabsContent>
      
      <TabsContent value="users">
        <UserManagement />
      </TabsContent>
      
      <TabsContent value="account">
        <AccountInfo userRole={userRole} userId={userId} />
      </TabsContent>
      
      {isShopOwner && (
        <TabsContent value="shop-management">
          <ShopManagementTab userId={userId || ''} />
        </TabsContent>
      )}
    </div>
  );
};
