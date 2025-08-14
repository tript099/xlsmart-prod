import { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { HRSidebar } from "@/components/HRSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { User } from "lucide-react";

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
        <header className="fixed top-0 left-0 right-0 h-16 z-50 bg-gradient-to-r from-primary/5 to-primary/10 backdrop-blur-sm border-b border-primary/20 flex items-center px-6 gap-4">
          <SidebarTrigger className="p-2 hover:bg-primary/10 rounded-lg transition-colors" />
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <img 
                  src="/xlsmart-logo.svg" 
                  alt="XLSMART" 
                  className="h-6 w-auto"
                />
              </div>
              <div>
                <h1 className="font-bold text-xl text-foreground">XLSMART</h1>
                <p className="text-xs text-muted-foreground">HR Intelligence Platform</p>
              </div>
            </div>
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <LanguageToggle />
            <div className="h-8 w-px bg-border"></div>
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground hidden sm:block">HR Manager</span>
            </div>
          </div>
        </header>

        <HRSidebar />

        {/* Main Content Area */}
        <main className="flex-1 pt-16">
          <div className="p-8 h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default HRDashboard;