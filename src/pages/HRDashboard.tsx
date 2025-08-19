import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { HRSidebar } from "@/components/HRSidebar";
import { useAuth } from "@/contexts/AuthContext";

import { LiteLLMTest } from "@/components/LiteLLMTest";
import { ComprehensiveApplicationTester } from "@/components/ComprehensiveApplicationTester";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Zap, TestTube } from "lucide-react";


const HRDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLiteLLMDialogOpen, setIsLiteLLMDialogOpen] = useState(false);
  const [isAppTesterDialogOpen, setIsAppTesterDialogOpen] = useState(false);

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Redirect to roles dashboard if on base dashboard route
  useEffect(() => {
    if (location.pathname === '/dashboard' || location.pathname === '/dashboard/') {
      navigate('/dashboard/roles', { replace: true });
    }
  }, [location.pathname, navigate]);

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Global Header */}
        <header className="fixed top-0 left-0 right-0 h-20 z-50 xlsmart-gradient-bg border-b flex items-center justify-between px-4">
          <SidebarTrigger className="text-white hover:bg-white/20" />
          
          <div className="flex flex-col items-center space-y-1">
            <img 
              src="/xlsmart-logo.svg" 
              alt="XLSMART Logo" 
              className="h-10 w-auto"
            />
            <p className="text-white/90 text-sm font-medium">AI-Powered HR Platform by SimplifyAI</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Dialog open={isLiteLLMDialogOpen} onOpenChange={setIsLiteLLMDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <span className="hidden sm:inline">Test LiteLLM</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogTitle className="sr-only">LiteLLM Connection Test</DialogTitle>
                <LiteLLMTest />
              </DialogContent>
            </Dialog>
            
            <Dialog open={isAppTesterDialogOpen} onOpenChange={setIsAppTesterDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="default" size="sm" className="flex items-center gap-2">
                  <TestTube className="h-4 w-4" />
                  <span className="hidden sm:inline">Test Application</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogTitle className="sr-only">Comprehensive Application Testing</DialogTitle>
                <ComprehensiveApplicationTester />
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <HRSidebar />

        {/* Main Content Area */}
        <main className="flex-1 pt-20">
          <div className="p-6 h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default HRDashboard;