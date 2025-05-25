
import { useState, useEffect } from "react";
import { TabsContent } from "@/components/ui/tabs";
import { JobsTab } from "@/components/dashboard/jobs/JobsTab";
import { SearchPanel } from "@/components/dashboard/SearchPanel";
import { AccountInfo } from "@/components/dashboard/account/AccountInfo";
import { MessageList } from "@/components/dashboard/messaging/MessageList";
import { TicketList } from "@/components/dashboard/tickets/TicketList";
import { UserManagement } from "@/components/dashboard/admin/UserManagement";
import { ShopManagementTab } from "@/components/dashboard/shops/ShopManagementTab";
import { MyShopView } from "@/components/dashboard/shops/MyShopView";
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
      <TabsContent value="jobs">
        <JobsTab
          activeJobs={activeJobs}
          completedJobs={completedJobs}
          allJobs={allJobs}
          setJobs={setJobs}
          handleAddJob={handleAddJob}
          translations={translations}
          userRole={userRole}
          userId={userId}
        />
      </TabsContent>
      
      <TabsContent value="customers">
        <SearchPanel
          jobs={allJobs}
          userRole={userRole}
          userId={userId}
        />
      </TabsContent>
      
      <TabsContent value="support">
        <TicketList userId={userId} userRole={userRole} />
      </TabsContent>
      
      <TabsContent value="shops">
        {/* Show admin management for admins/support, personal shop view for everyone else */}
        {(userRole === 'admin' || userRole === 'support') ? (
          <ShopManagementTab userId={userId || ''} />
        ) : (
          <MyShopView userId={userId} />
        )}
      </TabsContent>
      
      <TabsContent value="users">
        <UserManagement />
      </TabsContent>
      
      <TabsContent value="account">
        <AccountInfo userRole={userRole} userId={userId} />
      </TabsContent>
    </div>
  );
};
