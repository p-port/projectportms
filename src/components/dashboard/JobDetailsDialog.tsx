
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Camera, Check } from "lucide-react";
import { QrCodeDisplay } from "./QrCodeDisplay";

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
  const [newNote, setNewNote] = useState("");
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [photoType, setPhotoType] = useState<"start" | "completion">("start");

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

  const handleAddNote = () => {
    if (!newNote.trim()) {
      toast.error("Note cannot be empty");
      return;
    }

    const updatedJob = {
      ...currentJob,
      notes: [
        ...currentJob.notes,
        {
          text: newNote,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    setCurrentJob(updatedJob);
    setNewNote("");
    onUpdateJob(updatedJob);
    
    // Update the job in localStorage
    updateJobInLocalStorage(updatedJob);
    
    toast.success("Note added successfully");
  };

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

  const updateJobInLocalStorage = (updatedJob: any) => {
    const storedJobsString = localStorage.getItem('projectPortJobs');
    if (storedJobsString) {
      const storedJobs = JSON.parse(storedJobsString);
      const updatedJobs = storedJobs.map((j: any) => 
        j.id === updatedJob.id ? updatedJob : j
      );
      localStorage.setItem('projectPortJobs', JSON.stringify(updatedJobs));
      console.log(`Job ${updatedJob.id} updated in localStorage`);
    }
  };

  const simulatePhotoUpload = (type: "start" | "completion") => {
    setUploadingPhotos(true);
    setPhotoType(type);
    
    // Simulate photo upload delay
    setTimeout(() => {
      const photoCount = Math.floor(Math.random() * 4) + 3; // Random between 3 and 6
      const newPhotos = Array(photoCount).fill("/placeholder.svg");
      
      const updatedJob = {
        ...currentJob,
        photos: {
          ...currentJob.photos,
          [type]: newPhotos
        }
      };
      
      // If this is start photos, also change status to in-progress
      if (type === "start" && currentJob.status === "pending") {
        updatedJob.status = "in-progress";
        updatedJob.notes = [
          ...updatedJob.notes,
          {
            text: "Job started - initial photos uploaded",
            timestamp: new Date().toISOString()
          }
        ];
      }
      
      // If this is completion photos, also change status to completed
      if (type === "completion") {
        updatedJob.status = "completed";
        updatedJob.dateCompleted = new Date().toISOString().split("T")[0];
        updatedJob.notes = [
          ...updatedJob.notes,
          {
            text: "Job completed - final photos uploaded",
            timestamp: new Date().toISOString()
          }
        ];
      }
      
      setCurrentJob(updatedJob);
      onUpdateJob(updatedJob);
      
      // Update the job in localStorage
      updateJobInLocalStorage(updatedJob);
      
      setUploadingPhotos(false);
      toast.success(`${photoCount} photos uploaded successfully`);
    }, 1500);
  };

  const canStartJob = currentJob.status === "pending" && currentJob.photos.start.length === 0;
  const canCompleteJob = 
    currentJob.status === "in-progress" && 
    currentJob.photos.start.length > 0 && 
    currentJob.photos.completion.length === 0;

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

          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Customer Information</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Name:</span>
                  <span>{currentJob.customer.name}</span>
                  
                  <span className="text-muted-foreground">Phone:</span>
                  <span>{currentJob.customer.phone}</span>
                  
                  <span className="text-muted-foreground">Email:</span>
                  <span>{currentJob.customer.email}</span>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Motorcycle Information</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Make:</span>
                  <span>{currentJob.motorcycle.make}</span>
                  
                  <span className="text-muted-foreground">Model:</span>
                  <span>{currentJob.motorcycle.model}</span>
                  
                  <span className="text-muted-foreground">Year:</span>
                  <span>{currentJob.motorcycle.year}</span>
                  
                  <span className="text-muted-foreground">VIN:</span>
                  <span className="font-mono">{currentJob.motorcycle.vin}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 mt-4">
              <h3 className="text-lg font-medium">Service Information</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground block">Service Type:</span>
                  <span>{currentJob.serviceType}</span>
                </div>
                
                <div>
                  <span className="text-muted-foreground block">Created:</span>
                  <span>{currentJob.dateCreated}</span>
                </div>
                
                <div>
                  <span className="text-muted-foreground block">Status:</span>
                  <span className="capitalize">{currentJob.status.replace("-", " ")}</span>
                </div>
                
                <div>
                  <span className="text-muted-foreground block">Completed:</span>
                  <span>{currentJob.dateCompleted || "Not completed"}</span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4 mt-4">
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-medium">Job Notes</h3>
              
              <div className="flex flex-col gap-2">
                <Textarea
                  placeholder="Add a note about this job..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={3}
                />
                <Button onClick={handleAddNote} className="self-end">
                  Add Note
                </Button>
              </div>

              <div className="space-y-4 mt-4">
                <h4 className="font-medium">Notes History</h4>
                {currentJob.notes.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No notes yet</p>
                ) : (
                  <div className="space-y-3">
                    {currentJob.notes.map((note: any, index: number) => {
                      // Format the timestamp for display
                      const date = new Date(note.timestamp);
                      const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                      
                      return (
                        <div key={index} className="bg-muted p-3 rounded-md">
                          <p className="text-sm">{note.text}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formattedDate}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="text-lg font-medium mb-4">Update Job Status</h3>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={currentJob.status === "pending" ? "default" : "outline"}
                  onClick={() => handleStatusChange("pending")}
                  className="justify-start"
                  disabled={currentJob.status === "completed"}
                >
                  Pending
                </Button>
                <Button
                  variant={currentJob.status === "in-progress" ? "default" : "outline"}
                  onClick={() => handleStatusChange("in-progress")}
                  className="justify-start"
                  disabled={currentJob.status === "completed"}
                >
                  In Progress
                </Button>
                <Button
                  variant={currentJob.status === "on-hold" ? "default" : "outline"}
                  onClick={() => handleStatusChange("on-hold")}
                  className="justify-start"
                  disabled={currentJob.status === "completed"}
                >
                  On Hold
                </Button>
                <Button
                  variant={currentJob.status === "completed" ? "default" : "outline"}
                  onClick={() => handleStatusChange("completed")}
                  className="justify-start"
                >
                  Completed
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="photos" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Start Photos ({currentJob.photos.start.length}/6)</h3>
                {canStartJob && (
                  <Button 
                    onClick={() => simulatePhotoUpload("start")}
                    disabled={uploadingPhotos}
                  >
                    {uploadingPhotos && photoType === "start" ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
                        Uploading...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        Upload Photos to Start Job
                      </span>
                    )}
                  </Button>
                )}
              </div>

              {currentJob.photos.start.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                  {currentJob.photos.start.map((photo: string, index: number) => (
                    <div key={`start-${index}`} className="aspect-square bg-muted rounded-md overflow-hidden">
                      <img 
                        src={photo} 
                        alt={`Start photo ${index + 1}`} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No start photos uploaded yet</p>
              )}
            </div>

            <div className="space-y-4 mt-6 border-t pt-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Completion Photos ({currentJob.photos.completion.length}/6)</h3>
                {canCompleteJob && (
                  <Button 
                    onClick={() => simulatePhotoUpload("completion")}
                    disabled={uploadingPhotos}
                  >
                    {uploadingPhotos && photoType === "completion" ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
                        Uploading...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Check className="h-4 w-4" />
                        Upload Photos to Complete Job
                      </span>
                    )}
                  </Button>
                )}
              </div>

              {currentJob.photos.completion.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                  {currentJob.photos.completion.map((photo: string, index: number) => (
                    <div key={`completion-${index}`} className="aspect-square bg-muted rounded-md overflow-hidden">
                      <img 
                        src={photo} 
                        alt={`Completion photo ${index + 1}`} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No completion photos uploaded yet</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="qrcode" className="mt-4">
            <QrCodeDisplay jobId={currentJob.id} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
