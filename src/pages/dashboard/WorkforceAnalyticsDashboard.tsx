import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWorkforceAnalytics } from "@/hooks/useWorkforceAnalytics";
import { PieChart, BarChart3, TrendingUp, Users, Brain, Target, Zap, Shield, Clock, Award } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LiteLLMTest } from "@/components/LiteLLMTest";

const WorkforceAnalyticsDashboard = () => {
  const { metrics: workforceAnalytics, loading, error } = useWorkforceAnalytics();

  const analyticsStats = [
    { 
      value: loading ? "..." : workforceAnalytics?.totalEmployees || 0, 
      label: "Total Workforce", 
      icon: Users, 
      color: "text-primary",
      description: "All employees"
    },
    { 
      value: loading ? "..." : workforceAnalytics?.skillGaps.totalAssessments || 0, 
      label: "AI Assessments", 
      icon: Brain, 
      color: "text-secondary",
      description: "Completed assessments"
    },
    { 
      value: loading ? "..." : `${workforceAnalytics?.performanceMetrics.averageRating || 0}/5`, 
      label: "Avg Performance", 
      icon: Award, 
      color: "text-accent",
      description: "Performance rating"
    },
    { 
      value: loading ? "..." : Object.keys(workforceAnalytics?.roleDistribution || {}).length, 
      label: "Role Types", 
      icon: Target, 
      color: "text-muted-foreground",
      description: "Different roles"
    }
  ];

  // Hardcoded insights data - in a real app, this would come from database analytics
  const departmentInsights = [
    { department: "Engineering", employees: Math.floor((workforceAnalytics?.totalEmployees || 0) * 0.4), utilization: "94%", satisfaction: "4.2/5" },
    { department: "Sales", employees: Math.floor((workforceAnalytics?.totalEmployees || 0) * 0.18), utilization: "89%", satisfaction: "4.0/5" },
    { department: "Marketing", employees: Math.floor((workforceAnalytics?.totalEmployees || 0) * 0.12), utilization: "92%", satisfaction: "4.1/5" },
    { department: "Operations", employees: Math.floor((workforceAnalytics?.totalEmployees || 0) * 0.15), utilization: "91%", satisfaction: "3.9/5" },
    { department: "Support", employees: Math.floor((workforceAnalytics?.totalEmployees || 0) * 0.15), utilization: "88%", satisfaction: "4.3/5" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-foreground">Advanced Workforce Analytics</h1>
        <p className="text-muted-foreground text-lg">
          AI-powered insights, predictive analytics, and comprehensive workforce intelligence
        </p>
      </div>

      {/* Analytics Stats */}
      <section className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl p-6 border">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-2">Real-time Workforce Metrics</h2>
          <p className="text-muted-foreground">
            Live analytics from {workforceAnalytics?.totalEmployees || 0} employees across your organization
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {analyticsStats.map((stat, index) => (
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
      <Tabs defaultValue="ai-intelligence" className="w-full">
        <TabsList className="grid w-full grid-cols-6 lg:w-fit">
          <TabsTrigger value="ai-intelligence" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            <span className="hidden sm:inline">AI Intelligence</span>
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="departments" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Departments</span>
          </TabsTrigger>
          <TabsTrigger value="predictive" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Predictions</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Performance</span>
          </TabsTrigger>
          <TabsTrigger value="litellm-test" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">LiteLLM Test</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai-intelligence" className="space-y-6 mt-6">
          {loading ? (
            <div className="text-center py-8">Loading workforce analytics...</div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">Error: {error}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-primary" />
                    <span>Employee Distribution</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(workforceAnalytics?.departmentBreakdown || {}).slice(0, 5).map(([dept, count]) => (
                      <div key={dept} className="flex justify-between items-center">
                        <span className="text-sm font-medium">{dept}</span>
                        <span className="text-sm text-muted-foreground">{count} employees</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-secondary" />
                    <span>Skills Assessment</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Total Assessments</span>
                      <span className="font-medium">{workforceAnalytics?.skillGaps.totalAssessments || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Avg Match %</span>
                      <span className="font-medium">{workforceAnalytics?.skillGaps.averageMatchPercentage || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Critical Gaps</span>
                      <span className="font-medium text-destructive">{workforceAnalytics?.skillGaps.criticalGaps || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-accent" />
                    <span>Training Metrics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Total Trainings</span>
                      <span className="font-medium">{workforceAnalytics?.trainingMetrics.totalTrainings || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Completion Rate</span>
                      <span className="font-medium">{workforceAnalytics?.trainingMetrics.completionRate || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Avg Hours</span>
                      <span className="font-medium">{workforceAnalytics?.trainingMetrics.averageHours || 0}h</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Skills Distribution & Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <span>Skills Distribution</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Technical Skills</span>
                      <span className="text-sm text-muted-foreground">78%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="h-2 rounded-full bg-gradient-to-r from-primary to-primary/80" style={{ width: '78%' }}></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Leadership</span>
                      <span className="text-sm text-muted-foreground">45%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="h-2 rounded-full bg-gradient-to-r from-secondary to-secondary/80" style={{ width: '45%' }}></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Communication</span>
                      <span className="text-sm text-muted-foreground">89%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="h-2 rounded-full bg-gradient-to-r from-accent to-accent/80" style={{ width: '89%' }}></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Project Management</span>
                      <span className="text-sm text-muted-foreground">62%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="h-2 rounded-full bg-gradient-to-r from-primary to-primary/80" style={{ width: '62%' }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <span>Workforce Trends</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-lg">
                    <p className="font-medium text-primary">Hiring Trend</p>
                    <p className="text-sm text-muted-foreground">↗ 15% increase in new hires this quarter</p>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-secondary/5 to-secondary/10 border border-secondary/20 rounded-lg">
                    <p className="font-medium text-secondary">Skill Development</p>
                    <p className="text-sm text-muted-foreground">↗ 23% increase in training completions</p>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-accent/5 to-accent/10 border border-accent/20 rounded-lg">
                    <p className="font-medium text-accent">Engagement</p>
                    <p className="text-sm text-muted-foreground">↗ 8% improvement in satisfaction scores</p>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-muted-foreground/5 to-muted-foreground/10 border border-muted-foreground/20 rounded-lg">
                    <p className="font-medium text-muted-foreground">Retention</p>
                    <p className="text-sm text-muted-foreground/80">↗ 5% improvement in retention rates</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="departments" className="space-y-6 mt-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-secondary/5 to-accent/5">
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-secondary" />
                <span>Department Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Department</th>
                      <th className="text-left py-3 px-4 font-semibold">Employees</th>
                      <th className="text-left py-3 px-4 font-semibold">Avg Salary</th>
                      <th className="text-left py-3 px-4 font-semibold">Performance</th>
                      <th className="text-left py-3 px-4 font-semibold">Trend</th>
                    </tr>
                  </thead>
                   <tbody>
                     {Object.entries(workforceAnalytics?.departmentBreakdown || {}).length > 0 ? (
                       Object.entries(workforceAnalytics?.departmentBreakdown || {}).map(([dept, count], index) => (
                         <tr key={index} className="border-b hover:bg-muted/30 transition-colors">
                           <td className="py-3 px-4 font-medium">{dept}</td>
                           <td className="py-3 px-4">{count}</td>
                           <td className="py-3 px-4">
                             <span className="font-medium text-muted-foreground">N/A</span>
                           </td>
                           <td className="py-3 px-4">
                             <span className="text-primary font-medium">4.2/5</span>
                           </td>
                           <td className="py-3 px-4">
                             <span className="text-primary">↗ +2.3%</span>
                           </td>
                         </tr>
                       ))
                     ) : (
                      departmentInsights.map((dept, index) => (
                        <tr key={index} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4 font-medium">{dept.department}</td>
                          <td className="py-3 px-4">{dept.employees}</td>
                          <td className="py-3 px-4">
                            <span className="font-medium text-muted-foreground">Sample data</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-primary font-medium">{dept.satisfaction}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-primary">{dept.utilization}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictive" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-0 shadow-md bg-gradient-to-br from-primary/5 to-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="h-5 w-5 text-primary" />
                  <span>Skill Demand Prediction</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-4">
                  AI predicts future skill demands based on industry trends and organizational growth
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">AI/ML Skills</span>
                    <span className="text-sm font-medium text-primary">↗ 45%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Cybersecurity</span>
                    <span className="text-sm font-medium text-primary">↗ 32%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Cloud Computing</span>
                    <span className="text-sm font-medium text-primary">↗ 28%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-0 shadow-md bg-gradient-to-br from-secondary/5 to-secondary/10">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-secondary" />
                  <span>Talent Optimization</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-4">
                  AI identifies optimal role-employee matches and suggests improvements
                </p>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Match Rate:</span> 
                    <span className="text-secondary ml-1">87%</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Efficiency Gain:</span> 
                    <span className="text-secondary ml-1">+23%</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Satisfaction Score:</span> 
                    <span className="text-secondary ml-1">4.3/5</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-0 shadow-md bg-gradient-to-br from-accent/5 to-accent/10">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-accent" />
                  <span>Risk Assessment</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-4">
                  Predictive analytics for employee turnover and performance risks
                </p>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Turnover Risk:</span> 
                    <span className="text-accent ml-1">Low (4.2%)</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Performance Risk:</span> 
                    <span className="text-accent ml-1">Moderate</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Succession Ready:</span> 
                    <span className="text-accent ml-1">78%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-0 shadow-md bg-gradient-to-br from-primary/5 to-secondary/10">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-primary" />
                  <span>Performance Prediction</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-4">
                  AI models predict future performance based on current trends
                </p>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Projected Growth:</span> 
                    <span className="text-primary ml-1">+12%</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">High Performers:</span> 
                    <span className="text-primary ml-1">23%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-0 shadow-md bg-gradient-to-br from-secondary/5 to-accent/10">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-secondary" />
                  <span>Workforce Planning</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-4">
                  Strategic insights for future workforce requirements
                </p>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Hiring Needs:</span> 
                    <span className="text-secondary ml-1">+156 roles</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Skills Gap:</span> 
                    <span className="text-secondary ml-1">23 areas</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-0 shadow-md bg-gradient-to-br from-accent/5 to-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-accent" />
                  <span>Diversity Analytics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-4">
                  Advanced diversity and inclusion metrics with predictive insights
                </p>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Diversity Score:</span> 
                    <span className="text-accent ml-1">8.2/10</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Inclusion Index:</span> 
                    <span className="text-accent ml-1">87%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <span>Performance Distribution</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg">
                    <span className="font-medium">Exceptional (5.0)</span>
                    <span className="text-primary font-bold">12%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-secondary/5 to-secondary/10 rounded-lg">
                    <span className="font-medium">High (4.0-4.9)</span>
                    <span className="text-secondary font-bold">34%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-accent/5 to-accent/10 rounded-lg">
                    <span className="font-medium">Good (3.0-3.9)</span>
                    <span className="text-accent font-bold">41%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="font-medium">Needs Improvement</span>
                    <span className="text-muted-foreground font-bold">13%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-primary" />
                  <span>Top Performers by Department</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="space-y-3">
                   {Object.entries(workforceAnalytics?.departmentBreakdown || {}).slice(0, 5).map(([dept, count], index) => (
                     <div key={index} className="flex justify-between items-center p-2 border-l-4 border-primary pl-4">
                       <span className="text-sm font-medium">{dept}</span>
                       <span className="text-sm text-primary font-bold">
                         {Math.round(Math.random() * 30 + 70)}% high performers
                       </span>
                     </div>
                   ))}
                   {Object.keys(workforceAnalytics?.departmentBreakdown || {}).length === 0 && (
                     <p className="text-muted-foreground text-center py-4">
                       Performance data will appear here once employee data is uploaded.
                     </p>
                   )}
                 </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="litellm-test" className="space-y-6 mt-6">
          <LiteLLMTest />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorkforceAnalyticsDashboard;