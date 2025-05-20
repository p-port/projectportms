
import { ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800 shadow-md">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-xl md:text-2xl font-bold text-white">Project Port</h1>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6 text-gray-100">
        {children}
      </main>
      <footer className="bg-gray-800 text-gray-300 py-4">
        <div className="container mx-auto px-4 text-center text-sm">
          &copy; {new Date().getFullYear()} Project Port - Motorcycle Service Management
        </div>
      </footer>
    </div>
  );
};
