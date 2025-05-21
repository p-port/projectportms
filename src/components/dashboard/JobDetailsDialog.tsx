
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { DetailsTab } from "./job-details/DetailsTab";
import { NotesTab } from "./job-details/NotesTab";
import { PhotosTab } from "./job-details/PhotosTab";
import { QrCodeDisplay } from "./QrCodeDisplay";
import { getStatusColor, updateJobInLocalStorage } from "./job-details/JobUtils";

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
  const [currentJob, setCurrentJob] = useState({ ...job });

  const handleStatusChange = (newStatus: string) => {
    const updatedJob = {
      ...currentJob,
      status: newStatus,
    };

    if (newStatus === "completed" && !currentJob.dateCompleted) {
      updatedJob.dateCompleted = new Date().toISOString().split("T")[0];
    }

    setCurrentJob(updatedJob);
    onUpdateJob(updatedJob);
    
    // Update the job in localStorage
    updateJobInLocalStorage(updatedJob);
    
    toast.success(`Job status updated to ${newStatus}`);
  };

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
