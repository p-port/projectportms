
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

interface JobData {
  id: string;
  customer: {
    name: string;
    phone: string;
    email: string;
  };
  motorcycle: {
    make: string;
    model: string;
    year: string;
    vin: string;
  };
  serviceType: string;
  status: string;
  dateCreated: string | null;
  dateCompleted: string | null;
  notes: any[];
  photos: {
    start: string[];
    completion: string[];
  };
  initialCost: number | null;
  finalCost: number | null;
}

const TrackJob = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    loadJobData();
  }, [jobId]);

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p>Loading job information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
          <CardFooter>
            <Link to="/">
              <Button>Back to Home</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Job Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Sorry, we couldn't find any job with the provided ID.</p>
          </CardContent>
          <CardFooter>
            <Link to="/">
              <Button>Back to Home</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Job Tracking: {job.id}</CardTitle>
            <Link to="/">
              <Button variant="outline" size="sm">Back to Home</Button>
            </Link>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Status Section */}
          <div className="bg-muted p-4 rounded-md">
            <h3 className="text-lg font-semibold mb-2">Status: {job.status}</h3>
            <p className="text-sm text-muted-foreground">
              {job.status === 'pending' && 'Your motorcycle is in the queue and waiting to be serviced.'}
              {job.status === 'in_progress' && 'Our mechanics are currently working on your motorcycle.'}
              {job.status === 'completed' && 'Your service has been completed! You can pick up your motorcycle.'}
            </p>
            
            {/* Cost Information */}
            <div className="mt-4 space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Initial Cost:</span>
                <span>{formatCurrency(job.initialCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Final Cost:</span>
                <span>{formatCurrency(job.finalCost)}</span>
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* Customer Info */}
          <div>
            <h3 className="font-semibold mb-2">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Name</p>
                <p>{job.customer.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Phone</p>
                <p>{job.customer.phone}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p>{job.customer.email}</p>
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* Motorcycle Info */}
          <div>
            <h3 className="font-semibold mb-2">Motorcycle Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Make</p>
                <p>{job.motorcycle.make}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Model</p>
                <p>{job.motorcycle.model}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Year</p>
                <p>{job.motorcycle.year}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">VIN</p>
                <p>{job.motorcycle.vin}</p>
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* Service Info */}
          <div>
            <h3 className="font-semibold mb-2">Service Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Service Type</p>
                <p>{job.serviceType}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Date Created</p>
                <p>{job.dateCreated || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Date Completed</p>
                <p>{job.dateCompleted || 'Not completed yet'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrackJob;
