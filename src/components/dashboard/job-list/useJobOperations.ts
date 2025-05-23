
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useJobOperations = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check for authenticated user
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        setUser(data.session.user);
      }
    };
    
    checkUser();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const syncJobToSupabase = async (job: any, userId: string) => {
    try {
      const { error } = await supabase.from('jobs').upsert({
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
      
      if (error) throw error;
    } catch (error) {
      console.error("Error syncing job to database:", error);
    }
  };

  return {
    user,
    syncJobToSupabase
  };
};
