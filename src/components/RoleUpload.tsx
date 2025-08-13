import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/LanguageContext";

export const RoleUpload = () => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { t } = useLanguage();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadStatus('idle');
    }
  };

  const simulateUpload = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    setUploadStatus('processing');
    setUploadProgress(0);

    // Simulate upload progress
    for (let i = 0; i <= 100; i += 10) {
      setUploadProgress(i);
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setIsUploading(false);
    setUploadStatus('completed');
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setUploadStatus('idle');
    setIsUploading(false);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-card-foreground mb-2">{t('feature.upload.title')}</h2>
        <p className="text-muted-foreground">{t('feature.upload.description')}</p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <Upload className="h-5 w-5 text-primary" />
            Bulk Role Upload & Standardization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Source Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="source" className="text-card-foreground">Source Company</Label>
              <Select>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Select source company" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-popover border-border" sideOffset={5} alignOffset={0}>
                  <SelectItem value="xl" className="text-popover-foreground hover:bg-accent">XL Axiata</SelectItem>
                  <SelectItem value="smart" className="text-popover-foreground hover:bg-accent">SMART Telecom</SelectItem>
                  <SelectItem value="both" className="text-popover-foreground hover:bg-accent">Both Companies</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="format" className="text-card-foreground">File Format</Label>
              <Select>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Select file format" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-popover border-border" sideOffset={5} alignOffset={0}>
                  <SelectItem value="excel" className="text-popover-foreground hover:bg-accent">Excel (.xlsx)</SelectItem>
                  <SelectItem value="csv" className="text-popover-foreground hover:bg-accent">CSV (.csv)</SelectItem>
                  <SelectItem value="json" className="text-popover-foreground hover:bg-accent">JSON (.json)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center bg-background">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".xlsx,.csv,.json"
                onChange={handleFileSelect}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center space-y-2"
              >
                <FileText className="h-12 w-12 text-muted-foreground" />
                <div className="text-lg font-medium text-foreground">
                  {selectedFile ? selectedFile.name : "Choose file to upload"}
                </div>
                <div className="text-sm text-muted-foreground">
                  Supports Excel, CSV, and JSON formats
                </div>
              </label>
            </div>

            {selectedFile && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg border border-border">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-card-foreground">{selectedFile.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  
                  {uploadStatus === 'completed' && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  {uploadStatus === 'error' && (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  )}
                </div>

                {uploadStatus === 'processing' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-card-foreground">
                      <span>Processing roles...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="bg-muted" />
                  </div>
                )}

                {uploadStatus === 'completed' && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-medium">Upload completed successfully!</span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      Found 47 roles • Mapped 43 to XLSMART standards • 4 require manual review
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  {uploadStatus === 'idle' && (
                    <Button onClick={simulateUpload} disabled={isUploading} className="xl-button-primary">
                      Start Processing
                    </Button>
                  )}
                  
                  {uploadStatus === 'completed' && (
                    <>
                      <Button className="xl-button-primary">Review Mappings</Button>
                      <Button variant="outline" onClick={resetUpload}>
                        Upload Another File
                      </Button>
                    </>
                  )}
                  
                  {uploadStatus !== 'completed' && uploadStatus !== 'processing' && (
                    <Button variant="outline" onClick={resetUpload}>
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mapping Results Preview */}
      {uploadStatus === 'completed' && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Role Mapping Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-2xl font-bold text-green-800">43</div>
                  <div className="text-sm text-green-700">Auto-mapped roles</div>
                </div>
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-800">4</div>
                  <div className="text-sm text-yellow-700">Need manual review</div>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-2xl font-bold text-blue-800">91%</div>
                  <div className="text-sm text-blue-700">Mapping accuracy</div>
                </div>
              </div>
              
              <Button className="w-full xl-button-primary">
                Proceed to Job Description Generation
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};