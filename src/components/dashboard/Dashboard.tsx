import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { JobList } from "./JobList";
import { NewJobForm } from "./NewJobForm";
import { SearchCustomers } from "./SearchCustomers";
import { Search, User, MessageSquare } from "lucide-react";
import { generateUniqueJobId } from "./job-details/JobUtils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { supabase } from "@/integrations/supabase/client";
import { MessageList } from "./messaging/MessageList";
import { AccountInfo } from "./account/AccountInfo";

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
      try {
        if (!user?.id) return;
        
        const { count, error } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('recipient_id', user.id)
          .eq('is_read', false);
          
        if (error) throw error;
        setUnreadMessages(count || 0);
      } catch (error) {
        console.error('Error loading unread messages count:', error);
      }
    };
    
    loadUnreadMessagesCount();
    
    // Subscribe to new messages
    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          if (payload.new.recipient_id === user?.id) {
            setUnreadMessages(prev => prev + 1);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        (payload) => {
          if (payload.new.recipient_id === user?.id && 
              !payload.new.is_read && payload.old.is_read) {
            setUnreadMessages(prev => prev + 1);
          }
          
          if (payload.new.recipient_id === user?.id && 
              payload.new.is_read && !payload.old.is_read) {
            setUnreadMessages(prev => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h2 className="text-2xl sm:text-3xl font-bold">{t.dashboard}</h2>
        <p className="text-muted-foreground">{t.welcome}, {user?.name || "Mechanic"}</p>
      </div>

      <div className="flex w-full items-center space-x-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t.searchPlaceholder}
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={`grid w-full ${isMobile ? "grid-cols-2" : "grid-cols-6"}`}>
          <TabsTrigger value="active-jobs">{t.activeJobs} ({activeJobs.length})</TabsTrigger>
          <TabsTrigger value="completed-jobs">{t.completed} ({completedJobs.length})</TabsTrigger>
          {isMobile ? null : <TabsTrigger value="new-job">{t.newJob}</TabsTrigger>}
          {isMobile ? null : <TabsTrigger value="customers">{t.customers}</TabsTrigger>}
          {isMobile ? null : (
            <TabsTrigger value="messages" className="relative">
              Messages
              {unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadMessages}
                </span>
              )}
            </TabsTrigger>
          )}
          {isMobile ? null : <TabsTrigger value="account">Account</TabsTrigger>}
        </TabsList>

        {isMobile && (
          <div className="grid grid-cols-2 gap-2 mt-2 mb-2">
            <Button 
              variant="outline" 
              className={activeTab === "new-job" ? "bg-muted" : ""} 
              onClick={() => setActiveTab("new-job")}
            >
              {t.newJob}
            </Button>
            <Button 
              variant="outline" 
              className={activeTab === "customers" ? "bg-muted" : ""} 
              onClick={() => setActiveTab("customers")}
            >
              {t.customers}
            </Button>
          </div>
        )}

        {isMobile && (
          <div className="grid grid-cols-2 gap-2 mb-2">
            <Button 
              variant="outline" 
              className={activeTab === "messages" ? "bg-muted" : ""} 
              onClick={() => setActiveTab("messages")}
            >
              <MessageSquare className="mr-1 h-4 w-4" />
              Messages
              {unreadMessages > 0 && (
                <span className="ml-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadMessages}
                </span>
              )}
            </Button>
            <Button 
              variant="outline" 
              className={activeTab === "account" ? "bg-muted" : ""} 
              onClick={() => setActiveTab("account")}
            >
              <User className="mr-1 h-4 w-4" />
              Account
            </Button>
          </div>
        )}

        <TabsContent value="active-jobs">
          <JobList jobs={activeJobs} type="active" setJobs={setJobs} allJobs={jobs} />
        </TabsContent>

        <TabsContent value="completed-jobs">
          <JobList jobs={completedJobs} type="completed" setJobs={setJobs} allJobs={jobs} />
        </TabsContent>

        <TabsContent value="new-job">
          <NewJobForm onSubmit={handleAddJob} />
        </TabsContent>

        <TabsContent value="customers">
          <SearchCustomers jobs={jobs} />
        </TabsContent>
        
        <TabsContent value="messages">
          <MessageList />
        </TabsContent>
        
        <TabsContent value="account">
          <AccountInfo userId={user?.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
