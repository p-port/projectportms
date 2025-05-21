
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
