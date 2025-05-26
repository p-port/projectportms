import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { supabase } from "@/integrations/supabase/client";
import { useAuthCheck } from "@/hooks/useAuthCheck";
import { useJobPermissions } from "@/hooks/useJobPermissions";
import { DashboardHeader } from "./features/DashboardHeader";
import { TabsNavigation } from "./features/TabsNavigation";
import { TabContent } from "./features/TabContent";
import { defaultTranslations } from "./job-list/translations";

interface DashboardProps {
  user: any;
}

export const Dashboard = ({ user }: DashboardProps) => {
  const [language] = useLocalStorage("language", "en");
  const [jobs, setJobs] = useState<any[]>([]);
  const [allJobs, setAllJobs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("jobs");
  const { userRole, userId } = useAuthCheck();
  const { permissions, loading, filterJobs } = useJobPermissions();

  const t = defaultTranslations[language as keyof typeof defaultTranslations] || defaultTranslations.en;

  const loadJobsFromStorage = () => {
    try {
      const storedJobs = localStorage.getItem("jobs");
      if (storedJobs) {
        const parsedJobs = JSON.parse(storedJobs);
        setJobs(parsedJobs);
        setAllJobs(parsedJobs);
      }
    } catch (error) {
      console.error("Error loading jobs from local storage:", error);
    }
  };

  const syncJobsFromSupabase = async () => {
    if (!userId) return;

    try {
      let query = supabase.from('jobs').select('*');
      
      // Apply shop-based filtering for mechanics
      if (!permissions.canSeeAllJobs && permissions.shopId) {
        query = query.eq('shop_id', permissions.shopId);
      } else if (!permissions.canSeeAllJobs && !permissions.shopId) {
        // Users without shop can't see any jobs
        setJobs([]);
        setAllJobs([]);
        return;
      }

      const { data: supabaseJobs, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching jobs from Supabase:", error);
        return;
      }

      if (supabaseJobs) {
        const formattedJobs = supabaseJobs.map(job => ({
          id: job.job_id,
          customer: job.customer,
          motorcycle: job.motorcycle,
          serviceType: job.service_type,
          status: job.status,
          dateCreated: job.date_created,
          dateCompleted: job.date_completed,
          notes: job.notes || [],
          photos: job.photos || { start: [], completion: [] },
          shop_id: job.shop_id
        }));

        setJobs(formattedJobs);
        setAllJobs(formattedJobs);
        
        // Also store in localStorage for offline access
        localStorage.setItem("jobs", JSON.stringify(formattedJobs));
      }
    } catch (error) {
      console.error("Error syncing jobs from Supabase:", error);
    }
  };

  useEffect(() => {
    loadJobsFromStorage();
  }, []);

  useEffect(() => {
    if (userId && !loading) {
      syncJobsFromSupabase();
    }
  }, [userId, loading, permissions.canSeeAllJobs, permissions.shopId]);

  const handleAddJob = (newJob: any) => {
    const updatedJobs = [...jobs, newJob];
    setJobs(updatedJobs);
    setAllJobs(updatedJobs);
    localStorage.setItem("jobs", JSON.stringify(updatedJobs));
  };

  const activeJobs = filterJobs(jobs.filter(job => job.status === "pending" || job.status === "in_progress"));
  const completedJobs = filterJobs(jobs.filter(job => job.status === "completed"));

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 space-y-6">
        <DashboardHeader 
          userName={user?.name || user?.email}
          searchQuery=""
          onSearchChange={() => {}}
          translations={t}
          userId={userId}
        />
        <Tabs defaultValue="jobs" className="space-y-6">
          <div className="flex justify-center">
            <TabsNavigation 
              activeTab={activeTab} 
              setActiveTab={setActiveTab}
              isMobile={false}
              activeJobs={activeJobs.length}
              completedJobs={completedJobs.length}
              unreadTickets={0}
              translations={t}
              userRole={userRole}
              userId={userId}
            />
          </div>
          <TabContent
            activeJobs={activeJobs}
            completedJobs={completedJobs}
            allJobs={allJobs}
            setJobs={setJobs}
            handleAddJob={handleAddJob}
            userId={userId}
            userRole={userRole}
            translations={t}
          />
        </Tabs>
      </div>
    </div>
  );
};
