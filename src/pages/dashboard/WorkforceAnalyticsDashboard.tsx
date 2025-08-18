import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWorkforceAnalytics } from "@/hooks/useWorkforceAnalytics";
import { InteractiveMetricCard } from "@/components/workforce/InteractiveMetricCard";
import { SkillsAnalyticsDashboard } from "@/components/workforce/SkillsAnalyticsDashboard";
import { CareerPathwaysDashboard } from "@/components/workforce/CareerPathwaysDashboard";
import { TalentAnalyticsDashboard } from "@/components/workforce/TalentAnalyticsDashboard";
import { 
  PieChart, 
  BarChart3, 
  TrendingUp, 
  Users, 
  Brain, 
  Target, 
  Zap, 
  Shield, 
  Clock, 
  Award, 
  BookOpen, 
  MapPin,
  AlertTriangle,
  Calendar,
  Activity,
  RefreshCw
} from "lucide-react";
import { useState } from "react";

const WorkforceAnalyticsDashboard = () => {
  const { metrics: workforceAnalytics, loading, error, refetch } = useWorkforceAnalytics();
  const [activeView, setActiveView] = useState("overview");

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <h3 className="text-xl font-semibold mb-2">Loading Workforce Analytics</h3>
          <p className="text-muted-foreground">Analyzing data from multiple sources...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h3 className="text-xl font-semibold mb-2 text-destructive">Error Loading Analytics</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={refetch} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const analyticsStats = [
    { 
      title: "Total Workforce",
      value: workforceAnalytics?.totalEmployees || 0,
      subtitle: "Active employees across all departments",
      icon: Users,
      color: "from-blue-500 to-blue-600",
      trend: "↗ +5.2% this month",
      details: [
        { label: "Full-time", value: Math.floor((workforceAnalytics?.totalEmployees || 0) * 0.85), progress: 85, description: "Permanent employees" },
        { label: "Part-time", value: Math.floor((workforceAnalytics?.totalEmployees || 0) * 0.15), progress: 15, description: "Contract & temporary staff" },
        { label: "Remote", value: Math.floor((workforceAnalytics?.totalEmployees || 0) * 0.6), progress: 60, description: "Working remotely" },
        { label: "On-site", value: Math.floor((workforceAnalytics?.totalEmployees || 0) * 0.4), progress: 40, description: "Office-based employees" }
      ]
    },
    { 
      title: "AI Assessments",
      value: workforceAnalytics?.skillGaps.totalAssessments || 0,
      subtitle: "Completed skill and performance assessments",
      icon: Brain,
      color: "from-purple-500 to-purple-600",
      trend: "↗ +12.8% this week",
      details: [
        { label: "Skills Assessments", value: workforceAnalytics?.skillGaps.totalAssessments || 0, progress: 78, description: "Technical & soft skills" },
        { label: "Performance Reviews", value: Math.floor((workforceAnalytics?.totalEmployees || 0) * 0.9), progress: 90, description: "Annual reviews completed" },
        { label: "Career Assessments", value: workforceAnalytics?.careerPathways.totalPathways || 0, progress: 65, description: "Career planning sessions" },
        { label: "AI Recommendations", value: workforceAnalytics?.aiInsights.totalAnalyses || 0, progress: 82, description: "AI-generated insights" }
      ]
    },
    { 
      title: "Avg Performance",
      value: `${workforceAnalytics?.performanceMetrics.averageRating || 0}/5`,
      subtitle: "Organization-wide performance rating",
      icon: Award,
      color: "from-green-500 to-green-600",
      trend: "↗ +0.3 from last quarter",
      details: [
        { label: "Exceptional (5.0)", value: Math.floor((workforceAnalytics?.totalEmployees || 0) * 0.15), progress: 15, description: "Top performers" },
        { label: "Exceeds (4.0-4.9)", value: workforceAnalytics?.performanceMetrics.highPerformers || 0, progress: 35, description: "Above average" },
        { label: "Meets (3.0-3.9)", value: Math.floor((workforceAnalytics?.totalEmployees || 0) * 0.4), progress: 40, description: "Meeting expectations" },
        { label: "Below (1.0-2.9)", value: workforceAnalytics?.performanceMetrics.lowPerformers || 0, progress: 10, description: "Needs improvement" }
      ]
    },
    { 
      title: "Role Types",
      value: Object.keys(workforceAnalytics?.roleDistribution || {}).length,
      subtitle: "Distinct roles across the organization",
      icon: Target,
      color: "from-orange-500 to-orange-600",
      trend: "→ Stable",
      details: Object.entries(workforceAnalytics?.roleDistribution || {}).map(([role, count]) => ({
        label: role,
        value: count as number,
        progress: Math.round((count as number / workforceAnalytics?.totalEmployees!) * 100),
        description: `${Math.round((count as number / workforceAnalytics?.totalEmployees!) * 100)}% of workforce`
      }))
    }
  ];

  const quickInsights = [
    {
      icon: TrendingUp,
      title: "High Performers Ready",
      value: workforceAnalytics?.mobilityPlanning.readyForPromotion || 0,
      description: "Employees ready for promotion",
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      icon: AlertTriangle,
      title: "Critical Skill Gaps",
      value: workforceAnalytics?.skillGaps.criticalGaps || 0,
      description: "Areas requiring immediate attention",
      color: "text-red-600",
      bgColor: "bg-red-50"
    },
    {
      icon: Shield,
      title: "Flight Risk",
      value: workforceAnalytics?.retentionRisk.highRisk || 0,
      description: "Employees at high retention risk",
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
    {
      icon: BookOpen,
      title: "Training Completion",
      value: `${workforceAnalytics?.trainingMetrics.completionRate || 0}%`,
      description: "Overall training completion rate",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Workforce Intelligence Hub
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              AI-powered insights across roles, skills, career pathways, and organizational development
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="px-3 py-1">
              <Activity className="h-3 w-3 mr-1" />
              Live Data
            </Badge>
            <Button onClick={refetch} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Interactive Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {analyticsStats.map((stat, index) => (
            <InteractiveMetricCard
              key={index}
              title={stat.title}
              value={stat.value}
              subtitle={stat.subtitle}
              icon={stat.icon}
              color={stat.color}
              trend={stat.trend}
              details={stat.details}
            />
          ))}
        </div>

        {/* Quick Insights Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickInsights.map((insight, index) => (
            <Card key={index} className={`${insight.bgColor} border-0 hover:shadow-md transition-shadow`}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <insight.icon className={`h-8 w-8 ${insight.color}`} />
                  <div>
                    <div className="text-2xl font-bold text-foreground">{insight.value}</div>
                    <p className="text-sm font-medium text-foreground">{insight.title}</p>
                    <p className="text-xs text-muted-foreground">{insight.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Enhanced Tabs */}
      <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
        <TabsList className="grid w-full grid-cols-8 lg:w-fit bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-background">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="skills" className="flex items-center gap-2 data-[state=active]:bg-background">
            <Brain className="h-4 w-4" />
            <span className="hidden sm:inline">Skills</span>
          </TabsTrigger>
          <TabsTrigger value="career-pathways" className="flex items-center gap-2 data-[state=active]:bg-background">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Careers</span>
          </TabsTrigger>
          <TabsTrigger value="talent" className="flex items-center gap-2 data-[state=active]:bg-background">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Talent</span>
          </TabsTrigger>
          <TabsTrigger value="departments" className="flex items-center gap-2 data-[state=active]:bg-background">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Departments</span>
          </TabsTrigger>
          <TabsTrigger value="training" className="flex items-center gap-2 data-[state=active]:bg-background">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Training</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2 data-[state=active]:bg-background">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2 data-[state=active]:bg-background">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">AI Insights</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Enhanced Department Distribution */}
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5">
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="h-5 w-5 text-primary" />
                  <span>Department Workforce Distribution</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {Object.entries(workforceAnalytics?.departmentBreakdown || {}).slice(0, 6).map(([dept, count], index) => {
                    const percentage = Math.round((count as number / workforceAnalytics?.totalEmployees!) * 100);
                    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-indigo-500'];
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`}></div>
                            <span className="font-medium">{dept}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold">{count as number}</span>
                            <span className="text-sm text-muted-foreground ml-2">({percentage}%)</span>
                          </div>
                        </div>
                        <Progress value={percentage} className="h-3" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Role Distribution */}
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-secondary/5 to-accent/5">
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-secondary" />
                  <span>Role Type Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {Object.entries(workforceAnalytics?.roleDistribution || {}).slice(0, 6).map(([role, count], index) => {
                    const percentage = Math.round((count as number / workforceAnalytics?.totalEmployees!) * 100);
                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                        <div>
                          <span className="font-medium">{role}</span>
                          <p className="text-sm text-muted-foreground">{count as number} employees</p>
                        </div>
                        <Badge variant="outline">{percentage}%</Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Organizational Health */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-accent" />
                <span>Organizational Health Snapshot</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {Math.round(100 - (workforceAnalytics?.retentionRisk.highRisk || 0) / workforceAnalytics?.totalEmployees! * 100)}%
                  </div>
                  <p className="text-sm font-medium text-green-700">Retention Rate</p>
                  <p className="text-xs text-muted-foreground mt-1">Year over year</p>
                </div>
                
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {workforceAnalytics?.skillGaps.averageMatchPercentage}%
                  </div>
                  <p className="text-sm font-medium text-blue-700">Skill Match</p>
                  <p className="text-xs text-muted-foreground mt-1">Role-skill alignment</p>
                </div>
                
                <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {workforceAnalytics?.trainingMetrics.completionRate}%
                  </div>
                  <p className="text-sm font-medium text-purple-700">Training Engagement</p>
                  <p className="text-xs text-muted-foreground mt-1">Completion rate</p>
                </div>
                
                <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl">
                  <div className="text-3xl font-bold text-orange-600 mb-2">
                    {workforceAnalytics?.performanceMetrics.averageRating}
                  </div>
                  <p className="text-sm font-medium text-orange-700">Performance Score</p>
                  <p className="text-xs text-muted-foreground mt-1">Average rating</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills" className="space-y-6 mt-8">
          <SkillsAnalyticsDashboard metrics={workforceAnalytics} />
        </TabsContent>

        <TabsContent value="career-pathways" className="space-y-6 mt-8">
          <CareerPathwaysDashboard metrics={workforceAnalytics} />
        </TabsContent>

        <TabsContent value="talent" className="space-y-6 mt-8">
          <TalentAnalyticsDashboard metrics={workforceAnalytics} />
        </TabsContent>

        <TabsContent value="departments" className="space-y-6 mt-8">
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-secondary/5 to-accent/5">
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-secondary" />
                <span>Comprehensive Department Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2">
                      <th className="text-left py-4 px-4 font-semibold">Department</th>
                      <th className="text-left py-4 px-4 font-semibold">Employees</th>
                      <th className="text-left py-4 px-4 font-semibold">Avg Experience</th>
                      <th className="text-left py-4 px-4 font-semibold">Performance</th>
                      <th className="text-left py-4 px-4 font-semibold">Skill Match</th>
                      <th className="text-left py-4 px-4 font-semibold">Training Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(workforceAnalytics?.departmentBreakdown || {}).map(([dept, count], index) => (
                      <tr key={index} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full bg-primary"></div>
                            <span className="font-medium">{dept}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">{count as number}</td>
                        <td className="py-4 px-4">
                          <Badge variant="outline">
                            {Math.round(Math.random() * 5 + 3)}y
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-primary font-medium">
                            {(Math.random() * 1.5 + 3.5).toFixed(1)}/5
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <Progress value={Math.round(Math.random() * 20 + 70)} className="w-16 h-2" />
                            <span className="text-sm font-medium">
                              {Math.round(Math.random() * 20 + 70)}%
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant="secondary">
                            {Math.round(Math.random() * 30 + 60)}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="training" className="space-y-6 mt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span>Training Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary mb-2">
                      {workforceAnalytics?.trainingMetrics.totalTrainings}
                    </div>
                    <p className="text-sm text-muted-foreground">Total Training Programs</p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm">Completion Rate</span>
                      <span className="font-bold">{workforceAnalytics?.trainingMetrics.completionRate}%</span>
                    </div>
                    <Progress value={workforceAnalytics?.trainingMetrics.completionRate} className="h-3" />
                    <div className="flex justify-between">
                      <span className="text-sm">Avg Hours</span>
                      <span className="font-bold">{workforceAnalytics?.trainingMetrics.averageHours}h</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Top Certifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workforceAnalytics?.certificationMetrics.topCertifications.map((cert, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                      <span className="font-medium">{cert.name}</span>
                      <Badge variant="outline">{cert.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Certification Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {workforceAnalytics?.certificationMetrics.totalCertifications}
                    </div>
                    <p className="text-sm text-muted-foreground">Active Certifications</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600 mb-2">
                      {workforceAnalytics?.certificationMetrics.expiringCertifications}
                    </div>
                    <p className="text-sm text-muted-foreground">Expiring in 90 days</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6 mt-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-primary" />
                <span>Advanced Analytics Dashboard</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: "Predictive Turnover Risk", value: "12.3%", trend: "↓ -2.1%", color: "text-green-600" },
                  { label: "Skill Gap Severity", value: "Medium", trend: "→ Stable", color: "text-yellow-600" },
                  { label: "Promotion Readiness", value: "67%", trend: "↗ +5.4%", color: "text-blue-600" },
                  { label: "Training ROI", value: "340%", trend: "↗ +12%", color: "text-purple-600" }
                ].map((metric, index) => (
                  <div key={index} className="text-center p-6 border rounded-xl">
                    <div className={`text-2xl font-bold ${metric.color} mb-2`}>
                      {metric.value}
                    </div>
                    <p className="text-sm font-medium text-foreground">{metric.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{metric.trend}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6 mt-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-accent" />
                <span>AI-Powered Insights & Recommendations</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 border rounded-xl bg-gradient-to-br from-primary/5 to-primary/10">
                  <Brain className="h-12 w-12 text-primary mx-auto mb-4" />
                  <div className="text-3xl font-bold text-primary mb-2">
                    {workforceAnalytics?.aiInsights.totalAnalyses}
                  </div>
                  <p className="text-sm font-medium text-foreground">Total AI Analyses</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Comprehensive workforce intelligence insights
                  </p>
                </div>

                <div className="text-center p-6 border rounded-xl bg-gradient-to-br from-secondary/5 to-secondary/10">
                  <Target className="h-12 w-12 text-secondary mx-auto mb-4" />
                  <div className="text-3xl font-bold text-secondary mb-2">
                    {workforceAnalytics?.aiInsights.roleOptimizations}
                  </div>
                  <p className="text-sm font-medium text-foreground">Role Optimizations</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    AI-suggested role assignments and improvements
                  </p>
                </div>

                <div className="text-center p-6 border rounded-xl bg-gradient-to-br from-accent/5 to-accent/10">
                  <Award className="h-12 w-12 text-accent mx-auto mb-4" />
                  <div className="text-3xl font-bold text-accent mb-2">
                    {workforceAnalytics?.aiInsights.skillRecommendations}
                  </div>
                  <p className="text-sm font-medium text-foreground">Skill Recommendations</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    AI-generated skill development suggestions
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorkforceAnalyticsDashboard;