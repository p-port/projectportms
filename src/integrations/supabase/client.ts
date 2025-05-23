import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { Shop } from '@/types/shop';

const SUPABASE_URL = "https://pkmyuwlgvozgclrypdqv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrbXl1d2xndm96Z2NscnlwZHF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3NjEwODcsImV4cCI6MjA2MzMzNzA4N30.p9clVUQAttII54xxpz65-ooFT5VRnjbjw6addz_yYoA";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Helper functions for working with the Supabase auth system
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ 
    email, 
    password
  });
  return { data, error };
}

export async function signUp(email: string, password: string, userData: { name: string, role?: string, shop_identifier?: string }, redirectTo?: string) {
  const options: any = {
    data: userData
  };
  
  if (redirectTo) {
    options.emailRedirectTo = redirectTo;
  }
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  return { data, error };
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
}

// Helper function to check if a user is authenticated before making requests
export async function ensureAuthenticated() {
  const { data } = await getSession();
  return data.session !== null;
}

// Get the user's shop identifier
export async function getUserShopInfo() {
  const { user } = await getCurrentUser();
  
  if (!user) return null;
  
  try {
    // Update this query to handle shop_id and shop_identifier properties that may not yet exist
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
      
    if (error) {
      console.error("Error fetching user shop info:", error);
      return null;
    }

    // If shop_id exists in the data, fetch shop details
    // Use the 'as any' to bypass TypeScript checking until we generate new types
    const profile = data as any;
    if (profile && profile.shop_id) {
      // Use any type here to overcome TypeScript's type checking
      const { data: shopData, error: shopError } = await (supabase as any)
        .from('shops')
        .select('*')
        .eq('id', profile.shop_id)
        .single();
        
      if (!shopError && shopData) {
        return { 
          profile: profile,
          shop: shopData as Shop
        };
      }
    }
    
    return { profile: profile, shop: null };
  } catch (err) {
    console.error("Error in getUserShopInfo:", err);
    return null;
  }
}

// Function to fetch shops data with proper typing
export async function fetchShops(): Promise<Shop[]> {
  try {
    // Use any type to bypass TypeScript's type checking
    const { data, error } = await (supabase as any)
      .from('shops')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Shop[];
  } catch (error) {
    console.error("Error fetching shops:", error);
    return [];
  }
}

// Function to create a new shop with proper typing
export async function createShop(shopData: Omit<Shop, 'id' | 'created_at'>): Promise<{data: Shop | null, error: any}> {
  try {
    // Update to use explicit cast to handle the type issues with the new shops table
    const { data, error } = await (supabase as any)
      .from('shops')
      .insert(shopData)
      .select()
      .single();
      
    if (error) {
      console.error("Error in createShop:", error);
      return { data: null, error };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error("Error creating shop:", error);
    return { data: null, error };
  }
}

// Function to create a notification for a user
export async function createNotification(userId: string, notification: {
  title: string;
  content: string;
  type: string;
  reference_id?: string;
}) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title: notification.title,
        content: notification.content,
        type: notification.type,
        reference_id: notification.reference_id,
        is_read: false
      })
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { data: null, error };
  }
}

// Function to mark a notification as read
export async function markNotificationAsRead(notificationId: string) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { data: null, error };
  }
}

// Function to mark all notifications as read for a user
export async function markAllNotificationsAsRead(userId: string) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return { data: null, error };
  }
}
