
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
    const { data, error } = await supabase
      .from('profiles')
      .select('shop_id, shop_identifier, role')
      .eq('id', user.id)
      .single();
      
    if (error) {
      console.error("Error fetching user shop info:", error);
      return null;
    }

    // If shop_id exists, fetch shop details
    if (data?.shop_id) {
      // Use any type here since the Database type doesn't know about shops yet
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('*')
        .eq('id', data.shop_id)
        .single() as any;
        
      if (!shopError && shopData) {
        return { 
          profile: data,
          shop: shopData as Shop
        };
      }
    }
    
    return { profile: data, shop: null };
  } catch (err) {
    console.error("Error in getUserShopInfo:", err);
    return null;
  }
}

// Function to fetch shops data with proper typing
export async function fetchShops(): Promise<Shop[]> {
  try {
    // Cast to any to work around type checking until types are updated
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
    // Cast to any to work around type checking until types are updated
    const result = await (supabase as any)
      .from('shops')
      .insert(shopData)
      .select()
      .single();
      
    return result;
  } catch (error) {
    console.error("Error creating shop:", error);
    return { data: null, error };
  }
}
