
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

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
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

export async function signUp(email: string, password: string, userData: { name: string, role?: string }, redirectTo?: string) {
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
