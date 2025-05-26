
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UserPermissions {
  userRole: string;
  shopId: string | null;
  canSeeAllJobs: boolean;
}

export const useJobPermissions = () => {
  const [permissions, setPermissions] = useState<UserPermissions>({
    userRole: 'mechanic',
    shopId: null,
    canSeeAllJobs: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserPermissions = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role, shop_id')
          .eq('id', user.id)
          .single();

        if (profile) {
          const canSeeAllJobs = profile.role === 'admin' || profile.role === 'support';
          setPermissions({
            userRole: profile.role || 'mechanic',
            shopId: profile.shop_id,
            canSeeAllJobs
          });
        }
      } catch (error) {
        console.error('Error fetching user permissions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserPermissions();
  }, []);

  const filterJobs = (jobs: any[]) => {
    if (permissions.canSeeAllJobs) {
      return jobs; // Admin and support can see all jobs
    }
    
    if (!permissions.shopId) {
      return []; // Users without shop assignment can't see any jobs
    }

    // Mechanics can only see jobs from their shop
    return jobs.filter(job => job.shop_id === permissions.shopId);
  };

  return {
    permissions,
    loading,
    filterJobs
  };
};
