import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, Users, CheckCircle, AlertCircle, Loader2, Brain, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as XLSX from 'xlsx';

interface UploadProgress {
  total: number;
  processed: number;
  assigned: number;
  errors: number;
}

interface UploadSession {
  id: string;
  session_name: string;
  status: string;
  total_rows: number;
  created_at: string;
  ai_analysis?: any; // Use any to handle Json type from database
}

export const EmployeeUploadTwoStep = () => {
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({ total: 0, processed: 0, assigned: 0, errors: 0 });
  const [assignmentProgress, setAssignmentProgress] = useState<UploadProgress>({ total: 0, processed: 0, assigned: 0, errors: 0 });
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [assignmentComplete, setAssignmentComplete] = useState(false);
  const [availableSessions, setAvailableSessions] = useState<UploadSession[]>([]);
  const [selectedSessionForAssignment, setSelectedSessionForAssignment] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("upload");
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    setFiles(selectedFiles);
    setUploadComplete(false);
    setUploadProgress({ total: 0, processed: 0, assigned: 0, errors: 0 });
  };

  const processExcelFiles = async (files: FileList) => {
    const processedData: any[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      
      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length > 1) {
          const headers = jsonData[0] as string[];
          const rows = jsonData.slice(1) as any[][];
          
          rows.forEach(row => {
            if (row.some(cell => cell !== undefined && cell !== null && cell !== '')) {
              const rowData: any = {};
              headers.forEach((header, index) => {
                if (header && row[index] !== undefined) {
                  rowData[header.toString().trim()] = row[index];
                }
              });
              processedData.push({
                ...rowData,
                sourceFile: file.name,
                sourceSheet: sheetName
              });
            }
          });
        }
      });
    }
    
    return processedData;
  };

  const handleUploadData = async () => {
    if (!files || files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select Excel files to upload",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploading(true);
      
      // Process Excel files
      const employeeData = await processExcelFiles(files);
      setUploadProgress(prev => ({ ...prev, total: employeeData.length }));

      toast({
        title: "Processing employee data...",
        description: `Found ${employeeData.length} employee records`
      });

      // Upload to Supabase function (Step 1: Data only)
      const { data, error } = await supabase.functions.invoke('employee-upload-data', {
        body: {
          employees: employeeData,
          sessionName: `Employee Data Upload ${new Date().toISOString()}`
        }
      });

      if (error) throw error;

      setSessionId(data.sessionId);
      
      // Poll for upload progress
      const pollProgress = setInterval(async () => {
        const { data: progressData } = await supabase.functions.invoke('employee-upload-progress', {
          body: { sessionId: data.sessionId }
        });

        if (progressData) {
          setUploadProgress(progressData.progress);
          
          if (progressData.status === 'completed') {
            clearInterval(pollProgress);
            setUploadComplete(true);
            setUploading(false);
            toast({
              title: "Data Upload Complete!",
              description: `Successfully uploaded ${progressData.progress.processed} employee records`
            });
            // Switch to assignment tab
            setActiveTab("assign");
            loadAvailableSessions();
          } else if (progressData.status === 'error') {
            clearInterval(pollProgress);
            setUploading(false);
            toast({
              title: "Upload Failed",
              description: progressData.error || "An error occurred during upload",
              variant: "destructive"
            });
          }
        }
      }, 2000);

    } catch (error: any) {
      console.error('Upload error:', error);
      setUploading(false);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload employee data",
        variant: "destructive"
      });
    }
  };

  const loadAvailableSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('xlsmart_upload_sessions')
        .select('*')
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAvailableSessions(data || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const handleAssignRoles = async () => {
    if (!selectedSessionForAssignment) {
      toast({
        title: "No session selected",
        description: "Please select an upload session to assign roles",
        variant: "destructive"
      });
      return;
    }

    try {
      setAssigning(true);
      setAssignmentProgress({ total: 0, processed: 0, assigned: 0, errors: 0 });

      // Start AI role assignment (Step 2)
      const { data, error } = await supabase.functions.invoke('employee-role-assignment', {
        body: {
          sessionId: selectedSessionForAssignment
        }
      });

      if (error) throw error;

      toast({
        title: "Starting AI role assignment...",
        description: "Analyzing employee data and assigning roles"
      });
      
      // Poll for assignment progress
      const pollProgress = setInterval(async () => {
        const { data: progressData } = await supabase.functions.invoke('employee-upload-progress', {
          body: { sessionId: selectedSessionForAssignment }
        });

        if (progressData) {
          setAssignmentProgress(progressData.progress);
          
          if (progressData.status === 'roles_assigned') {
            clearInterval(pollProgress);
            setAssignmentComplete(true);
            setAssigning(false);
            toast({
              title: "Role Assignment Complete!",
              description: `Successfully assigned roles to ${progressData.progress.assigned} employees`
            });
          } else if (progressData.status === 'error') {
            clearInterval(pollProgress);
            setAssigning(false);
            toast({
              title: "Assignment Failed",
              description: progressData.error || "An error occurred during role assignment",
              variant: "destructive"
            });
          }
        }
      }, 2000);

    } catch (error: any) {
      console.error('Assignment error:', error);
      setAssigning(false);
      toast({
        title: "Assignment Failed",
        description: error.message || "Failed to assign roles",
        variant: "destructive"
      });
    }
  };

  const getProgressPercentage = (progress: UploadProgress) => {
    if (progress.total === 0) return 0;
    return Math.round((progress.processed / progress.total) * 100);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          2-Step Employee Upload & AI Role Assignment
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Upload employee data first, then assign roles using AI analysis
        </p>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Step 1: Upload Data
            </TabsTrigger>
            <TabsTrigger value="assign" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Step 2: Assign Roles
            </TabsTrigger>
          </TabsList>

          {/* Step 1: Upload Data */}
          <TabsContent value="upload" className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="employee-files">Upload Employee Data (Excel Files)</Label>
              <Input
                id="employee-files"
                type="file"
                multiple
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                disabled={uploading}
              />
              <p className="text-sm text-muted-foreground">
                Upload Excel files with employee data in the specified format below.
              </p>
            </div>

            {files && files.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Files:</Label>
                <div className="flex flex-wrap gap-2">
                  {Array.from(files).map((file, index) => (
                    <Badge key={index} variant="outline">
                      {file.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Button 
              onClick={handleUploadData} 
              disabled={!files || files.length === 0 || uploading}
              className="w-full"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading Data...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Employee Data
                </>
              )}
            </Button>

            {uploading && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Upload Progress</span>
                    <span>{getProgressPercentage(uploadProgress)}%</span>
                  </div>
                  <Progress value={getProgressPercentage(uploadProgress)} className="w-full" />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{uploadProgress.total}</div>
                    <div className="text-sm text-muted-foreground">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-500">{uploadProgress.processed}</div>
                    <div className="text-sm text-muted-foreground">Processed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">{uploadProgress.assigned}</div>
                    <div className="text-sm text-muted-foreground">Uploaded</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-500">{uploadProgress.errors}</div>
                    <div className="text-sm text-muted-foreground">Errors</div>
                  </div>
                </div>
              </div>
            )}

            {uploadComplete && (
              <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Data Upload Completed Successfully!</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Total Records:</span> {uploadProgress.total}
                  </div>
                  <div>
                    <span className="font-medium">Successfully Uploaded:</span> {uploadProgress.processed}
                  </div>
                  <div>
                    <span className="font-medium">Errors:</span> {uploadProgress.errors}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Ready for role assignment. Click "Step 2: Assign Roles" to continue.
                  </p>
                  <Button onClick={() => setActiveTab("assign")} size="sm" className="flex items-center gap-2">
                    Next Step <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Step 2: Assign Roles */}
          <TabsContent value="assign" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Select Upload Session for Role Assignment</Label>
                <Button onClick={loadAvailableSessions} variant="outline" size="sm">
                  Refresh Sessions
                </Button>
              </div>
              
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {availableSessions.map((session) => (
                  <div 
                    key={session.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedSessionForAssignment === session.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedSessionForAssignment(session.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-sm">{session.session_name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {session.total_rows} employees • Status: {session.status}
                        </p>
                      </div>
                      <Badge variant={selectedSessionForAssignment === session.id ? "default" : "outline"} className="text-xs">
                        {selectedSessionForAssignment === session.id ? "Selected" : "Select"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button 
              onClick={handleAssignRoles} 
              disabled={!selectedSessionForAssignment || assigning}
              className="w-full"
            >
              {assigning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assigning Roles with AI...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4" />
                  Start AI Role Assignment
                </>
              )}
            </Button>

            {assigning && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Assignment Progress</span>
                    <span>{getProgressPercentage(assignmentProgress)}%</span>
                  </div>
                  <Progress value={getProgressPercentage(assignmentProgress)} className="w-full" />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{assignmentProgress.total}</div>
                    <div className="text-sm text-muted-foreground">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-500">{assignmentProgress.processed}</div>
                    <div className="text-sm text-muted-foreground">Analyzed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">{assignmentProgress.assigned}</div>
                    <div className="text-sm text-muted-foreground">Assigned</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-500">{assignmentProgress.errors}</div>
                    <div className="text-sm text-muted-foreground">Errors</div>
                  </div>
                </div>
              </div>
            )}

            {assignmentComplete && (
              <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">AI Role Assignment Completed!</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Total Employees:</span> {assignmentProgress.total}
                  </div>
                  <div>
                    <span className="font-medium">Roles Assigned:</span> {assignmentProgress.assigned}
                  </div>
                  <div>
                    <span className="font-medium">Errors:</span> {assignmentProgress.errors}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Expected Format Documentation */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">Required Excel Format:</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p className="font-medium">Column Headers (exact names required):</p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>• EmployeeID</div>
              <div>• Name</div>
              <div>• Telco</div>
              <div>• CurrentRoleTitle</div>
              <div>• Level</div>
              <div>• Skills</div>
              <div>• Certifications</div>
              <div>• YearsExperience</div>
              <div>• Location</div>
              <div>• PerformanceRating</div>
              <div>• Aspirations</div>
            </div>
            <p className="text-xs mt-2 text-blue-600">
              Skills and Certifications should be comma-separated values
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};