import React, { useCallback, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AIJobDescriptionGeneratorEnhanced } from "@/components/AIJobDescriptionGeneratorEnhanced";
import { AIJobDescriptionsIntelligence } from "@/components/AIJobDescriptionsIntelligence";
import AIRoleAssignmentTester from "@/components/AIRoleAssignmentTester";
import JobDescriptionDialog from "@/components/JobDescriptionDialog";
import { useJobDescriptionStats } from "@/hooks/useJobDescriptionStats";
import { useRecentJobDescriptions } from "@/hooks/useRecentJobDescriptions";
import { useNavigate } from "react-router-dom";
import { FileText, Zap, CheckCircle, Clock, Brain, Loader2 } from "lucide-react";

const JobDescriptionsDashboard = () => {
  console.log('🔄 JobDescriptionsDashboard rendered');
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("generator");
  
  console.log('🎯 Current activeTab:', activeTab);
  const [activeDialog, setActiveDialog] = useState<string | null>(null);
  const { totalJDs, activeJDs, draftJDs, approvedJDs, pendingJDs, loading } = useJobDescriptionStats();
  const { recentJDs, loading: recentLoading } = useRecentJobDescriptions();
  console.log('📊 Dashboard stats:', { totalJDs, activeJDs, draftJDs, approvedJDs, pendingJDs, loading });

  const handleCardClick = useCallback((cardType: string, index: number) => {
    console.log('🔍 Card clicked:', cardType, index);
    
    // Open dialog instead of navigation to prevent page reload
    if (index === 0) {
      setActiveDialog('all-jds');
    } else if (index === 1) {
      setActiveDialog('approved-jds');
    } else if (index === 2) {
      setActiveDialog('pending-jds');
    } else if (index === 3) {
      setActiveDialog('active-jds');
    }
  }, []);

  // Memoize the stats array to prevent re-renders
  const jdStats = useMemo(() => [
    { 
      value: loading ? "Loading..." : totalJDs.toLocaleString(), 
      label: "Generated JDs", 
      icon: FileText, 
      color: "text-blue-600",
      description: "Total job descriptions",
      status: "all"
    },
    { 
      value: loading ? "Loading..." : `${approvedJDs}`, 
      label: "Approved JDs", 
      icon: CheckCircle, 
      color: "text-green-600",
      description: "Approved job descriptions",
      status: "approved"
    },
    { 
      value: loading ? "Loading..." : `${pendingJDs}`, 
      label: "Pending Review", 
      icon: Clock, 
      color: "text-purple-600",
      description: "Need approval or review",
      status: "draft,review"
    },
    { 
      value: loading ? "Loading..." : `${activeJDs}`, 
      label: "Active JDs", 
      icon: Zap, 
      color: "text-orange-600",
      description: "Currently in use",
      status: "published"
    }
  ], [loading, totalJDs, approvedJDs, pendingJDs, activeJDs]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-foreground">Job Descriptions</h1>
        <p className="text-muted-foreground text-lg">
          Generate, manage, and analyze job descriptions with AI assistance
        </p>
      </div>

      {/* JD Stats */}
      <section className="bg-muted/50 rounded-xl p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-2">Job Description Statistics</h2>
          <p className="text-muted-foreground">
            Overview of job description generation and management metrics
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {jdStats.map((stat, index) => (
            <Card 
              key={`${stat.label}-${stat.value}`}
              className="hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-105"
              onClick={() => handleCardClick(stat.status, index)}
            >
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
                    <div className={`text-2xl font-bold ${stat.color} flex items-center gap-2`}>
                      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
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

      {/* AI Job Description Tools */}
      <section>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-2">AI Job Description Tools</h2>
          <p className="text-muted-foreground">
            Generate, analyze, and optimize job descriptions with AI-powered intelligence
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="generator" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Generator
            </TabsTrigger>
            <TabsTrigger value="intelligence" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Intelligence
            </TabsTrigger>
            <TabsTrigger value="tester" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Tester
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generator" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <span>Generate Job Descriptions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AIJobDescriptionGeneratorEnhanced />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="intelligence" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="h-5 w-5 text-primary" />
                  <span>Job Description Intelligence</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AIJobDescriptionsIntelligence />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="tester" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="h-5 w-5 text-primary" />
                  <span>AI System Tester</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AIRoleAssignmentTester />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      {/* JD Management Features */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Generations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading recent job descriptions...</span>
                </div>
              ) : recentJDs.length > 0 ? (
                recentJDs.map((jd) => (
                  <div key={jd.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">{jd.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Generated {new Date(jd.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className={`text-sm ${
                      jd.status === 'approved' ? 'text-green-600' :
                      jd.status === 'published' ? 'text-blue-600' :
                      jd.status === 'review' ? 'text-yellow-600' :
                      'text-gray-600'
                    }`}>
                      {jd.status === 'approved' && '✓ Approved'}
                      {jd.status === 'published' && '✓ Published'}
                      {jd.status === 'review' && '⏳ Review'}
                      {jd.status === 'draft' && '📝 Draft'}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center p-8 text-muted-foreground">
                  No job descriptions found. Generate your first JD using the tools above.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quality Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Completeness Score</span>
                <span className="font-semibold text-green-600">95%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Industry Alignment</span>
                <span className="font-semibold text-blue-600">92%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Skills Coverage</span>
                <span className="font-semibold text-purple-600">88%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Compliance Rate</span>
                <span className="font-semibold text-orange-600">97%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Dialog Modals for JD Details */}
      <Dialog open={activeDialog === 'all-jds'} onOpenChange={(open) => setActiveDialog(open ? 'all-jds' : null)}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="sr-only">All Job Descriptions</DialogTitle>
          <JobDescriptionDialog statusFilters={['all']} />
        </DialogContent>
      </Dialog>

      <Dialog open={activeDialog === 'approved-jds'} onOpenChange={(open) => setActiveDialog(open ? 'approved-jds' : null)}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="sr-only">Approved Job Descriptions</DialogTitle>
          <JobDescriptionDialog statusFilters={['approved']} />
        </DialogContent>
      </Dialog>

      <Dialog open={activeDialog === 'pending-jds'} onOpenChange={(open) => setActiveDialog(open ? 'pending-jds' : null)}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="sr-only">Pending Review Job Descriptions</DialogTitle>
          <JobDescriptionDialog statusFilters={['draft', 'review']} />
        </DialogContent>
      </Dialog>

      <Dialog open={activeDialog === 'active-jds'} onOpenChange={(open) => setActiveDialog(open ? 'active-jds' : null)}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="sr-only">Active Job Descriptions</DialogTitle>
          <JobDescriptionDialog statusFilters={['published']} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JobDescriptionsDashboard;