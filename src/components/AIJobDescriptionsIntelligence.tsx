import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, TrendingUp, Target, Shield, Brain, AlertTriangle, CheckCircle, Star } from "lucide-react";
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

  const analysisTypes = [
    { value: 'jd_optimization', label: 'JD Optimization', icon: Target },
    { value: 'market_alignment', label: 'Market Alignment', icon: TrendingUp },
    { value: 'skills_mapping', label: 'Skills Mapping', icon: Brain },
    { value: 'compliance_analysis', label: 'Compliance Analysis', icon: Shield }
  ];

  const handleAnalysis = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-job-descriptions-intelligence', {
        body: {
          analysisType: selectedAnalysis,
          // Note: Department filtering not supported yet as xlsmart_job_descriptions 
          // table doesn't have department column
          // departmentFilter: departmentFilter || undefined,
          // roleFilter: roleFilter || undefined
        }
      });

      if (error) throw error;
      
      setResults(data);
      onAnalysisComplete?.(data);
      toast.success('Job descriptions analysis completed!');
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to complete analysis');
    } finally {
      setIsLoading(false);
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
        <Select value={selectedAnalysis} onValueChange={setSelectedAnalysis}>
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
          {isLoading ? 'Analyzing...' : 'Run Analysis'}
          <FileText className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {results && (
        <Tabs value={selectedAnalysis} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="jd_optimization">Optimization</TabsTrigger>
            <TabsTrigger value="market_alignment">Market</TabsTrigger>
            <TabsTrigger value="skills_mapping">Skills</TabsTrigger>
            <TabsTrigger value="compliance_analysis">Compliance</TabsTrigger>
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