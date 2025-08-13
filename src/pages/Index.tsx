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
  Zap,
  BarChart3,
  Target,
  Smartphone
} from "lucide-react";
import { AIChat } from "@/components/AIChat";
import { RoleUpload } from "@/components/RoleUpload";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAIStats } from "@/components/AIStatsProvider";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [activeDialog, setActiveDialog] = useState<string | null>(null);
  const { t } = useLanguage();
  const aiStats = useAIStats();
  const { toast } = useToast();

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
      id: 'assessment',
      title: t('feature.assessment.title'),
      description: t('feature.assessment.description'),
      icon: Users,
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
                <Badge variant="secondary" className="bg-white/15 text-white border-white/20 backdrop-blur-sm">
                  SimplifyAI Platform
                </Badge>
                <Button className="xlsmart-button-secondary shadow-xl">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
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
                      <DialogContent className={feature.id === 'upload' ? "max-w-4xl max-h-[80vh] overflow-y-auto" : "max-w-2xl"}>
                        {feature.id === 'upload' ? <RoleUpload /> : <AIChat />}
                      </DialogContent>
                    </Dialog>
                   ) : (
                    <Button 
                      variant="outline" 
                      className="w-full group-hover:xlsmart-primary-gradient group-hover:text-white group-hover:border-transparent transition-all duration-300 shadow-sm hover:shadow-md"
                      onClick={() => {
                        if (feature.id === 'jd-generator' || feature.id === 'assessment' || feature.id === 'mobility' || feature.id === 'development') {
                          toast({
                            title: "AI Feature",
                            description: `${feature.title} will be powered by AI engine. Feature coming soon!`
                          });
                        }
                      }}
                    >
                      {t('button.learn_more')}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
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
              <Card key={index} className="xlsmart-card text-center hover:scale-105">
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
                  <RoleUpload />
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