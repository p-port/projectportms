
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { DetailsTab } from "./job-details/DetailsTab";
import { NotesTab } from "./job-details/NotesTab";
import { PhotosTab } from "./job-details/PhotosTab";
import { QrCodeDisplay } from "./QrCodeDisplay";
import { getStatusColor, updateJobInLocalStorage } from "./job-details/JobUtils";
import { supabase } from "@/integrations/supabase/client";

interface JobDetailsDialogProps {
  job: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateJob: (updatedJob: any) => void;
}

export const JobDetailsDialog = ({
  job,
  open,
  onOpenChange,
  onUpdateJob,
}: JobDetailsDialogProps) => {
  const [activeTab, setActiveTab] = useState("details");
  const [currentJob, setCurrentJob] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  // Update currentJob whenever job prop changes
  useEffect(() => {
    if (job) {
      setCurrentJob({ ...job });
    }
  }, [job]);

  useEffect(() => {
    // Check for authenticated user
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        setUser(data.session.user);
      }
    };
    
    checkUser();
  }, []);

  const handleStatusChange = async (newStatus: string) => {
    if (!currentJob) return;
    
    // Check photo requirements
    if (newStatus === "in-progress" && (!currentJob.photos.start || currentJob.photos.start.length < 3)) {
      toast.error("You need to upload at least 3 start photos before changing status to In Progress");
      return;
    }

    if (newStatus === "completed" && (!currentJob.photos.completion || currentJob.photos.completion.length < 3)) {
      toast.error("You need to upload at least 3 completion photos before marking this job as Complete");
      return;
    }
    
    const updatedJob = {
      ...currentJob,
      status: newStatus,
    };

    if (newStatus === "completed" && !currentJob.dateCompleted) {
      updatedJob.dateCompleted = new Date().toISOString().split("T")[0];
    }

    try {
      // If user is authenticated, update in Supabase first
      if (user) {
        console.log("Updating job status in Supabase:", updatedJob.id, newStatus);
        const { error } = await supabase.from('jobs').update({
          status: newStatus,
          date_completed: updatedJob.dateCompleted
        }).eq('job_id', updatedJob.id);
        
        if (error) {
          console.error("Error updating job status in Supabase:", error);
          throw error;
        }
      }
      
      // Update the job locally
      setCurrentJob(updatedJob);
      onUpdateJob(updatedJob);
      
      // Update the job in localStorage
      updateJobInLocalStorage(updatedJob);
      
      toast.success(`Job status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating job status:", error);
      toast.error("Failed to update job status. Please try again.");
    }
  };

  // Don't render anything if job is not available
  if (!currentJob) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>
              Job #{currentJob.id} - {currentJob.motorcycle.make}{" "}
              {currentJob.motorcycle.model}
            </span>
            <Badge className={`${getStatusColor(currentJob.status)} capitalize`}>
              {currentJob.status.replace("-", " ")}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Manage job details, photos, and status
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="notes">Notes & Status</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
            <TabsTrigger value="qrcode">QR Code</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <DetailsTab currentJob={currentJob} />
          </TabsContent>

          <TabsContent value="notes">
            <NotesTab 
              currentJob={currentJob} 
              onUpdateJob={(updatedJob) => {
                setCurrentJob(updatedJob);
                onUpdateJob(updatedJob);
              }}
              handleStatusChange={handleStatusChange}
              updateJobInLocalStorage={updateJobInLocalStorage}
            />
          </TabsContent>

          <TabsContent value="photos">
            <PhotosTab 
              currentJob={currentJob} 
              onUpdateJob={(updatedJob) => {
                setCurrentJob(updatedJob);
                onUpdateJob(updatedJob);
              }}
              updateJobInLocalStorage={updateJobInLocalStorage}
              minPhotosRequired={3}
            />
          </TabsContent>

          <TabsContent value="qrcode">
            <QrCodeDisplay jobId={currentJob.id} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
