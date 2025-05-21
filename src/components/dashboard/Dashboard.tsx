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
    customers: "Customers"
  },
  ko: {
    dashboard: "대시보드",
    welcome: "다시 환영합니다",
    searchPlaceholder: "작업 ID, 고객 이름 또는 오토바이로 검색...",
    activeJobs: "활성 작업",
    completed: "완료됨",
    newJob: "새 작업",
    customers: "고객"
  }
};

export const Dashboard = ({ user }: DashboardProps) => {
  const [activeTab, setActiveTab] = useState("active-jobs");
  const [jobs, setJobs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const isMobile = useIsMobile();
  const [language] = useLocalStorage("language", "en");
  const t = translations[language as keyof typeof translations];
  
  // Add unread messages count
  const [unreadMessages, setUnreadMessages] = useState(0);
  
  // Load unread messages count
  useEffect(() => {
    const loadUnreadMessagesCount = async () => {
      const count = await fetchUnreadMessagesCount(user?.id);
      setUnreadMessages(count);
    };
    
    loadUnreadMessagesCount();
    
    // Subscribe to message updates
    const channel = subscribeToMessageUpdates(
      user?.id,
      // On new message
      () => setUnreadMessages(prev => prev + 1),
      // On message read
      () => setUnreadMessages(prev => Math.max(0, prev - 1))
    );
      
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Load jobs from localStorage or use sample data on first load
  useEffect(() => {
    const storedJobsString = localStorage.getItem('projectPortJobs');
    if (storedJobsString) {
      const storedJobs = JSON.parse(storedJobsString);
      setJobs(storedJobs);
    } else {
      setJobs(SAMPLE_JOBS);
      // Store the sample jobs in localStorage
      localStorage.setItem('projectPortJobs', JSON.stringify(SAMPLE_JOBS));
    }
  }, []);

  // Update localStorage whenever jobs change
  useEffect(() => {
    if (jobs.length > 0) {
      localStorage.setItem('projectPortJobs', JSON.stringify(jobs));
      console.log("Jobs updated in localStorage:", jobs);
    }
  }, [jobs]);

  const handleAddJob = (jobData: any) => {
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
