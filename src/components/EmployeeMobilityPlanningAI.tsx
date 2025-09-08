import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { MapPin, ArrowRight, Building, Clock, Star, Users, RefreshCw, Brain, Target, TrendingUp, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

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
  formattedAnalysis?: string; // Optional for performance optimization
}

export const EmployeeMobilityPlanningAI = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [standardRoles, setStandardRoles] = useState<StandardRole[]>([]);
  const [mobilityPlans, setMobilityPlans] = useState<MobilityPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState<{ processed: number; total: number } | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [executedMoves, setExecutedMoves] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadData();
    loadExecutedMoves();
  }, []);

  const loadExecutedMoves = async () => {
    try {
      const { data, error } = await supabase
        .from('employee_moves' as any)
        .select('employee_id')
        .eq('move_status', 'executed');

      if (error) throw error;
      
      const executedEmployeeIds = new Set(data?.map((move: any) => move.employee_id) || []);
      setExecutedMoves(executedEmployeeIds);
    } catch (error) {
      console.error('Error loading executed moves:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load employees and roles in parallel for faster initial load
      const [employeesResult, rolesResult] = await Promise.all([
        supabase
          .from('xlsmart_employees')
          .select('*')
          .eq('is_active', true)
          .order('first_name'),
        supabase
          .from('xlsmart_standard_roles')
          .select('*')
          .eq('is_active', true)
      ]);

      if (employeesResult.error) throw employeesResult.error;
      if (rolesResult.error) throw rolesResult.error;

      console.log('Loaded employees:', employeesResult.data);
      console.log('Total employees loaded:', employeesResult.data?.length);
      setEmployees(employeesResult.data || []);
      setStandardRoles(rolesResult.data || []);
      
      // Show the UI immediately, load mobility plans in background
      setLoading(false);

      // Load AI-generated mobility plans asynchronously (non-blocking)
      setTimeout(async () => {
        try {
          const { data: mobilityPlansData, error: mobilityPlansError } = await supabase
            .from('ai_analysis_results')
            .select('*')
            .eq('analysis_type', 'mobility_plan')
            .order('created_at', { ascending: false });

          if (mobilityPlansError) {
            console.error('Error loading mobility plans:', mobilityPlansError);
          } else {
            // Transform mobility plans data
            const transformedMobilityPlans = mobilityPlansData?.map((result: any) => ({
              id: result.id,
              employee_id: result.input_parameters?.employee_id || '',
              current_role: result.input_parameters?.current_position || '',
              target_roles: result.analysis_result?.mobilityPlan || '',
              mobility_score: 75, // Default score
              barriers: [],
              recommendations: result.analysis_result?.mobilityPlan || '',
              ai_analysis: result.analysis_result?.mobilityPlan || '',
              created_at: result.created_at
            })) || [];

            console.log('Raw mobility plans data:', mobilityPlansData);
            console.log('Transformed mobility plans:', transformedMobilityPlans);
            setMobilityPlans(transformedMobilityPlans);
          }
        } catch (error) {
          console.error('Error loading mobility plans:', error);
        }
      }, 100); // Small delay to ensure UI renders first

    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load mobility planning data",
        variant: "destructive",
      });
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
            first_name: emp.first_name,
            last_name: emp.last_name,
            current_position: emp.current_position,
            current_department: emp.current_department,
            current_level: emp.current_level,
            years_of_experience: emp.years_of_experience,
            skills: emp.skills,
            performance_rating: emp.performance_rating,
            source_company: emp.source_company
          })),
          standard_roles: standardRoles
        }
      });

      if (error) throw error;

      if (data?.success && data.sessionId) {
        toast({
          title: "Mobility Analysis Started",
          description: `Processing mobility plans for ${employees.length} employees`,
        });
        
        // Poll for progress updates
        const pollProgress = setInterval(async () => {
          try {
            const { data: progressData } = await supabase.functions.invoke('employee-mobility-planning-progress', {
              body: { sessionId: data.sessionId }
            });

            if (progressData?.progress) {
              setProgress({
                processed: progressData.progress.processed || 0,
                total: progressData.progress.total || employees.length
              });
              
              if (progressData.status === 'completed') {
                clearInterval(pollProgress);
                setAnalyzing(false);
                setProgress(null);
                
                toast({
                  title: "Mobility Analysis Complete!",
                  description: `Generated mobility plans for ${progressData.progress.completed || employees.length} employees`,
                });
                
                // Reload data to show new mobility plans
                await loadData();
              } else if (progressData.status === 'error') {
                clearInterval(pollProgress);
                setAnalyzing(false);
                setProgress(null);
                
                toast({
                  title: "Analysis Failed",
                  description: progressData.error || "An error occurred during analysis",
                  variant: "destructive",
                });
              }
            }
          } catch (progressError) {
            console.error('Error checking progress:', progressError);
          }
        }, 2000);

        // Set a timeout to stop polling after 5 minutes
        setTimeout(() => {
          clearInterval(pollProgress);
          if (analyzing) {
            setAnalyzing(false);
            setProgress(null);
            toast({
              title: "Analysis Timeout",
              description: "Analysis is taking longer than expected. Please check back later.",
              variant: "destructive",
            });
          }
        }, 300000); // 5 minutes
        
      } else {
        throw new Error('Failed to start mobility analysis session');
      }

    } catch (error: any) {
      console.error('Mobility analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to run mobility analysis",
        variant: "destructive",
      });
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

  const handleExecuteMove = async (plan: MobilityPlan, employee: Employee | undefined) => {
    console.log('Executing move for plan:', plan);
    console.log('Employee data:', employee);
    
    if (!employee) {
      toast({
        title: "Error",
        description: "Employee information not found",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to execute moves",
        variant: "destructive",
      });
      return;
    }

    try {
      // Parse the AI analysis to extract move recommendations
      const analysis = plan.ai_analysis || '';
      
      // Create a simple move based on the plan - directly execute it
      const moveData = {
        employee_id: employee.id,
        move_type: 'lateral_move', // This could be determined from AI analysis
        previous_position: employee.current_position,
        previous_department: employee.current_department,
        previous_level: employee.current_level,
        new_position: `${employee.current_position} (Advanced)`, // Placeholder - should come from AI analysis
        new_department: employee.current_department, // Could be different based on AI recommendation
        new_level: employee.current_level,
        reason: 'AI-recommended mobility plan',
        notes: analysis.substring(0, 500), // First 500 chars of AI analysis
        mobility_plan_id: plan.id,
        requested_by: user.id,
        approved_by: user.id, // Auto-approve since we're executing directly
        approval_date: new Date().toISOString(),
        move_status: 'executed', // Directly execute, no approval needed
        effective_date: new Date().toISOString()
      };

      // Create the move record
      const { data: moveRecord, error: moveError } = await supabase
        .from('employee_moves' as any)
        .insert(moveData)
        .select()
        .single();

      if (moveError) throw moveError;

      // Immediately update employee's current position, department, and level
      const { error: employeeError } = await supabase
        .from('xlsmart_employees')
        .update({
          current_position: moveData.new_position,
          current_department: moveData.new_department,
          current_level: moveData.new_level,
          updated_at: new Date().toISOString()
        })
        .eq('id', employee.id);

      if (employeeError) throw employeeError;

      toast({
        title: "Move Executed Successfully!",
        description: `${employee.first_name} ${employee.last_name}'s position has been updated to ${moveData.new_position}.`,
      });

      console.log('Move executed and employee updated:', moveRecord);

      // Add employee to executed moves set to hide them from the list
      setExecutedMoves(prev => new Set([...prev, employee.id]));
      
      // Refresh the data to show updated information
      await loadData();
      
      // Trigger a custom event to refresh the moves history
      window.dispatchEvent(new CustomEvent('moveExecuted', { 
        detail: { moveRecord, employee } 
      }));

    } catch (error: any) {
      console.error('Error executing move:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to execute move",
        variant: "destructive",
      });
    }
  };

  // Simplified and faster formatting function
  const formatMobilityPlan = useCallback((text: string) => {
    if (!text) return '';
    
    // Much simpler and faster formatting
    return text
      // Basic headers
      .replace(/###\s+(.*?)(?=\n|$)/g, '<h4 class="font-semibold text-blue-600 mt-3 mb-2">$1</h4>')
      .replace(/##\s+(.*?)(?=\n|$)/g, '<h3 class="font-bold text-gray-800 mt-4 mb-2">$1</h3>')
      
      // Bold text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      
      // Simple bullet points
      .replace(/^[-•]\s+(.*)$/gm, '<div class="mb-1">• $1</div>')
      
      // Basic line breaks
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n/g, '<br/>');
  }, []);

  // Progressive formatting state
  const [formattedPlans, setFormattedPlans] = useState<MobilityPlan[]>([]);
  const [isFormatting, setIsFormatting] = useState(false);

  // Format plans progressively when AI Results tab becomes active
  useEffect(() => {
    if (activeTab === "ai-results" && mobilityPlans.length > 0) {
      // Show content immediately with unformatted text
      setFormattedPlans([...mobilityPlans]);
      
      const unformattedPlans = mobilityPlans.filter(plan => !plan.formattedAnalysis);
      
      if (unformattedPlans.length > 0) {
        setIsFormatting(true);
        
        // Process plans quickly in the background
        const formatInBatches = async () => {
          let allFormatted = [...mobilityPlans];
          
          // Format all at once but with a small delay to let UI render
          await new Promise(resolve => setTimeout(resolve, 50));
          
          unformattedPlans.forEach(plan => {
            const index = allFormatted.findIndex(p => p.id === plan.id);
            if (index !== -1) {
              allFormatted[index] = {
                ...plan,
                formattedAnalysis: formatMobilityPlan(plan.ai_analysis)
              };
            }
          });
          
          setFormattedPlans([...allFormatted]);
          setIsFormatting(false);
        };
        
        formatInBatches();
      }
    } else if (activeTab !== "ai-results") {
      // Clear formatted plans when not on AI Results tab to save memory
      setFormattedPlans([]);
    }
  }, [activeTab, mobilityPlans, formatMobilityPlan]);

  // Lazy loading component for AI Results
  const AIResultsTab = useCallback(() => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI-Generated Mobility Plans
        </CardTitle>
      </CardHeader>
      <CardContent>
        {mobilityPlans.length > 0 ? (
          <div className="space-y-4">
            {isFormatting && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="text-sm text-blue-700">
                    Formatting content... ({formattedPlans.filter(p => p.formattedAnalysis).length}/{mobilityPlans.length})
                  </span>
                </div>
              </div>
            )}
            
            {formattedPlans.filter(plan => !executedMoves.has(plan.employee_id)).length === 0 && (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-green-800">All Moves Executed!</h3>
                <p className="text-muted-foreground">
                  All available mobility plans have been executed. Check the Employee Moves History to see completed moves.
                </p>
              </div>
            )}
            {formattedPlans
              .filter(plan => !executedMoves.has(plan.employee_id)) // Filter out executed moves
              .slice(0, 20).map((plan) => { // Limit to 20 plans for performance
              const employee = employees.find(emp => emp.id === plan.employee_id);
              
              // Skip if employee not found
              if (!employee) return null;
              
              return (
                <div key={plan.id} className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">
                        {employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown Employee'}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {plan.current_role} • {employee?.current_department}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {new Date(plan.created_at).toLocaleDateString()}
                    </Badge>
                  </div>
                  <div className="bg-white border border-gray-200 p-6 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h5 className="font-semibold text-base text-gray-800">
                        AI Mobility Recommendations
                      </h5>
                      <Button
                        size="sm"
                        onClick={() => handleExecuteMove(plan, employee)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Execute Move Now
                      </Button>
                    </div>
                    <div className="max-w-none border-t border-gray-200 pt-4">
                      <div className="text-sm leading-relaxed text-gray-700">
                        {plan.formattedAnalysis ? (
                          <div dangerouslySetInnerHTML={{ __html: plan.formattedAnalysis }} />
                        ) : (
                          <div className="whitespace-pre-wrap">
                            {plan.ai_analysis || 'No analysis available'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {formattedPlans.length > 20 && (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">
                  Showing first 20 of {formattedPlans.length} mobility plans
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">No AI Results Yet</h3>
            <p className="text-muted-foreground mb-4">
              Run the AI mobility analysis to generate personalized mobility plans.
            </p>
            <Button
              onClick={runAIMobilityAnalysis}
              disabled={analyzing || employees.length === 0}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            >
              <Brain className="mr-2 h-4 w-4" />
              Run AI Analysis
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  ), [formattedPlans, employees, analyzing, runAIMobilityAnalysis, isFormatting, mobilityPlans]);

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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="employees">Mobility Analysis</TabsTrigger>
          <TabsTrigger value="ai-results">AI Results</TabsTrigger>
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

        <TabsContent value="ai-results" className="space-y-4">
          {activeTab === "ai-results" && <AIResultsTab />}
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