import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, Users, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';

interface UploadProgress {
  total: number;
  processed: number;
  assigned: number;
  errors: number;
}

export const EmployeeUpload = () => {
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>({ total: 0, processed: 0, assigned: 0, errors: 0 });
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [uploadComplete, setUploadComplete] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    setFiles(selectedFiles);
    setUploadComplete(false);
    setProgress({ total: 0, processed: 0, assigned: 0, errors: 0 });
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

  const handleUpload = async () => {
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
      setProgress(prev => ({ ...prev, total: employeeData.length }));

      toast({
        title: "Processing employees...",
        description: `Found ${employeeData.length} employee records`
      });

      // Upload to Supabase function
      const { data, error } = await supabase.functions.invoke('employee-upload-ai', {
        body: {
          employees: employeeData,
          sessionName: `Employee Upload ${new Date().toISOString()}`
        }
      });

      if (error) throw error;

      setSessionId(data.sessionId);
      
      // Poll for progress
      const pollProgress = setInterval(async () => {
        const { data: progressData } = await supabase.functions.invoke('employee-upload-progress', {
          body: { sessionId: data.sessionId }
        });

        if (progressData) {
          setProgress(progressData.progress);
          
          if (progressData.status === 'completed') {
            clearInterval(pollProgress);
            setUploadComplete(true);
            setUploading(false);
            toast({
              title: "Upload Complete!",
              description: `Successfully processed ${progressData.progress.assigned} employees with AI role assignment`
            });
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

  const getProgressPercentage = () => {
    if (progress.total === 0) return 0;
    return Math.round((progress.processed / progress.total) * 100);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Bulk Employee Upload & AI Role Assignment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
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
            Upload Excel files containing employee data. AI will automatically assign roles based on skills and experience.
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
          onClick={handleUpload} 
          disabled={!files || files.length === 0 || uploading}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload & Assign Roles
            </>
          )}
        </Button>

        {uploading && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing Progress</span>
                <span>{getProgressPercentage()}%</span>
              </div>
              <Progress value={getProgressPercentage()} className="w-full" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{progress.total}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">{progress.processed}</div>
                <div className="text-sm text-muted-foreground">Processed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">{progress.assigned}</div>
                <div className="text-sm text-muted-foreground">Assigned</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500">{progress.errors}</div>
                <div className="text-sm text-muted-foreground">Errors</div>
              </div>
            </div>
          </div>
        )}

        {uploadComplete && (
          <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Upload Completed Successfully!</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Total Employees:</span> {progress.total}
              </div>
              <div>
                <span className="font-medium">Successfully Assigned:</span> {progress.assigned}
              </div>
              <div>
                <span className="font-medium">Errors:</span> {progress.errors}
              </div>
            </div>
            {sessionId && (
              <p className="text-sm text-muted-foreground">
                Session ID: {sessionId}
              </p>
            )}
          </div>
        )}

        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">Expected Excel Format:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Employee Number, First Name, Last Name</li>
            <li>• Email, Phone, Current Position</li>
            <li>• Department, Years of Experience</li>
            <li>• Skills (comma-separated), Education</li>
            <li>• Salary, Certifications</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};