
  const loadJobData = async () => {
    if (!jobId) {
      setError("No job ID provided");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log("Looking up job with ID:", jobId);
      
      // First try to get job from Supabase
      const { data: supabaseJobs, error: supabaseError } = await supabase
        .from('jobs')
        .select('*')
        .eq('job_id', jobId);
      
      if (supabaseError) throw supabaseError;
      
      if (supabaseJobs && supabaseJobs.length > 0) {
        // Format the job from Supabase
        const supabaseJob = supabaseJobs[0];
        console.log("Found job in Supabase:", supabaseJob);
        
        // Extract initialCost and finalCost from the job data
        let initialCost = null;
        let finalCost = null;
        
        // Check if notes contains cost information
        if (supabaseJob.notes && typeof supabaseJob.notes === 'object') {
          if ('initialCost' in supabaseJob.notes) {
            initialCost = supabaseJob.notes.initialCost;
          }
          if ('finalCost' in supabaseJob.notes) {
            finalCost = supabaseJob.notes.finalCost;
          }
        }
        
        const formattedJob = {
          id: supabaseJob.job_id,
          customer: supabaseJob.customer,
          motorcycle: supabaseJob.motorcycle,
          serviceType: supabaseJob.service_type,
          status: supabaseJob.status,
          dateCreated: supabaseJob.date_created ? new Date(supabaseJob.date_created).toISOString().split('T')[0] : null,
          dateCompleted: supabaseJob.date_completed ? new Date(supabaseJob.date_completed).toISOString().split('T')[0] : null,
          notes: supabaseJob.notes || [],
          photos: supabaseJob.photos || { start: [], completion: [] },
          initialCost: initialCost || supabaseJob.initialCost, // Try both locations
          finalCost: finalCost || supabaseJob.finalCost // Try both locations
        };
        
        console.log("Formatted job with cost info:", formattedJob);
        setJob(formattedJob);
        setError(null);
        return;
      }
      
      // If not found in Supabase, try localStorage
      const storedJobsString = localStorage.getItem('projectPortJobs');
      const jobs = storedJobsString ? JSON.parse(storedJobsString) : [];
      
      console.log("Available jobs in localStorage:", jobs);
      
      // Try to find the job with exact match first
      let foundJob = jobs.find((job: any) => job.id === jobId);
      
      // If not found with exact match, try case-insensitive match
      if (!foundJob) {
        foundJob = jobs.find((job: any) => 
          job.id.toLowerCase() === jobId.toLowerCase()
        );
      }
      
      if (foundJob) {
        console.log("Found job in localStorage:", foundJob);
        setJob(foundJob);
        setError(null);
      } else {
        console.log("Job not found in localStorage or Supabase");
        setError(`No job found with ID: ${jobId}`);
      }
    } catch (err) {
      console.error("Error retrieving job:", err);
      setError("An error occurred while retrieving the job data");
    } finally {
      setLoading(false);
    }
  };
