import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, TrendingUp, Target, Shield, Brain, AlertTriangle, CheckCircle, Star, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface JobDescriptionsIntelligenceProps {
  onAnalysisComplete?: (result: any) => void;
}

export const AIJobDescriptionsIntelligence: React.FC<JobDescriptionsIntelligenceProps> = ({ onAnalysisComplete }) => {
  const [selectedAnalysis, setSelectedAnalysis] = useState<string>('jd_optimization');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [fixingJobs, setFixingJobs] = useState<Set<string>>(new Set());
  const [pastResults, setPastResults] = useState<any[]>([]);
  const [selectedResultId, setSelectedResultId] = useState<string>('');

  const analysisTypes = [
    { value: 'jd_optimization', label: 'JD Optimization', icon: Target },
    { value: 'market_alignment', label: 'Market Alignment', icon: TrendingUp },
    { value: 'skills_mapping', label: 'Skills Mapping', icon: Brain },
    { value: 'compliance_analysis', label: 'Compliance Analysis', icon: Shield }
  ];

  React.useEffect(() => {
    fetchPastResults();
  }, []);

  const fetchPastResults = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_analysis_results')
        .select('*')
        .eq('function_name', 'ai-job-descriptions-intelligence')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPastResults(data || []);
    } catch (error) {
      console.error('Error fetching past results:', error);
    }
  };

  const handleAnalysis = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-job-descriptions-intelligence', {
        body: {
          analysisType: selectedAnalysis,
        }
      });

      if (error) throw error;
      
      setResults(data);
      setSelectedResultId(''); // Clear selected result ID for new analysis
      onAnalysisComplete?.(data);
      toast.success('Job descriptions analysis completed!');
      
      // Refresh past results to include the new one
      await fetchPastResults();
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to complete analysis');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalysisTypeChange = async (newAnalysisType: string) => {
    setSelectedAnalysis(newAnalysisType);
    
    // Check if we have cached results for this analysis type
    const cachedResult = pastResults.find(
      result => result.analysis_type === newAnalysisType
    );

    if (cachedResult) {
      setResults(cachedResult.analysis_result);
      setSelectedResultId(cachedResult.id);
      toast.success('Loaded cached analysis results');
    } else {
      setResults(null);
      setSelectedResultId('');
    }
  };

  const handleLoadPastResult = (resultId: string) => {
    const result = pastResults.find(r => r.id === resultId);
    if (result) {
      setResults(result.analysis_result);
      setSelectedResultId(resultId);
      setSelectedAnalysis(result.analysis_type);
      toast.success('Loaded past analysis result');
    }
  };

  const handleFixJobDescription = async (jobId: string, recommendations: string[]) => {
    setFixingJobs(prev => new Set([...prev, jobId]));
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-job-description-fix', {
        body: {
          jobDescriptionId: jobId,
          recommendations
        }
      });

      if (error) throw error;
      
      toast.success(`Job description improved! ${data.improvementsMade?.length || 0} improvements applied.`);
      
      // Refresh the analysis results
      await handleAnalysis();
      
    } catch (error) {
      console.error('Fix error:', error);
      toast.error('Failed to fix job description');
    } finally {
      setFixingJobs(prev => {
        const newSet = new Set(prev);
        newSet.delete(jobId);
        return newSet;
      });
    }
  };

  const renderOptimizationResults = (data: any) => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{data.summary?.totalAnalyzed || 0}</div>
            <div className="text-sm text-muted-foreground">Job Descriptions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-secondary">{data.summary?.averageCompleteness || 0}%</div>
            <div className="text-sm text-muted-foreground">Avg Completeness</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-accent">{data.summary?.averageClarity || 0}%</div>
            <div className="text-sm text-muted-foreground">Avg Clarity</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{data.summary?.improvementOpportunities || 0}</div>
            <div className="text-sm text-muted-foreground">Improvement Areas</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Optimization Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.optimizationRecommendations?.map((rec: any, index: number) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{rec.role}</h4>
                  <div className="flex items-center gap-2">
                    <Progress value={rec.currentScore} className="w-20" />
                    <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}>
                      {rec.priority}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleFixJobDescription(rec.jobId || `job-${index}`, rec.recommendations)}
                      disabled={fixingJobs.has(rec.jobId || `job-${index}`) || isLoading}
                      className="ml-2"
                    >
                      <Wrench className="h-3 w-3 mr-1" />
                      {fixingJobs.has(rec.jobId || `job-${index}`) ? 'Fixing...' : 'Fix'}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-red-600">Issues:</span>
                    <ul className="text-sm text-muted-foreground ml-4">
                      {rec.issues?.map((issue: string, i: number) => (
                        <li key={i}>• {issue}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-green-600">Recommendations:</span>
                    <ul className="text-sm text-muted-foreground ml-4">
                      {rec.recommendations?.map((recommendation: string, i: number) => (
                        <li key={i}>• {recommendation}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderMarketAlignmentResults = (data: any) => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{data.marketAlignment?.overallScore || 0}%</div>
            <div className="text-sm text-muted-foreground">Overall Score</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-secondary">{data.marketAlignment?.industryStandards || 0}%</div>
            <div className="text-sm text-muted-foreground">Industry Standards</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-accent">{data.marketAlignment?.competitivePositioning || 0}%</div>
            <div className="text-sm text-muted-foreground">Competitive Edge</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{data.marketAlignment?.salaryAlignment || 0}%</div>
            <div className="text-sm text-muted-foreground">Salary Alignment</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Role Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.roleAnalysis?.slice(0, 5).map((role: any, index: number) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{role.role}</h4>
                    <div className="flex items-center gap-2">
                      <Progress value={role.marketAlignment} className="w-20" />
                      <span className="text-sm font-medium">{role.marketAlignment}%</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-green-600">Strengths:</span>
                      <ul className="text-muted-foreground ml-2">
                        {role.strengthAreas?.slice(0, 2).map((strength: string, i: number) => (
                          <li key={i}>• {strength}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="font-medium text-orange-600">Improvements:</span>
                      <ul className="text-muted-foreground ml-2">
                        {role.improvementAreas?.slice(0, 2).map((improvement: string, i: number) => (
                          <li key={i}>• {improvement}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Industry Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.industryTrends?.map((trend: any, index: number) => (
                <div key={index} className="border-l-4 border-primary pl-4">
                  <h4 className="font-medium">{trend.trend}</h4>
                  <p className="text-sm text-muted-foreground">{trend.impact}</p>
                  <p className="text-sm text-primary mt-1">{trend.recommendation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderSkillsMappingResults = (data: any) => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{data.skillsAlignment?.overallMatch || 0}%</div>
            <div className="text-sm text-muted-foreground">Overall Match</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{data.skillsAlignment?.criticalSkillsGap || 0}%</div>
            <div className="text-sm text-muted-foreground">Critical Gaps</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{data.skillsAlignment?.emergingSkillsReadiness || 0}%</div>
            <div className="text-sm text-muted-foreground">Future Ready</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{data.skillsAlignment?.skillsInflation || 0}%</div>
            <div className="text-sm text-muted-foreground">Skills Inflation</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Skills Analysis by Role</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.skillsAnalysis?.slice(0, 5).map((analysis: any, index: number) => (
                <div key={index} className="border rounded-lg p-3">
                  <h4 className="font-medium mb-2">{analysis.role}</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-blue-600">Required:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {analysis.requiredSkills?.slice(0, 3).map((skill: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-red-600">Gaps:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {analysis.skillsGap?.slice(0, 3).map((gap: string, i: number) => (
                          <Badge key={i} variant="destructive" className="text-xs">{gap}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Emerging Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.emergingSkills?.map((skill: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{skill.skill}</h4>
                    <p className="text-sm text-muted-foreground">{skill.recommendation}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={skill.importance === 'high' ? 'destructive' : skill.importance === 'medium' ? 'default' : 'secondary'}>
                      {skill.importance}
                    </Badge>
                    <div className="text-sm text-muted-foreground mt-1">{skill.currentCoverage}% coverage</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderComplianceResults = (data: any) => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{data.complianceScore?.overall || 0}%</div>
            <div className="text-sm text-muted-foreground">Overall Score</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{data.complianceScore?.legalCompliance || 0}%</div>
            <div className="text-sm text-muted-foreground">Legal</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{data.complianceScore?.inclusivity || 0}%</div>
            <div className="text-sm text-muted-foreground">Inclusivity</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{data.complianceScore?.accessibility || 0}%</div>
            <div className="text-sm text-muted-foreground">Accessibility</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{data.complianceScore?.equalOpportunity || 0}%</div>
            <div className="text-sm text-muted-foreground">Equal Opportunity</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Compliance Issues</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.complianceIssues?.map((issue: any, index: number) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{issue.role}</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant={issue.severity === 'high' ? 'destructive' : issue.severity === 'medium' ? 'default' : 'secondary'}>
                      {issue.severity}
                    </Badge>
                    {issue.severity === 'high' ? <AlertTriangle className="h-4 w-4 text-red-600" /> : 
                     issue.severity === 'medium' ? <AlertTriangle className="h-4 w-4 text-orange-600" /> :
                     <CheckCircle className="h-4 w-4 text-green-600" />}
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-red-600">{issue.issueType}:</span>
                    <p className="text-sm text-muted-foreground">{issue.description}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-green-600">Recommendation:</span>
                    <p className="text-sm text-muted-foreground">{issue.recommendation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={selectedAnalysis} onValueChange={handleAnalysisTypeChange}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Select analysis type" />
          </SelectTrigger>
          <SelectContent>
            {analysisTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                <div className="flex items-center gap-2">
                  <type.icon className="h-4 w-4" />
                  {type.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedResultId} onValueChange={handleLoadPastResult}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Load past analysis" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">New Analysis</SelectItem>
            {pastResults.map((result) => (
              <SelectItem key={result.id} value={result.id}>
                <div className="flex flex-col">
                  <span className="font-medium">
                    {analysisTypes.find(t => t.value === result.analysis_type)?.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(result.created_at).toLocaleDateString()} {new Date(result.created_at).toLocaleTimeString()}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={departmentFilter} onValueChange={setDepartmentFilter} disabled>
          <SelectTrigger className="w-full sm:w-48 opacity-50">
            <SelectValue placeholder="All Departments (Filtering Coming Soon)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            <SelectItem value="Engineering">Engineering</SelectItem>
            <SelectItem value="Marketing">Marketing</SelectItem>
            <SelectItem value="Sales">Sales</SelectItem>
            <SelectItem value="HR">HR</SelectItem>
            <SelectItem value="Finance">Finance</SelectItem>
          </SelectContent>
        </Select>

        <Button 
          onClick={handleAnalysis} 
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          <FileText className="h-4 w-4 mr-2" />
          {isLoading ? 'Analyzing...' : selectedResultId ? 'Run New Analysis' : 'Analyze Job Descriptions'}
        </Button>
      </div>

      {selectedResultId && (
        <div className="bg-muted/50 border border-border rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-green-600" />
            Viewing cached result from {new Date(pastResults.find(r => r.id === selectedResultId)?.created_at || '').toLocaleString()}
          </div>
        </div>
      )}

      {results && (
        <Tabs value={selectedAnalysis} onValueChange={setSelectedAnalysis}>
          <TabsList className="grid w-full grid-cols-4">
            {analysisTypes.map((type) => (
              <TabsTrigger key={type.value} value={type.value} className="flex items-center gap-2">
                <type.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{type.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="jd_optimization" className="mt-6">
            {renderOptimizationResults(results)}
          </TabsContent>

          <TabsContent value="market_alignment" className="mt-6">
            {renderMarketAlignmentResults(results)}
          </TabsContent>

          <TabsContent value="skills_mapping" className="mt-6">
            {renderSkillsMappingResults(results)}
          </TabsContent>

          <TabsContent value="compliance_analysis" className="mt-6">
            {renderComplianceResults(results)}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};