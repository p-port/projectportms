
import { useState } from "react";
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

interface JobListProps {
  jobs: any[];
  type: "active" | "completed";
  setJobs: React.Dispatch<React.SetStateAction<any[]>>;
  allJobs: any[];
}

export const JobList = ({ jobs, type, setJobs, allJobs }: JobListProps) => {
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "on-hold":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleViewDetails = (job: any) => {
    setSelectedJob(job);
    setIsDetailsOpen(true);
  };

  const handleUpdateJob = (updatedJob: any) => {
    const updatedJobs = allJobs.map(job => 
      job.id === updatedJob.id ? updatedJob : job
    );
    setJobs(updatedJobs);
    setIsDetailsOpen(false);
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

      {selectedJob && (
        <JobDetailsDialog
          job={selectedJob}
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          onUpdateJob={handleUpdateJob}
        />
      )}
    </div>
  );
};
