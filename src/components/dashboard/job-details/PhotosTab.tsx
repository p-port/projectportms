
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Check, Upload, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { capturePhoto, updateJobInLocalStorage } from "./JobUtils";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";

interface PhotosTabProps {
  currentJob: any;
  onUpdateJob: (updatedJob: any) => void;
  updateJobInLocalStorage: (job: any) => void;
  minPhotosRequired?: number;
}

export const PhotosTab = ({ currentJob, onUpdateJob, updateJobInLocalStorage, minPhotosRequired = 3 }: PhotosTabProps) => {
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [photoType, setPhotoType] = useState<"start" | "completion">("start");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<{ type: "start" | "completion", index: number } | null>(null);
  const [completionConfirmOpen, setCompletionConfirmOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status checks for job stage
  const canStartJob = currentJob.status === "pending";
  const canCompleteJob = currentJob.status === "in-progress" && currentJob.photos.start.length >= minPhotosRequired;

  const hasEnoughStartPhotos = currentJob.photos.start.length >= minPhotosRequired;
  const hasEnoughCompletionPhotos = currentJob.photos.completion.length >= minPhotosRequired;

  const handlePhotoCapture = (type: "start" | "completion", useCamera: boolean = true) => {
    setUploadingPhotos(true);
    setPhotoType(type);
    
    // Use our photo capture utility
    capturePhoto((photoDataUrl) => {
      // Add the new photo to the appropriate array
      const updatedPhotos = {
        ...currentJob.photos,
        [type]: [...currentJob.photos[type], photoDataUrl]
      };
      
      let updatedJob = {
        ...currentJob,
        photos: updatedPhotos
      };
      
      // If this is start photos, also change status to in-progress if we have enough photos
      if (type === "start" && currentJob.status === "pending" && updatedPhotos.start.length >= minPhotosRequired) {
        // Ask user if they want to start the job now
        if (confirm("You have uploaded enough photos to start the job. Would you like to change the status to In Progress?")) {
          updatedJob = {
            ...updatedJob,
            status: "in-progress",
            notes: [
              ...updatedJob.notes,
              {
                text: "Job started - initial photos uploaded",
                timestamp: new Date().toISOString()
              }
            ]
          };
          toast.success("Job status changed to In Progress");
        }
      }
      
      // If this is completion photos and we have enough photos
      if (type === "completion" && updatedPhotos.completion.length >= minPhotosRequired) {
        // Show completion confirmation dialog
        setCompletionConfirmOpen(true);
      }
      
      // Update job in state and localStorage
      onUpdateJob(updatedJob);
      updateJobInLocalStorage(updatedJob);
      
      setUploadingPhotos(false);
      toast.success(`Photo captured and uploaded successfully`);
    }, useCamera);
  };

  // Handle file selection for photo upload
  const handleFileUpload = (type: "start" | "completion") => {
    if (fileInputRef.current) {
      setPhotoType(type);
      fileInputRef.current.click();
    }
  };

  // Handle the file input change event
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingPhotos(true);
    
    // Process each selected file
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const photoDataUrl = event.target?.result as string;
        
        // Add the new photo to the appropriate array
        const updatedPhotos = {
          ...currentJob.photos,
          [photoType]: [...currentJob.photos[photoType], photoDataUrl]
        };
        
        let updatedJob = {
          ...currentJob,
          photos: updatedPhotos
        };
        
        // If this is start photos and we reach minimum required photos
        if (photoType === "start" && currentJob.status === "pending" && 
            updatedPhotos.start.length >= minPhotosRequired) {
          // Ask user if they want to start the job
          if (confirm("You have uploaded enough photos to start the job. Would you like to change the status to In Progress?")) {
            updatedJob = {
              ...updatedJob,
              status: "in-progress",
              notes: [
                ...updatedJob.notes,
                {
                  text: "Job started - initial photos uploaded",
                  timestamp: new Date().toISOString()
                }
              ]
            };
            toast.success("Job status changed to In Progress");
          }
        }
        
        // If this is completion photos and we reach minimum required photos
        if (photoType === "completion" && updatedPhotos.completion.length >= minPhotosRequired) {
          // Show completion confirmation dialog
          setCompletionConfirmOpen(true);
        }
        
        // Update job in state and localStorage
        onUpdateJob(updatedJob);
        updateJobInLocalStorage(updatedJob);
      };
      
      reader.readAsDataURL(file);
    });
    
    setUploadingPhotos(false);
    toast.success(`Photos uploaded successfully`);
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle photo deletion
  const handleDeletePhoto = (type: "start" | "completion", index: number) => {
    setPhotoToDelete({ type, index });
    setDeleteDialogOpen(true);
  };

  const confirmDeletePhoto = () => {
    if (!photoToDelete) return;
    
    const { type, index } = photoToDelete;
    
    // Remove the photo from the array
    const updatedPhotos = {
      ...currentJob.photos,
      [type]: [...currentJob.photos[type].slice(0, index), ...currentJob.photos[type].slice(index + 1)]
    };
    
    const updatedJob = {
      ...currentJob,
      photos: updatedPhotos
    };
    
    // Update job in state and localStorage
    onUpdateJob(updatedJob);
    updateJobInLocalStorage(updatedJob);
    
    // Close dialog and reset state
    setDeleteDialogOpen(false);
    setPhotoToDelete(null);
    toast.success("Photo deleted successfully");
  };

  // Complete job function
  const completeJob = () => {
    if (!hasEnoughCompletionPhotos) {
      toast.error(`You need at least ${minPhotosRequired} completion photos to complete the job`);
      return;
    }
    
    const updatedJob = {
      ...currentJob,
      status: "completed",
      dateCompleted: new Date().toISOString().split("T")[0],
      notes: [
        ...currentJob.notes,
        {
          text: "Job completed - final photos uploaded",
          timestamp: new Date().toISOString()
        }
      ]
    };
    
    onUpdateJob(updatedJob);
    updateJobInLocalStorage(updatedJob);
    setCompletionConfirmOpen(false);
    toast.success("Job marked as completed!");
  };

  // Simulate multiple photo uploads for demo purposes
  const simulateMultiplePhotos = (type: "start" | "completion") => {
    setUploadingPhotos(true);
    setPhotoType(type);
    
    // Simulate photo upload delay
    setTimeout(() => {
      const photoCount = Math.floor(Math.random() * 2) + minPhotosRequired; // Random between min and min+2
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
        if (confirm("You have uploaded enough photos to start the job. Would you like to change the status to In Progress?")) {
          updatedJob.status = "in-progress";
          updatedJob.notes = [
            ...updatedJob.notes,
            {
              text: "Job started - initial photos uploaded",
              timestamp: new Date().toISOString()
            }
          ];
          toast.success("Job status changed to In Progress");
        }
      }
      
      // If this is completion photos, ask if they want to complete the job
      if (type === "completion" && currentJob.status === "in-progress") {
        setCompletionConfirmOpen(true);
      }
      
      onUpdateJob(updatedJob);
      updateJobInLocalStorage(updatedJob);
      
      setUploadingPhotos(false);
      toast.success(`${photoCount} photos uploaded successfully`);
    }, 1500);
  };

  return (
    <div className="space-y-4 mt-4">
      {/* Hidden file input for photo uploads */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        multiple
      />

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">
            Start Photos ({currentJob.photos.start.length}/{minPhotosRequired}+)
            {hasEnoughStartPhotos && (
              <span className="text-green-500 ml-2">✓ Minimum photos met</span>
            )}
          </h3>
          {/* Always show upload buttons for start photos unless job is completed */}
          {currentJob.status !== "completed" && (
            <div className="flex gap-2">
              <Button 
                onClick={() => handlePhotoCapture("start", true)}
                disabled={uploadingPhotos}
                variant="outline"
              >
                <Camera className="h-4 w-4 mr-2" />
                Take Photo
              </Button>
              <Button 
                onClick={() => handleFileUpload("start")}
                disabled={uploadingPhotos}
                variant="outline"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Photo
              </Button>
              {canStartJob && (
                <Button 
                  onClick={() => simulateMultiplePhotos("start")}
                  disabled={uploadingPhotos || currentJob.status !== "pending"}
                >
                  {uploadingPhotos && photoType === "start" ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
                      Uploading...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Camera className="h-4 w-4" />
                      Upload {minPhotosRequired}+ Photos to Start Job
                    </span>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>

        {currentJob.photos.start.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {currentJob.photos.start.map((photo: string, index: number) => (
              <div key={`start-${index}`} className="aspect-square bg-muted rounded-md overflow-hidden relative group">
                <img 
                  src={photo} 
                  alt={`Start photo ${index + 1}`} 
                  className="w-full h-full object-cover"
                />
                {currentJob.status !== "completed" && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDeletePhoto("start", index)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No start photos uploaded yet</p>
        )}
      </div>

      <div className="space-y-4 mt-6 border-t pt-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">
            Completion Photos ({currentJob.photos.completion.length}/{minPhotosRequired}+)
            {hasEnoughCompletionPhotos && (
              <span className="text-green-500 ml-2">✓ Minimum photos met</span>
            )}
          </h3>
          {/* Always show upload buttons for completion photos if job is in progress or completed */}
          {(currentJob.status === "in-progress" || currentJob.status === "completed") && (
            <div className="flex gap-2">
              <Button 
                onClick={() => handlePhotoCapture("completion", true)}
                disabled={uploadingPhotos || currentJob.status === "completed"}
                variant="outline"
              >
                <Camera className="h-4 w-4 mr-2" />
                Take Photo
              </Button>
              <Button 
                onClick={() => handleFileUpload("completion")}
                disabled={uploadingPhotos || currentJob.status === "completed"}
                variant="outline"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Photo
              </Button>
              {canCompleteJob && currentJob.status === "in-progress" && (
                <Button 
                  onClick={() => simulateMultiplePhotos("completion")}
                  disabled={uploadingPhotos}
                >
                  {uploadingPhotos && photoType === "completion" ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
                      Uploading...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Camera className="h-4 w-4" />
                      Upload {minPhotosRequired}+ Photos for Completion
                    </span>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>

        {currentJob.photos.completion.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {currentJob.photos.completion.map((photo: string, index: number) => (
              <div key={`completion-${index}`} className="aspect-square bg-muted rounded-md overflow-hidden relative group">
                <img 
                  src={photo} 
                  alt={`Completion photo ${index + 1}`} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleDeletePhoto("completion", index)}
                    disabled={currentJob.status === "completed"}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No completion photos uploaded yet</p>
        )}
        
        {hasEnoughCompletionPhotos && currentJob.status === "in-progress" && (
          <div className="mt-4">
            <Button 
              onClick={() => setCompletionConfirmOpen(true)} 
              className="bg-green-500 hover:bg-green-600"
            >
              <Check className="h-4 w-4 mr-2" />
              Complete Job with These Photos
            </Button>
          </div>
        )}
      </div>

      {/* Delete Photo Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this photo? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPhotoToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletePhoto} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Job Completion Confirmation Dialog */}
      <AlertDialog open={completionConfirmOpen} onOpenChange={setCompletionConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Job?</AlertDialogTitle>
            <AlertDialogDescription>
              You have uploaded {currentJob.photos.completion.length} completion photos. 
              Would you like to mark this job as completed now, or do you want to add more photos first?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Add More Photos</AlertDialogCancel>
            <AlertDialogAction onClick={completeJob} className="bg-green-600 hover:bg-green-700">
              Complete Job
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
