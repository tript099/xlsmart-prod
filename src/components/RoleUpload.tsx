import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export const RoleUpload = () => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Bulk Role Upload & Standardization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Source Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="source">Source Company</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select source company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="xl">XL Axiata</SelectItem>
                  <SelectItem value="smart">SMART Telecom</SelectItem>
                  <SelectItem value="both">Both Companies</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="format">File Format</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select file format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                  <SelectItem value="csv">CSV (.csv)</SelectItem>
                  <SelectItem value="json">JSON (.json)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
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
                <div className="text-lg font-medium">
                  {selectedFile ? selectedFile.name : "Choose file to upload"}
                </div>
                <div className="text-sm text-muted-foreground">
                  Supports Excel, CSV, and JSON formats
                </div>
              </label>
            </div>

            {selectedFile && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm font-medium">{selectedFile.name}</span>
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
                    <div className="flex justify-between text-sm">
                      <span>Processing roles...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} />
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
                    <Button onClick={simulateUpload} disabled={isUploading}>
                      Start Processing
                    </Button>
                  )}
                  
                  {uploadStatus === 'completed' && (
                    <>
                      <Button>Review Mappings</Button>
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
        <Card>
          <CardHeader>
            <CardTitle>Role Mapping Results</CardTitle>
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
              
              <Button className="w-full">
                Proceed to Job Description Generation
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};