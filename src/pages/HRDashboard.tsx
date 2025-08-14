import { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { HRSidebar } from "@/components/HRSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { LanguageToggle } from "@/components/LanguageToggle";

const HRDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Redirect to analytics dashboard if on base dashboard route
  useEffect(() => {
    if (location.pathname === '/dashboard' || location.pathname === '/dashboard/') {
      navigate('/dashboard/analytics', { replace: true });
    }
  }, [location.pathname, navigate]);

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Global Header */}
        <header className="fixed top-0 left-0 right-0 h-14 z-50 bg-background border-b flex items-center px-4 gap-4">
          <SidebarTrigger />
          <div className="flex items-center space-x-3">
            <img 
              src="/xlsmart-logo.svg" 
              alt="XLSMART" 
              className="h-8 w-auto"
            />
            <span className="font-semibold text-lg text-primary">XLSMART HR Portal</span>
          </div>
          <div className="ml-auto">
            <LanguageToggle />
          </div>
        </header>

        <HRSidebar />

        {/* Main Content Area */}
        <main className="flex-1 pt-14">
          <div className="p-6 h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default HRDashboard;