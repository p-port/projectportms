
import { useState, useEffect } from "react";
import { Tabs } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { supabase } from "@/integrations/supabase/client";
import { generateUniqueJobId } from "./job-details/JobUtils";
import { DashboardHeader } from "./features/DashboardHeader";
import { TabsNavigation } from "./features/TabsNavigation";
import { TabContent } from "./features/TabContent";
import { fetchUnreadMessagesCount, subscribeToMessageUpdates } from "./services/UnreadMessagesService";
import { toast } from "sonner";

interface DashboardProps {
  user: any;
}

// Sample jobs data
const SAMPLE_JOBS = [
  {
    id: "HOCB-202305-001",
    customer: {
      name: "Michael Johnson",
      phone: "555-123-4567",
      email: "michael@example.com"
    },
    motorcycle: {
      make: "Honda",
      model: "CBR600RR",
      year: "2020",
      vin: "1HGCM82633A123456"
    },
    serviceType: "Oil Change & Tune-up",
    status: "in-progress",
    dateCreated: "2023-05-18",
    notes: [
      { text: "Initial inspection completed", timestamp: "2023-05-18T10:30:00" },
      { text: "Parts ordered", timestamp: "2023-05-18T14:15:00" }
    ],
    photos: {
      start: ["/placeholder.svg", "/placeholder.svg", "/placeholder.svg"],
      completion: []
    }
  },
  {
    id: "KANI-202305-002",
    customer: {
      name: "Sarah Williams",
      phone: "555-987-6543",
      email: "sarah@example.com"
    },
    motorcycle: {
      make: "Kawasaki",
      model: "Ninja 650",
      year: "2021",
      vin: "JKAZXCE17MA012345"
    },
    serviceType: "Brake replacement",
    status: "completed",
    dateCreated: "2023-05-15",
    dateCompleted: "2023-05-17",
    notes: [
      { text: "Front and rear brake pads replaced", timestamp: "2023-05-15T11:00:00" },
      { text: "Brake fluid flushed and replaced", timestamp: "2023-05-16T09:45:00" },
      { text: "Final inspection completed", timestamp: "2023-05-17T14:30:00" }
    ],
    photos: {
      start: ["/placeholder.svg", "/placeholder.svg", "/placeholder.svg"],
      completion: ["/placeholder.svg", "/placeholder.svg", "/placeholder.svg"]
    }
  },
  {
    id: "YAMT-202305-003",
    customer: {
      name: "David Thompson",
      phone: "555-456-7890",
      email: "david@example.com"
    },
    motorcycle: {
      make: "Yamaha",
      model: "MT-09",
      year: "2022",
      vin: "JYARN23E9NA001234"
    },
    serviceType: "Chain replacement & adjustment",
    status: "pending",
    dateCreated: "2023-05-19",
    notes: [],
    photos: {
      start: [],
      completion: []
    }
  }
];

// Dashboard translations
const translations = {
  en: {
    dashboard: "Dashboard",
    welcome: "Welcome back",
    searchPlaceholder: "Search jobs by ID, customer name, or motorcycle...",
    activeJobs: "Active Jobs",
    completed: "Completed",
    newJob: "New Job",
    customers: "Customers",
    support: "Support",
    messages: "Messages",
    account: "Account",
    loading: "Loading jobs...",
    error: "Error loading jobs",
    retry: "Retry"
  },
  ko: {
    dashboard: "대시보드",
    welcome: "다시 환영합니다",
    searchPlaceholder: "작업 ID, 고객 이름 또는 오토바이로 검색...",
    activeJobs: "활성 작업",
    completed: "완료됨",
    newJob: "새 작업",
    customers: "고객",
    support: "지원",
    messages: "메시지",
    account: "계정",
    loading: "작업 로딩 중...",
    error: "작업을 불러오는 중 오류가 발생했습니다",
    retry: "재시도"
  }
};

export const Dashboard = ({ user }: DashboardProps) => {
  const [activeTab, setActiveTab] = useState("active-jobs");
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const isMobile = useIsMobile();
  const [language] = useLocalStorage("language", "en");
  const t = translations[language as keyof typeof translations];
  
  // Add unread messages count
  const [unreadMessages, setUnreadMessages] = useState(0);
  
  // Load unread messages count
  useEffect(() => {
    if (!user?.id) return;
    
    const loadUnreadMessagesCount = async () => {
      const count = await fetchUnreadMessagesCount(user.id);
      setUnreadMessages(count);
    };
    
    loadUnreadMessagesCount();
    
    // Subscribe to message updates
    const channel = subscribeToMessageUpdates(
      user.id,
      // On new message
      () => setUnreadMessages(prev => prev + 1),
      // On message read
      () => setUnreadMessages(prev => Math.max(0, prev - 1))
    );
      
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Load jobs from Supabase if user is authenticated, otherwise use localStorage
  useEffect(() => {
    const loadJobs = async () => {
      setLoading(true);
      setError(false);
      
      try {
        if (user?.id) {
          // Try to load jobs from Supabase
          const { data: supabaseJobs, error } = await supabase
            .from('jobs')
            .select('*')
            .order('date_created', { ascending: false });
            
          if (error) throw error;
          
          if (supabaseJobs && supabaseJobs.length > 0) {
            // Transform Supabase jobs to match our app's format
            const formattedJobs = supabaseJobs.map(job => ({
              id: job.job_id,
              customer: job.customer,
              motorcycle: job.motorcycle,
              serviceType: job.service_type,
              status: job.status,
              dateCreated: job.date_created ? new Date(job.date_created).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              dateCompleted: job.date_completed ? new Date(job.date_completed).toISOString().split('T')[0] : null,
              notes: job.notes || [],
              photos: job.photos || { start: [], completion: [] }
            }));
            
            setJobs(formattedJobs);
            
            // Also update localStorage
            localStorage.setItem('projectPortJobs', JSON.stringify(formattedJobs));
            return;
          }
        }
        
        // If no user or no jobs in Supabase, fall back to localStorage
        const storedJobsString = localStorage.getItem('projectPortJobs');
        if (storedJobsString) {
          const storedJobs = JSON.parse(storedJobsString);
          setJobs(storedJobs);
          
          // If user is authenticated, sync to Supabase
          if (user?.id) {
            syncJobsToSupabase(storedJobs, user.id);
          }
        } else {
          // No jobs in localStorage either, use samples
          setJobs(SAMPLE_JOBS);
          localStorage.setItem('projectPortJobs', JSON.stringify(SAMPLE_JOBS));
          
          // If user is authenticated, sync to Supabase
          if (user?.id) {
            syncJobsToSupabase(SAMPLE_JOBS, user.id);
          }
        }
      } catch (err) {
        console.error("Error loading jobs:", err);
        setError(true);
        
        // Attempt to fall back to localStorage
        const storedJobsString = localStorage.getItem('projectPortJobs');
        if (storedJobsString) {
          setJobs(JSON.parse(storedJobsString));
        } else {
          setJobs(SAMPLE_JOBS);
          localStorage.setItem('projectPortJobs', JSON.stringify(SAMPLE_JOBS));
        }
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
  }, [user?.id]);

  // Sync jobs to Supabase
  const syncJobsToSupabase = async (jobsToSync: any[], userId: string) => {
    try {
      for (const job of jobsToSync) {
        await supabase.from('jobs').upsert({
          job_id: job.id,
          customer: job.customer,
          motorcycle: job.motorcycle, 
          service_type: job.serviceType,
          status: job.status,
          date_created: job.dateCreated,
          date_completed: job.dateCompleted,
          notes: job.notes,
          photos: job.photos,
          user_id: userId
        });
      }
    } catch (error) {
      console.error("Error syncing jobs to Supabase:", error);
    }
  };

  const handleAddJob = async (jobData: any) => {
    // Generate a unique job ID based on motorcycle details
    const newJobId = generateUniqueJobId(
      jobData.motorcycle.make,
      jobData.motorcycle.model,
      jobs.length + 1
    );
    
    const newJob = {
      ...jobData,
      id: newJobId,
      dateCreated: new Date().toISOString().split('T')[0],
      status: "pending",
      notes: [],
      photos: {
        start: [],
        completion: []
      }
    };
    
    const updatedJobs = [newJob, ...jobs];
    setJobs(updatedJobs);
    localStorage.setItem('projectPortJobs', JSON.stringify(updatedJobs));
    
    // If user is authenticated, sync to Supabase
    if (user?.id) {
      try {
        const { error } = await supabase.from('jobs').insert({
          job_id: newJob.id,
          customer: newJob.customer,
          motorcycle: newJob.motorcycle,
          service_type: newJob.serviceType,
          status: newJob.status,
          date_created: newJob.dateCreated,
          notes: newJob.notes,
          photos: newJob.photos,
          user_id: user.id
        });
        
        if (error) throw error;
      } catch (error) {
        console.error("Error adding job to Supabase:", error);
        toast.error("Failed to save job to cloud");
      }
    }
    
    setActiveTab("active-jobs");
  };

  const filteredJobs = searchQuery 
    ? jobs.filter(job => 
        job.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.motorcycle.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.motorcycle.model.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : jobs;

  const activeJobs = filteredJobs.filter(job => job.status !== "completed");
  const completedJobs = filteredJobs.filter(job => job.status === "completed");

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p>{t.loading}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center space-y-4">
          <p className="text-destructive">{t.error}</p>
          <Button onClick={() => window.location.reload()}>{t.retry}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        userName={user?.name}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        translations={t}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsNavigation
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isMobile={isMobile}
          activeJobs={activeJobs.length}
          completedJobs={completedJobs.length}
          unreadMessages={unreadMessages}
          translations={t}
        />

        <TabContent
          activeJobs={activeJobs}
          completedJobs={completedJobs}
          allJobs={jobs}
          setJobs={setJobs}
          handleAddJob={handleAddJob}
          userId={user?.id}
        />
      </Tabs>
    </div>
  );
};
