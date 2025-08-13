import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  Users, 
  FileText, 
  Brain, 
  TrendingUp, 
  MessageCircle,
  ArrowRight,
  Shield,
  Zap,
  BarChart3
} from "lucide-react";
import { AIChat } from "@/components/AIChat";
import { RoleUpload } from "@/components/RoleUpload";

const Index = () => {
  const [activeDialog, setActiveDialog] = useState<string | null>(null);

  const features = [
    {
      id: 'upload',
      title: 'Bulk Role Upload',
      description: 'Upload XL and SMART role catalogs and auto-map to XLSMART Standard Roles with industry-aligned job families.',
      icon: Upload,
      badge: 'Core Feature',
      badgeVariant: 'default' as const,
      dialogContent: 'upload'
    },
    {
      id: 'jd-generator',
      title: 'AI JD Generator',
      description: 'Generate comprehensive job descriptions for standardized roles with AI assistance and customizable templates.',
      icon: FileText,
      badge: 'AI-Powered',
      badgeVariant: 'secondary' as const,
      dialogContent: null
    },
    {
      id: 'assessment',
      title: 'Employee Assessment',
      description: 'Match employees against target JDs, identify skill gaps, and get next role recommendations.',
      icon: Users,
      badge: 'Analytics',
      badgeVariant: 'outline' as const,
      dialogContent: null
    },
    {
      id: 'chat',
      title: 'HR AI Assistant',
      description: 'Chat with AI to tweak job descriptions, get insights, and receive personalized recommendations.',
      icon: MessageCircle,
      badge: 'AI-Powered',
      badgeVariant: 'secondary' as const,
      dialogContent: 'chat'
    },
    {
      id: 'analytics',
      title: 'Skill Analytics',
      description: 'Track skill distribution, identify gaps, and monitor development progress across the organization.',
      icon: TrendingUp,
      badge: 'Analytics',
      badgeVariant: 'outline' as const,
      dialogContent: null
    },
    {
      id: 'development',
      title: 'Development Plans',
      description: 'Create personalized learning paths and career development recommendations for employees.',
      icon: Brain,
      badge: 'Growth',
      badgeVariant: 'destructive' as const,
      dialogContent: null
    }
  ];

  const stats = [
    { value: "2,847", label: "Total Employees", icon: Users },
    { value: "156", label: "Standardized Roles", icon: Shield },
    { value: "89%", label: "Mapping Accuracy", icon: Zap },
    { value: "342", label: "Skills Identified", icon: BarChart3 }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Enterprise Header */}
      <header className="enterprise-header">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                XLSMART HR Platform
              </h1>
              <p className="text-lg text-muted-foreground">
                AI-Powered Talent Management & Role Standardization Suite
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="px-3 py-1">
                Enterprise Ready
              </Badge>
              <Button className="enterprise-button-primary px-6">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12 space-y-12">
        {/* Features Grid */}
        <section>
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-2">Platform Features</h2>
            <p className="text-muted-foreground">
              Comprehensive tools for modernizing your HR operations through AI-driven insights.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.id} className="enterprise-card group cursor-pointer">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <Badge variant={feature.badgeVariant} className="text-xs">
                      {feature.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                  
                  {feature.dialogContent ? (
                    <Dialog open={activeDialog === feature.id} onOpenChange={(open) => setActiveDialog(open ? feature.id : null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          {feature.id === 'upload' ? 'Upload Catalogs' : 'Open Assistant'}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className={feature.id === 'upload' ? "max-w-4xl max-h-[80vh] overflow-y-auto" : "max-w-2xl"}>
                        {feature.id === 'upload' ? <RoleUpload /> : <AIChat />}
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      Learn More
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Statistics Dashboard */}
        <section>
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-2">Platform Overview</h2>
            <p className="text-muted-foreground">
              Real-time insights into your HR transformation progress.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="enterprise-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-primary mb-1">
                        {stat.value}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {stat.label}
                      </p>
                    </div>
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <stat.icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-2xl p-8 border border-border">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold">Ready to Transform Your HR Operations?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Start with uploading your role catalogs or explore our AI assistant to see how XLSMART can streamline your talent management processes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Dialog open={activeDialog === 'quick-upload'} onOpenChange={(open) => setActiveDialog(open ? 'quick-upload' : null)}>
                <DialogTrigger asChild>
                  <Button size="lg" className="enterprise-button-primary px-8">
                    <Upload className="mr-2 h-5 w-5" />
                    Upload Role Catalogs
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <RoleUpload />
                </DialogContent>
              </Dialog>
              
              <Dialog open={activeDialog === 'quick-chat'} onOpenChange={(open) => setActiveDialog(open ? 'quick-chat' : null)}>
                <DialogTrigger asChild>
                  <Button size="lg" variant="outline" className="px-8">
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Try AI Assistant
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <AIChat />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;