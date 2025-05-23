
import { ReactNode, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { LanguageDropdown } from "@/components/LanguageDropdown";

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
  const [language] = useLocalStorage("language", "en");
  
  // Set logo based on theme
  const logoSrc = theme === "dark" 
    ? "/lovable-uploads/28dd3615-eb59-4a33-ae85-3a1e81c82540.png" 
    : "/lovable-uploads/263071da-5dd5-4f23-9074-ff28f3a3408f.png";
  
  const t = layoutTranslations[language as keyof typeof layoutTranslations];

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
            <span className="text-xl md:text-2xl font-bold text-foreground">{t.title}</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageDropdown />
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
