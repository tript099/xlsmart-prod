import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  Users, 
  FileText, 
  Brain, 
  TrendingUp, 
  MessageCircle,
  ArrowRight,
  Zap,
  BarChart3,
  Target,
  Smartphone,
  User
} from "lucide-react";
import { AIChat } from "@/components/AIChat";
import { RoleUploadFlexible } from "@/components/RoleUploadFlexible"; // Fixed component import
import { AIJobDescriptionGeneratorEnhanced } from "@/components/AIJobDescriptionGeneratorEnhanced";
import { AISkillsAssessmentEnhanced } from "@/components/AISkillsAssessmentEnhanced";
import { EmployeeMobilityPlanningEnhanced } from "@/components/EmployeeMobilityPlanningEnhanced";
import { DevelopmentPathwaysEnhanced } from "@/components/DevelopmentPathwaysEnhanced";
import { EmployeeListDetails } from "@/components/EmployeeListDetails";
import { StandardizedRolesDetails } from "@/components/StandardizedRolesDetails";
import { MappingAccuracyDetails } from "@/components/MappingAccuracyDetails";
import { SkillsListDetails } from "@/components/SkillsListDetails";
import { EmployeeUpload } from "@/components/EmployeeUpload";
import { EmployeeCareerPaths } from "@/components/EmployeeCareerPaths";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAIStats } from "@/components/AIStatsProvider";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [activeDialog, setActiveDialog] = useState<string | null>(null);
  const { t } = useLanguage();
  const aiStats = useAIStats();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const features = [
    {
      id: 'upload',
      title: t('feature.upload.title'),
      description: t('feature.upload.description'),
      icon: Upload,
      badge: t('feature.upload.badge'),
      dialogContent: 'upload'
    },
    {
      id: 'jd-generator',
      title: t('feature.jd.title'),
      description: t('feature.jd.description'),
      icon: FileText,
      badge: t('feature.jd.badge'),
      dialogContent: null
    },
    {
      id: 'employee-upload',
      title: 'Employee Upload & AI Assignment',
      description: 'Upload 10,000+ employees and automatically assign roles using AI',
      icon: Users,
      badge: 'AI',
      dialogContent: null
    },
    {
      id: 'assessment',
      title: t('feature.assessment.title'),
      description: t('feature.assessment.description'),
      icon: Brain,
      badge: t('feature.assessment.badge'),
      dialogContent: null
    },
    {
      id: 'chat',
      title: t('feature.chat.title'),
      description: t('feature.chat.description'),
      icon: MessageCircle,
      badge: t('feature.chat.badge'),
      dialogContent: 'chat'
    },
    {
      id: 'career-paths',
      title: 'Employee Career Paths',
      description: 'AI-powered career path planning and progression mapping',
      icon: TrendingUp,
      badge: 'AI',
      dialogContent: null
    },
    {
      id: 'mobility',
      title: t('feature.mobility.title'),
      description: t('feature.mobility.description'),
      icon: Target,
      badge: t('feature.mobility.badge'),
      dialogContent: null
    },
    {
      id: 'development',
      title: t('feature.development.title'),
      description: t('feature.development.description'),
      icon: Brain,
      badge: t('feature.development.badge'),
      dialogContent: null
    }
  ];

  const stats = [
    { value: aiStats.loading ? "..." : aiStats.employees, label: t('stats.employees'), icon: Users, color: "text-blue-600" },
    { value: aiStats.loading ? "..." : aiStats.roles, label: t('stats.roles'), icon: Target, color: "text-cyan-600" },
    { value: aiStats.loading ? "..." : aiStats.accuracy, label: t('stats.accuracy'), icon: Zap, color: "text-blue-600" },
    { value: aiStats.loading ? "..." : aiStats.skills, label: t('stats.skills'), icon: BarChart3, color: "text-cyan-600" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* XLSMART Header with Official Gradient */}
      <header className="xlsmart-gradient-bg text-white">
          <div className="container mx-auto px-6 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex flex-col items-center space-y-3">
                  <img 
                    src="/xlsmart-logo.svg" 
                    alt="XLSMART Logo" 
                    className="h-16 w-auto"
                  />
                  <p className="text-white/90 text-lg font-medium text-center">AI-Powered HR Platform by SimplifyAI</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <LanguageToggle />
                <div className="flex items-center space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-white/90 text-sm">{user?.email}</span>
                </div>
                <Button 
                  onClick={handleSignOut}
                  variant="outline" 
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                >
                  Sign Out
                </Button>
              </div>
            </div>
            
            <div className="mt-12 space-y-4">
              <h2 className="text-3xl font-light">
                Revolutionizing HR with <span className="font-bold text-white">Artificial Intelligence</span>
              </h2>
              <p className="text-white/80 text-xl max-w-3xl leading-relaxed">
                Streamline role standardization, skill assessment, and career development with SimplifyAI's AI-powered platform built for the telecommunications industry.
              </p>
            </div>
          </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12 space-y-12">
        {/* Features Grid */}
          <section>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('features.title')}</h2>
              <p className="text-gray-600 text-lg max-w-3xl mx-auto">
                {t('features.subtitle')}
              </p>
            </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={feature.id} className="xlsmart-card group cursor-pointer relative overflow-hidden hover:scale-105">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-accent/10 rounded-bl-3xl"></div>
                
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="p-4 bg-primary/10 rounded-2xl group-hover:bg-primary/20 transition-colors">
                      <feature.icon className="h-7 w-7 text-primary group-hover:text-primary/80" />
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-xs font-medium border-2 ${
                        feature.badge === 'AI' ? 'border-accent/30 text-accent bg-accent/10' :
                        feature.badge === 'Core' ? 'border-primary/30 text-primary bg-primary/10' :
                        feature.badge === 'Analytics' ? 'border-purple-500/30 text-purple-600 bg-purple-50' :
                        'border-muted-foreground/30 text-muted-foreground bg-muted/10'
                      }`}
                    >
                      {feature.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-bold text-card-foreground group-hover:text-primary transition-colors duration-300">
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
                        <Button variant="outline" className="w-full group-hover:xlsmart-primary-gradient group-hover:text-white group-hover:border-transparent transition-all duration-300 shadow-sm hover:shadow-md">
                          {feature.id === 'upload' ? t('feature.upload.button') : t('feature.chat.button')}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className={feature.id === 'upload' ? "max-w-4xl max-h-[80vh] overflow-y-auto" : "max-w-4xl max-h-[80vh] overflow-y-auto"}>
                        {feature.id === 'upload' ? <RoleUploadFlexible /> : <AIChat />}
                      </DialogContent>
                    </Dialog>
                   ) : (
                    <Dialog open={activeDialog === feature.id} onOpenChange={(open) => setActiveDialog(open ? feature.id : null)}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full group-hover:xlsmart-primary-gradient group-hover:text-white group-hover:border-transparent transition-all duration-300 shadow-sm hover:shadow-md"
                        >
                          {t('button.learn_more')}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
                        <DialogTitle className="sr-only">Feature Dialog</DialogTitle>
                        {feature.id === 'jd-generator' && <AIJobDescriptionGeneratorEnhanced />}
                        {feature.id === 'employee-upload' && <EmployeeUpload />}
                        {feature.id === 'assessment' && <AISkillsAssessmentEnhanced />}
                        {feature.id === 'career-paths' && <EmployeeCareerPaths />}
                        {feature.id === 'mobility' && <EmployeeMobilityPlanningEnhanced />}
                        {feature.id === 'development' && <DevelopmentPathwaysEnhanced />}
                      </DialogContent>
                    </Dialog>
                   )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Statistics Dashboard */}
        <section className="bg-gray-50 rounded-2xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('stats.title')}</h2>
            <p className="text-gray-600">
              {t('stats.subtitle')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card 
                key={index} 
                className="xlsmart-card text-center hover:scale-105 cursor-pointer transition-all duration-300"
                onClick={() => {
                  if (index === 0) {
                    // Employees stat - show employee details
                    setActiveDialog('employee-details');
                  } else if (index === 1) {
                    // Roles stat - show standardized roles details
                    setActiveDialog('roles-details');
                  } else if (index === 2) {
                    // Accuracy stat - show mapping accuracy details
                    setActiveDialog('accuracy-details');
                  } else if (index === 3) {
                    // Skills stat - show skills details
                    setActiveDialog('skills-details');
                  }
                }}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center space-y-3">
                    <div className={`p-4 rounded-2xl bg-gradient-to-br ${
                      index % 2 === 0 ? 'from-primary to-primary/80' : 'from-accent to-accent/80'
                    }`}>
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className={`text-3xl font-bold ${stat.color}`}>
                        {stat.value}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {stat.label}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="xlsmart-gradient-bg rounded-3xl p-12 text-white text-center shadow-2xl">
          <div className="space-y-6">
            <div>
              <h2 className="text-4xl font-bold mb-6">Ready to Transform Your HR?</h2>
              <p className="text-white/90 text-xl max-w-3xl mx-auto leading-relaxed">
                Join the future of human resources with SimplifyAI's AI-powered role standardization, skills assessment, and career development planning.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Dialog open={activeDialog === 'quick-upload'} onOpenChange={(open) => setActiveDialog(open ? 'quick-upload' : null)}>
                <DialogTrigger asChild>
                  <Button size="lg" className="xlsmart-button-secondary px-12 py-4 text-lg shadow-2xl">
                    <Upload className="mr-3 h-6 w-6" />
                    Upload Role Catalogs
                  </Button>
                </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <div className="sr-only">
                          <h2>Role Upload Dialog</h2>
                          <p>Upload and standardize role catalogs using AI</p>
                        </div>
                         <div>
                           <RoleUploadFlexible />
                           <hr className="my-4" />
                           <div style={{border: '1px solid #ccc', padding: '10px', margin: '10px 0'}}>
                             <h4>Debug: Test Edge Function</h4>
                             <button onClick={async () => {
                               console.log('Testing function...');
                               try {
                                 const response = await fetch('https://nwohehoountzfudzygqg.supabase.co/functions/v1/flexible-role-upload', {
                                   method: 'POST',
                                   headers: {
                                     'Content-Type': 'application/json',
                                     'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
                                     'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53b2hlaG9vdW50emZ1ZHp5Z3FnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODYwODgsImV4cCI6MjA2NzU2MjA4OH0.8MBoQn_Hs4uMf6ctCLcMr_vBqDAQ_YbglLYV9bet5pM'
                                   },
                                   body: JSON.stringify({ action: 'test' })
                                 });
                                 const result = await response.text();
                                 console.log('Function test result:', result);
                                 alert(`Function response: ${result}`);
                               } catch (err) {
                                 console.error('Function test error:', err);
                                 alert(`Function error: ${err.message}`);
                               }
                             }}>Test Function</button>
                           </div>
                         </div>
                      </DialogContent>
              </Dialog>
              
              <Dialog open={activeDialog === 'quick-chat'} onOpenChange={(open) => setActiveDialog(open ? 'quick-chat' : null)}>
                <DialogTrigger asChild>
                  <Button size="lg" variant="outline" className="px-12 py-4 text-lg bg-white/10 border-white/30 text-white hover:bg-white/20 hover:scale-105 transition-all shadow-xl backdrop-blur-sm">
                    <MessageCircle className="mr-3 h-6 w-6" />
                    Try AI Assistant
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <div className="sr-only">
                    <h2>AI Chat Assistant</h2>
                    <p>Chat with AI for HR assistance</p>
                  </div>
                  <AIChat />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </section>

        {/* Detail Dialogs for Stats */}
        <Dialog open={activeDialog === 'employee-details'} onOpenChange={(open) => setActiveDialog(open ? 'employee-details' : null)}>
          <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
            <EmployeeListDetails />
          </DialogContent>
        </Dialog>

        <Dialog open={activeDialog === 'roles-details'} onOpenChange={(open) => setActiveDialog(open ? 'roles-details' : null)}>
          <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
            <StandardizedRolesDetails />
          </DialogContent>
        </Dialog>

        <Dialog open={activeDialog === 'accuracy-details'} onOpenChange={(open) => setActiveDialog(open ? 'accuracy-details' : null)}>
          <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
            <MappingAccuracyDetails />
          </DialogContent>
        </Dialog>

        <Dialog open={activeDialog === 'skills-details'} onOpenChange={(open) => setActiveDialog(open ? 'skills-details' : null)}>
          <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
            <SkillsListDetails />
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Index;