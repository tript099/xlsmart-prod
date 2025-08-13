import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Upload, FileSpreadsheet, Brain, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import * as XLSX from 'xlsx';
import { useLanguage } from "@/contexts/LanguageContext";

export const RoleUploadFlexible = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [xlFile, setXlFile] = useState<File | null>(null);
  const [smartFile, setSmartFile] = useState<File | null>(null);
  const [includeIndustryStandards, setIncludeIndustryStandards] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFlexibleUpload = async () => {
    try {
      setIsProcessing(true);
      setUploadProgress(0);

      if (!xlFile || !smartFile) {
        throw new Error('Please select both XL and SMART role files');
      }

      // Step 1: Parse Excel files to get structured data
      const parseExcelFile = async (file: File): Promise<{fileName: string, headers: string[], rows: any[][]}> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const data = e.target?.result;
              const workbook = XLSX.read(data, { type: 'array' });
              const sheetName = workbook.SheetNames[0];
              const worksheet = workbook.Sheets[sheetName];
              const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
              
              if (jsonData.length === 0) {
                resolve({ fileName: file.name, headers: [], rows: [] });
                return;
              }
              
              const headers = jsonData[0] as string[];
              const rows = jsonData.slice(1) as any[][];
              
              resolve({
                fileName: file.name,
                headers: headers.filter(h => h && String(h).trim()), // Remove empty headers
                rows: rows.filter(row => row.some(cell => cell && String(cell).trim())) // Remove empty rows
              });
            } catch (error) {
              reject(error);
            }
          };
          reader.onerror = () => reject(new Error('File reading failed'));
          reader.readAsArrayBuffer(file);
        });
      };

      setUploadProgress(20);

      // Parse both files
      const [xlData, smartData] = await Promise.all([
        parseExcelFile(xlFile),
        parseExcelFile(smartFile)
      ]);

      console.log('✅ Parsed XL data:', { 
        fileName: xlData.fileName, 
        headers: xlData.headers, 
        rowCount: xlData.rows.length 
      });
      console.log('✅ Parsed SMART data:', { 
        fileName: smartData.fileName, 
        headers: smartData.headers, 
        rowCount: smartData.rows.length 
      });

      if (xlData.rows.length === 0 && smartData.rows.length === 0) {
        throw new Error('No data found in the uploaded files. Please check that the Excel files contain data.');
      }

      setUploadProgress(40);

      // Step 2: Upload to flexible storage
      console.log('📤 Uploading data to flexible storage...');
      const { data: uploadResult, error: uploadError } = await supabase.functions.invoke('flexible-role-upload', {
        body: {
          action: 'upload',
          sessionName: `${xlData.fileName} + ${smartData.fileName}`,
          excelData: [xlData, smartData]
        }
      });

      if (uploadError) throw uploadError;
      if (!uploadResult.success) throw new Error(uploadResult.error);

      console.log('✅ Upload successful:', uploadResult);
      setUploadProgress(60);

      // Step 3: AI Standardization
      console.log('🧠 Starting AI role standardization...');
      const { data: standardizeResult, error: standardizeError } = await supabase.functions.invoke('flexible-role-upload', {
        body: {
          action: 'standardize',
          sessionId: uploadResult.sessionId
        }
      });

      if (standardizeError) throw standardizeError;
      if (!standardizeResult.success) throw new Error(standardizeResult.error);

      console.log('✅ Standardization complete:', standardizeResult);
      setUploadProgress(100);

      // Show success message
      toast({
        title: "✅ XLSMART Role Catalog Created!",
        description: `Successfully processed ${uploadResult.totalRows} roles from 2 sources • Created ${standardizeResult.standardRolesCreated} standard roles • ${standardizeResult.mappingsCreated} mappings generated`,
        duration: 8000,
      });

      // Trigger refresh of dashboard data
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('❌ Error during flexible role upload:', error);
      toast({
        title: "❌ Role Upload Failed",
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: "destructive",
        duration: 10000,
      });
    } finally {
      setIsProcessing(false);
      setUploadProgress(0);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto border-border bg-card">
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center gap-2 text-card-foreground">
          <Brain className="h-6 w-6 text-primary" />
          Flexible AI-Powered Role Standardization
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Upload XL and SMART role catalogs to automatically create standardized roles using AI. 
          No column format restrictions - the system adapts to your data structure.
        </p>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* File Upload Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* XL Roles File */}
          <div className="space-y-2">
            <Label htmlFor="xl-file" className="text-card-foreground">XL Roles File (.xlsx)</Label>
            <div className="relative">
              <Input
                id="xl-file"
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setXlFile(e.target.files?.[0] || null)}
                className="bg-background border-border text-foreground file:bg-primary file:text-primary-foreground"
                disabled={isProcessing}
              />
              <FileSpreadsheet className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
            {xlFile && (
              <p className="text-sm text-primary">
                ✓ {xlFile.name} ({(xlFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          {/* SMART Roles File */}
          <div className="space-y-2">
            <Label htmlFor="smart-file" className="text-card-foreground">SMART Roles File (.xlsx)</Label>
            <div className="relative">
              <Input
                id="smart-file"
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setSmartFile(e.target.files?.[0] || null)}
                className="bg-background border-border text-foreground file:bg-primary file:text-primary-foreground"
                disabled={isProcessing}
              />
              <FileSpreadsheet className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
            {smartFile && (
              <p className="text-sm text-primary">
                ✓ {smartFile.name} ({(smartFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>
        </div>

        {/* Options */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="industry-standards"
              checked={includeIndustryStandards}
              onCheckedChange={(checked) => setIncludeIndustryStandards(checked as boolean)}
              disabled={isProcessing}
            />
            <Label htmlFor="industry-standards" className="text-sm text-card-foreground">
              Include AI-generated industry standards for telecommunications
            </Label>
          </div>
        </div>

        {/* Progress */}
        {isProcessing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {uploadProgress < 30 && "📊 Analyzing Excel structure..."}
                {uploadProgress >= 30 && uploadProgress < 60 && "📤 Uploading role data..."}
                {uploadProgress >= 60 && uploadProgress < 100 && "🧠 AI standardizing roles..."}
                {uploadProgress === 100 && "✅ Role Standardization Complete!"}
              </span>
              <span className="text-card-foreground">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="w-full" />
          </div>
        )}

        {/* Action Button */}
        <Button
          onClick={handleFlexibleUpload}
          disabled={!xlFile || !smartFile || isProcessing}
          className="w-full xl-button-primary"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Brain className="mr-2 h-4 w-4 animate-spin" />
              AI Processing Roles...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Create XLSMART Role Catalog
            </>
          )}
        </Button>

        {/* Info Section */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <h4 className="font-medium text-card-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            How This Works
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1 ml-6">
            <li>• Automatically detects column structure in your Excel files</li>
            <li>• Uses AI to create standardized telecommunications roles</li>
            <li>• Maps your existing roles to standardized equivalents</li>
            <li>• Creates confidence scores for each mapping</li>
            <li>• No manual column matching required - works with any Excel format</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};