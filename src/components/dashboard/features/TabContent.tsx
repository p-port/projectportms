
import { TabsContent } from "@/components/ui/tabs";
import { JobList } from "../JobList";
import { NewJobForm } from "../NewJobForm";
import { SearchPanel } from "../SearchPanel";
import { TicketList } from "../tickets/TicketList";
import { AccountInfo } from "../account/AccountInfo";

interface TabContentProps {
  activeJobs: any[];
  completedJobs: any[];
  allJobs: any[];
  setJobs: React.Dispatch<React.SetStateAction<any[]>>;
  handleAddJob: (jobData: any) => void;
  userId?: string;
  userRole?: string;
  translations?: any;
}

export const TabContent = ({ 
  activeJobs, 
  completedJobs, 
  allJobs, 
  setJobs,
  handleAddJob,
  userId,
  userRole,
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

      <TabsContent value="search">
        <SearchPanel jobs={allJobs} translations={translations} />
      </TabsContent>
      
      <TabsContent value="tickets">
        <TicketList userId={userId} userRole={userRole} />
      </TabsContent>
      
      <TabsContent value="account">
        <AccountInfo userId={userId} />
      </TabsContent>
    </>
  );
};
