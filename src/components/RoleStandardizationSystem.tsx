import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileSpreadsheet, Brain, CheckCircle, AlertCircle, Zap, Database } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';

interface ParsedFile {
  fileName: string;
  headers: string[];
  rows: any[][];
  type: 'xl' | 'smart';
}

export const RoleStandardizationSystem = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [xlFiles, setXlFiles] = useState<File[]>([]);
  const [smartFiles, setSmartFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [results, setResults] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [uploadComplete, setUploadComplete] = useState(false);

  const parseExcelFile = useCallback((file: File, type: 'xl' | 'smart'): Promise<ParsedFile> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          const headers = jsonData[0] as string[];
          const rows = jsonData.slice(1) as any[][];
          
          resolve({
            fileName: file.name,
            headers: headers.filter(h => h && String(h).trim()),
            rows: rows.filter(row => row.some(cell => cell && String(cell).trim())),
            type
          });
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('File reading failed'));
      reader.readAsArrayBuffer(file);
    });
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, type: 'xl' | 'smart') => {
    const selectedFiles = Array.from(e.target.files || []);
    if (type === 'xl') {
      setXlFiles(selectedFiles);
    } else {
      setSmartFiles(selectedFiles);
    }
  }, []);

  const uploadToDatabase = async () => {
    if (xlFiles.length === 0 && smartFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one Excel file",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to use this feature",
        variant: "destructive"
      });
      return;
    }

    // Check if user session is valid
    const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
    if (userError || !currentUser) {
      toast({
        title: "Session Expired",
        description: "Please refresh the page and log in again",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setResults(null);

    try {
      // Step 1: Parse files
      setCurrentStep("📊 Parsing Excel files...");
      setProgress(20);
      
      const allFiles = [...xlFiles, ...smartFiles];
      const parsedFiles: ParsedFile[] = [];
      
      for (const file of xlFiles) {
        const parsed = await parseExcelFile(file, 'xl');
        parsedFiles.push(parsed);
      }
      
      for (const file of smartFiles) {
        const parsed = await parseExcelFile(file, 'smart');
        parsedFiles.push(parsed);
      }

      // Step 2: Create session
      setCurrentStep("🔐 Creating upload session...");
      setProgress(40);

      const { data: session, error: sessionError } = await supabase
        .from('xlsmart_upload_sessions')
        .insert({
          session_name: `Role Upload ${new Date().toISOString()}: ${allFiles.map(f => f.name).join(', ')}`,
          file_names: allFiles.map(f => f.name),
          temp_table_names: [],
          total_rows: parsedFiles.reduce((sum, file) => sum + file.rows.length, 0),
          status: 'uploading',
          created_by: user.id,
          ai_analysis: { 
            step: 'upload_started',
            xl_files: parsedFiles.filter(f => f.type === 'xl').length,
            smart_files: parsedFiles.filter(f => f.type === 'smart').length
          }
        })
        .select()
        .single();

      if (sessionError) throw sessionError;
      setSessionId(session.id);

      // Step 3: Upload to database
      setCurrentStep("💾 Uploading to database...");
      setProgress(60);

      const xlData = parsedFiles
        .filter(f => f.type === 'xl')
        .flatMap(file => file.rows.map(row => {
          const roleObj: any = {};
          file.headers.forEach((header, index) => {
            roleObj[header] = row[index];
          });
          return roleObj;
        }));

      const smartData = parsedFiles
        .filter(f => f.type === 'smart')
        .flatMap(file => file.rows.map(row => {
          const roleObj: any = {};
          file.headers.forEach((header, index) => {
            roleObj[header] = row[index];
          });
          return roleObj;
        }));

      const { data: uploadResult, error: uploadError } = await supabase.functions.invoke('upload-role-data', {
        body: {
          sessionId: session.id,
          xlData,
          smartData
        }
      });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      if (!uploadResult?.success) {
        console.error('Upload failed:', uploadResult);
        throw new Error(uploadResult?.error || 'Upload failed');
      }

      setProgress(100);
      setCurrentStep("✅ Upload completed!");
      setUploadComplete(true);

      if (uploadResult.skipped) {
        toast({
          title: "ℹ️ Data Already Exists",
          description: `${uploadResult.xlCount + uploadResult.smartCount} roles already uploaded for this session`,
          duration: 5000
        });
      } else {
        toast({
          title: "🎉 Upload Success!",
          description: `Uploaded ${uploadResult.totalInserted} new roles to database`,
          duration: 5000
        });
      }

    } catch (error) {
      console.error('Upload error details:', error);
      
      toast({
        title: "❌ Upload Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setCurrentStep("");
    }
  };

  const runStandardization = async () => {
    if (!sessionId) {
      toast({
        title: "No upload session",
        description: "Please upload data first",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      setCurrentStep("🧠 AI standardizing roles...");
      setProgress(50);

      const { data: result, error } = await supabase.functions.invoke('ai-role-standardization', {
        body: { sessionId }
      });

      if (error) {
        console.error('Standardization error:', error);
        throw new Error(`Standardization failed: ${error.message}`);
      }

      if (!result?.success) {
        console.error('Standardization failed:', result);
        throw new Error(result?.error || 'Standardization failed');
      }

      setProgress(100);
      setCurrentStep("✅ Standardization completed!");

      setResults({
        standardizedRolesCreated: result.standardizedRolesCreated,
        mappingsCreated: result.mappingsCreated,
        xlDataProcessed: result.xlDataProcessed,
        smartDataProcessed: result.smartDataProcessed
      });

      toast({
        title: "🎉 Standardization Success!",
        description: `Created ${result.standardizedRolesCreated} standardized roles with ${result.mappingsCreated} mappings`,
        duration: 5000
      });

    } catch (error) {
      console.error('Standardization error details:', error);
      
      toast({
        title: "❌ Standardization Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setCurrentStep("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-3">
          <Upload className="h-6 w-6 text-primary" />
          Role Management Options
        </h2>
        <p className="text-muted-foreground mt-2">
          Choose how you want to process your role data
        </p>
      </div>

      {/* Option Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Option 1: Upload Only */}
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Database className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-xl">Upload Only</CardTitle>
            <p className="text-muted-foreground text-sm">
              Simply upload your role data to the system without AI processing
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <Tabs defaultValue="xl" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="xl" className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    XL Roles
                  </TabsTrigger>
                  <TabsTrigger value="smart" className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Smart Roles
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="xl" className="space-y-3">
                  <div>
                    <Label htmlFor="xl-files-upload">XL Role Catalog Files</Label>
                    <Input
                      id="xl-files-upload"
                      type="file"
                      accept=".xlsx,.xls"
                      multiple
                      onChange={(e) => handleFileChange(e, 'xl')}
                      disabled={isProcessing}
                    />
                  </div>
                  
                  {xlFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Selected XL files:</p>
                      {xlFiles.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm p-2 bg-blue-50 rounded">
                          <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                          <span>{file.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {(file.size / 1024).toFixed(1)} KB
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="smart" className="space-y-3">
                  <div>
                    <Label htmlFor="smart-files-upload">Smart Role Catalog Files</Label>
                    <Input
                      id="smart-files-upload"
                      type="file"
                      accept=".xlsx,.xls"
                      multiple
                      onChange={(e) => handleFileChange(e, 'smart')}
                      disabled={isProcessing}
                    />
                  </div>
                  
                  {smartFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Selected Smart files:</p>
                      {smartFiles.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm p-2 bg-green-50 rounded">
                          <FileSpreadsheet className="h-4 w-4 text-green-600" />
                          <span>{file.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {(file.size / 1024).toFixed(1)} KB
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <Button
                onClick={uploadToDatabase}
                disabled={(xlFiles.length === 0 && smartFiles.length === 0) || !user || isProcessing}
                className="w-full"
                variant="outline"
              >
                {isProcessing ? (
                  <>
                    <Database className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-4 w-4" />
                    Upload to System
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Option 2: Upload and Standardize */}
        <Card className="hover:shadow-lg transition-shadow duration-200 border-primary/20">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-gradient-to-br from-primary/10 to-primary/20 rounded-full flex items-center justify-center mb-4">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-xl">Upload & Standardize</CardTitle>
            <p className="text-muted-foreground text-sm">
              Upload and let AI standardize your roles automatically
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <Tabs defaultValue="xl-std" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="xl-std" className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    XL Roles
                  </TabsTrigger>
                  <TabsTrigger value="smart-std" className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Smart Roles
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="xl-std" className="space-y-3">
                  <div>
                    <Label htmlFor="xl-files-std">XL Role Catalog Files</Label>
                    <Input
                      id="xl-files-std"
                      type="file"
                      accept=".xlsx,.xls"
                      multiple
                      onChange={(e) => handleFileChange(e, 'xl')}
                      disabled={isProcessing}
                    />
                  </div>
                  
                  {xlFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Selected XL files:</p>
                      {xlFiles.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm p-2 bg-blue-50 rounded">
                          <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                          <span>{file.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {(file.size / 1024).toFixed(1)} KB
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="smart-std" className="space-y-3">
                  <div>
                    <Label htmlFor="smart-files-std">Smart Role Catalog Files</Label>
                    <Input
                      id="smart-files-std"
                      type="file"
                      accept=".xlsx,.xls"
                      multiple
                      onChange={(e) => handleFileChange(e, 'smart')}
                      disabled={isProcessing}
                    />
                  </div>
                  
                  {smartFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Selected Smart files:</p>
                      {smartFiles.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm p-2 bg-green-50 rounded">
                          <FileSpreadsheet className="h-4 w-4 text-green-600" />
                          <span>{file.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {(file.size / 1024).toFixed(1)} KB
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <Button
                onClick={async () => {
                  await uploadToDatabase();
                  if (sessionId) {
                    await runStandardization();
                  }
                }}
                disabled={(xlFiles.length === 0 && smartFiles.length === 0) || !user || isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Brain className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" />
                    Upload & Standardize
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress */}
      {isProcessing && (
        <Card className="max-w-2xl mx-auto">
          <CardContent className="space-y-3 pt-6">
            <div className="flex justify-between text-sm">
              <span>{currentStep}</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {results && (
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-6">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <div className="space-y-2">
                  <p className="font-medium">Process completed successfully!</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p>• XL Roles Processed: <strong>{results.xlDataProcessed || 0}</strong></p>
                      <p>• Smart Roles Processed: <strong>{results.smartDataProcessed || 0}</strong></p>
                    </div>
                    <div>
                      <p>• Standardized Roles Created: <strong>{results.standardizedRolesCreated || 0}</strong></p>
                      <p>• Mappings Generated: <strong>{results.mappingsCreated || 0}</strong></p>
                    </div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
};