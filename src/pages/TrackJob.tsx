
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, Clock } from "lucide-react";

// This page would be shown to customers when they scan the QR code
const TrackJob = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // In a real app, this would fetch from your API
    // For demo, we'll retrieve job data from localStorage
    setLoading(true);
    
    try {
      // Get all jobs from localStorage
      const storedJobsString = localStorage.getItem('projectPortJobs');
      const jobs = storedJobsString ? JSON.parse(storedJobsString) : [];
      
      console.log("Looking for job with ID:", jobId);
      console.log("Available jobs:", jobs);
      
      // Find the job with the matching ID
      const foundJob = jobs.find((job: any) => job.id === jobId);
      
      if (foundJob) {
        console.log("Found job:", foundJob);
        setJob(foundJob);
        setError(null);
      } else {
        console.log("Job not found");
        setError(`No job found with ID: ${jobId}`);
      }
    } catch (err) {
      console.error("Error retrieving job:", err);
      setError("An error occurred while retrieving the job data");
    } finally {
      setLoading(false);
    }
  }, [jobId]);

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

  const getStatusMessage = (status: string) => {
    switch (status) {
      case "pending":
        return "Your motorcycle is in the queue and waiting to be serviced.";
      case "in-progress":
        return "Our mechanics are currently working on your motorcycle.";
      case "on-hold":
        return "Work on your motorcycle is temporarily paused. We'll resume shortly.";
      case "completed":
        return "Good news! Your motorcycle service is completed and ready for pickup.";
      default:
        return "";
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">Project Port - Service Status Tracker</h1>
        
        {loading && (
          <div className="flex justify-center items-center h-60">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-muted-foreground">Loading job details...</p>
            </div>
          </div>
        )}

        {error && (
          <Card className="border-red-200">
            <CardContent className="pt-6">
              <div className="text-center p-6">
                <h3 className="text-lg font-medium text-red-600">Error</h3>
                <p className="mt-2">{error}</p>
                <p className="mt-4 text-sm text-muted-foreground">
                  Please check that you have the correct tracking URL or QR code.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && !error && job && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Job #{job.id}</CardTitle>
                  <p className="text-muted-foreground mt-1">
                    {job.motorcycle.make} {job.motorcycle.model} ({job.motorcycle.year})
                  </p>
                </div>
                <Badge className={`${getStatusColor(job.status)} capitalize`}>
                  {job.status.replace("-", " ")}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-md">
                <p>{getStatusMessage(job.status)}</p>
              </div>
              
              <div className="space-y-2">
                <p><span className="font-medium">Service type:</span> {job.serviceType}</p>
                <p><span className="font-medium">Date created:</span> {job.dateCreated}</p>
                
                {job.dateCompleted ? (
                  <p><span className="font-medium">Date completed:</span> {job.dateCompleted}</p>
                ) : (
                  <p><span className="font-medium">Status:</span> {job.status.replace("-", " ")}</p>
                )}
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-3">
                <h3 className="font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Service Progress
                </h3>
                
                {job.notes && job.notes.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No updates yet</p>
                ) : (
                  <div className="space-y-4 relative before:absolute before:top-3 before:bottom-0 before:left-1.5 before:w-px before:bg-muted-foreground/20">
                    {job.notes && job.notes.map((note: any, index: number) => {
                      const date = new Date(note.timestamp);
                      const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                      
                      return (
                        <div key={index} className="pl-6 relative">
                          <div className="absolute left-0 top-1.5 w-3 h-3 rounded-full bg-primary ring-4 ring-background"></div>
                          <p className="font-medium">{note.text}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formattedDate}
                          </p>
                        </div>
                      );
                    })}
                    
                    {job.status === "completed" && (
                      <div className="pl-6 relative">
                        <div className="absolute left-0 top-1.5 w-3 h-3 rounded-full bg-green-500 ring-4 ring-background">
                          <Check className="h-2 w-2 text-white absolute top-0.5 left-0.5" />
                        </div>
                        <p className="font-medium">Service completed</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Your motorcycle is ready for pickup
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default TrackJob;
