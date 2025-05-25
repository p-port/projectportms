
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NotificationService } from "../messaging/services/NotificationService";

export const useJobOperations = () => {
  const [user, setUser] = useState<any>(null);
  const [userShop, setUserShop] = useState<any>(null);

  useEffect(() => {
    // Check for authenticated user
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        setUser(data.session.user);
        await fetchUserShop(data.session.user.id);
      }
    };
    
    checkUser();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          await fetchUserShop(currentUser.id);
        } else {
          setUserShop(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserShop = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('shop_id')
        .eq('id', userId)
        .single();

      if (profile?.shop_id) {
        const { data: shop } = await supabase
          .from('shops')
          .select('*')
          .eq('id', profile.shop_id)
          .single();
        
        setUserShop(shop);
      }
    } catch (error) {
      console.error("Error fetching user shop:", error);
    }
  };

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
        user_id: userId,
        shop_id: userShop?.id
      });
      
      if (error) throw error;

      // Record customer interaction history
      if (userShop?.id && job.customer?.email) {
        await supabase.from('customer_shop_history').insert({
          customer_email: job.customer.email,
          customer_phone: job.customer.phone,
          shop_id: userShop.id,
          job_id: job.id,
          interaction_type: job.status === 'completed' ? 'job_completed' : 'job_created',
          notes: `Job ${job.status}: ${job.serviceType}`
        });
      }

      // Send SMS notification for status changes
      if (job.customer?.phone && userShop?.name) {
        await NotificationService.notifyJobStatusChange(
          job.id,
          job.customer.phone,
          job.status,
          userShop.name
        );
      }
    } catch (error) {
      console.error("Error syncing job to database:", error);
    }
  };

  return {
    user,
    userShop,
    syncJobToSupabase
  };
};
