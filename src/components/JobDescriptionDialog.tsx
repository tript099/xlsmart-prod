import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  CheckCircle, 
  XCircle, 
  FileText, 
  Calendar,
  Loader2,
  Eye,
  Edit3,
  Download
} from 'lucide-react';

interface JobDescription {
  id: string;
  title: string;
  summary: string | null;
  responsibilities: any;
  required_qualifications: any;
  preferred_qualifications: any;
  required_skills: any;
  preferred_skills: any;
  salary_range_min: number | null;
  salary_range_max: number | null;
  currency: string;
  status: string;
  experience_level: string | null;
  education_level: string | null;
  employment_type: string;
  location_type: string;
  created_at: string;
  updated_at: string;
  generated_by: string;
  reviewed_by: string | null;
  approved_by: string | null;
  ai_generated: boolean;
}

interface JobDescriptionDialogProps {
  statusFilters: string[];
}

const JobDescriptionDialog: React.FC<JobDescriptionDialogProps> = ({ statusFilters }) => {
  const { toast } = useToast();
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJD, setSelectedJD] = useState<JobDescription | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadJobDescriptions();
  }, [statusFilters]);

  const loadJobDescriptions = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('xlsmart_job_descriptions')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply status filter
      if (!statusFilters.includes('all')) {
        if (statusFilters.length === 1) {
          query = query.eq('status', statusFilters[0]);
        } else {
          query = query.in('status', statusFilters);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Type-safe conversion
      const typedData: JobDescription[] = (data || []).map(item => ({
        ...item,
        summary: item.summary || '',
        responsibilities: Array.isArray(item.responsibilities) ? item.responsibilities : [],
        required_qualifications: Array.isArray(item.required_qualifications) ? item.required_qualifications : [],
        preferred_qualifications: Array.isArray(item.preferred_qualifications) ? item.preferred_qualifications : [],
        required_skills: Array.isArray(item.required_skills) ? item.required_skills : [],
        preferred_skills: Array.isArray(item.preferred_skills) ? item.preferred_skills : [],
        salary_range_min: item.salary_range_min || 0,
        salary_range_max: item.salary_range_max || 0,
        experience_level: item.experience_level || '',
        education_level: item.education_level || ''
      }));
      
      setJobDescriptions(typedData);
      if (typedData.length > 0) setSelectedJD(typedData[0]); // Auto-select first item
    } catch (error) {
      console.error('Error loading job descriptions:', error);
      toast({
        title: "Error",
        description: "Failed to load job descriptions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (jdId: string) => {
    try {
      setActionLoading(jdId);
      const { error } = await supabase
        .from('xlsmart_job_descriptions')
        .update({
          status: 'approved',
          approved_by: (await supabase.auth.getUser()).data.user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', jdId);

      if (error) throw error;

      await loadJobDescriptions();
      toast({
        title: "✅ Approved!",
        description: "Job description has been approved successfully",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error approving JD:', error);
      toast({
        title: "Error",
        description: "Failed to approve job description",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handlePublish = async (jdId: string) => {
    try {
      setActionLoading(jdId);
      const { error } = await supabase
        .from('xlsmart_job_descriptions')
        .update({
          status: 'published',
          updated_at: new Date().toISOString()
        })
        .eq('id', jdId);

      if (error) throw error;

      await loadJobDescriptions();
      toast({
        title: "🚀 Published!",
        description: "Job description is now live and active",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error publishing JD:', error);
      toast({
        title: "Error",
        description: "Failed to publish job description",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'published': return 'bg-blue-100 text-blue-800';
      case 'review': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'published': return <Eye className="h-4 w-4" />;
      case 'review': return <Edit3 className="h-4 w-4" />;
      case 'draft': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getFilterTitle = () => {
    if (statusFilters.includes('all')) return 'All Job Descriptions';
    if (statusFilters.length > 1) {
      if (statusFilters.includes('draft') && statusFilters.includes('review')) {
        return 'Pending Review Job Descriptions';
      }
      return `${statusFilters.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' & ')} Job Descriptions`;
    }
    const status = statusFilters[0];
    switch (status) {
      case 'draft': return 'Draft Job Descriptions';
      case 'approved': return 'Approved Job Descriptions';
      case 'published': return 'Published Job Descriptions';
      case 'review': return 'Job Descriptions Under Review';
      default: return 'Job Descriptions';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin mr-3" />
        <span>Loading job descriptions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{getFilterTitle()}</h2>
          <p className="text-muted-foreground">
            Review, approve, and manage job descriptions
          </p>
        </div>
        <Badge variant="secondary">{jobDescriptions.length} found</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Job Descriptions List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Job Descriptions ({jobDescriptions.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <div className="space-y-2 p-4">
                  {jobDescriptions.map((jd) => (
                    <Card
                      key={jd.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedJD?.id === jd.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedJD(jd)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm truncate">{jd.title}</h4>
                            <Badge 
                              className={`text-xs ${getStatusColor(jd.status)}`}
                              variant="secondary"
                            >
                              {getStatusIcon(jd.status)}
                              <span className="ml-1 capitalize">{jd.status}</span>
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {jd.summary?.substring(0, 100) || 'No summary available'}...
                          </p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(jd.created_at).toLocaleDateString()}
                            </span>
                            {jd.ai_generated && (
                              <Badge variant="outline" className="text-xs">
                                AI Generated
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Job Description Details */}
        <div className="lg:col-span-2">
          {selectedJD ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {selectedJD.title}
                  </CardTitle>
                  <Badge className={getStatusColor(selectedJD.status)}>
                    {getStatusIcon(selectedJD.status)}
                    <span className="ml-1 capitalize">{selectedJD.status}</span>
                  </Badge>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-4">
                  {(selectedJD.status === 'draft' || selectedJD.status === 'review') && (
                    <Button
                      onClick={() => handleApprove(selectedJD.id)}
                      disabled={actionLoading === selectedJD.id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {actionLoading === selectedJD.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Approve
                    </Button>
                  )}
                  {selectedJD.status === 'approved' && (
                    <Button
                      onClick={() => handlePublish(selectedJD.id)}
                      disabled={actionLoading === selectedJD.id}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {actionLoading === selectedJD.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Eye className="h-4 w-4 mr-2" />
                      )}
                      Publish
                    </Button>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Summary</h4>
                    <p className="text-sm text-muted-foreground">{selectedJD.summary || 'No summary available'}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Salary Range</h4>
                      <p className="text-sm">
                        {selectedJD.currency} {selectedJD.salary_range_min?.toLocaleString() || 'N/A'} - {selectedJD.salary_range_max?.toLocaleString() || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Experience Level</h4>
                      <p className="text-sm capitalize">{selectedJD.experience_level || 'N/A'}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Key Responsibilities</h4>
                    <ul className="space-y-2">
                      {Array.isArray(selectedJD.responsibilities) && selectedJD.responsibilities.length > 0 ? (
                        selectedJD.responsibilities.map((resp: string, index: number) => (
                          <li key={index} className="text-sm flex items-start gap-2">
                            <span className="text-primary">•</span>
                            <span>{resp}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-sm text-muted-foreground">No responsibilities listed</li>
                      )}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Required Qualifications</h4>
                    <ul className="space-y-2">
                      {Array.isArray(selectedJD.required_qualifications) && selectedJD.required_qualifications.length > 0 ? (
                        selectedJD.required_qualifications.map((qual: string, index: number) => (
                          <li key={index} className="text-sm flex items-start gap-2">
                            <span className="text-red-500">•</span>
                            <span>{qual}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-sm text-muted-foreground">No required qualifications listed</li>
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-[500px]">
                <div className="text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Select a Job Description</h3>
                  <p className="text-muted-foreground">
                    Choose a job description from the list to review and manage
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobDescriptionDialog;