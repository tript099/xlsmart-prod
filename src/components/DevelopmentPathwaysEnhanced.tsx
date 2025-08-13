import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Target, Lightbulb, Clock, Building, Users, UserCheck, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BulkDevelopmentProgress {
  total: number;
  processed: number;
  completed: number;
  errors: number;
}

export const DevelopmentPathwaysEnhanced = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("individual");
  
  // Individual form data
  const [formData, setFormData] = useState({
    employeeName: "",
    currentPosition: "",
    experienceLevel: "",
    currentSkills: "",
    careerGoals: "",
    preferredLearningStyle: "",
    timeCommitment: "",
    industryFocus: ""
  });
  
  // Bulk selection data
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  
  // State management
  const [developmentPlan, setDevelopmentPlan] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<BulkDevelopmentProgress>({ total: 0, processed: 0, completed: 0, errors: 0 });
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Dropdown data
  const [companies, setCompanies] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    fetchDropdownData();
  }, []);

  const fetchDropdownData = async () => {
    // Fetch companies
    const { data: companyData } = await supabase
      .from('xlsmart_employees')
      .select('source_company')
      .eq('is_active', true);
    if (companyData) {
      const uniqueCompanies = [...new Set(companyData.map(item => item.source_company))];
      setCompanies(uniqueCompanies);
    }

    // Fetch departments
    const { data: deptData } = await supabase
      .from('xlsmart_employees')
      .select('current_department')
      .eq('is_active', true);
    if (deptData) {
      const uniqueDepartments = [...new Set(deptData.map(item => item.current_department).filter(Boolean))];
      setDepartments(uniqueDepartments);
    }

    // Fetch roles
    const { data: roleData } = await supabase
      .from('xlsmart_employees')
      .select('current_position')
      .eq('is_active', true);
    if (roleData) {
      const uniqueRoles = [...new Set(roleData.map(item => item.current_position))];
      setRoles(uniqueRoles);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateIndividualPlan = async () => {
    if (!formData.employeeName || !formData.currentPosition || !formData.careerGoals) {
      toast({
        title: "Missing Information",
        description: "Please fill in employee name, current position, and career goals.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('development-pathways', {
        body: {
          employeeProfile: {
            name: formData.employeeName,
            currentPosition: formData.currentPosition,
            experienceLevel: formData.experienceLevel,
            preferredLearningStyle: formData.preferredLearningStyle,
            timeCommitment: formData.timeCommitment,
            industryFocus: formData.industryFocus,
            currentSkills: formData.currentSkills.split(',').map(s => s.trim()),
            careerGoals: formData.careerGoals
          }
        }
      });

      if (error) throw error;

      setDevelopmentPlan(data.developmentPlan);
      toast({
        title: "Success!",
        description: "Development pathway generated successfully"
      });
    } catch (error: any) {
      console.error('Error generating development plan:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate development plan",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runBulkDevelopmentPlanning = async (type: 'company' | 'department' | 'role', identifier: string) => {
    if (!identifier) {
      toast({
        title: "Missing Selection",
        description: `Please select a ${type}`,
        variant: "destructive"
      });
      return;
    }

    setIsBulkProcessing(true);
    setBulkProgress({ total: 0, processed: 0, completed: 0, errors: 0 });

    try {
      const { data, error } = await supabase.functions.invoke('development-pathways-bulk', {
        body: {
          pathwayType: type,
          identifier
        }
      });

      if (error) throw error;

      setSessionId(data.sessionId);
      
      // Poll for progress
      const pollProgress = setInterval(async () => {
        const { data: progressData } = await supabase.functions.invoke('development-pathways-progress', {
          body: { sessionId: data.sessionId }
        });

        if (progressData) {
          setBulkProgress(progressData.progress);
          
          if (progressData.status === 'completed') {
            clearInterval(pollProgress);
            setIsBulkProcessing(false);
            toast({
              title: "Bulk Development Planning Complete!",
              description: `Generated development pathways for ${progressData.progress.completed} employees`
            });
          } else if (progressData.status === 'error') {
            clearInterval(pollProgress);
            setIsBulkProcessing(false);
            toast({
              title: "Planning Failed",
              description: progressData.error || "An error occurred during bulk planning",
              variant: "destructive"
            });
          }
        }
      }, 3000);

    } catch (error: any) {
      console.error('Bulk development planning error:', error);
      setIsBulkProcessing(false);
      toast({
        title: "Planning Failed",
        description: error.message || "Failed to start bulk development planning",
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
          <BookOpen className="h-5 w-5" />
          Development Pathways
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
                <Label htmlFor="employeeName">Employee Name</Label>
                <Input
                  id="employeeName"
                  value={formData.employeeName}
                  onChange={(e) => handleInputChange("employeeName", e.target.value)}
                  placeholder="Enter employee name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentPosition">Current Position</Label>
                <Input
                  id="currentPosition"
                  value={formData.currentPosition}
                  onChange={(e) => handleInputChange("currentPosition", e.target.value)}
                  placeholder="Enter current position"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="experienceLevel">Experience Level</Label>
                <Select value={formData.experienceLevel} onValueChange={(value) => handleInputChange("experienceLevel", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entry">Entry Level (0-2 years)</SelectItem>
                    <SelectItem value="junior">Junior (2-5 years)</SelectItem>
                    <SelectItem value="mid">Mid Level (5-8 years)</SelectItem>
                    <SelectItem value="senior">Senior (8-12 years)</SelectItem>
                    <SelectItem value="expert">Expert (12+ years)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="preferredLearningStyle">Preferred Learning Style</Label>
                <Select value={formData.preferredLearningStyle} onValueChange={(value) => handleInputChange("preferredLearningStyle", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select learning style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online Courses</SelectItem>
                    <SelectItem value="classroom">Classroom Training</SelectItem>
                    <SelectItem value="hands-on">Hands-on Projects</SelectItem>
                    <SelectItem value="mentoring">Mentoring</SelectItem>
                    <SelectItem value="mixed">Mixed Approach</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timeCommitment">Time Commitment (hours/week)</Label>
                <Select value={formData.timeCommitment} onValueChange={(value) => handleInputChange("timeCommitment", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time commitment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-2">1-2 hours/week</SelectItem>
                    <SelectItem value="3-5">3-5 hours/week</SelectItem>
                    <SelectItem value="6-10">6-10 hours/week</SelectItem>
                    <SelectItem value="10+">10+ hours/week</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="industryFocus">Industry Focus</Label>
                <Input
                  id="industryFocus"
                  value={formData.industryFocus}
                  onChange={(e) => handleInputChange("industryFocus", e.target.value)}
                  placeholder="e.g., Technology, Healthcare, Finance"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentSkills">Current Skills</Label>
              <Textarea
                id="currentSkills"
                value={formData.currentSkills}
                onChange={(e) => handleInputChange("currentSkills", e.target.value)}
                placeholder="List current skills (comma-separated)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="careerGoals">Career Goals</Label>
              <Textarea
                id="careerGoals"
                value={formData.careerGoals}
                onChange={(e) => handleInputChange("careerGoals", e.target.value)}
                placeholder="Describe career goals and aspirations"
              />
            </div>

            <Button 
              onClick={generateIndividualPlan} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Pathway...
                </>
              ) : (
                <>
                  <Target className="mr-2 h-4 w-4" />
                  Generate Development Pathway
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="company" className="space-y-4">
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

            <Button 
              onClick={() => runBulkDevelopmentPlanning('company', selectedCompany)} 
              disabled={!selectedCompany || isBulkProcessing}
              className="w-full"
            >
              {isBulkProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Planning for Company...
                </>
              ) : (
                <>
                  <Building className="mr-2 h-4 w-4" />
                  Generate Pathways for All Company Employees
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="department" className="space-y-4">
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

            <Button 
              onClick={() => runBulkDevelopmentPlanning('department', selectedDepartment)} 
              disabled={!selectedDepartment || isBulkProcessing}
              className="w-full"
            >
              {isBulkProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Planning for Department...
                </>
              ) : (
                <>
                  <Users className="mr-2 h-4 w-4" />
                  Generate Pathways for All Department Employees
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="role" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role-select">Select Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={() => runBulkDevelopmentPlanning('role', selectedRole)} 
              disabled={!selectedRole || isBulkProcessing}
              className="w-full"
            >
              {isBulkProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Planning for Role...
                </>
              ) : (
                <>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Generate Pathways for All Role Employees
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>

        {isBulkProcessing && (
          <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Bulk Development Planning Progress</span>
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

        {developmentPlan && activeTab === "individual" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Generated Development Pathway
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap text-sm">{developmentPlan}</div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};