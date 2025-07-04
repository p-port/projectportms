
import { supabase } from "@/integrations/supabase/client";

// Generate a unique job ID based on motorcycle make, model, and counter
export const generateUniqueJobId = (make: string, model: string, counter: number) => {
  // Extract first two letters of make and model, convert to uppercase
  const makePrefix = make.substring(0, 2).toUpperCase();
  const modelPrefix = model.substring(0, 2).toUpperCase();
  
  // Get current year and month
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  
  // Format counter with leading zeros
  const counterStr = String(counter).padStart(3, '0');
  
  // Combine to create a unique ID: MAKE-MODEL-YEAR-MONTH-COUNT
  return `${makePrefix}${modelPrefix}-${year}${month}-${counterStr}`;
};

// Get the appropriate color class for a job status badge
export const getStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-yellow-500 hover:bg-yellow-600";
    case "in-progress":
      return "bg-blue-500 hover:bg-blue-600";
    case "on-hold":
      return "bg-orange-500 hover:bg-orange-600";
    case "completed":
      return "bg-green-500 hover:bg-green-600";
    default:
      return "bg-gray-500 hover:bg-gray-600";
  }
};

// Update a job in localStorage and Supabase if the user is authenticated
export const updateJobInLocalStorage = async (job: any) => {
  try {
    // Get all jobs from localStorage
    const storedJobsString = localStorage.getItem('projectPortJobs');
    const jobs = storedJobsString ? JSON.parse(storedJobsString) : [];
    
    // Find and update the job
    const updatedJobs = jobs.map((j: any) => (j.id === job.id ? job : j));
    
    // Save back to localStorage
    localStorage.setItem('projectPortJobs', JSON.stringify(updatedJobs));
    console.log("Job updated in localStorage:", job);
    
    // Check if the user is authenticated
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      // Prepare notes object to include final cost if needed
      const notes = job.notes || {};
      if (job.finalCost) {
        notes.finalCost = job.finalCost;
      }
      
      // Sync job data to Supabase with the correct column names
      const { error } = await supabase.from('jobs').update({
        customer: job.customer,
        motorcycle: job.motorcycle,
        service_type: job.serviceType,
        status: job.status,
        date_completed: job.dateCompleted,
        notes: notes,
        photos: job.photos
      }).eq('job_id', job.id);
      
      if (error) {
        console.error("Error syncing job to Supabase:", error);
      } else {
        console.log("Job updated in Supabase:", job.id);
      }
    }
  } catch (err) {
    console.error("Error updating job:", err);
  }
};

// Delete a job from localStorage and Supabase if the user is authenticated
export const deleteJob = async (jobId: string): Promise<{ success: boolean; message: string }> => {
  try {
    // Get all jobs from localStorage
    const storedJobsString = localStorage.getItem('projectPortJobs');
    const jobs = storedJobsString ? JSON.parse(storedJobsString) : [];
    
    // Filter out the job to delete
    const updatedJobs = jobs.filter((j: any) => j.id !== jobId);
    
    // Save back to localStorage
    localStorage.setItem('projectPortJobs', JSON.stringify(updatedJobs));
    console.log("Job deleted from localStorage:", jobId);
    
    // Check if the user is authenticated
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      // Delete job from Supabase
      const { error } = await supabase.from('jobs').delete().eq('job_id', jobId);
      
      if (error) {
        console.error("Error deleting job from Supabase:", error);
        return { success: false, message: "Failed to delete job from database" };
      } else {
        console.log("Job deleted from Supabase:", jobId);
      }
    }
    
    return { success: true, message: "Job successfully deleted" };
  } catch (err) {
    console.error("Error deleting job:", err);
    return { success: false, message: "An error occurred while deleting the job" };
  }
};

// Capture a photo from camera or file upload
// This would typically use the device camera in a real app
// For demo purposes, we're using a simulated approach
export const capturePhoto = (
  onPhotoCapture: (dataUrl: string) => void,
  useCamera: boolean = true
) => {
  // In a real app, we would use the device camera API
  // For demo, we'll simulate photo capture with a placeholder
  if (useCamera) {
    // Simulate camera capture delay
    setTimeout(() => {
      // Generate a random placeholder or use a static image
      onPhotoCapture("/placeholder.svg");
    }, 1000);
  } else {
    // Simulate file selection
    // In a real app, we would open a file picker
    setTimeout(() => {
      onPhotoCapture("/placeholder.svg");
    }, 500);
  }
};

// Check if the job has all requirements to be completed
export const canCompleteJob = (job: any): { valid: boolean; message?: string } => {
  // Check if job has minimum number of completion photos
  const completionPhotos = job.photos?.completion || [];
  const minPhotosRequired = 3;
  
  if (completionPhotos.length < minPhotosRequired) {
    return { 
      valid: false, 
      message: `You need to upload at least ${minPhotosRequired} completion photos before marking this job as Complete` 
    };
  }
  
  // Check if job has a final cost set
  if (!job.finalCost) {
    return {
      valid: false,
      message: "You need to set a final cost before marking this job as Complete"
    };
  }
  
  return { valid: true };
};
