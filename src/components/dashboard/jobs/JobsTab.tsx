
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { JobList } from "../JobList";
import { NewJobForm } from "../NewJobForm";

interface JobsTabProps {
  activeJobs: any[];
  completedJobs: any[];
  allJobs: any[];
  setJobs: (jobs: any[]) => void;
  handleAddJob: (job: any) => void;
  translations: any;
  userRole?: string;
  userId?: string;
}

export const JobsTab = ({ 
  activeJobs, 
  completedJobs, 
  allJobs, 
  setJobs, 
  handleAddJob, 
  translations, 
  userRole, 
  userId 
}: JobsTabProps) => {
  const [activeTab, setActiveTab] = useState("new");

  const handleJobUpdate = () => {
    // Switch to active jobs tab to show the newly created job
    setActiveTab("active");
    
    // Trigger a page reload to ensure the new job appears
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-center mb-6">
          <TabsList className="grid w-full max-w-md grid-cols-3 h-12">
            <TabsTrigger value="new" className="flex items-center gap-2 text-sm">
              <Plus className="h-4 w-4" />
              {translations?.newJob || "New Job"}
            </TabsTrigger>
            <TabsTrigger value="active" className="text-sm">
              {translations?.activeJobs || "Active"} ({activeJobs.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-sm">
              {translations?.completedJobs || "Completed"} ({completedJobs.length})
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="new" className="mt-0">
          <NewJobForm onJobCreated={handleJobUpdate} />
        </TabsContent>
        
        <TabsContent value="active" className="mt-0">
          <JobList 
            jobs={activeJobs} 
            allJobs={allJobs}
            setJobs={setJobs}
            jobType="active"
            translations={translations}
            userRole={userRole}
          />
        </TabsContent>
        
        <TabsContent value="completed" className="mt-0">
          <JobList 
            jobs={completedJobs} 
            allJobs={allJobs}
            setJobs={setJobs}
            jobType="completed"
            translations={translations}
            userRole={userRole}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
