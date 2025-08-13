import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, CheckCircle, AlertCircle, Eye, ThumbsUp, ThumbsDown, Zap } from "lucide-react";
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

  const processRoleStandardization = async () => {
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
          uploaded_by: '00000000-0000-0000-0000-000000000000' // Should be auth.uid()
        })
        .select()
        .single();

      if (catalogError) throw catalogError;
      setCatalogId(catalogData.id);

      setUploadProgress(20);

      // Step 2: Simulate file parsing (in real implementation, parse the actual file)
      const simulatedRoleData = [
        {
          title: "Senior Software Engineer",
          department: "Technology",
          level: "Senior",
          description: "Responsible for developing and maintaining software applications"
        },
        {
          title: "Marketing Manager",
          department: "Marketing", 
          level: "Manager",
          description: "Manage marketing campaigns and team"
        },
        {
          title: "Business Development Associate", 
          department: "Sales",
          level: "Associate",
          description: "Generate new business opportunities"
        },
        {
          title: "HR Specialist",
          department: "Human Resources",
          level: "Specialist", 
          description: "Handle employee relations and HR processes"
        },
        {
          title: "Network Engineer",
          department: "Technology",
          level: "Mid-level",
          description: "Design and maintain telecommunications network infrastructure"
        },
        {
          title: "Customer Success Manager",
          department: "Customer Service",
          level: "Manager",
          description: "Ensure customer satisfaction and retention"
        }
      ];

      setUploadProgress(40);

      // Step 3: Call AI standardization service
      const { data: standardizationResult, error: standardizationError } = await supabase.functions.invoke('standardize-roles', {
        body: {
          roleData: simulatedRoleData,
          sourceCompany: sourceCompany,
          catalogId: catalogData.id
        }
      });

      if (standardizationError) {
        throw new Error(`Standardization failed: ${standardizationError.message}`);
      }

      setUploadProgress(80);

      // Step 4: Fetch the created mappings
      const { data: mappingsData, error: mappingsError } = await supabase
        .from('xlsmart_role_mappings')
        .select(`
          id,
          original_role_title,
          original_department,
          standardized_role_title,
          standardized_department,
          job_family,
          mapping_confidence,
          requires_manual_review,
          mapping_status
        `)
        .eq('catalog_id', catalogData.id);

      if (mappingsError) throw mappingsError;

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
      setUploadProgress(100);
      setIsUploading(false);
      setUploadStatus('completed');

      toast({
        title: "Role Standardization Complete!",
        description: `Successfully processed ${standardizationResult.totalRoles} roles using AI. ${standardizationResult.autoMappedCount} auto-mapped, ${standardizationResult.manualReviewCount} need review.`
      });

    } catch (error) {
      console.error('Error during role standardization:', error);
      setIsUploading(false);
      setUploadStatus('error');
      toast({
        title: "Standardization Failed",
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
        <h2 className="text-2xl font-bold text-card-foreground mb-2">AI-Powered Role Standardization</h2>
        <p className="text-muted-foreground">Upload XL and SMART role catalogs to create XLSMART standard roles using AI</p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <Zap className="h-5 w-5 text-primary" />
            Bulk Role Upload & AI Standardization
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
                  {selectedFile ? selectedFile.name : "Choose role catalog file to upload"}
                </div>
                <div className="text-sm text-muted-foreground">
                  Supports Excel, CSV, and JSON formats containing role data
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
                      <span>AI standardizing roles...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="bg-muted" />
                    <div className="text-xs text-muted-foreground text-center">
                      {uploadProgress < 30 && "Analyzing role catalog..."}
                      {uploadProgress >= 30 && uploadProgress < 60 && "AI matching to standard roles..."}
                      {uploadProgress >= 60 && uploadProgress < 90 && "Creating role mappings..."}
                      {uploadProgress >= 90 && "Finalizing standardization..."}
                    </div>
                  </div>
                )}

                {uploadStatus === 'completed' && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-medium">AI Standardization Complete!</span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      Processed {mappingResults.length} roles • AI auto-mapped {autoMappedCount} to XLSMART standards • {reviewRequiredCount} need manual review
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  {uploadStatus === 'idle' && (
                    <Button 
                      onClick={processRoleStandardization} 
                      disabled={isUploading || !sourceCompany || !fileFormat} 
                      className="xl-button-primary"
                    >
                      <Zap className="mr-2 h-4 w-4" />
                      AI Standardize Roles
                    </Button>
                  )}
                  
                  {uploadStatus === 'completed' && (
                    <>
                      <Button onClick={() => setShowMappingReview(true)} className="xl-button-primary">
                        <Eye className="mr-2 h-4 w-4" />
                        Review AI Mappings
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

      {/* AI Standardization Results */}
      {uploadStatus === 'completed' && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">AI Role Standardization Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-2xl font-bold text-green-800">{autoMappedCount}</div>
                  <div className="text-sm text-green-700">AI Auto-mapped roles</div>
                </div>
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-800">{reviewRequiredCount}</div>
                  <div className="text-sm text-yellow-700">Need manual review</div>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-2xl font-bold text-blue-800">{overallAccuracy}%</div>
                  <div className="text-sm text-blue-700">AI confidence average</div>
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">How AI Standardization Works:</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• AI analyzes role titles, departments, and descriptions from {sourceCompany.toUpperCase()}</li>
                  <li>• Matches against XLSMART's master catalog of {mappingResults.length > 0 ? '16+' : 'industry-standard'} role definitions</li>
                  <li>• Creates standardized job families, levels, and titles aligned with telecommunications industry</li>
                  <li>• Flags low-confidence mappings for HR review and approval</li>
                </ul>
              </div>
              
              <Button className="w-full xl-button-primary" onClick={() => setShowMappingReview(true)}>
                <Eye className="mr-2 h-4 w-4" />
                Review All AI Mappings
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
              <h2 className="text-2xl font-bold text-card-foreground">AI Role Mapping Review</h2>
              <p className="text-muted-foreground">Review and approve AI-generated role standardizations</p>
            </div>
            
            <div className="space-y-4">
              {mappingResults.map((mapping) => (
                <Card key={mapping.id} className="border-border bg-card">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-semibold text-card-foreground mb-2">Original {sourceCompany.toUpperCase()} Role</h3>
                        <div className="space-y-1 text-sm">
                          <div><span className="font-medium">Title:</span> {mapping.originalTitle}</div>
                          <div><span className="font-medium">Department:</span> {mapping.originalDepartment}</div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-card-foreground mb-2">XLSMART Standard Role</h3>
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
                          AI: {mapping.confidence.toFixed(1)}% confidence
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
                Generate Job Descriptions for Approved Roles
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};