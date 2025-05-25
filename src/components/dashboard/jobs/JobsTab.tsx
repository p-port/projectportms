
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JobList } from "@/components/dashboard/JobList";
import { NewJobForm } from "@/components/dashboard/NewJobForm";
import { Wrench, Check, Plus } from "lucide-react";

interface JobsTabProps {
  activeJobs: any[];
  completedJobs: any[];
  allJobs: any[];
  setJobs: (jobs: any[]) => void;
  handleAddJob: (job: any) => void;
  translations: any;
  userRole?: string;
}

export const JobsTab = ({
  activeJobs,
  completedJobs,
  allJobs,
  setJobs,
  handleAddJob,
  translations,
  userRole
}: JobsTabProps) => {
  return (
    <Tabs defaultValue="active" className="space-y-6">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="active" className="flex gap-2 items-center">
          <Wrench className="h-4 w-4" />
          {translations.activeJobs || "Active Jobs"}
          <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium">
            {activeJobs.length}
          </span>
        </TabsTrigger>
        <TabsTrigger value="completed" className="flex gap-2 items-center">
          <Check className="h-4 w-4" />
          {translations.completed || "Completed"}
          <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium">
            {completedJobs.length}
          </span>
        </TabsTrigger>
        <TabsTrigger value="new-job" className="flex gap-2 items-center">
          <Plus className="h-4 w-4" />
          {translations.newJob || "New Job"}
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="active">
        <JobList
          jobs={activeJobs}
          allJobs={allJobs}
          setJobs={setJobs}
          jobType="active"
          translations={translations}
          emptyStateMessage={translations.noActiveJobs}
          emptyStateAction={translations.createNewJob}
          userRole={userRole}
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
          userRole={userRole}
        />
      </TabsContent>
      
      <TabsContent value="new-job">
        <NewJobForm onSubmit={handleAddJob} />
      </TabsContent>
    </Tabs>
  );
};
