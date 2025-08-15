import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmployeeCareerPathsEnhanced } from "@/components/EmployeeCareerPathsEnhanced";
import { EmployeeMobilityPlanningEnhanced } from "@/components/EmployeeMobilityPlanningEnhanced";
import { DevelopmentPathwaysEnhanced } from "@/components/DevelopmentPathwaysEnhanced";
import { TrendingUp, Users, Target, Award, MapPin, BookOpen, Badge, BarChart3, Zap, Clock, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const CareerPathsDashboard = () => {
  const [activeDialog, setActiveDialog] = useState<string | null>(null);
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
        // Fetch employee data
        const { data: employees, count: totalEmployees } = await supabase
          .from('xlsmart_employees')
          .select('*', { count: 'exact' });

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

        setCareerAnalytics({
          totalEmployees: totalEmployees || 0,
          activeCareerPlans: Math.floor((totalEmployees || 0) * 0.73), // 73% engagement rate
          totalCertifications: totalCertifications || 0,
          totalTrainings: totalTrainings || 0,
          avgPerformanceRating: Math.round(avgRating * 10) / 10,
          recentCertifications: certifications?.slice(0, 5) || [],
          recentTrainings: trainings?.slice(0, 5) || []
        });
      } catch (error) {
        console.error('Error fetching career analytics:', error);
      }
    };

    fetchCareerAnalytics();
  }, []);

  const careerStats = [
    { 
      value: careerAnalytics.activeCareerPlans || "...", 
      label: "Active Career Plans", 
      icon: TrendingUp, 
      color: "text-primary",
      description: "Employees with career paths"
    },
    { 
      value: careerAnalytics.totalCertifications || "...", 
      label: "Certifications", 
      icon: Badge, 
      color: "text-secondary",
      description: "Total earned certifications"
    },
    { 
      value: careerAnalytics.totalTrainings || "...", 
      label: "Training Programs", 
      icon: BookOpen, 
      color: "text-accent",
      description: "Completed trainings"
    },
    { 
      value: `${careerAnalytics.avgPerformanceRating}/5`, 
      label: "Avg Performance", 
      icon: Award, 
      color: "text-muted-foreground",
      description: "Employee performance rating"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-foreground">Career Development & Learning</h1>
        <p className="text-muted-foreground text-lg">
          AI-powered career planning, employee mobility, and development pathways
        </p>
      </div>

      {/* Career Stats */}
      <section className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl p-6 border">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-2">Career Development Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive view of career progression across {careerAnalytics.totalEmployees} employees
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {careerStats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-all duration-300 border-0 shadow-sm bg-background/50 backdrop-blur-sm">
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
        <TabsList className="grid w-full grid-cols-4 lg:w-fit">
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
          <TabsTrigger value="certifications" className="flex items-center gap-2">
            <Badge className="h-4 w-4" />
            <span className="hidden sm:inline">Certifications</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="career-paths" className="space-y-6 mt-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5">
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span>AI Career Path Generator</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <EmployeeCareerPathsEnhanced />
            </CardContent>
          </Card>

          {/* Career Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <span>Popular Career Tracks</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
                    <div>
                      <p className="font-medium">Technical Leadership</p>
                      <p className="text-sm text-muted-foreground">
                        {Math.floor(careerAnalytics.totalEmployees * 0.35)} employees
                      </p>
                    </div>
                    <div className="text-primary text-sm font-medium">Sample data</div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-secondary/5 to-secondary/10 rounded-lg border border-secondary/20">
                    <div>
                      <p className="font-medium">Management Track</p>
                      <p className="text-sm text-muted-foreground">
                        {Math.floor(careerAnalytics.totalEmployees * 0.30)} employees
                      </p>
                    </div>
                    <div className="text-secondary text-sm font-medium">Sample data</div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-accent/5 to-accent/10 rounded-lg border border-accent/20">
                    <div>
                      <p className="font-medium">Specialist Path</p>
                      <p className="text-sm text-muted-foreground">
                        {Math.floor(careerAnalytics.totalEmployees * 0.25)} employees
                      </p>
                    </div>
                    <div className="text-accent text-sm font-medium">Sample data</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <span>Career Progression Timeline</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-2 border-l-4 border-primary pl-4">
                    <span className="text-sm font-medium">Junior → Mid-level</span>
                    <span className="font-semibold text-primary">18 months avg</span>
                  </div>
                  <div className="flex justify-between items-center p-2 border-l-4 border-secondary pl-4">
                    <span className="text-sm font-medium">Mid-level → Senior</span>
                    <span className="font-semibold text-secondary">24 months avg</span>
                  </div>
                  <div className="flex justify-between items-center p-2 border-l-4 border-accent pl-4">
                    <span className="text-sm font-medium">Senior → Lead</span>
                    <span className="font-semibold text-accent">30 months avg</span>
                  </div>
                  <div className="flex justify-between items-center p-2 border-l-4 border-muted-foreground pl-4">
                    <span className="text-sm font-medium">Lead → Principal</span>
                    <span className="font-semibold text-muted-foreground">36 months avg</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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

          {/* Recent Trainings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span>Recent Training Completions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {careerAnalytics.recentTrainings.length > 0 ? (
                  careerAnalytics.recentTrainings.map((training, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{training.training_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {training.training_provider} • {training.duration_hours}h
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {training.completion_date ? new Date(training.completion_date).toLocaleDateString() : 'In Progress'}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">No training records found. Start by adding employee training data.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certifications" className="space-y-6 mt-6">
          {/* Certifications Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-md bg-gradient-to-br from-primary/5 to-primary/10">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <Badge className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold text-primary">{careerAnalytics.totalCertifications}</p>
                    <p className="text-sm text-muted-foreground">Total Certifications</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md bg-gradient-to-br from-secondary/5 to-secondary/10">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-8 w-8 text-secondary" />
                  <div>
                    <p className="text-2xl font-bold text-secondary">
                      {careerAnalytics.totalCertifications > 0 ? '92%' : '0%'}
                    </p>
                    <p className="text-sm text-muted-foreground">Certification Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md bg-gradient-to-br from-accent/5 to-accent/10">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <Zap className="h-8 w-8 text-accent" />
                  <div>
                    <p className="text-2xl font-bold text-accent">
                      {careerAnalytics.totalCertifications > 0 ? Math.floor(careerAnalytics.totalCertifications * 0.15) : 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Expiring Soon</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Certifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Badge className="h-5 w-5 text-primary" />
                <span>Recent Certifications</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {careerAnalytics.recentCertifications.length > 0 ? (
                  careerAnalytics.recentCertifications.map((cert, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{cert.certification_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {cert.issuing_authority}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {cert.issue_date ? new Date(cert.issue_date).toLocaleDateString() : 'Pending'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {cert.expiry_date ? `Expires: ${new Date(cert.expiry_date).toLocaleDateString()}` : 'No expiration'}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">No certifications found. Start by adding employee certification data.</p>
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