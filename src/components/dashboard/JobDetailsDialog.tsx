
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { DetailsTab } from "./job-details/DetailsTab";
import { NotesTab } from "./job-details/NotesTab";
import { PhotosTab } from "./job-details/PhotosTab";
import { QrCodeDisplay } from "./QrCodeDisplay";
import { getStatusColor, updateJobInLocalStorage, canCompleteJob } from "./job-details/JobUtils";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

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
  const [showFinalCostDialog, setShowFinalCostDialog] = useState(false);
  const [finalCost, setFinalCost] = useState("");
  const [pendingStatusChange, setPendingStatusChange] = useState<string | null>(null);

  // Update currentJob whenever job prop changes
  useEffect(() => {
    if (job) {
      setCurrentJob({ ...job });
      if (job.finalCost) {
        setFinalCost(job.finalCost);
      }
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
    
    const minPhotosRequired = 3; // Consistent with PhotosTab
    
    // Check photo requirements
    if (newStatus === "in-progress" && (!currentJob.photos.start || currentJob.photos.start.length < minPhotosRequired)) {
      toast.error(`You need to upload at least ${minPhotosRequired} start photos before changing status to In Progress`);
      return;
    }

    // If trying to complete the job, check completion requirements
    if (newStatus === "completed") {
      const completionCheck = canCompleteJob(currentJob);
      
      if (!completionCheck.valid) {
        toast.error(completionCheck.message);
        
        // If the error is about final cost, prompt for it
        if (completionCheck.message?.includes("final cost")) {
          setPendingStatusChange("completed");
          setShowFinalCostDialog(true);
          return;
        }
        
        return;
      }
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
        // Fix: Use snake_case field names for Supabase (matching database column names)
        const { error } = await supabase.from('jobs').update({
          status: newStatus,
          date_completed: updatedJob.dateCompleted,
          final_cost: updatedJob.finalCost
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

  const handleFinalCostSubmit = async () => {
    if (!finalCost || isNaN(Number(finalCost))) {
      toast.error("Please enter a valid final cost");
      return;
    }
    
    const updatedJob = {
      ...currentJob,
      finalCost: finalCost
    };
    
    // Update the job with final cost
    setCurrentJob(updatedJob);
    
    try {
      // Update in Supabase if user is authenticated
      if (user) {
        const { error } = await supabase.from('jobs').update({
          final_cost: finalCost
        }).eq('job_id', updatedJob.id);
        
        if (error) {
          console.error("Error updating job final cost in Supabase:", error);
          throw error;
        }
      }
      
      // Update locally
      onUpdateJob(updatedJob);
      updateJobInLocalStorage(updatedJob);
      
      setShowFinalCostDialog(false);
      
      // If this was part of a status change to completed, continue with that change
      if (pendingStatusChange === "completed") {
        setPendingStatusChange(null);
        handleStatusChange("completed");
      } else {
        toast.success("Final cost updated successfully");
      }
    } catch (error) {
      console.error("Error updating final cost:", error);
      toast.error("Failed to update final cost. Please try again.");
    }
  };

  // Don't render anything if job is not available
  if (!currentJob) return null;

  return (
    <>
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

          <div className="my-4">
            <div className="flex items-center gap-4 mb-4">
              <Label htmlFor="finalCost">Final Cost:</Label>
              <div className="relative flex-1">
                <Input
                  id="finalCost"
                  type="text"
                  placeholder="Enter final cost"
                  value={finalCost}
                  onChange={(e) => setFinalCost(e.target.value)}
                />
              </div>
              <Button onClick={handleFinalCostSubmit}>
                Update Final Cost
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
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

      <AlertDialog open={showFinalCostDialog} onOpenChange={setShowFinalCostDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enter Final Cost</AlertDialogTitle>
            <AlertDialogDescription>
              Please enter the final cost for this job before marking it as completed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              type="text"
              placeholder="Enter final cost"
              value={finalCost}
              onChange={(e) => setFinalCost(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingStatusChange(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinalCostSubmit}>Save</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
