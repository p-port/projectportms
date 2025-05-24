import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// Define types
interface User {
  id: string;
  email: string;
  // Add more fields as needed
}

interface Job {
  id: string;
  customer: string;
  motorcycle: string;
  serviceType: string;
  status: string;
  dateCreated: string;
  dateCompleted?: string;
  notes?: string;
  photos?: string[]; // Ensure your Supabase column supports arrays or JSON
}

export const useJobOperations = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for authenticated user
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        setUser(data.session.user as User);
      }
    };

    checkUser();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => {
        setUser(session?.user as User ?? null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const syncJobToSupabase = async (job: Job) => {
    if (!user) {
      console.error("User not authenticated");
      return { error: "User not authenticated" };
    }

    try {
      const { error } = await supabase.from("jobs").upsert({
        job_id: job.id,
        customer: job.customer,
        motorcycle: job.motorcycle,
        service_type: job.serviceType,
        status: job.status,
        date_created: job.dateCreated,
        date_completed: job.dateCompleted,
        notes: job.notes,
        photos: job.photos,
        user_id: user.id,
      });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error("Error syncing job to database:", error);
      return { error };
    }
  };

  return {
    user,
    syncJobToSupabase,
  };
};
