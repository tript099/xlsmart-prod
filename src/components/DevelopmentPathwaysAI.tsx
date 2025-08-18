import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { BookOpen, ArrowRight, Target, Clock, Star, Users, RefreshCw, Brain, TrendingUp, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  employee_number: string;
  current_position: string;
  current_department: string;
  current_level: string;
  years_of_experience: number;
  skills: any;
  certifications: any;
  performance_rating: number;
  standard_role_id: string | null;
  source_company: string;
}

interface StandardRole {
  id: string;
  role_title: string;
  job_family: string;
  role_level: string;
  department: string;
  required_skills?: any;
}

interface DevelopmentPlan {
  id: string;
  employee_id: string;
  skill_gaps: any;
  learning_paths: any;
  priority_skills: any;
  development_timeline: string;
  ai_recommendations: string;
  created_at: string;
}

export const DevelopmentPathwaysAI = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [standardRoles, setStandardRoles] = useState<StandardRole[]>([]);
  const [developmentPlans, setDevelopmentPlans] = useState<DevelopmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState<{ processed: number; total: number } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load all employees
      const { data: employeesData, error: employeesError } = await supabase
        .from('xlsmart_employees')
        .select('*')
        .eq('is_active', true)
        .order('first_name');

      if (employeesError) throw employeesError;

      // Load standard roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('xlsmart_standard_roles')
        .select('*')
        .eq('is_active', true);

      if (rolesError) throw rolesError;

      setEmployees(employeesData || []);
      setStandardRoles(rolesData || []);

    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load development pathways data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const runAIDevelopmentAnalysis = async () => {
    if (employees.length === 0) {
      toast({
        title: "No employees",
        description: "No employees found for development analysis",
        variant: "destructive",
      });
      return;
    }

    setAnalyzing(true);
    setProgress({ processed: 0, total: employees.length });

    try {
      console.log('Starting AI development analysis for', employees.length, 'employees');

      const { data, error } = await supabase.functions.invoke('development-pathways-bulk', {
        body: {
          pathwayType: 'company',
          identifier: 'xl'  // Analyzing xl company employees
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Development Analysis Complete",
          description: `Generated development plans for ${data.total_processed} employees`,
        });
        
        // Reload data to show new development plans
        await loadData();
      }

    } catch (error: any) {
      console.error('Development analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to run development analysis",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
      setProgress(null);
    }
  };

  const getSkillGaps = (employee: Employee) => {
    // Find the target role and identify skill gaps
    const targetRole = standardRoles.find(role => role.id === employee.standard_role_id);
    if (!targetRole || !targetRole.required_skills) return [];

    const currentSkills = Array.isArray(employee.skills) ? employee.skills : [];
    const requiredSkills = Array.isArray(targetRole.required_skills) ? targetRole.required_skills : [];
    
    return requiredSkills.filter(skill => 
      !currentSkills.some(currentSkill => 
        currentSkill.toLowerCase().includes(skill.toLowerCase())
      )
    ).slice(0, 3);
  };

  const getDevelopmentPriority = (employee: Employee) => {
    const experience = employee.years_of_experience || 0;
    const performance = employee.performance_rating || 0;
    const skillGaps = getSkillGaps(employee).length;
    
    if (performance >= 4 && skillGaps <= 2) return "Advanced";
    if (performance >= 3 && experience >= 3) return "Intermediate";
    return "Foundation";
  };

  const getLearningRecommendations = (employee: Employee) => {
    const skillGaps = getSkillGaps(employee);
    const priority = getDevelopmentPriority(employee);
    
    const recommendations = [];
    
    if (skillGaps.length > 0) {
      recommendations.push(`Skill development: ${skillGaps.join(', ')}`);
    }
    
    if (priority === "Advanced") {
      recommendations.push("Leadership training", "Mentoring opportunities");
    } else if (priority === "Intermediate") {
      recommendations.push("Cross-functional projects", "Certification programs");
    } else {
      recommendations.push("Foundation courses", "On-the-job training");
    }
    
    return recommendations.slice(0, 3);
  };

  const calculateProgressPercentage = () => {
    if (!progress) return 0;
    return (progress.processed / progress.total) * 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading development pathways data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">AI Development Pathways</h2>
          <p className="text-muted-foreground">
            AI-powered learning and development planning for employee growth
          </p>
        </div>
        <Button
          onClick={runAIDevelopmentAnalysis}
          disabled={analyzing || employees.length === 0}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          {analyzing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Brain className="mr-2 h-4 w-4" />
              Run AI Development Analysis
            </>
          )}
        </Button>
      </div>

      {analyzing && progress && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Analyzing development pathways...</span>
                <span>{progress.processed} / {progress.total}</span>
              </div>
              <Progress value={calculateProgressPercentage()} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="employees">Development Analysis</TabsTrigger>
          <TabsTrigger value="pathways">Learning Pathways</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{employees.length}</div>
                <p className="text-xs text-muted-foreground">
                  Active employees for development
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Learning Paths</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">
                  Foundation, Intermediate, Advanced
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">High Performers</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {employees.filter(emp => emp.performance_rating >= 4).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Ready for advanced development
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Skill Gaps</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {employees.reduce((total, emp) => total + getSkillGaps(emp).length, 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total identified skill gaps
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="employees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Employee Development Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Current Role</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Priority Level</TableHead>
                    <TableHead>Skill Gaps</TableHead>
                    <TableHead>Learning Recommendations</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => {
                    const priority = getDevelopmentPriority(employee);
                    const skillGaps = getSkillGaps(employee);
                    const recommendations = getLearningRecommendations(employee);
                    
                    return (
                      <TableRow key={employee.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {employee.first_name} {employee.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {employee.employee_number}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{employee.current_position}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {employee.years_of_experience || 0} years
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500" />
                            {employee.performance_rating || 0}/5
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              priority === 'Advanced' ? 'default' : 
                              priority === 'Intermediate' ? 'secondary' : 'outline'
                            }
                          >
                            {priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {skillGaps.length > 0 ? skillGaps.map((gap, index) => (
                              <Badge key={index} variant="destructive" className="text-xs">
                                {gap}
                              </Badge>
                            )) : (
                              <span className="text-sm text-green-600">No major gaps</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {recommendations.map((rec, index) => (
                              <div key={index} className="flex items-center gap-1 text-sm">
                                <ArrowRight className="h-3 w-3 text-purple-500" />
                                {rec}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pathways" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-500" />
                  Foundation Path
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    For employees new to their roles or the organization
                  </div>
                  <div className="space-y-2">
                    <div className="font-medium">Key Components:</div>
                    <ul className="text-sm space-y-1">
                      <li>• Basic skill training</li>
                      <li>• Company orientation</li>
                      <li>• Mentorship programs</li>
                      <li>• Foundational certifications</li>
                    </ul>
                  </div>
                  <div className="text-lg font-bold">
                    {employees.filter(emp => getDevelopmentPriority(emp) === 'Foundation').length} employees
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Intermediate Path
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    For experienced employees ready to advance
                  </div>
                  <div className="space-y-2">
                    <div className="font-medium">Key Components:</div>
                    <ul className="text-sm space-y-1">
                      <li>• Advanced skill development</li>
                      <li>• Cross-functional projects</li>
                      <li>• Professional certifications</li>
                      <li>• Leadership training</li>
                    </ul>
                  </div>
                  <div className="text-lg font-bold">
                    {employees.filter(emp => getDevelopmentPriority(emp) === 'Intermediate').length} employees
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-purple-500" />
                  Advanced Path
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    For high performers ready for leadership roles
                  </div>
                  <div className="space-y-2">
                    <div className="font-medium">Key Components:</div>
                    <ul className="text-sm space-y-1">
                      <li>• Executive training</li>
                      <li>• Strategic projects</li>
                      <li>• Mentoring others</li>
                      <li>• Innovation initiatives</li>
                    </ul>
                  </div>
                  <div className="text-lg font-bold">
                    {employees.filter(emp => getDevelopmentPriority(emp) === 'Advanced').length} employees
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};