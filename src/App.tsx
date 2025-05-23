
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index";
import TrackJob from "./pages/TrackJob";
import NotFound from "./pages/NotFound";
import VerificationSuccess from "./pages/VerificationSuccess";
import { ShopManagement } from "./components/dashboard/shops/ShopManagement";
import { UserManagement } from "./components/dashboard/admin/UserManagement";
import { UserDetails } from "./components/dashboard/admin/UserDetails";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/track-job/:jobId" element={<TrackJob />} />
            <Route path="/verification-success" element={<VerificationSuccess />} />
            <Route path="/shop-management" element={<ShopManagement />} />
            <Route path="/user-management" element={<UserManagement />} />
            <Route path="/user-management/:userId" element={<UserDetails />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
