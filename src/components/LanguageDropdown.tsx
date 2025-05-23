
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useEffect } from "react";

export function LanguageDropdown() {
  const [language, setLanguage] = useLocalStorage("language", "en");

  const handleLanguageChange = (newLanguage: string) => {
    // Set a flag to indicate this is a language-change reload
    sessionStorage.setItem('language_reload', 'true');
    setLanguage(newLanguage);
    
    // Reload the page to apply language changes everywhere
    window.location.reload();
  };

  // Effect to handle page reload logic
  useEffect(() => {
    const isLanguageReload = sessionStorage.getItem('language_reload');
    
    if (isLanguageReload) {
      // Clear the flag after reload
      sessionStorage.removeItem('language_reload');
    }
  }, []);

  const getLanguageName = (code: string) => {
    switch (code) {
      case 'en': return 'English';
      case 'ko': return '한국어';
      case 'ru': return 'Русский';
      default: return 'English';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 relative">
          <Globe className="h-4 w-4" />
          <span className="absolute -bottom-1 -right-1 text-xs font-bold">
            {language.toUpperCase()}
          </span>
          <span className="sr-only">Change language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleLanguageChange("en")}>
          <span className={language === "en" ? "font-bold" : ""}>English</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleLanguageChange("ko")}>
          <span className={language === "ko" ? "font-bold" : ""}>한국어</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleLanguageChange("ru")}>
          <span className={language === "ru" ? "font-bold" : ""}>Русский</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
