
import { ReactNode, useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Globe } from "lucide-react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { supabase } from "@/integrations/supabase/client";

interface LayoutProps {
  children: ReactNode;
}

// Korean and Russian translations for Layout component
const layoutTranslations = {
  en: {
    title: "Project Port",
    footer: "Project Port - Motorcycle Service Management",
  },
  ko: {
    title: "프로젝트 포트",
    footer: "프로젝트 포트 - 오토바이 서비스 관리",
  },
  ru: {
    title: "Проект Порт",
    footer: "Проект Порт - Управление сервисом мотоциклов",
  }
};

export const Layout = ({ children }: LayoutProps) => {
  const isMobile = useIsMobile();
  const { theme, toggleTheme } = useTheme();
  const [language, setLanguage] = useLocalStorage("language", "en");
  const [shopName, setShopName] = useState<string | null>(null);
  
  // Add effect to reload page when language changes
  useEffect(() => {
    // The key in sessionStorage is used to track if this is a language-change reload
    const isLanguageReload = sessionStorage.getItem('language_reload');
    
    if (isLanguageReload) {
      // Clear the flag after reload
      sessionStorage.removeItem('language_reload');
    }

    // This will run on component mount and when language changes
    return () => {
      // This cleanup function runs when language changes
    };
  }, [language]);

  // Fetch user's shop name
  useEffect(() => {
    const fetchUserShop = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('shop_id')
          .eq('id', user.id)
          .single();

        if (profile?.shop_id) {
          const { data: shop } = await supabase
            .from('shops')
            .select('name')
            .eq('id', profile.shop_id)
            .single();

          setShopName(shop?.name || null);
        }
      } catch (error) {
        console.error('Error fetching user shop:', error);
      }
    };

    fetchUserShop();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUserShop();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  const toggleLanguage = () => {
    // Set a flag to indicate this is a language-change reload
    sessionStorage.setItem('language_reload', 'true');
    
    // Cycle through languages: en -> ko -> ru -> en
    if (language === "en") setLanguage("ko");
    else if (language === "ko") setLanguage("ru");
    else setLanguage("en");
    
    // Reload the page to apply language changes everywhere
    window.location.reload();
  };

  const t = layoutTranslations[language as keyof typeof layoutTranslations];
  
  // Set logo based on theme
  const logoSrc = theme === "dark" 
    ? "/lovable-uploads/28dd3615-eb59-4a33-ae85-3a1e81c82540.png" 
    : "/lovable-uploads/263071da-5dd5-4f23-9074-ff28f3a3408f.png";

  const displayTitle = shopName || t.title;
  
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-secondary shadow-md">
        <div className="container mx-auto px-4 py-4 flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center">
            <img 
              src={logoSrc} 
              alt="Project Port Logo" 
              className="h-8 w-auto mr-2"
            />
            <span className="text-xl md:text-2xl font-bold text-foreground">{displayTitle}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleLanguage}>
              <Globe className="h-4 w-4" />
              <span className="sr-only">Switch Language</span>
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleTheme}>
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span className="sr-only">Toggle Theme</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
      <footer className="bg-secondary text-muted-foreground py-4">
        <div className="container mx-auto px-4 text-center text-sm">
          <div className="flex justify-center items-center mb-2">
            <img 
              src={logoSrc} 
              alt="Project Port Logo" 
              className="h-6 w-auto mr-2"
            />
          </div>
          &copy; {new Date().getFullYear()} {t.footer}
        </div>
      </footer>
    </div>
  );
};
