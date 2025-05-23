import { useState, useEffect } from "react";
import { Tabs } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { supabase } from "@/integrations/supabase/client";
import { generateUniqueJobId } from "./job-details/JobUtils";
import { DashboardHeader } from "./features/DashboardHeader";
import { TabsNavigation } from "./features/TabsNavigation";
import { TabContent } from "./features/TabContent";
import { fetchUnreadTicketsCount, subscribeToTicketUpdates } from "./services/UnreadTicketsService";
import { toast } from "sonner";

interface DashboardProps {
  user: any;
}

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
    tickets: "Tickets",
    account: "Account",
    shops: "Shops",
    users: "Users",
    loading: "Loading jobs...",
    error: "Error loading jobs",
    retry: "Retry",
    noActiveJobs: "No active jobs found",
    createNewJob: "Create a new job to get started",
    noCompletedJobs: "No completed jobs found",
    completedJobsAppear: "Completed jobs will appear here",
    jobSynced: "Job synced to cloud storage",
    jobSyncError: "Failed to sync job to cloud"
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
    tickets: "티켓",
    account: "계정",
    shops: "샵",
    users: "사용자",
    loading: "작업 로딩 중...",
    error: "작업을 불러오는 중 오류가 발생했습니다",
    retry: "재시도",
    noActiveJobs: "활성 작업을 찾을 수 없습니다",
    createNewJob: "시작하려면 새 작업을 생성하세요",
    noCompletedJobs: "완료된 작업을 찾을 수 없습니다", 
    completedJobsAppear: "완료된 작업이 여기에 표시됩니다",
    jobSynced: "작업이 클라우드 스토리지에 동기화되었습니다",
    jobSyncError: "작업을 클라우드에 동기화하지 못했습니다"
  },
  ru: {
    dashboard: "Панель управления",
    welcome: "С возвращением",
    searchPlaceholder: "Поиск заказов по ID, имени клиента или мотоциклу...",
    activeJobs: "Активные заказы",
    completed: "Завершенные",
    newJob: "Новый заказ",
    customers: "Клиенты",
    support: "Поддержка",
    tickets: "Тикеты",
    account: "Аккаунт",
    shops: "Магазины",
    users: "Пользователи",
    loading: "Загрузка заказов...",
    error: "Ошибка при загрузке заказов",
    retry: "Повторить",
    noActiveJobs: "Активных заказов не найдено",
    createNewJob: "Создайте новый заказ, чтобы начать",
    noCompletedJobs: "Завершенных заказов не найдено",
    completedJobsAppear: "Завершенные заказы будут отображаться здесь",
    jobSynced: "Заказ синхронизирован с облачным хранилищем",
    jobSyncError: "Не удалось синхронизировать заказ с облаком"
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
  const [userRole, setUserRole] = useState<string>('mechanic');
  
  // Add unread tickets count
  const [unreadTickets, setUnreadTickets] = useState(0);
  
  // Load user role
  useEffect(() => {
    if (!user?.id) return;
    
    const fetchUserRole = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (!error && data) {
        setUserRole(data.role);
      }
    };
    
    fetchUserRole();
  }, [user?.id]);
  
  // Load unread tickets count
  useEffect(() => {
    if (!user?.id) return;
    
    const loadUnreadTicketsCount = async () => {
      const count = await fetchUnreadTicketsCount(user.id, userRole);
      setUnreadTickets(count);
    };
    
    loadUnreadTicketsCount();
    
    // Subscribe to ticket updates
    const channel = subscribeToTicketUpdates(
      user.id,
      userRole,
      // On new ticket or message
      () => setUnreadTickets(prev => prev + 1),
      // On ticket read
      () => setUnreadTickets(prev => Math.max(0, prev - 1))
    );
      
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [user?.id, userRole]);

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
              photos: job.photos || { start: [], completion: [] },
              // Handle shop_id safely, using optional chaining and type assertion
              shopId: (job as any).shop_id || null
            }));
            
            setJobs(formattedJobs);
            
            // Also update localStorage for offline access
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
            toast.success(t.jobSynced);
          }
        } else {
          // No jobs in localStorage either - no sample jobs needed anymore since we have Supabase
          setJobs([]);
          localStorage.setItem('projectPortJobs', JSON.stringify([]));
        }
      } catch (err) {
        console.error("Error loading jobs:", err);
        setError(true);
        
        // Attempt to fall back to localStorage
        const storedJobsString = localStorage.getItem('projectPortJobs');
        if (storedJobsString) {
          setJobs(JSON.parse(storedJobsString));
        } else {
          setJobs([]);
          localStorage.setItem('projectPortJobs', JSON.stringify([]));
        }
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
  }, [user?.id, t.jobSynced]);

  // Sync jobs to Supabase
  const syncJobsToSupabase = async (jobsToSync: any[], userId: string) => {
    try {
      // Get user's shop ID using type assertion to avoid TypeScript errors 
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      // Safely access shop_id using type assertion
      const shopId = (profileData as any)?.shop_id || null;

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
          user_id: userId,
          shop_id: shopId
        });
      }
    } catch (error) {
      console.error("Error syncing jobs to Supabase:", error);
      toast.error(t.jobSyncError);
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
        // Get user's shop ID with type assertion
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        // Safely access shop_id using type assertion
        const shopId = (profileData as any)?.shop_id || null;
        
        const { error } = await supabase.from('jobs').insert({
          job_id: newJob.id,
          customer: newJob.customer,
          motorcycle: newJob.motorcycle,
          service_type: newJob.serviceType,
          status: newJob.status,
          date_created: newJob.dateCreated,
          notes: newJob.notes,
          photos: newJob.photos,
          user_id: user.id,
          shop_id: shopId
        });
        
        if (error) throw error;
        toast.success(t.jobSynced);
      } catch (error) {
        console.error("Error adding job to Supabase:", error);
        toast.error(t.jobSyncError);
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
        userId={user?.id}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsNavigation
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isMobile={isMobile}
          activeJobs={activeJobs.length}
          completedJobs={completedJobs.length}
          unreadTickets={unreadTickets}
          translations={t}
          userRole={userRole}
        />

        <TabContent
          activeJobs={activeJobs}
          completedJobs={completedJobs}
          allJobs={jobs}
          setJobs={setJobs}
          handleAddJob={handleAddJob}
          userId={user?.id}
          userRole={userRole}
          translations={t}
        />
      </Tabs>
    </div>
  );
};
