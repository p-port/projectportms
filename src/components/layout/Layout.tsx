
import { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { NotificationCenter } from "@/components/dashboard/notifications/NotificationCenter";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setUserId(data.session.user.id);
      }
    };
    
    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          setUserId(session.user.id);
        } else {
          setUserId(null);
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
      <Footer />
      {userId && <NotificationCenter userId={userId} />}
    </div>
  );
};
