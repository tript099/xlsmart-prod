import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmployeeCareerPathsEnhanced } from "@/components/EmployeeCareerPathsEnhanced";
import { EmployeeMobilityPlanningEnhanced } from "@/components/EmployeeMobilityPlanningEnhanced";
import { DevelopmentPathwaysEnhanced } from "@/components/DevelopmentPathwaysEnhanced";
import { TrendingUp, Users, Target, Award, MapPin, BookOpen, Badge, BarChart3, Zap, Clock, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const CareerPathsDashboard = () => {
  const [careerAnalytics, setCareerAnalytics] = useState({
    totalEmployees: 0,
    activeCareerPlans: 0,
    totalCertifications: 0,
    totalTrainings: 0,
    avgPerformanceRating: 0,
    recentCertifications: [],
    recentTrainings: []
  });

  useEffect(() => {
    const fetchCareerAnalytics = async () => {
      try {
        console.log('Fetching career analytics...');
        
        // Fetch employee data
        const { data: employees, count: totalEmployees } = await supabase
          .from('xlsmart_employees')
          .select('*', { count: 'exact' });

        // Fetch active development plans
        const { data: developmentPlans, count: activePlans } = await supabase
          .from('xlsmart_development_plans')
          .select('*', { count: 'exact' })
          .eq('plan_status', 'active');

        // Fetch certifications
        const { data: certifications, count: totalCertifications } = await supabase
          .from('employee_certifications')
          .select('*', { count: 'exact' });

        // Fetch trainings
        const { data: trainings, count: totalTrainings } = await supabase
          .from('employee_trainings')
          .select('*', { count: 'exact' });

        // Calculate average performance rating
        const avgRating = employees?.length > 0 
          ? employees.reduce((sum, emp) => sum + (emp.performance_rating || 0), 0) / employees.length 
          : 0;

        const analyticsData = {
          totalEmployees: totalEmployees || 0,
          activeCareerPlans: activePlans || 0,
          totalCertifications: totalCertifications || 0,
          totalTrainings: totalTrainings || 0,
          avgPerformanceRating: Math.round(avgRating * 10) / 10,
          recentCertifications: certifications?.slice(0, 5) || [],
          recentTrainings: trainings?.slice(0, 5) || []
        };

        console.log('Career analytics data:', analyticsData);
        setCareerAnalytics(analyticsData);
      } catch (error) {
        console.error('Error fetching career analytics:', error);
      }
    };

    fetchCareerAnalytics();
  }, []);

  const careerStats = [
    { 
      value: careerAnalytics.activeCareerPlans || 0, 
      label: "Active Career Plans", 
      icon: TrendingUp, 
      color: "text-primary",
      description: "Employees with career paths"
    },
    { 
      value: careerAnalytics.totalCertifications || 0, 
      label: "Total Certifications", 
      icon: Award, 
      color: "text-secondary",
      description: "Professional certifications"
    },
    { 
      value: careerAnalytics.totalTrainings || 0, 
      label: "Training Programs", 
      icon: BookOpen, 
      color: "text-accent",
      description: "Completed trainings"
    },
    { 
      value: `${careerAnalytics.avgPerformanceRating}`, 
      label: "Avg Performance", 
      icon: Target, 
      color: "text-green-600",
      description: "Team performance rating"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-foreground">Career Paths & Development</h1>
        <p className="text-muted-foreground text-lg">
          AI-powered career planning, development pathways, and employee mobility optimization
        </p>
      </div>

      {/* Career Stats */}
      <section className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl p-6 border">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-2">Career Development Analytics</h2>
          <p className="text-muted-foreground">
            Real-time insights from {careerAnalytics.totalEmployees} employees across your organization
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {careerStats.map((stat, index) => (
            <Card 
              key={index} 
              className="hover:shadow-lg transition-all duration-300 border-0 shadow-sm bg-background/50 backdrop-blur-sm cursor-pointer hover:scale-[1.02]"
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className={`text-2xl font-bold ${stat.color}`}>
                      {stat.value}
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {stat.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stat.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Main Content Tabs */}
      <Tabs defaultValue="career-paths" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-fit">
          <TabsTrigger value="career-paths" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Career Paths</span>
          </TabsTrigger>
          <TabsTrigger value="mobility" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Mobility</span>
          </TabsTrigger>
          <TabsTrigger value="development" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Development</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="career-paths" className="space-y-6 mt-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5">
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span>AI Career Paths Engine</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <EmployeeCareerPathsEnhanced />
            </CardContent>
          </Card>

          {/* Recent Career Development */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span>Recent Career Activities</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {careerAnalytics.recentCertifications.length > 0 ? (
                  careerAnalytics.recentCertifications.map((cert: any, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{cert.certification_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {cert.issuing_authority}
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(cert.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">No recent certifications. Encourage your team to pursue professional development.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mobility" className="space-y-6 mt-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-secondary/5 to-accent/5">
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-secondary" />
                <span>Employee Mobility Planning</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <EmployeeMobilityPlanningEnhanced />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="development" className="space-y-6 mt-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-accent/5 to-primary/5">
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-accent" />
                <span>Development Pathways</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <DevelopmentPathwaysEnhanced />
            </CardContent>
          </Card>

          {/* Recent Training Programs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-primary" />
                <span>Recent Training Programs</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {careerAnalytics.recentTrainings.length > 0 ? (
                  careerAnalytics.recentTrainings.map((training: any, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{training.training_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {training.training_provider}
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {training.duration_hours}h
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">No recent training programs. Start building your team's capabilities.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CareerPathsDashboard;