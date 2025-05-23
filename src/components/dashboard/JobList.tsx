
import { useState } from "react";
import { JobDetailsDialog } from "./JobDetailsDialog";
import { JobCard } from "./job-card/JobCard";
import { EmptyState } from "./job-list/EmptyState";
import { useJobOperations } from "./job-list/useJobOperations";
import { defaultTranslations } from "./job-list/translations";
import { useLocalStorage } from "@/hooks/use-local-storage";

interface JobListProps {
  jobs: any[];
  allJobs: any[];
  setJobs: React.Dispatch<React.SetStateAction<any[]>>;
  jobType: string;
  emptyStateMessage: any;
  emptyStateAction: any;
  type?: "active" | "completed"; // Keep the old prop for backward compatibility
  translations?: any;
}

export const JobList = ({ jobs, type, setJobs, allJobs, jobType = type, translations }: JobListProps) => {
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [language] = useLocalStorage("language", "en");
  const { user, syncJobToSupabase } = useJobOperations();
  
  // Use translations from props if available, otherwise use default
  const t = translations || defaultTranslations[language as keyof typeof defaultTranslations];
  
  // Define effectiveType variable to resolve the error
  const effectiveType = jobType || type;

  const handleViewDetails = (job: any) => {
    setSelectedJob(job);
    setIsDetailsOpen(true);
  };

  const handleUpdateJob = (updatedJob: any) => {
    const updatedJobs = allJobs.map(job => 
      job.id === updatedJob.id ? updatedJob : job
    );
    setJobs(updatedJobs);
    
    // Also sync to Supabase if user is authenticated
    if (user) {
      syncJobToSupabase(updatedJob, user.id);
    }
  };

  const handleDeleteJob = (jobId: string) => {
    // Filter out the deleted job from the jobs state
    const updatedJobs = allJobs.filter(job => job.id !== jobId);
    setJobs(updatedJobs);
  };

  // Reset selectedJob when dialog closes
  const handleOpenChange = (open: boolean) => {
    setIsDetailsOpen(open);
    if (!open) {
      setSelectedJob(null);
    }
  };

  return (
    <div>
      {jobs.length === 0 ? (
        <EmptyState 
          message={effectiveType === "active" ? t.noActiveJobs : t.noCompletedJobs}
          description={effectiveType === "active" ? t.createNewJob : t.completedJobsAppear}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <JobCard 
              key={job.id}
              job={job}
              onViewDetails={handleViewDetails}
              translations={t}
            />
          ))}
        </div>
      )}

      {isDetailsOpen && selectedJob && (
        <JobDetailsDialog
          job={selectedJob}
          open={isDetailsOpen}
          onOpenChange={handleOpenChange}
          onUpdateJob={handleUpdateJob}
          onDeleteJob={handleDeleteJob}
        />
      )}
    </div>
  );
};
