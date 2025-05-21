
import { ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Globe } from "lucide-react";
import { useLocalStorage } from "@/hooks/use-local-storage";

interface LayoutProps {
  children: ReactNode;
}

// Korean translations for Layout component
const layoutTranslations = {
  en: {
    title: "Project Port",
    footer: "Project Port - Motorcycle Service Management",
  },
  ko: {
    title: "프로젝트 포트",
    footer: "프로젝트 포트 - 오토바이 서비스 관리",
  }
};

export const Layout = ({ children }: LayoutProps) => {
  const isMobile = useIsMobile();
  const { theme, toggleTheme } = useTheme();
  const [language, setLanguage] = useLocalStorage("language", "en");
  
  const toggleLanguage = () => {
    setLanguage(language === "en" ? "ko" : "en");
  };

  const t = layoutTranslations[language as keyof typeof layoutTranslations];
  
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-secondary shadow-md">
        <div className="container mx-auto px-4 py-4 flex flex-wrap justify-between items-center gap-2">
          <h1 className="text-xl md:text-2xl font-bold text-foreground">{t.title}</h1>
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
          &copy; {new Date().getFullYear()} {t.footer}
        </div>
      </footer>
    </div>
  );
};
