
/**
 * Updates a job in localStorage
 * @param updatedJob The job to update in localStorage
 */
export const updateJobInLocalStorage = (updatedJob: any) => {
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

/**
 * Returns the appropriate status color for job status badges
 * @param status The job status string
 * @returns CSS class string for status styling
 */
export const getStatusColor = (status: string) => {
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

/**
 * Generates a unique job ID based on motorcycle details and current date
 * @param motorcycleMake Make of the motorcycle
 * @param motorcycleModel Model of the motorcycle
 * @param jobCount Current job count for sequence
 * @returns Unique job ID string
 */
export const generateUniqueJobId = (motorcycleMake: string, motorcycleModel: string, jobCount: number) => {
  // Get current date info
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  
  // Create abbreviations from make and model
  const makeAbbr = motorcycleMake.substring(0, 2).toUpperCase();
  const modelAbbr = motorcycleModel.substring(0, 2).toUpperCase();
  
  // Generate sequence number
  const sequence = String(jobCount).padStart(3, '0');
  
  // Create unique job ID
  return `${makeAbbr}${modelAbbr}-${year}${month}-${sequence}`;
};

/**
 * Captures a photo using device camera or file upload
 * @param callback Function to call with the captured photo data
 * @param useCamera Whether to use camera (true) or file upload (false)
 */
export const capturePhoto = (callback: (photoDataUrl: string) => void, useCamera: boolean = true) => {
  if (useCamera && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    // Create video and canvas elements for camera capture
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const stream = document.createElement('div');
    const captureBtn = document.createElement('button');
    const closeBtn = document.createElement('button');
    
    // Style the stream container
    stream.style.position = 'fixed';
    stream.style.top = '0';
    stream.style.left = '0';
    stream.style.width = '100%';
    stream.style.height = '100%';
    stream.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    stream.style.zIndex = '9999';
    stream.style.display = 'flex';
    stream.style.flexDirection = 'column';
    stream.style.alignItems = 'center';
    stream.style.justifyContent = 'center';
    
    // Add video element to stream container
    video.style.maxWidth = '100%';
    video.style.maxHeight = '80%';
    video.style.transform = 'scaleX(-1)'; // Mirror effect
    stream.appendChild(video);
    
    // Add capture button
    captureBtn.innerText = 'Capture Photo';
    captureBtn.style.padding = '10px 20px';
    captureBtn.style.margin = '10px';
    captureBtn.style.backgroundColor = '#3b82f6';
    captureBtn.style.color = 'white';
    captureBtn.style.border = 'none';
    captureBtn.style.borderRadius = '5px';
    captureBtn.style.cursor = 'pointer';
    stream.appendChild(captureBtn);
    
    // Add close button
    closeBtn.innerText = 'Cancel';
    closeBtn.style.padding = '10px 20px';
    closeBtn.style.margin = '10px';
    closeBtn.style.backgroundColor = '#6b7280';
    closeBtn.style.color = 'white';
    closeBtn.style.border = 'none';
    closeBtn.style.borderRadius = '5px';
    closeBtn.style.cursor = 'pointer';
    stream.appendChild(closeBtn);
    
    // Add stream container to document body
    document.body.appendChild(stream);
    
    // Access user's camera
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((mediaStream) => {
        video.srcObject = mediaStream;
        video.play();
        
        // Handle capture button click
        captureBtn.addEventListener('click', () => {
          // Set canvas dimensions to match video
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          // Draw current video frame to canvas
          const context = canvas.getContext('2d');
          if (context) {
            // Flip horizontally for mirror effect if needed
            context.translate(canvas.width, 0);
            context.scale(-1, 1);
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
          }
          
          // Convert canvas to data URL
          const photoDataUrl = canvas.toDataURL('image/jpeg');
          
          // Clean up
          const tracks = mediaStream.getTracks();
          tracks.forEach(track => track.stop());
          document.body.removeChild(stream);
          
          // Call callback with photo data
          callback(photoDataUrl);
        });
        
        // Handle close button click
        closeBtn.addEventListener('click', () => {
          // Clean up
          const tracks = mediaStream.getTracks();
          tracks.forEach(track => track.stop());
          document.body.removeChild(stream);
        });
      })
      .catch((err) => {
        console.error("Error accessing camera:", err);
        document.body.removeChild(stream);
        // Fall back to file upload
        createFileInput(callback);
      });
  } else {
    // Use file upload if camera not available or not requested
    createFileInput(callback);
  }
};

/**
 * Creates a file input for photo upload
 * @param callback Function to call with the uploaded photo data
 */
const createFileInput = (callback: (photoDataUrl: string) => void) => {
  // Create file input element
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.style.display = 'none';
  document.body.appendChild(fileInput);
  
  // Trigger file input click
  fileInput.click();
  
  // Handle file selection
  fileInput.addEventListener('change', (e) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const photoDataUrl = event.target?.result as string;
        callback(photoDataUrl);
      };
      reader.readAsDataURL(file);
    }
    
    // Clean up
    document.body.removeChild(fileInput);
  });
  
  // Clean up if no file selected
  fileInput.addEventListener('cancel', () => {
    document.body.removeChild(fileInput);
  });
};
