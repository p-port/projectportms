
import { useState, useEffect } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { Layout } from "@/components/layout/Layout";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { getSession, supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface User {
  email: string;
  name: string;
  role: string;
  id: string;
}

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on page load
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data, error } = await getSession();
        
        if (error) {
          console.error("Session error:", error);
          setIsAuthenticated(false);
          setUser(null);
          return;
        }
        
        if (data?.session?.user) {
          setIsAuthenticated(true);
          const userData = {
            email: data.session.user.email || '',
            name: data.session.user.user_metadata?.name || data.session.user.email || '',
            role: data.session.user.user_metadata?.role || 'mechanic',
            id: data.session.user.id
          };
          setUser(userData);
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (err) {
        console.error("Session check error:", err);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSession();
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const userData = {
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email || '',
            role: session.user.user_metadata?.role || 'mechanic',
            id: session.user.id
          };
          setUser(userData);
          setIsAuthenticated(true);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    );
    
    // Cleanup subscription on component unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogin = (userData: User) => {
    setIsAuthenticated(true);
    setUser(userData);
  };
  
  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[calc(100vh-12rem)]">
          <div className="text-center space-y-4">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p>Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {!isAuthenticated ? (
        <AuthForm onLogin={handleLogin} />
      ) : (
        <>
          <div className="flex justify-end mb-4">
            <LogoutButton onLogout={handleLogout} />
          </div>
          <Dashboard />
        </>
      )}
    </Layout>
  );
};

export default Index;
