import { NavLink, useLocation } from "react-router-dom";
import {
  BarChart3,
  Users,
  Briefcase,
  FileText,
  Brain,
  TrendingUp,
  Target,
  BookOpen,
  Award,
  PieChart,
  Package,
  User
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const navigationItems = [
  {
    title: "Analytics Dashboard",
    url: "/dashboard/analytics",
    icon: BarChart3,
    description: "Platform overview & insights"
  },
  {
    title: "Employee Management",
    url: "/dashboard/employees",
    icon: Users,
    description: "Employee dashboard & analytics"
  },
  {
    title: "Role Management",
    url: "/dashboard/roles",
    icon: Briefcase,
    description: "Role standardization & analytics"
  },
  {
    title: "Job Descriptions",
    url: "/dashboard/job-descriptions",
    icon: FileText,
    description: "JD generation & management"
  },
  {
    title: "Skill Assessment",
    url: "/dashboard/skills",
    icon: Brain,
    description: "Skills analysis & recommendations"
  },
  {
    title: "Career Paths",
    url: "/dashboard/career-paths",
    icon: TrendingUp,
    description: "Career planning & progression"
  },
  {
    title: "Employee Mobility",
    url: "/dashboard/mobility",
    icon: Target,
    description: "Mobility planning & analysis"
  },
  {
    title: "Development Pathways",
    url: "/dashboard/development",
    icon: BookOpen,
    description: "Learning & development paths"
  },
  {
    title: "Certifications",
    url: "/dashboard/certifications",
    icon: Award,
    description: "Certification tracking"
  },
  {
    title: "Workforce Analytics",
    url: "/dashboard/workforce-analytics",
    icon: PieChart,
    description: "Advanced workforce insights"
  },
  {
    title: "Skill Inventory",
    url: "/dashboard/skill-inventory",
    icon: Package,
    description: "Organization skill mapping"
  }
];

export function HRSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-primary/10 text-primary font-medium border-l-4 border-primary" : "hover:bg-muted/50";

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  return (
    <Sidebar
      className={collapsed ? "w-16" : "w-64"}
      collapsible="icon"
    >
      <SidebarTrigger className="m-2 self-end" />

      <SidebarContent>
        {/* Header */}
        <div className={`p-4 border-b ${collapsed ? 'px-2' : ''}`}>
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <User className="h-4 w-4 text-primary" />
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">HR Manager</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? 'sr-only' : ''}>
            HR Portal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && (
                        <div className="flex-1 min-w-0">
                          <span className="block text-sm font-medium truncate">{item.title}</span>
                          <span className="block text-xs text-muted-foreground truncate">{item.description}</span>
                        </div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Sign Out Button */}
        <div className="mt-auto p-4 border-t">
          <Button
            onClick={handleSignOut}
            variant="outline"
            size={collapsed ? "icon" : "sm"}
            className="w-full"
          >
            {collapsed ? (
              <User className="h-4 w-4" />
            ) : (
              "Sign Out"
            )}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}