
import { useState, useEffect } from "react";
import { Tabs } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { DashboardHeader } from "./features/DashboardHeader";
import { TabsNavigation } from "./features/TabsNavigation";
import { TabContent } from "./features/TabContent";
import { supabase } from "@/integrations/supabase/client";
import { fetchUnreadTicketsCount, subscribeToTicketUpdates } from "./services/UnreadTicketsService";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { toast } from "sonner";

export const Dashboard = ({ user }: { user: any }) => {
  const [activeTab, setActiveTab] = useState("active-jobs");
  const isMobile = useIsMobile();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [unreadTickets, setUnreadTickets] = useState(0);
  const [language] = useLocalStorage("language", "en");
  const [translations, setTranslations] = useState<any>({
    activeJobs: "Active Jobs",
    completed: "Completed",
    newJob: "New Job",
    customers: "Customers"
  });

  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const { data, error } = await supabase
          .from('translations')
          .select('*')
          .eq('language', language);

        if (error) {
          throw error;
        }

        if (data) {
          const translated: any = {};
          data.forEach(item => {
            translated[item.key] = item.value;
          });
          setTranslations(translated);
        }
      } catch (error) {
        console.error('Error loading translations:', error);
        toast.error('Failed to load translations. Using default values.');
      }
    };

    loadTranslations();
  }, [language]);

  useEffect(() => {
    const fetchJobs = async () => {
      setLoadingJobs(true);
      try {
        const { data, error } = await supabase
          .from('jobs')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        setJobs(data || []);
      } catch (error) {
        console.error('Error fetching jobs:', error);
        toast.error('Failed to load jobs. Please try again.');
      } finally {
        setLoadingJobs(false);
      }
    };

    fetchJobs();
  }, []);

  const activeJobs = jobs.filter(job => job.status !== 'completed');
  const completedJobs = jobs.filter(job => job.status === 'completed');

  const handleAddJob = async (jobData: any) => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .insert([jobData])
        .select();

      if (error) {
        throw error;
      }

      setJobs(prevJobs => [...prevJobs, data[0]]);
      toast.success('Job added successfully!');
    } catch (error) {
      console.error('Error adding job:', error);
      toast.error('Failed to add job. Please try again.');
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    
    // Load initial unread tickets count
    loadUnreadTicketsCount();
    
    // Subscribe to ticket changes
    const channel = subscribeToTicketUpdates(user.id, loadUnreadTicketsCount);
    
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user]);

  const loadUnreadTicketsCount = async () => {
    try {
      const count = await fetchUnreadTicketsCount(user?.id);
      setUnreadTickets(count);
    } catch (error) {
      console.error('Error loading unread tickets count:', error);
    }
  };

  return (
    <div className="container max-w-5xl py-4">
      <DashboardHeader 
        userName={user?.name || "User"} 
        searchQuery="" 
        onSearchChange={() => {}} 
        translations={{
          dashboard: "Dashboard",
          welcome: "Welcome",
          searchPlaceholder: "Search"
        }} 
      />
      
      <Tabs
        defaultValue="active-jobs"
        value={activeTab}
        onValueChange={setActiveTab}
        className="mt-6"
      >
        <TabsNavigation 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          isMobile={isMobile} 
          activeJobs={activeJobs.length}
          completedJobs={completedJobs.length}
          unreadTickets={unreadTickets}
          translations={translations}
        />
        
        {loadingJobs ? (
          <div className="mt-4 p-4 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading...</p>
          </div>
        ) : (
          <TabContent 
            activeJobs={activeJobs}
            completedJobs={completedJobs}
            allJobs={jobs}
            setJobs={setJobs}
            handleAddJob={handleAddJob}
            userId={user?.id}
            userRole={user?.role}
            translations={translations}
          />
        )}
      </Tabs>
    </div>
  );
};
