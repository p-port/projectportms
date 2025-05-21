
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { JobDetailsDialog } from "./JobDetailsDialog";
import { getStatusColor } from "./job-details/JobUtils";
import { supabase } from "@/integrations/supabase/client";

interface JobListProps {
  jobs: any[];
  type: "active" | "completed";
  setJobs: React.Dispatch<React.SetStateAction<any[]>>;
  allJobs: any[];
}

export const JobList = ({ jobs, type, setJobs, allJobs }: JobListProps) => {
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check for authenticated user
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        setUser(data.session.user);
      }
    };
    
    checkUser();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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

  const syncJobToSupabase = async (job: any, userId: string) => {
    try {
      const { error } = await supabase.from('jobs').upsert({
        job_id: job.id,
        customer: job.customer,
        motorcycle: job.motorcycle,
        service_type: job.serviceType,
        status: job.status,
        date_created: job.dateCreated,
        date_completed: job.dateCompleted,
        notes: job.notes,
        photos: job.photos,
        user_id: userId
      });
      
      if (error) throw error;
    } catch (error) {
      console.error("Error syncing job to database:", error);
    }
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
        <div className="text-center py-10">
          <h3 className="text-xl font-medium text-gray-500">
            {type === "active" ? "No active jobs found" : "No completed jobs found"}
          </h3>
          <p className="text-gray-400 mt-2">
            {type === "active"
              ? "Create a new job to get started"
              : "Completed jobs will appear here"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <Card key={job.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{job.motorcycle.make} {job.motorcycle.model}</CardTitle>
                    <CardDescription>{job.customer.name}</CardDescription>
                  </div>
                  <Badge className={`${getStatusColor(job.status)} capitalize`}>
                    {job.status.replace("-", " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Job ID:</span>
                    <span className="font-medium">{job.id}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Service:</span>
                    <span className="font-medium">{job.serviceType}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{job.dateCreated}</span>
                  </div>
                  {job.dateCompleted && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Completed:</span>
                      <span>{job.dateCompleted}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Notes:</span>
                    <span>{job.notes.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Photos:</span>
                    <span>
                      {job.photos.start.length + job.photos.completion.length} / 12
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleViewDetails(job)}
                >
                  View Details
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {isDetailsOpen && selectedJob && (
        <JobDetailsDialog
          job={selectedJob}
          open={isDetailsOpen}
          onOpenChange={handleOpenChange}
          onUpdateJob={handleUpdateJob}
        />
      )}
    </div>
  );
};
