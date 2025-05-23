
import React from "react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

export const Header = () => {
  const [language] = useLocalStorage("language", "en");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsLoggedIn(!!data.session);
    };
    
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        setIsLoggedIn(true);
      } else if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false);
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <header className="bg-primary text-white py-4 shadow-md">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-xl font-bold">
            <a href="/">Auto Shop Portal</a>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {isLoggedIn && (
            <LogoutButton variant="link" className="text-white hover:text-gray-200" />
          )}
        </div>
      </div>
    </header>
  );
};
