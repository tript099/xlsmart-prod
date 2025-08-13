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

const Index = () => {
  const [activeDialog, setActiveDialog] = useState<string | null>(null);

  const features = [
    {
      id: 'upload',
      title: 'Bulk Role Upload & Standardization',
      description: 'Upload XL dan SMART role catalogs dan auto-mapping ke XLSMART Standard Role dengan industry-aligned job families.',
      icon: Upload,
      badge: 'Core',
      dialogContent: 'upload'
    },
    {
      id: 'jd-generator',
      title: 'AI-Powered JD Generator',
      description: 'Generate job descriptions untuk setiap standardized role dengan in-app chatbot untuk tweak tone dan requirements.',
      icon: FileText,
      badge: 'AI',
      dialogContent: null
    },
    {
      id: 'assessment',
      title: 'Employee Skill Assessment',
      description: 'Upload XL dan SMART employees, match % vs target JD, skill gaps, next role recommendation.',
      icon: Users,
      badge: 'Analytics',
      dialogContent: null
    },
    {
      id: 'chat',
      title: 'HR AI Assistant',
      description: 'In-app chatbot untuk HR/editors tweak job descriptions dan mendapatkan personalized recommendations.',
      icon: MessageCircle,
      badge: 'AI',
      dialogContent: 'chat'
    },
    {
      id: 'mobility',
      title: 'Employee Mobility & Planning',
      description: 'Level fit analysis, rotation/churn risk assessment, dan personalized development plans.',
      icon: Target,
      badge: 'Planning',
      dialogContent: null
    },
    {
      id: 'development',
      title: 'Development Pathways',
      description: 'Personalized development plan dengan courses, certifications, dan projects untuk career growth.',
      icon: Brain,
      badge: 'Growth',
      dialogContent: null
    }
  ];

  const stats = [
    { value: "2,847", label: "Total Karyawan", icon: Users, color: "text-blue-600" },
    { value: "156", label: "Standardized Roles", icon: Target, color: "text-cyan-600" },
    { value: "89%", label: "Mapping Accuracy", icon: Zap, color: "text-blue-600" },
    { value: "342", label: "Skills Teridentifikasi", icon: BarChart3, color: "text-cyan-600" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* XL-style Header with Gradient */}
      <header className="xl-gradient-bg text-white">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Smartphone className="h-8 w-8" />
                <div>
                  <h1 className="text-3xl font-bold">XLSMART</h1>
                  <p className="text-blue-100 text-sm">HR Platform</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                AI-Powered
              </Badge>
              <Button className="xl-button-teal">
                Mulai Sekarang
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="mt-8 space-y-2">
            <h2 className="text-2xl font-light">
              Platform Manajemen Talenta <span className="font-semibold">Terdepan</span>
            </h2>
            <p className="text-blue-100 text-lg max-w-2xl">
              Standardisasi role, generate JD dengan AI, dan employee assessment untuk transformasi digital HR XL & SMART
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12 space-y-12">
        {/* Features Grid */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Fitur Platform</h2>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto">
              Solusi komprehensif untuk modernisasi operasi HR melalui teknologi AI dan analytics
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={feature.id} className="xl-card group cursor-pointer relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-bl-full"></div>
                
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="p-3 bg-blue-50 rounded-xl">
                      <feature.icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        feature.badge === 'AI' ? 'border-cyan-200 text-cyan-700 bg-cyan-50' :
                        feature.badge === 'Core' ? 'border-blue-200 text-blue-700 bg-blue-50' :
                        feature.badge === 'Analytics' ? 'border-purple-200 text-purple-700 bg-purple-50' :
                        'border-gray-200 text-gray-700 bg-gray-50'
                      }`}
                    >
                      {feature.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                  
                  {feature.dialogContent ? (
                    <Dialog open={activeDialog === feature.id} onOpenChange={(open) => setActiveDialog(open ? feature.id : null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full group-hover:xl-blue-gradient group-hover:text-white transition-all duration-200">
                          {feature.id === 'upload' ? 'Upload Role Catalog' : 'Buka Assistant'}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className={feature.id === 'upload' ? "max-w-4xl max-h-[80vh] overflow-y-auto" : "max-w-2xl"}>
                        {feature.id === 'upload' ? <RoleUpload /> : <AIChat />}
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <Button variant="outline" className="w-full group-hover:xl-blue-gradient group-hover:text-white transition-all duration-200">
                      Pelajari Lebih Lanjut
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Overview</h2>
            <p className="text-gray-600">
              Real-time insights transformasi HR XL & SMART
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="xl-card text-center">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center space-y-3">
                    <div className={`p-3 rounded-full bg-gradient-to-br ${
                      index % 2 === 0 ? 'from-blue-500 to-blue-600' : 'from-cyan-500 to-cyan-600'
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
        <section className="xl-gradient-bg rounded-2xl p-8 text-white text-center">
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-4">Siap Transformasi HR Anda?</h2>
              <p className="text-blue-100 text-lg max-w-2xl mx-auto">
                Mulai dengan upload role catalog XL dan SMART atau eksplorasi AI assistant untuk melihat bagaimana XLSMART dapat mengoptimalkan proses talent management Anda.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Dialog open={activeDialog === 'quick-upload'} onOpenChange={(open) => setActiveDialog(open ? 'quick-upload' : null)}>
                <DialogTrigger asChild>
                  <Button size="lg" className="xl-button-teal px-8">
                    <Upload className="mr-2 h-5 w-5" />
                    Upload Role Catalog
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <RoleUpload />
                </DialogContent>
              </Dialog>
              
              <Dialog open={activeDialog === 'quick-chat'} onOpenChange={(open) => setActiveDialog(open ? 'quick-chat' : null)}>
                <DialogTrigger asChild>
                  <Button size="lg" variant="outline" className="px-8 bg-white/10 border-white/30 text-white hover:bg-white/20">
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Coba AI Assistant
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