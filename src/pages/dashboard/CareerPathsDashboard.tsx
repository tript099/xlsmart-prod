import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmployeeCareerPathsEnhanced } from "@/components/EmployeeCareerPathsEnhanced";
import { EmployeeMobilityPlanningAI } from "@/components/EmployeeMobilityPlanningAI";
import { DevelopmentPathwaysAI } from "@/components/DevelopmentPathwaysAI";
import { TrendingUp, Users, Target, Award, BookOpen, Navigation } from "lucide-react";

const CareerPathsDashboard = () => {
  const careerStats = [
    { 
      value: "1,847", 
      label: "Career Plans", 
      icon: TrendingUp, 
      color: "text-blue-600",
      description: "Active career plans"
    },
    { 
      value: "89%", 
      label: "Engagement Rate", 
      icon: Users, 
      color: "text-green-600",
      description: "Employee participation"
    },
    { 
      value: "73%", 
      label: "Goal Achievement", 
      icon: Target, 
      color: "text-purple-600",
      description: "Completed milestones"
    },
    { 
      value: "156", 
      label: "Promotions", 
      icon: Award, 
      color: "text-orange-600",
      description: "This quarter"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-foreground">Career Development Hub</h1>
        <p className="text-muted-foreground text-lg">
          Comprehensive career planning, mobility analysis, and development pathways powered by AI
        </p>
      </div>

      {/* Career Stats */}
      <section className="bg-muted/50 rounded-xl p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-2">Career Development Statistics</h2>
          <p className="text-muted-foreground">
            Overview of career planning and progression metrics
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {careerStats.map((stat, index) => (
            <Card key={index} className="hover:shadow-md transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${
                    index % 4 === 0 ? 'from-blue-500 to-blue-600' :
                    index % 4 === 1 ? 'from-green-500 to-green-600' :
                    index % 4 === 2 ? 'from-purple-500 to-purple-600' :
                    'from-orange-500 to-orange-600'
                  }`}>
                    <stat.icon className="h-5 w-5 text-white" />
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

      {/* Career Development Tools */}
      <section>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-2">AI-Powered Career Development</h2>
          <p className="text-muted-foreground">
            Comprehensive suite of tools for career planning, mobility, and development pathways
          </p>
        </div>

        <Tabs defaultValue="career-paths" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="career-paths" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Career Paths</span>
            </TabsTrigger>
            <TabsTrigger value="mobility" className="flex items-center space-x-2">
              <Navigation className="h-4 w-4" />
              <span>Employee Mobility</span>
            </TabsTrigger>
            <TabsTrigger value="development" className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4" />
              <span>Development Pathways</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="career-paths" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <span>Career Path Generator</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EmployeeCareerPathsEnhanced />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mobility" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Navigation className="h-5 w-5 text-primary" />
                  <span>Employee Mobility Planning</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EmployeeMobilityPlanningAI />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="development" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span>Development Pathways</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DevelopmentPathwaysAI />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      {/* Career Insights */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Popular Career Tracks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Technical Leadership</p>
                  <p className="text-sm text-muted-foreground">347 employees</p>
                </div>
                <div className="text-blue-600 text-sm">↗ 23%</div>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Management Track</p>
                  <p className="text-sm text-muted-foreground">298 employees</p>
                </div>
                <div className="text-green-600 text-sm">↗ 18%</div>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Specialist Path</p>
                  <p className="text-sm text-muted-foreground">234 employees</p>
                </div>
                <div className="text-purple-600 text-sm">↗ 15%</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Career Progression Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Junior → Mid-level</span>
                <span className="font-semibold text-blue-600">18 months avg</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Mid-level → Senior</span>
                <span className="font-semibold text-green-600">24 months avg</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Senior → Lead</span>
                <span className="font-semibold text-purple-600">30 months avg</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Lead → Principal</span>
                <span className="font-semibold text-orange-600">36 months avg</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default CareerPathsDashboard;