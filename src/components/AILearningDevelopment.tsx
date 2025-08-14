import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, TrendingUp, Award, Users, Target, Clock, CheckCircle, Brain, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LearningDevelopmentProps {
  onAnalysisComplete?: (result: any) => void;
}

export function AILearningDevelopment({ onAnalysisComplete }: LearningDevelopmentProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<string>('personalized_learning');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [employeeId, setEmployeeId] = useState<string>('');
  const { toast } = useToast();

  const analysisTypes = [
    { value: 'personalized_learning', label: 'Personalized Learning', icon: BookOpen },
    { value: 'skills_development', label: 'Skills Development', icon: TrendingUp },
    { value: 'training_effectiveness', label: 'Training Effectiveness', icon: Award },
    { value: 'learning_strategy', label: 'Learning Strategy', icon: Brain }
  ];

  const handleAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-learning-development', {
        body: {
          analysisType: selectedAnalysis,
          departmentFilter: departmentFilter || undefined,
          employeeId: employeeId || undefined
        }
      });

      if (error) throw error;

      setAnalysisResult(data);
      onAnalysisComplete?.(data);
      
      toast({
        title: "Analysis Complete",
        description: "AI learning & development analysis has been completed successfully.",
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: "Failed to complete learning & development analysis. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderPersonalizedLearningResults = () => {
    if (!analysisResult?.personalizedPlans) return null;

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Personalized Learning Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysisResult.personalizedPlans?.slice(0, 6).map((plan: any, index: number) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Employee: {plan.currentProfile?.role}</h4>
                    <Badge variant="outline">{plan.currentProfile?.skillLevel}</Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h5 className="font-medium text-sm mb-2">Learning Objectives</h5>
                      <ul className="text-sm space-y-1">
                        {plan.learningObjectives?.slice(0, 3).map((obj: string, idx: number) => (
                          <li key={idx} className="text-muted-foreground">• {obj}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-sm mb-2">Learning Preferences</h5>
                      <div className="text-sm space-y-1">
                        <p><strong>Modality:</strong> {plan.learningPreferences?.modality}</p>
                        <p><strong>Pace:</strong> {plan.learningPreferences?.pace}</p>
                        <p><strong>Time:</strong> {plan.learningPreferences?.timeCommitment}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium text-sm mb-2">Top Skill Development Areas</h5>
                    <div className="space-y-2">
                      {plan.skillDevelopmentPlan?.slice(0, 3).map((skill: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="text-sm">{skill.skillName}</span>
                          <div className="flex items-center space-x-2">
                            <Progress value={(skill.currentLevel / skill.targetLevel) * 100} className="w-20 h-2" />
                            <Badge variant={skill.priority === 'High' ? 'destructive' : 'secondary'} className="text-xs">
                              {skill.priority}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {analysisResult.learningRecommendations && (
          <Card>
            <CardHeader>
              <CardTitle>Learning Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Immediate Actions</h4>
                  <ul className="space-y-1">
                    {analysisResult.learningRecommendations.immediateActions?.map((action: string, index: number) => (
                      <li key={index} className="text-sm text-muted-foreground">• {action}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Quarterly Goals</h4>
                  <ul className="space-y-1">
                    {analysisResult.learningRecommendations.quarterlyGoals?.map((goal: string, index: number) => (
                      <li key={index} className="text-sm text-muted-foreground">• {goal}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Annual Targets</h4>
                  <ul className="space-y-1">
                    {analysisResult.learningRecommendations.annualTargets?.map((target: string, index: number) => (
                      <li key={index} className="text-sm text-muted-foreground">• {target}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>Estimated Budget:</strong> IDR {analysisResult.learningRecommendations.budgetEstimate?.toLocaleString() || 'N/A'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderSkillsDevelopmentResults = () => {
    if (!analysisResult?.organizationalSkillsGaps) return null;

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Organizational Skills Gaps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysisResult.organizationalSkillsGaps?.map((gap: any, index: number) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{gap.skillCategory}</h4>
                    <Badge variant={
                      gap.gapSeverity === 'Critical' ? 'destructive' :
                      gap.gapSeverity === 'High' ? 'secondary' : 'outline'
                    }>
                      {gap.gapSeverity}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm"><strong>Current:</strong> {gap.currentCapability}</p>
                      <p className="text-sm"><strong>Target:</strong> {gap.targetCapability}</p>
                    </div>
                    <div>
                      <p className="text-sm"><strong>Affected Roles:</strong> {gap.affectedRoles?.join(', ')}</p>
                      <p className="text-sm"><strong>Priority:</strong> {gap.developmentPriority}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-sm font-medium">Recommended Programs:</p>
                    <p className="text-sm text-muted-foreground">{gap.recommendedPrograms?.join(', ')}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {analysisResult.skillsDevelopmentPrograms && (
          <Card>
            <CardHeader>
              <CardTitle>Recommended Development Programs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysisResult.skillsDevelopmentPrograms?.map((program: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{program.programName}</h4>
                      <Badge variant="outline">{program.delivery}</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm"><strong>Target Skills:</strong></p>
                        <p className="text-sm text-muted-foreground">{program.targetSkills?.join(', ')}</p>
                      </div>
                      <div>
                        <p className="text-sm"><strong>Duration:</strong> {program.duration}</p>
                        <p className="text-sm"><strong>Investment:</strong> IDR {program.investmentRequired?.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm"><strong>ROI:</strong> {program.roi}</p>
                        <p className="text-sm"><strong>Audience:</strong> {program.targetAudience}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderTrainingEffectivenessResults = () => {
    if (!analysisResult?.trainingEffectivenessMetrics) return null;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{analysisResult.trainingEffectivenessMetrics.totalTrainingsCompleted}</p>
                  <p className="text-sm text-muted-foreground">Trainings Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-secondary" />
                <div>
                  <p className="text-2xl font-bold">{analysisResult.trainingEffectivenessMetrics.avgCompletionRate}%</p>
                  <p className="text-sm text-muted-foreground">Completion Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-accent" />
                <div>
                  <p className="text-2xl font-bold">{analysisResult.trainingEffectivenessMetrics.skillImprovementRate}%</p>
                  <p className="text-sm text-muted-foreground">Skill Improvement</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{analysisResult.trainingEffectivenessMetrics.trainingROI}%</p>
                  <p className="text-sm text-muted-foreground">Training ROI</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Program Performance Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysisResult.programPerformance?.map((program: any, index: number) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">{program.programName}</h4>
                    <Badge variant={
                      program.continuationDecision === 'Continue' ? 'default' :
                      program.continuationDecision === 'Modify' ? 'secondary' : 'destructive'
                    }>
                      {program.continuationDecision}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-sm font-medium">Completion Rate</p>
                      <Progress value={program.completionRate} className="h-2 mt-1" />
                      <p className="text-xs text-muted-foreground mt-1">{program.completionRate}%</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Average Rating</p>
                      <p className="text-lg font-bold text-primary">{program.averageRating}/5</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Skill Improvement</p>
                      <p className="text-lg font-bold text-secondary">{program.skillImprovementMeasured}%</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Business Impact</p>
                      <Badge variant="outline">{program.businessImpact}</Badge>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium">Recommendations:</p>
                    <p className="text-sm text-muted-foreground">{program.recommendations?.join(', ')}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span>AI Learning & Development Intelligence</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium mb-2 block">Analysis Type</label>
              <Select value={selectedAnalysis} onValueChange={setSelectedAnalysis}>
                <SelectTrigger>
                  <SelectValue placeholder="Select analysis type" />
                </SelectTrigger>
                <SelectContent>
                  {analysisTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center space-x-2">
                        <type.icon className="h-4 w-4" />
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Department Filter</label>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="Engineering">Engineering</SelectItem>
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="HR">Human Resources</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Employee ID (Optional)</label>
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="All employees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={handleAnalysis} 
                disabled={isAnalyzing}
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Run Analysis
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {analysisResult && (
        <div className="space-y-6">
          {selectedAnalysis === 'personalized_learning' && renderPersonalizedLearningResults()}
          {selectedAnalysis === 'skills_development' && renderSkillsDevelopmentResults()}
          {selectedAnalysis === 'training_effectiveness' && renderTrainingEffectivenessResults()}
          {selectedAnalysis === 'learning_strategy' && (
            <Card>
              <CardHeader>
                <CardTitle>Learning Strategy Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Learning strategy results will be displayed here</p>
                  <pre className="text-xs text-left mt-4 bg-muted p-4 rounded overflow-auto max-h-96">
                    {JSON.stringify(analysisResult, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}