
import { TabsContent } from "@/components/ui/tabs";
import { JobList } from "../JobList";
import { NewJobForm } from "../NewJobForm";
import { SearchCustomers } from "../SearchCustomers";
import { MessageList } from "../messaging/MessageList";
import { AccountInfo } from "../account/AccountInfo";

interface TabContentProps {
  activeJobs: any[];
  completedJobs: any[];
  allJobs: any[];
  setJobs: React.Dispatch<React.SetStateAction<any[]>>;
  handleAddJob: (jobData: any) => void;
  userId?: string;
  translations?: any;
}

export const TabContent = ({ 
  activeJobs, 
  completedJobs, 
  allJobs, 
  setJobs,
  handleAddJob,
  userId,
  translations
}: TabContentProps) => {
  return (
    <>
      <TabsContent value="active-jobs">
        <JobList 
          jobs={activeJobs} 
          type="active" 
          setJobs={setJobs} 
          allJobs={allJobs}
          translations={translations} 
        />
      </TabsContent>

      <TabsContent value="completed-jobs">
        <JobList 
          jobs={completedJobs} 
          type="completed" 
          setJobs={setJobs} 
          allJobs={allJobs}
          translations={translations} 
        />
      </TabsContent>

      <TabsContent value="new-job">
        <NewJobForm onSubmit={handleAddJob} />
      </TabsContent>

      <TabsContent value="customers">
        <SearchCustomers jobs={allJobs} />
      </TabsContent>
      
      <TabsContent value="messages">
        <MessageList />
      </TabsContent>
      
      <TabsContent value="account">
        <AccountInfo userId={userId} />
      </TabsContent>
    </>
  );
};
