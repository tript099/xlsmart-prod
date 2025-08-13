import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, CheckCircle, AlertCircle, Eye, ThumbsUp, ThumbsDown } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RoleMappingResult {
  id: string;
  originalTitle: string;
  originalDepartment: string;
  standardizedTitle: string;
  standardizedDepartment: string;
  jobFamily: string;
  confidence: number;
  requiresReview: boolean;
  status: 'auto_mapped' | 'manual_review' | 'approved' | 'rejected';
}

export const RoleUpload = () => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sourceCompany, setSourceCompany] = useState<string>('');
  const [fileFormat, setFileFormat] = useState<string>('');
  const [catalogId, setCatalogId] = useState<string | null>(null);
  const [mappingResults, setMappingResults] = useState<RoleMappingResult[]>([]);
  const [showMappingReview, setShowMappingReview] = useState(false);
  const { t } = useLanguage();
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadStatus('idle');
    }
  };

  const simulateUpload = async () => {
    if (!selectedFile || !sourceCompany || !fileFormat) {
      toast({
        title: "Missing Information",
        description: "Please select source company, file format, and file before processing.",
        variant: "destructive"
      });
      return;
    }
    
    setIsUploading(true);
    setUploadStatus('processing');
    setUploadProgress(0);

    try {
      // Step 1: Create role catalog entry
      const { data: catalogData, error: catalogError } = await supabase
        .from('xlsmart_role_catalogs')
        .insert({
          source_company: sourceCompany,
          file_name: selectedFile.name,
          file_format: fileFormat,
          file_size: selectedFile.size,
          upload_status: 'processing',
          uploaded_by: '00000000-0000-0000-0000-000000000000' // Temporary, should be auth.uid()
        })
        .select()
        .single();

      if (catalogError) throw catalogError;
      setCatalogId(catalogData.id);

      // Simulate processing with progress updates
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Step 2: Create sample role mappings
      const sampleMappings = [
        {
          catalog_id: catalogData.id,
          original_role_title: "Senior Software Engineer",
          original_department: "Technology",
          original_level: "Senior",
          standardized_role_title: "Senior Software Developer",
          standardized_department: "Engineering",
          standardized_level: "L5",
          job_family: "Technology",
          mapping_confidence: 95.5,
          requires_manual_review: false,
          mapping_status: 'auto_mapped'
        },
        {
          catalog_id: catalogData.id,
          original_role_title: "Marketing Manager",
          original_department: "Marketing",
          original_level: "Manager",
          standardized_role_title: "Marketing Manager",
          standardized_department: "Marketing",
          standardized_level: "M2",
          job_family: "Marketing",
          mapping_confidence: 88.2,
          requires_manual_review: false,
          mapping_status: 'auto_mapped'
        },
        {
          catalog_id: catalogData.id,
          original_role_title: "Business Development Associate",
          original_department: "Sales",
          original_level: "Associate",
          standardized_role_title: "Business Development Representative",
          standardized_department: "Sales",
          standardized_level: "L3",
          job_family: "Sales",
          mapping_confidence: 72.8,
          requires_manual_review: true,
          mapping_status: 'manual_review'
        },
        {
          catalog_id: catalogData.id,
          original_role_title: "HR Specialist",
          original_department: "Human Resources",
          original_level: "Specialist",
          standardized_role_title: "HR Business Partner",
          standardized_department: "Human Resources",
          standardized_level: "L4",
          job_family: "Human Resources",
          mapping_confidence: 79.3,
          requires_manual_review: true,
          mapping_status: 'manual_review'
        }
      ];

      const { data: mappingsData, error: mappingsError } = await supabase
        .from('xlsmart_role_mappings')
        .insert(sampleMappings)
        .select();

      if (mappingsError) throw mappingsError;

      // Update catalog with results
      await supabase
        .from('xlsmart_role_catalogs')
        .update({
          upload_status: 'completed',
          total_roles: sampleMappings.length,
          processed_roles: sampleMappings.length,
          mapping_accuracy: 86.2
        })
        .eq('id', catalogData.id);

      // Convert to display format
      const displayMappings: RoleMappingResult[] = mappingsData.map(mapping => ({
        id: mapping.id,
        originalTitle: mapping.original_role_title,
        originalDepartment: mapping.original_department || '',
        standardizedTitle: mapping.standardized_role_title,
        standardizedDepartment: mapping.standardized_department || '',
        jobFamily: mapping.job_family || '',
        confidence: mapping.mapping_confidence || 0,
        requiresReview: mapping.requires_manual_review || false,
        status: mapping.mapping_status as any
      }));

      setMappingResults(displayMappings);
      setIsUploading(false);
      setUploadStatus('completed');

      toast({
        title: "Upload Successful",
        description: `Processed ${sampleMappings.length} roles with ${displayMappings.filter(m => !m.requiresReview).length} auto-mapped.`
      });

    } catch (error) {
      console.error('Error during upload:', error);
      setIsUploading(false);
      setUploadStatus('error');
      toast({
        title: "Upload Failed",
        description: "There was an error processing your file. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleMappingReview = (mappingId: string, approved: boolean) => {
    setMappingResults(prev => prev.map(mapping => 
      mapping.id === mappingId 
        ? { ...mapping, status: approved ? 'approved' : 'rejected' }
        : mapping
    ));

    // Update in database
    supabase
      .from('xlsmart_role_mappings')
      .update({
        mapping_status: approved ? 'approved' : 'rejected',
        reviewed_by: '00000000-0000-0000-0000-000000000000', // Should be auth.uid()
        reviewed_at: new Date().toISOString()
      })
      .eq('id', mappingId)
      .then(() => {
        toast({
          title: approved ? "Mapping Approved" : "Mapping Rejected",
          description: `Role mapping has been ${approved ? 'approved' : 'rejected'} successfully.`
        });
      });
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setUploadStatus('idle');
    setIsUploading(false);
    setCatalogId(null);
    setMappingResults([]);
    setShowMappingReview(false);
    setSourceCompany('');
    setFileFormat('');
  };

  const autoMappedCount = mappingResults.filter(m => m.status === 'auto_mapped').length;
  const reviewRequiredCount = mappingResults.filter(m => m.requiresReview && m.status === 'manual_review').length;
  const overallAccuracy = mappingResults.length > 0 
    ? (mappingResults.reduce((acc, m) => acc + m.confidence, 0) / mappingResults.length).toFixed(1)
    : '0';

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
              <Select value={sourceCompany} onValueChange={setSourceCompany}>
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
              <Select value={fileFormat} onValueChange={setFileFormat}>
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
                      Found {mappingResults.length} roles • Mapped {autoMappedCount} to XLSMART standards • {reviewRequiredCount} require manual review
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  {uploadStatus === 'idle' && (
                    <Button onClick={simulateUpload} disabled={isUploading || !sourceCompany || !fileFormat} className="xl-button-primary">
                      Start Processing
                    </Button>
                  )}
                  
                  {uploadStatus === 'completed' && (
                    <>
                      <Button onClick={() => setShowMappingReview(true)} className="xl-button-primary">
                        <Eye className="mr-2 h-4 w-4" />
                        Review Mappings
                      </Button>
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
                  <div className="text-2xl font-bold text-green-800">{autoMappedCount}</div>
                  <div className="text-sm text-green-700">Auto-mapped roles</div>
                </div>
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-800">{reviewRequiredCount}</div>
                  <div className="text-sm text-yellow-700">Need manual review</div>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-2xl font-bold text-blue-800">{overallAccuracy}%</div>
                  <div className="text-sm text-blue-700">Mapping accuracy</div>
                </div>
              </div>
              
              <Button className="w-full xl-button-primary" onClick={() => setShowMappingReview(true)}>
                <Eye className="mr-2 h-4 w-4" />
                Review All Mappings
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mapping Review Dialog */}
      <Dialog open={showMappingReview} onOpenChange={setShowMappingReview}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-card-foreground">Role Mapping Review</h2>
              <p className="text-muted-foreground">Review and approve AI-generated role mappings</p>
            </div>
            
            <div className="space-y-4">
              {mappingResults.map((mapping) => (
                <Card key={mapping.id} className="border-border bg-card">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-semibold text-card-foreground mb-2">Original Role</h3>
                        <div className="space-y-1 text-sm">
                          <div><span className="font-medium">Title:</span> {mapping.originalTitle}</div>
                          <div><span className="font-medium">Department:</span> {mapping.originalDepartment}</div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-card-foreground mb-2">Standardized Role</h3>
                        <div className="space-y-1 text-sm">
                          <div><span className="font-medium">Title:</span> {mapping.standardizedTitle}</div>
                          <div><span className="font-medium">Department:</span> {mapping.standardizedDepartment}</div>
                          <div><span className="font-medium">Job Family:</span> {mapping.jobFamily}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={mapping.requiresReview ? "destructive" : "default"}>
                          {mapping.confidence.toFixed(1)}% confidence
                        </Badge>
                        {mapping.status === 'approved' && (
                          <Badge variant="default" className="bg-green-100 text-green-800">Approved</Badge>
                        )}
                        {mapping.status === 'rejected' && (
                          <Badge variant="destructive">Rejected</Badge>
                        )}
                      </div>
                      
                      {mapping.requiresReview && mapping.status === 'manual_review' && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleMappingReview(mapping.id, false)}
                          >
                            <ThumbsDown className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => handleMappingReview(mapping.id, true)}
                            className="xl-button-primary"
                          >
                            <ThumbsUp className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setShowMappingReview(false)}>
                Close Review
              </Button>
              <Button className="xl-button-primary">
                Proceed to Job Description Generation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};