import { useState, useEffect } from "react";
import { Tabs } from "@/components/ui/tabs";
import { useNavigate, useSearchParams } from "react-router-dom";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { SupportChat } from "@/components/SupportChat";
import { Layout } from "@/components/layout/Layout";
import { DashboardHeader } from "@/components/dashboard/features/DashboardHeader";
import { TabsNavigation } from "@/components/dashboard/features/TabsNavigation";
import { TabContent } from "@/components/dashboard/features/TabContent";
import { NotificationCenter } from "@/components/dashboard/notifications/NotificationCenter";
import { fetchUnreadTickets } from "@/components/dashboard/services/UnreadTicketsService";
import { fetchUnreadMessagesCount } from "@/components/dashboard/services/UnreadMessagesService";
import { getUserShopInfo } from "@/integrations/supabase/client";

// Translations
const translations = {
  en: {
    dashboard: "Dashboard",
    welcome: "Welcome",
    activeJobs: "Active Jobs",
    completed: "Completed",
    newJob: "New Job",
    tickets: "Support",
    account: "Account",
    search: "Search"
  },
  ko: {
    dashboard: "대시보드",
    welcome: "환영합니다",
    activeJobs: "진행 중",
    completed: "완료됨",
    newJob: "새 작업",
    tickets: "지원",
    account: "계정",
    search: "검색"
  },
  ru: {
    dashboard: "Панель",
    welcome: "Добро пожаловать",
    activeJobs: "Активные",
    completed: "Завершенные",
    newJob: "Новая работа",
    tickets: "Поддержка",
    account: "Аккаунт",
    search: "Поиск"
  }
};

export const Dashboard = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [language] = useLocalStorage("language", "en");
  const isMobile = useIsMobile();
  const [jobs, setJobs] = useState([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState("mechanic"); // Default role
  const [activeTab, setActiveTab] = useState("active-jobs");
  const [unreadTickets, setUnreadTickets] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [username, setUsername] = useState("");
  const [isShopOwner, setIsShopOwner] = useState(false);
  
  const t = translations[language as keyof typeof translations];

  // Set tab based on URL param if provided
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Check if the user is authenticated
  useEffect(() => {
    checkUser();
    
    // Subscribe to auth changes
    const authListener = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        navigate("/auth");
      } else if (event === "SIGNED_IN" && session) {
        setUserId(session.user.id);
      }
    });
    
    // Cleanup subscription
    return () => {
      authListener.data.subscription.unsubscribe();
    };
  }, []);

  // Fetch user data including role
  useEffect(() => {
    if (userId) {
      getUserInfo();
      checkIfShopOwner();
      loadJobs();
      loadUnreadTickets();
      loadUnreadMessages();
    }
  }, [userId]);

  const checkUser = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      
      if (!data.session) {
        navigate("/auth");
        return;
      }
      
      setUserId(data.session.user.id);
    } catch (error) {
      console.error("Error checking authentication:", error);
      navigate("/auth");
    }
  };
  
  const getUserInfo = async () => {
    if (!userId) return;
    
    try {
      // Get user role
      const { data: roleData, error: roleError } = await supabase.rpc("get_user_role");
      
      if (!roleError && roleData) {
        setUserRole(roleData);
      }
      
      // Get user profile
      const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
        
      if (!userError && userData) {
        setUsername(userData.name || "");
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
    }
  };

  const checkIfShopOwner = async () => {
    if (!userId) return;
    
    try {
      const userShopInfo = await getUserShopInfo();
      
      if (userShopInfo && userShopInfo.shop) {
        setIsShopOwner(userShopInfo.shop.owner_id === userId);
      }
    } catch (error) {
      console.error("Error checking shop owner status:", error);
    }
  };

  const loadJobs = async () => {
    try {
      // Fetch jobs from your database
      const { data, error } = await supabase
        .from("jobs")
        .select()
        .order("date_created", { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        setJobs(data);
      }
    } catch (error) {
      console.error("Error loading jobs:", error);
    }
  };

  const loadUnreadTickets = async () => {
    if (!userId) return;
    
    try {
      const count = await fetchUnreadTickets(userRole, userId);
      setUnreadTickets(count);
    } catch (error) {
      console.error("Error loading unread tickets:", error);
    }
  };

  const loadUnreadMessages = async () => {
    if (!userId) return;
    
    try {
      const count = await fetchUnreadMessagesCount(userId);
      setUnreadMessages(count);
    } catch (error) {
      console.error("Error loading unread messages:", error);
    }
  };

  const handleAddJob = (job: any) => {
    setJobs([job, ...jobs]);
    setActiveTab("active-jobs");
  };

  // Filter jobs based on status
  const activeJobs = jobs.filter(job => job.status !== "completed");
  const completedJobs = jobs.filter(job => job.status === "completed");

  return (
    <Layout>
      <div className="space-y-4">
        <DashboardHeader 
          title={t.dashboard}
          username={username}
          unreadMessages={unreadMessages}
        />
        
        <div className="flex justify-between items-center">
          <Tabs defaultValue={activeTab} value={activeTab} className="w-full">
            <TabsNavigation
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              isMobile={isMobile}
              activeJobs={activeJobs.length}
              completedJobs={completedJobs.length}
              unreadTickets={unreadTickets}
              translations={t}
              userRole={userRole}
              isShopOwner={isShopOwner}
            />
            
            <TabContent 
              activeJobs={activeJobs}
              completedJobs={completedJobs}
              allJobs={jobs}
              setJobs={setJobs}
              handleAddJob={handleAddJob}
              userId={userId || undefined}
              userRole={userRole}
              translations={t}
              isShopOwner={isShopOwner}
            />
          </Tabs>
        </div>
      </div>

      <SupportChat />
      <NotificationCenter userId={userId || ""} />
    </Layout>
  );
};
