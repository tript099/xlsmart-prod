import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Target, TrendingUp, AlertTriangle, Building, Users, UserCheck, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SkillGap {
  skill: string;
  currentLevel: number;
  requiredLevel: number;
  gap: number;
}

interface AssessmentResult {
  overallMatch: number;
  skillGaps: SkillGap[];
  recommendations: string;
  nextRoles: string[];
}

interface BulkAssessmentProgress {
  total: number;
  processed: number;
  completed: number;
  errors: number;
}

export const AISkillsAssessmentEnhanced = () => {
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedRoleForBulk, setSelectedRoleForBulk] = useState("");
  const [assessment, setAssessment] = useState<AssessmentResult | null>(null);
  const [isAssessing, setIsAssessing] = useState(false);
  const [isBulkAssessing, setIsBulkAssessing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<BulkAssessmentProgress>({ total: 0, processed: 0, completed: 0, errors: 0 });
  const [employees, setEmployees] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [bulkRoles, setBulkRoles] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("individual");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchEmployees();
    fetchRoles();
    fetchCompanies();
    fetchDepartments();
    fetchBulkRoles();
  }, []);

  const fetchEmployees = async () => {
    const { data } = await supabase
      .from('xlsmart_employees')
      .select('*')
      .eq('is_active', true);
    if (data) setEmployees(data);
  };

  const fetchRoles = async () => {
    const { data } = await supabase
      .from('xlsmart_job_descriptions')
      .select('*')
      .eq('status', 'approved');
    if (data) setRoles(data);
  };

  const fetchCompanies = async () => {
    const { data } = await supabase
      .from('xlsmart_employees')
      .select('source_company')
      .eq('is_active', true);
    if (data) {
      const uniqueCompanies = [...new Set(data.map(item => item.source_company))];
      setCompanies(uniqueCompanies);
    }
  };

  const fetchDepartments = async () => {
    const { data } = await supabase
      .from('xlsmart_employees')
      .select('current_department')
      .eq('is_active', true);
    if (data) {
      const uniqueDepartments = [...new Set(data.map(item => item.current_department).filter(Boolean))];
      setDepartments(uniqueDepartments);
    }
  };

  const fetchBulkRoles = async () => {
    const { data } = await supabase
      .from('xlsmart_employees')
      .select('current_position')
      .eq('is_active', true);
    if (data) {
      const uniqueRoles = [...new Set(data.map(item => item.current_position))];
      setBulkRoles(uniqueRoles);
    }
  };

  const runIndividualAssessment = async () => {
    if (!selectedEmployee || !selectedRole) {
      toast({
        title: "Missing Selection",
        description: "Please select both an employee and a target role",
        variant: "destructive"
      });
      return;
    }

    setIsAssessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-skills-assessment', {
        body: {
          employeeId: selectedEmployee,
          targetRoleId: selectedRole,
          assessmentType: 'individual'
        }
      });

      if (error) throw error;

      setAssessment(data.assessment);
      toast({
        title: "Assessment Complete",
        description: "Individual skills assessment has been completed"
      });
    } catch (error: any) {
      console.error('Assessment error:', error);
      toast({
        title: "Assessment Failed",
        description: error.message || "Failed to complete assessment",
        variant: "destructive"
      });
    } finally {
      setIsAssessing(false);
    }
  };

  const runBulkAssessment = async (type: 'company' | 'department' | 'role', identifier: string) => {
    if (!identifier) {
      toast({
        title: "Missing Selection",
        description: `Please select a ${type}`,
        variant: "destructive"
      });
      return;
    }

    setIsBulkAssessing(true);
    setBulkProgress({ total: 0, processed: 0, completed: 0, errors: 0 });

    try {
      const { data, error } = await supabase.functions.invoke('ai-skills-assessment-bulk', {
        body: {
          assessmentType: type,
          identifier,
          targetRoleId: selectedRole
        }
      });

      if (error) throw error;

      setSessionId(data.sessionId);
      
      // Poll for progress
      const pollProgress = setInterval(async () => {
        const { data: progressData } = await supabase.functions.invoke('ai-skills-assessment-progress', {
          body: { sessionId: data.sessionId }
        });

        if (progressData) {
          setBulkProgress(progressData.progress);
          
          if (progressData.status === 'completed') {
            clearInterval(pollProgress);
            setIsBulkAssessing(false);
            toast({
              title: "Bulk Assessment Complete!",
              description: `Assessed ${progressData.progress.completed} employees successfully`
            });
          } else if (progressData.status === 'error') {
            clearInterval(pollProgress);
            setIsBulkAssessing(false);
            toast({
              title: "Assessment Failed",
              description: progressData.error || "An error occurred during bulk assessment",
              variant: "destructive"
            });
          }
        }
      }, 3000);

    } catch (error: any) {
      console.error('Bulk assessment error:', error);
      setIsBulkAssessing(false);
      toast({
        title: "Assessment Failed",
        description: error.message || "Failed to start bulk assessment",
        variant: "destructive"
      });
    }
  };

  const getBulkProgressPercentage = () => {
    if (bulkProgress.total === 0) return 0;
    return Math.round((bulkProgress.processed / bulkProgress.total) * 100);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Skills Assessment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="individual">Individual</TabsTrigger>
            <TabsTrigger value="company">By Company</TabsTrigger>
            <TabsTrigger value="department">By Department</TabsTrigger>
            <TabsTrigger value="role">By Role</TabsTrigger>
          </TabsList>

          <TabsContent value="individual" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employee-select">Select Employee</Label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.first_name} {employee.last_name} - {employee.current_position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role-select">Target Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose target role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={runIndividualAssessment} 
              disabled={!selectedEmployee || !selectedRole || isAssessing}
              className="w-full"
            >
              {isAssessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assessing...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4" />
                  Run Assessment
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="company" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company-select">Select Company</Label>
                <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company} value={company}>
                        {company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target-role-select">Target Role (Optional)</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose target role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={() => runBulkAssessment('company', selectedCompany)} 
              disabled={!selectedCompany || isBulkAssessing}
              className="w-full"
            >
              {isBulkAssessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assessing Company...
                </>
              ) : (
                <>
                  <Building className="mr-2 h-4 w-4" />
                  Assess All Company Employees
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="department" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department-select">Select Department</Label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((department) => (
                      <SelectItem key={department} value={department}>
                        {department}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target-role-select">Target Role (Optional)</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose target role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={() => runBulkAssessment('department', selectedDepartment)} 
              disabled={!selectedDepartment || isBulkAssessing}
              className="w-full"
            >
              {isBulkAssessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assessing Department...
                </>
              ) : (
                <>
                  <Users className="mr-2 h-4 w-4" />
                  Assess All Department Employees
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="role" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role-bulk-select">Select Current Role</Label>
                <Select value={selectedRoleForBulk} onValueChange={setSelectedRoleForBulk}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {bulkRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target-role-select">Target Role (Optional)</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose target role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={() => runBulkAssessment('role', selectedRoleForBulk)} 
              disabled={!selectedRoleForBulk || isBulkAssessing}
              className="w-full"
            >
              {isBulkAssessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assessing Role...
                </>
              ) : (
                <>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Assess All Role Employees
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>

        {isBulkAssessing && (
          <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Bulk Assessment Progress</span>
                <span>{getBulkProgressPercentage()}%</span>
              </div>
              <Progress value={getBulkProgressPercentage()} className="w-full" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{bulkProgress.total}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">{bulkProgress.processed}</div>
                <div className="text-sm text-muted-foreground">Processed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">{bulkProgress.completed}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500">{bulkProgress.errors}</div>
                <div className="text-sm text-muted-foreground">Errors</div>
              </div>
            </div>
          </div>
        )}

        {assessment && activeTab === "individual" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Assessment Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-bold text-primary">{assessment.overallMatch}%</div>
                  <div className="text-sm text-muted-foreground">Overall Match</div>
                </div>
                
                {assessment.skillGaps.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Skill Gaps:</h4>
                    {assessment.skillGaps.map((gap, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{gap.skill}</span>
                          <span>{gap.currentLevel}/{gap.requiredLevel}</span>
                        </div>
                        <Progress value={(gap.currentLevel / gap.requiredLevel) * 100} className="h-2" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {assessment.recommendations && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    AI Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{assessment.recommendations}</p>
                </CardContent>
              </Card>
            )}

            {assessment.nextRoles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Suggested Next Roles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {assessment.nextRoles.map((role, index) => (
                      <Badge key={index} variant="outline">{role}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};