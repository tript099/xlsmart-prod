import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AISkillsAssessmentEnhanced } from "@/components/AISkillsAssessmentEnhanced";
import { SkillsListDetails } from "@/components/SkillsListDetails";
import { Brain, TrendingUp, Award, Users, Target, Zap, BarChart3, CheckCircle, AlertTriangle, BookOpen } from "lucide-react";
import { useAIStats } from "@/components/AIStatsProvider";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const SkillsDashboard = () => {
  const aiStats = useAIStats();
  const [activeDialog, setActiveDialog] = useState<string | null>(null);
  const [skillAnalytics, setSkillAnalytics] = useState({
    totalEmployees: 0,
    assessedEmployees: 0,
    totalSkills: 0,
    skillGaps: 0,
    avgSkillLevel: 0,
    topSkills: [],
    criticalGaps: [],
    recentAssessments: []
  });

  useEffect(() => {
    const fetchSkillAnalytics = async () => {
      try {
        // Fetch employee counts
        const { count: totalEmployees } = await supabase
          .from('xlsmart_employees')
          .select('*', { count: 'exact', head: true });

        // Fetch skills data
        const { count: totalSkills } = await supabase
          .from('skills_master')
          .select('*', { count: 'exact', head: true });

        // Fetch skill assessments
        const { data: assessments, count: assessedEmployees } = await supabase
          .from('xlsmart_skill_assessments')
          .select('*', { count: 'exact' });

        // Calculate analytics
        const avgSkillLevel = assessments?.length > 0 
          ? assessments.reduce((sum, a) => sum + (a.overall_match_percentage || 0), 0) / assessments.length 
          : 0;

        setSkillAnalytics({
          totalEmployees: totalEmployees || 0,
          assessedEmployees: assessedEmployees || 0,
          totalSkills: totalSkills || 0,
          skillGaps: assessments?.reduce((sum, a) => sum + (Array.isArray(a.skill_gaps) ? a.skill_gaps.length : 0), 0) || 0,
          avgSkillLevel: Math.round(avgSkillLevel * 10) / 10,
          topSkills: [],
          criticalGaps: [],
          recentAssessments: assessments?.slice(0, 5) || []
        });
      } catch (error) {
        console.error('Error fetching skill analytics:', error);
      }
    };

    fetchSkillAnalytics();
  }, []);

  const skillsStats = [
    { 
      value: skillAnalytics.totalSkills || "...", 
      label: "Total Skills", 
      icon: Brain, 
      color: "text-primary",
      description: "Identified skills"
    },
    { 
      value: skillAnalytics.totalEmployees > 0 
        ? `${Math.round((skillAnalytics.assessedEmployees / skillAnalytics.totalEmployees) * 100)}%`
        : "0%", 
      label: "Assessment Coverage", 
      icon: Users, 
      color: "text-secondary",
      description: "Employees assessed"
    },
    { 
      value: `${skillAnalytics.avgSkillLevel}%`, 
      label: "Avg Match Score", 
      icon: TrendingUp, 
      color: "text-accent",
      description: "Skills-role alignment"
    },
    { 
      value: skillAnalytics.skillGaps, 
      label: "Skill Gaps", 
      icon: AlertTriangle, 
      color: "text-destructive",
      description: "Identified gaps"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-foreground">Skills & Talent Management</h1>
        <p className="text-muted-foreground text-lg">
          AI-powered skills assessment, role standardization, and talent optimization
        </p>
      </div>

      {/* Skills Stats */}
      <section className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl p-6 border">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-2">Real-time Skills Analytics</h2>
          <p className="text-muted-foreground">
            Live insights from {skillAnalytics.totalEmployees} employees across your organization
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {skillsStats.map((stat, index) => (
            <Card 
              key={index} 
              className="hover:shadow-lg transition-all duration-300 border-0 shadow-sm bg-background/50 backdrop-blur-sm cursor-pointer"
              onClick={() => {
                if (index === 0) {
                  setActiveDialog('skills-details');
                }
              }}
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
      <Tabs defaultValue="assessment" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-fit">
          <TabsTrigger value="assessment" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            <span className="hidden sm:inline">Skills Assessment</span>
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Skills Inventory</span>
          </TabsTrigger>
          <TabsTrigger value="gaps" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Gap Analysis</span>
          </TabsTrigger>
          <TabsTrigger value="ai-insights" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">AI Insights</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assessment" className="space-y-6 mt-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5">
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-5 w-5 text-primary" />
                <span>AI Skills Assessment Engine</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <AISkillsAssessmentEnhanced />
            </CardContent>
          </Card>

          {/* Recent Assessments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span>Recent Assessments</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {skillAnalytics.recentAssessments.length > 0 ? (
                  skillAnalytics.recentAssessments.map((assessment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Assessment #{assessment.id?.slice(-8)}</p>
                        <p className="text-sm text-muted-foreground">
                          Match Score: {assessment.overall_match_percentage}%
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(assessment.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">No assessments yet. Start by running your first AI skills assessment.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6 mt-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-secondary/5 to-accent/5">
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-secondary" />
                <span>Skills Inventory & Analytics</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <SkillsListDetails />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gaps" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <span>Top Skills in Organization</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">JavaScript/TypeScript</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 h-2 bg-muted rounded-full">
                        <div className="w-4/5 h-2 bg-gradient-to-r from-primary to-primary/80 rounded-full"></div>
                      </div>
                      <span className="text-sm font-medium text-primary">80%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Project Management</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 h-2 bg-muted rounded-full">
                        <div className="w-3/4 h-2 bg-gradient-to-r from-secondary to-secondary/80 rounded-full"></div>
                      </div>
                      <span className="text-sm font-medium text-secondary">75%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Data Analysis</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 h-2 bg-muted rounded-full">
                        <div className="w-3/5 h-2 bg-gradient-to-r from-accent to-accent/80 rounded-full"></div>
                      </div>
                      <span className="text-sm font-medium text-accent">60%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Cloud Computing</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 h-2 bg-muted rounded-full">
                        <div className="w-1/3 h-2 bg-gradient-to-r from-destructive to-destructive/80 rounded-full"></div>
                      </div>
                      <span className="text-sm font-medium text-destructive">35%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <span>Critical Skills Gaps</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-destructive">Cloud Computing</p>
                      <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded">CRITICAL</span>
                    </div>
                    <p className="text-sm text-muted-foreground">65% of roles require this skill</p>
                    <p className="text-xs text-muted-foreground mt-1">Recommended: AWS/Azure certification program</p>
                  </div>
                  <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-yellow-700">Machine Learning</p>
                      <span className="text-xs bg-yellow-500/10 text-yellow-700 px-2 py-1 rounded">MODERATE</span>
                    </div>
                    <p className="text-sm text-muted-foreground">40% of roles require this skill</p>
                    <p className="text-xs text-muted-foreground mt-1">Recommended: Python ML bootcamp</p>
                  </div>
                  <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-blue-700">Agile Methodologies</p>
                      <span className="text-xs bg-blue-500/10 text-blue-700 px-2 py-1 rounded">MINOR</span>
                    </div>
                    <p className="text-sm text-muted-foreground">25% of roles require this skill</p>
                    <p className="text-xs text-muted-foreground mt-1">Recommended: Scrum Master certification</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ai-insights" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-0 shadow-md bg-gradient-to-br from-primary/5 to-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="h-5 w-5 text-primary" />
                  <span>Skill Predictions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-4">
                  AI predicts future skill demands based on industry trends
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
                  AI identifies optimal role-employee matches
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
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-0 shadow-md bg-gradient-to-br from-accent/5 to-accent/10">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-accent" />
                  <span>Learning Recommendations</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-4">
                  Personalized learning paths for skill development
                </p>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Active Programs:</span> 
                    <span className="text-accent ml-1">47</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Completion Rate:</span> 
                    <span className="text-accent ml-1">78%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Detail Dialogs */}
      <Dialog open={activeDialog === 'skills-details'} onOpenChange={(open) => setActiveDialog(open ? 'skills-details' : null)}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogTitle className="sr-only">Skills Details</DialogTitle>
          <SkillsListDetails />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SkillsDashboard;