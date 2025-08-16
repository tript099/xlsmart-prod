import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { MapPin, ArrowRight, Building, Clock, Star, Users, RefreshCw, Brain, Target, TrendingUp } from "lucide-react";
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

interface MobilityPlan {
  id: string;
  employee_id: string;
  current_role: string;
  target_roles: any;
  mobility_score: number;
  barriers: any;
  recommendations: string;
  ai_analysis: string;
  created_at: string;
}

export const EmployeeMobilityPlanningAI = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [standardRoles, setStandardRoles] = useState<StandardRole[]>([]);
  const [mobilityPlans, setMobilityPlans] = useState<MobilityPlan[]>([]);
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
        description: "Failed to load mobility planning data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const runAIMobilityAnalysis = async () => {
    if (employees.length === 0) {
      toast({
        title: "No employees",
        description: "No employees found for mobility analysis",
        variant: "destructive",
      });
      return;
    }

    setAnalyzing(true);
    setProgress({ processed: 0, total: employees.length });

    try {
      console.log('Starting AI mobility analysis for', employees.length, 'employees');

      const { data, error } = await supabase.functions.invoke('employee-mobility-planning-bulk', {
        body: {
          employees: employees.map(emp => ({
            id: emp.id,
            name: `${emp.first_name} ${emp.last_name}`,
            current_position: emp.current_position,
            department: emp.current_department,
            level: emp.current_level,
            experience: emp.years_of_experience,
            skills: emp.skills,
            performance_rating: emp.performance_rating
          })),
          standard_roles: standardRoles
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Mobility Analysis Started",
          description: data.message || `Processing mobility plans for employees`,
        });
        
        // Reload data to show new mobility plans
        await loadData();
      }

    } catch (error: any) {
      console.error('Mobility analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to run mobility analysis",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
      setProgress(null);
    }
  };

  const getMobilityScore = (employee: Employee) => {
    // Calculate mobility score based on experience, performance, skills
    let score = 50; // Base score
    
    // Experience factor
    const experience = employee.years_of_experience || 0;
    if (experience > 5) score += 20;
    else if (experience > 2) score += 10;
    
    // Performance factor
    const performance = employee.performance_rating || 0;
    score += (performance - 3) * 10;
    
    // Skills factor (if they have multiple skills)
    const skillsCount = Array.isArray(employee.skills) ? employee.skills.length : 1;
    score += Math.min(skillsCount * 5, 20);
    
    return Math.max(0, Math.min(100, score));
  };

  const getMobilityRisk = (employee: Employee) => {
    const score = getMobilityScore(employee);
    if (score >= 80) return { level: "High", color: "destructive" };
    if (score >= 60) return { level: "Medium", color: "default" };
    return { level: "Low", color: "secondary" };
  };

  const getPotentialMoves = (employee: Employee) => {
    // Find potential roles based on current department and adjacent departments
    const currentDept = employee.current_department;
    const adjacentRoles = standardRoles.filter(role => 
      role.department !== currentDept && 
      (role.job_family.toLowerCase().includes(employee.current_position.toLowerCase().split(' ')[0]) ||
       employee.current_position.toLowerCase().includes(role.job_family.toLowerCase()))
    );

    return adjacentRoles.slice(0, 3);
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
          <p>Loading employee mobility data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">AI Employee Mobility Planning</h2>
          <p className="text-muted-foreground">
            AI-powered internal mobility analysis and planning for workforce optimization
          </p>
        </div>
        <Button
          onClick={runAIMobilityAnalysis}
          disabled={analyzing || employees.length === 0}
          className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
        >
          {analyzing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Brain className="mr-2 h-4 w-4" />
              Run AI Mobility Analysis
            </>
          )}
        </Button>
      </div>

      {analyzing && progress && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Analyzing employee mobility potential...</span>
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
          <TabsTrigger value="employees">Mobility Analysis</TabsTrigger>
          <TabsTrigger value="risks">Flight Risk</TabsTrigger>
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
                  Active employees analyzed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">High Mobility Risk</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {employees.filter(emp => getMobilityScore(emp) >= 80).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Employees with high mobility potential
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Internal Moves</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {employees.filter(emp => getPotentialMoves(emp).length > 0).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Potential internal opportunities
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Departments</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Set(employees.map(emp => emp.current_department).filter(Boolean)).size}
                </div>
                <p className="text-xs text-muted-foreground">
                  Cross-functional opportunities
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
                Employee Mobility Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Current Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Mobility Score</TableHead>
                    <TableHead>Potential Moves</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => {
                    const mobilityRisk = getMobilityRisk(employee);
                    const potentialMoves = getPotentialMoves(employee);
                    
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
                          <Badge variant="outline">
                            {employee.current_department || 'N/A'}
                          </Badge>
                        </TableCell>
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
                          <div className="flex items-center gap-2">
                            <Badge variant={mobilityRisk.color as any}>
                              {mobilityRisk.level}
                            </Badge>
                            <span className="text-sm">
                              {getMobilityScore(employee)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {potentialMoves.map((role, index) => (
                              <div key={index} className="flex items-center gap-1 text-sm">
                                <ArrowRight className="h-3 w-3 text-green-500" />
                                <span>{role.role_title}</span>
                                <Badge variant="outline" className="text-xs">
                                  {role.department}
                                </Badge>
                              </div>
                            ))}
                            {potentialMoves.length === 0 && (
                              <span className="text-sm text-gray-500">No immediate moves</span>
                            )}
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

        <TabsContent value="risks" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Mobility Risk Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['High', 'Medium', 'Low'].map((level) => {
                    const count = employees.filter(emp => getMobilityRisk(emp).level === level).length;
                    const percentage = employees.length > 0 ? (count / employees.length) * 100 : 0;
                    
                    return (
                      <div key={level} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{level} Risk</span>
                          <span>{count} employees ({percentage.toFixed(1)}%)</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>High Mobility Risk Employees</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {employees
                    .filter(emp => getMobilityScore(emp) >= 80)
                    .slice(0, 5)
                    .map((employee) => (
                      <div key={employee.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">
                            {employee.first_name} {employee.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {employee.current_position}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive">
                            {getMobilityScore(employee)}% Risk
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};