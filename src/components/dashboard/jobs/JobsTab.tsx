
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { JobList } from "../JobList";
import { NewJobForm } from "../NewJobForm";

interface JobsTabProps {
  jobs: any[];
  onJobUpdate: () => void;
  userRole?: string;
  userId?: string;
}

export const JobsTab = ({ jobs, onJobUpdate, userRole, userId }: JobsTabProps) => {
  const [activeTab, setActiveTab] = useState("new");

  const activeJobs = jobs.filter(job => job.status !== 'completed');
  const completedJobs = jobs.filter(job => job.status === 'completed');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="new" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Job
        </TabsTrigger>
        <TabsTrigger value="active">
          Active Jobs ({activeJobs.length})
        </TabsTrigger>
        <TabsTrigger value="completed">
          Completed Jobs ({completedJobs.length})
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="new">
        <NewJobForm onJobCreated={onJobUpdate} />
      </TabsContent>
      
      <TabsContent value="active">
        <JobList 
          jobs={activeJobs} 
          onJobUpdate={onJobUpdate}
          title="Active Jobs"
          userRole={userRole}
          userId={userId}
        />
      </TabsContent>
      
      <TabsContent value="completed">
        <JobList 
          jobs={completedJobs} 
          onJobUpdate={onJobUpdate}
          title="Completed Jobs"
          userRole={userRole}
          userId={userId}
        />
      </TabsContent>
    </Tabs>
  );
};
