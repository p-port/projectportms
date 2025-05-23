
import React from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";

export const Footer = () => {
  const [language] = useLocalStorage("language", "en");
  
  const translations = {
    en: {
      copyright: "© 2025 Auto Shop Portal. All rights reserved."
    },
    ko: {
      copyright: "© 2025 자동차 정비소 포털. 모든 권리 보유."
    },
    ru: {
      copyright: "© 2025 Портал Автомастерской. Все права защищены."
    }
  };
  
  const t = translations[language as keyof typeof translations];

  return (
    <footer className="bg-gray-800 text-gray-300 py-6 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p>{t.copyright}</p>
          <div className="mt-4 md:mt-0">
            <ul className="flex space-x-4">
              <li><a href="#" className="hover:text-white">Terms</a></li>
              <li><a href="#" className="hover:text-white">Privacy</a></li>
              <li><a href="#" className="hover:text-white">Contact</a></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};
