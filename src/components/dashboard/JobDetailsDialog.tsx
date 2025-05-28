
import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { DetailsTab } from "./job-details/DetailsTab";
import { NotesTab } from "./job-details/NotesTab";
import { PhotosTab } from "./job-details/PhotosTab";
import { QrCodeDisplay } from "./QrCodeDisplay";
import { FinalCostDialog } from "./job-details/FinalCostDialog";
import { DeleteJobDialog } from "./job-details/DeleteJobDialog";
import { JobDetailsHeader } from "./job-details/JobDetailsHeader";
import { updateJobInLocalStorage, canCompleteJob, deleteJob } from "./job-details/JobUtils";
import { supabase } from "@/integrations/supabase/client";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { jobDetailsTranslations, deleteJobTranslations } from "./job-details/translations";

interface JobDetailsDialogProps {
  job: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateJob: (updatedJob: any) => void;
  onDeleteJob?: (jobId: string) => void;
}

export const JobDetailsDialog = ({
  job,
  open,
  onOpenChange,
  onUpdateJob,
  onDeleteJob,
}: JobDetailsDialogProps) => {
  const [activeTab, setActiveTab] = useState("details");
  const [currentJob, setCurrentJob] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [showFinalCostDialog, setShowFinalCostDialog] = useState(false);
  const [finalCost, setFinalCost] = useState("");
  const [pendingStatusChange, setPendingStatusChange] = useState<string | null>(null);
  const [language] = useLocalStorage("language", "en");
  
  // Delete job confirmation states
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [showSecondDeleteConfirmDialog, setShowSecondDeleteConfirmDialog] = useState(false);
  
  const t = jobDetailsTranslations[language as keyof typeof jobDetailsTranslations] || jobDetailsTranslations.en;
  const dt = deleteJobTranslations[language as keyof typeof deleteJobTranslations] || deleteJobTranslations.en;

  // Update currentJob whenever job prop changes
  useEffect(() => {
    if (job) {
      console.log("JobDetailsDialog: Updating currentJob with:", job);
      setCurrentJob({ ...job });
      if (job.finalCost) {
        setFinalCost(job.finalCost);
      }
    }
  }, [job]);

  useEffect(() => {
    // Check for authenticated user
    const checkUser = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          setUser(data.session.user);
        }
      } catch (error) {
        console.error("Error checking user session:", error);
      }
    };
    
    checkUser();
  }, []);

  const handleStatusChange = async (newStatus: string) => {
    if (!currentJob) {
      console.error("No current job available for status change");
      return;
    }
    
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
        
        // Here we need to ensure we're using the correct column names for Supabase
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
      await updateJobInLocalStorage(updatedJob);
      
      toast.success(`${t.jobStatusUpdated} ${newStatus}`);
    } catch (error) {
      console.error("Error updating job status:", error);
      toast.error(t.failedToUpdate);
    }
  };

  const handleFinalCostSubmit = async () => {
    if (!finalCost || isNaN(Number(finalCost))) {
      toast.error(t.invalidFinalCost);
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
        // Store the final cost in the notes object since there's no dedicated column for it
        const notes = updatedJob.notes || {};
        
        const { error } = await supabase.from('jobs').update({
          notes: { ...notes, finalCost: finalCost }
        }).eq('job_id', updatedJob.id);
        
        if (error) {
          console.error("Error updating job final cost in Supabase:", error);
          throw error;
        }
      }
      
      // Update locally
      onUpdateJob(updatedJob);
      await updateJobInLocalStorage(updatedJob);
      
      setShowFinalCostDialog(false);
      
      // If this was part of a status change to completed, continue with that change
      if (pendingStatusChange === "completed") {
        setPendingStatusChange(null);
        handleStatusChange("completed");
      } else {
        toast.success(t.finalCostUpdated);
      }
    } catch (error) {
      console.error("Error updating final cost:", error);
      toast.error(t.failedToUpdate);
    }
  };

  const handleDeleteJob = async () => {
    if (!currentJob) return;
    
    try {
      const result = await deleteJob(currentJob.id);
      
      if (result.success) {
        // Close all dialogs
        setShowSecondDeleteConfirmDialog(false);
        setShowDeleteConfirmDialog(false);
        onOpenChange(false);
        
        // Notify parent component about deletion
        if (onDeleteJob) {
          onDeleteJob(currentJob.id);
        }
        
        toast.success(dt.jobDeleted);
      } else {
        toast.error(`${dt.deleteFailed}: ${result.message}`);
      }
    } catch (error) {
      console.error("Error deleting job:", error);
      toast.error(dt.deleteFailed);
    }
  };

  // Don't render anything if job is not available
  if (!currentJob) {
    console.log("JobDetailsDialog: No currentJob available, not rendering");
    return null;
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <JobDetailsHeader 
            job={currentJob}
            finalCost={finalCost}
            setFinalCost={setFinalCost}
            onFinalCostSubmit={handleFinalCostSubmit}
            onDeleteClick={() => setShowDeleteConfirmDialog(true)}
            translations={t}
            deleteTranslations={dt}
          />

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="details">{t.details}</TabsTrigger>
              <TabsTrigger value="notes">{t.notesStatus}</TabsTrigger>
              <TabsTrigger value="photos">{t.photos}</TabsTrigger>
              <TabsTrigger value="qrcode">{t.qrCode}</TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <DetailsTab currentJob={currentJob} />
            </TabsContent>

            <TabsContent value="notes">
              <NotesTab 
                job={currentJob}
                allJobs={[currentJob]}
                setJobs={(jobs) => {
                  const updatedJob = jobs[0];
                  if (updatedJob) {
                    setCurrentJob(updatedJob);
                    onUpdateJob(updatedJob);
                  }
                }}
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

      <FinalCostDialog 
        open={showFinalCostDialog}
        onOpenChange={setShowFinalCostDialog}
        finalCost={finalCost}
        setFinalCost={setFinalCost}
        onSubmit={handleFinalCostSubmit}
        onCancel={() => setPendingStatusChange(null)}
        translations={t}
      />
      
      <DeleteJobDialog 
        showFirstDialog={showDeleteConfirmDialog}
        setShowFirstDialog={setShowDeleteConfirmDialog}
        showSecondDialog={showSecondDeleteConfirmDialog}
        setShowSecondDialog={setShowSecondDeleteConfirmDialog}
        onDelete={handleDeleteJob}
        translations={dt}
      />
    </>
  );
};
