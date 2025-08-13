import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileSpreadsheet, Brain, CheckCircle, AlertCircle, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
  const [xlFiles, setXlFiles] = useState<File[]>([]);
  const [smartFiles, setSmartFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [results, setResults] = useState<any>(null);

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

  const processRoleStandardization = async () => {
    if (xlFiles.length === 0 && smartFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one Excel file",
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
      setProgress(10);
      
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

      // Step 2: Get user and create session
      setCurrentStep("🔐 Creating upload session...");
      setProgress(20);
      
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data: session, error: sessionError } = await supabase
        .from('xlsmart_upload_sessions')
        .insert({
          session_name: `Role Standardization: ${allFiles.map(f => f.name).join(', ')}`,
          file_names: allFiles.map(f => f.name),
          temp_table_names: [],
          total_rows: parsedFiles.reduce((sum, file) => sum + file.rows.length, 0),
          status: 'analyzing',
          created_by: user.user.id,
          ai_analysis: { 
            raw_data: parsedFiles.map(f => ({
              fileName: f.fileName,
              headers: f.headers,
              rows: f.rows,
              type: f.type
            })),
            xl_files: parsedFiles.filter(f => f.type === 'xl').length,
            smart_files: parsedFiles.filter(f => f.type === 'smart').length
          }
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Step 3: AI Analysis and Standardization
      setCurrentStep("🧠 AI analyzing roles...");
      setProgress(40);

      const xlRoles = parsedFiles
        .filter(f => f.type === 'xl')
        .flatMap(file => file.rows.map(row => {
          const roleObj: any = {};
          file.headers.forEach((header, index) => {
            roleObj[header] = row[index];
          });
          roleObj._source = 'xl';
          roleObj._file = file.fileName;
          return roleObj;
        }));

      const smartRoles = parsedFiles
        .filter(f => f.type === 'smart')
        .flatMap(file => file.rows.map(row => {
          const roleObj: any = {};
          file.headers.forEach((header, index) => {
            roleObj[header] = row[index];
          });
          roleObj._source = 'smart';
          roleObj._file = file.fileName;
          return roleObj;
        }));

      const prompt = `Analyze these role data from XL and Smart sources and create standardized telecommunications roles:

XL Roles (${xlRoles.length} roles):
${xlRoles.slice(0, 5).map(role => JSON.stringify(role)).join('\n')}

Smart Roles (${smartRoles.length} roles):
${smartRoles.slice(0, 5).map(role => JSON.stringify(role)).join('\n')}

Create 8-12 standardized roles that best represent both XL and Smart role structures. Return valid JSON:

{
  "standardRoles": [
    {
      "role_title": "Network Operations Engineer",
      "department": "Network Operations", 
      "job_family": "Engineering",
      "role_level": "IC3-IC5",
      "role_category": "Technology",
      "standard_description": "Manages and monitors network infrastructure operations",
      "industry_alignment": "Telecommunications"
    }
  ],
  "mappings": [
    {
      "original_role_title": "RAN Performance Engineer",
      "original_department": "Network",
      "original_level": "Senior",
      "standardized_role_title": "Network Operations Engineer",
      "standardized_department": "Network Operations",
      "standardized_level": "IC4",
      "job_family": "Engineering",
      "mapping_confidence": 85,
      "mapping_status": "auto_mapped",
      "catalog_id": "${session.id}"
    }
  ]
}`;

      setProgress(60);

      // Call our edge function instead of direct API call
      const { data: aiResult, error: aiError } = await supabase.functions.invoke('role-standardization', {
        body: {
          sessionId: session.id,
          xlRoles,
          smartRoles
        }
      });

      if (aiError) {
        throw new Error(`Standardization error: ${aiError.message}`);
      }

      if (!aiResult.success) {
        throw new Error(aiResult.error || 'Standardization failed');
      }

      setProgress(100);
      setCurrentStep("✅ Standardization completed!");

      setResults({
        standardRoles: aiResult.standardRoles,
        mappings: aiResult.mappings,
        xlRoles: aiResult.xlRoles,
        smartRoles: aiResult.smartRoles,
        totalProcessed: aiResult.totalProcessed
      });

      toast({
        title: "🎉 Success!",
        description: `Created ${aiResult.standardRoles} standard roles with ${aiResult.mappings} mappings`,
        duration: 5000
      });

    } catch (error) {
      console.error('Standardization error:', error);
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
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-3 text-2xl">
          <Brain className="h-6 w-6 text-primary" />
          XL & Smart Role Standardization
        </CardTitle>
        <p className="text-muted-foreground">
          Upload XL and Smart role catalogs for AI-powered standardization
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* File Upload Tabs */}
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
          
          <TabsContent value="xl" className="space-y-4">
            <div>
              <Label htmlFor="xl-files">XL Role Catalog Files</Label>
              <Input
                id="xl-files"
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
          
          <TabsContent value="smart" className="space-y-4">
            <div>
              <Label htmlFor="smart-files">Smart Role Catalog Files</Label>
              <Input
                id="smart-files"
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

        {/* Progress */}
        {isProcessing && (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>{currentStep}</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {/* Results */}
        {results && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <div className="space-y-2">
                <p className="font-medium">Standardization completed successfully!</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p>• XL Roles Processed: <strong>{results.xlRoles}</strong></p>
                    <p>• Smart Roles Processed: <strong>{results.smartRoles}</strong></p>
                  </div>
                  <div>
                    <p>• Standard Roles Created: <strong>{results.standardRoles}</strong></p>
                    <p>• Mappings Generated: <strong>{results.mappings}</strong></p>
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Action Button */}
        <Button
          onClick={processRoleStandardization}
          disabled={(xlFiles.length === 0 && smartFiles.length === 0) || isProcessing}
          className="w-full h-12 text-lg"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Brain className="mr-2 h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-5 w-5" />
              Standardize Roles with AI
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};