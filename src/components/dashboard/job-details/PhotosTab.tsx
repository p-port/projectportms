
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Check, Upload } from "lucide-react";
import { toast } from "sonner";
import { capturePhoto, updateJobInLocalStorage } from "./JobUtils";

interface PhotosTabProps {
  currentJob: any;
  onUpdateJob: (updatedJob: any) => void;
  updateJobInLocalStorage: (job: any) => void;
}

export const PhotosTab = ({ currentJob, onUpdateJob, updateJobInLocalStorage }: PhotosTabProps) => {
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [photoType, setPhotoType] = useState<"start" | "completion">("start");

  const canStartJob = currentJob.status === "pending" && currentJob.photos.start.length === 0;
  const canCompleteJob = 
    currentJob.status === "in-progress" && 
    currentJob.photos.start.length > 0 && 
    currentJob.photos.completion.length === 0;

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
      
      // If this is start photos, also change status to in-progress
      if (type === "start" && currentJob.status === "pending") {
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
      }
      
      // If this is completion photos and we have enough photos, offer to change status to completed
      if (type === "completion" && updatedPhotos.completion.length >= 2) {
        updatedJob = {
          ...updatedJob,
          status: "completed",
          dateCompleted: new Date().toISOString().split("T")[0],
          notes: [
            ...updatedJob.notes,
            {
              text: "Job completed - final photos uploaded",
              timestamp: new Date().toISOString()
            }
          ]
        };
      }
      
      // Update job in state and localStorage
      onUpdateJob(updatedJob);
      updateJobInLocalStorage(updatedJob);
      
      setUploadingPhotos(false);
      toast.success(`Photo captured and uploaded successfully`);
    }, useCamera);
  };

  // Simulate multiple photo uploads for demo purposes
  const simulateMultiplePhotos = (type: "start" | "completion") => {
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
      
      onUpdateJob(updatedJob);
      updateJobInLocalStorage(updatedJob);
      
      setUploadingPhotos(false);
      toast.success(`${photoCount} photos uploaded successfully`);
    }, 1500);
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Start Photos ({currentJob.photos.start.length}/6)</h3>
          {canStartJob && (
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
                onClick={() => handlePhotoCapture("start", false)}
                disabled={uploadingPhotos}
                variant="outline"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Photo
              </Button>
              <Button 
                onClick={() => simulateMultiplePhotos("start")}
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
                    Upload All Photos to Start Job
                  </span>
                )}
              </Button>
            </div>
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
            <div className="flex gap-2">
              <Button 
                onClick={() => handlePhotoCapture("completion", true)}
                disabled={uploadingPhotos}
                variant="outline"
              >
                <Camera className="h-4 w-4 mr-2" />
                Take Photo
              </Button>
              <Button 
                onClick={() => handlePhotoCapture("completion", false)}
                disabled={uploadingPhotos}
                variant="outline"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Photo
              </Button>
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
                    <Check className="h-4 w-4" />
                    Upload All Photos to Complete Job
                  </span>
                )}
              </Button>
            </div>
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
    </div>
  );
};
