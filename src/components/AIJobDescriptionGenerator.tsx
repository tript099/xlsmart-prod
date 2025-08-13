import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, FileText, Download, Copy, Sparkles, Building2 } from 'lucide-react';

interface GeneratedJD {
  title: string;
  summary: string;
  responsibilities: string[];
  requiredQualifications: string[];
  preferredQualifications: string[];
  benefits: string[];
  fullDescription: string;
  keywords: string[];
  estimatedSalary: {
    min: number;
    max: number;
    currency: string;
  };
}

export const AIJobDescriptionGenerator = () => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedJD, setGeneratedJD] = useState<GeneratedJD | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    roleTitle: '',
    department: '',
    level: '',
    employmentType: 'full_time',
    locationStatus: 'office',
    salaryRange: '',
    requirements: '',
    customInstructions: '',
    tone: 'professional',
    language: 'en'
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async () => {
    if (!formData.roleTitle || !formData.department) {
      toast({
        title: "Missing Information",
        description: "Please provide at least role title and department.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-job-description-generator', {
        body: {
          ...formData,
          requirements: formData.requirements.split('\n').filter(req => req.trim())
        }
      });

      if (error) throw error;

      if (data.success) {
        setGeneratedJD(data.jobDescription);
        toast({
          title: "Job Description Generated!",
          description: "AI has created a comprehensive job description for your role.",
        });
      } else {
        throw new Error(data.message || 'Failed to generate job description');
      }
    } catch (error) {
      console.error('Error generating job description:', error);
      toast({
        title: "Generation Failed",
        description: "There was an error generating the job description. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Job description copied to clipboard.",
    });
  };

  const downloadAsText = () => {
    if (!generatedJD) return;
    
    const blob = new Blob([generatedJD.fullDescription], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generatedJD.title.replace(/\s+/g, '_')}_JD.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Building2 className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-card-foreground">AI Job Description Generator</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Create compelling, professional job descriptions powered by AI for telecommunications roles
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Job Requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="roleTitle">Role Title *</Label>
                <Input
                  id="roleTitle"
                  placeholder="e.g., Senior Network Engineer"
                  value={formData.roleTitle}
                  onChange={(e) => handleInputChange('roleTitle', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <Input
                  id="department"
                  placeholder="e.g., Technology, Sales, HR"
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="level">Level</Label>
                <Select value={formData.level} onValueChange={(value) => handleInputChange('level', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="junior">Junior</SelectItem>
                    <SelectItem value="mid">Mid-Level</SelectItem>
                    <SelectItem value="senior">Senior</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="director">Director</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="employmentType">Employment Type</Label>
                <Select value={formData.employmentType} onValueChange={(value) => handleInputChange('employmentType', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full Time</SelectItem>
                    <SelectItem value="part_time">Part Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="freelance">Freelance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="locationStatus">Work Location</Label>
                <Select value={formData.locationStatus} onValueChange={(value) => handleInputChange('locationStatus', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="office">On-site</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="salaryRange">Salary Range</Label>
                <Input
                  id="salaryRange"
                  placeholder="e.g., IDR 120,000,000 - 180,000,000"
                  value={formData.salaryRange}
                  onChange={(e) => handleInputChange('salaryRange', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="requirements">Specific Requirements (one per line)</Label>
              <Textarea
                id="requirements"
                placeholder="e.g., 5+ years experience with network protocols&#10;CCNA certification required&#10;Experience with telecom infrastructure"
                rows={4}
                value={formData.requirements}
                onChange={(e) => handleInputChange('requirements', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customInstructions">Additional Instructions</Label>
              <Textarea
                id="customInstructions"
                placeholder="Any specific company culture, benefits, or requirements to highlight..."
                rows={3}
                value={formData.customInstructions}
                onChange={(e) => handleInputChange('customInstructions', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tone">Writing Tone</Label>
                <Select value={formData.tone} onValueChange={(value) => handleInputChange('tone', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="corporate">Corporate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select value={formData.language} onValueChange={(value) => handleInputChange('language', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="id">Indonesian</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating || !formData.roleTitle || !formData.department}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating with AI...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Job Description
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Generated Output */}
        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Generated Job Description
              </CardTitle>
              {generatedJD && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(generatedJD.fullDescription)}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadAsText}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!generatedJD ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Fill in the requirements and click "Generate" to create your job description</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Header Info */}
                <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                  <h3 className="text-xl font-bold text-card-foreground">{generatedJD.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{generatedJD.summary}</p>
                  {generatedJD.estimatedSalary && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        Estimated Salary: {formatCurrency(generatedJD.estimatedSalary.min, generatedJD.estimatedSalary.currency)} - {formatCurrency(generatedJD.estimatedSalary.max, generatedJD.estimatedSalary.currency)}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Responsibilities */}
                <div>
                  <h4 className="font-semibold text-card-foreground mb-3">Key Responsibilities</h4>
                  <ul className="space-y-2">
                    {generatedJD.responsibilities.map((resp, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                        <span className="text-sm text-muted-foreground">{resp}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Separator />

                {/* Qualifications */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <h4 className="font-semibold text-card-foreground mb-3">Required Qualifications</h4>
                    <ul className="space-y-1">
                      {generatedJD.requiredQualifications.map((qual, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                          <span className="text-sm text-muted-foreground">{qual}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {generatedJD.preferredQualifications.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-card-foreground mb-3">Preferred Qualifications</h4>
                      <ul className="space-y-1">
                        {generatedJD.preferredQualifications.map((qual, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                            <span className="text-sm text-muted-foreground">{qual}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Keywords */}
                {generatedJD.keywords.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-card-foreground mb-3">SEO Keywords</h4>
                    <div className="flex flex-wrap gap-2">
                      {generatedJD.keywords.map((keyword, index) => (
                        <Badge key={index} variant="outline">{keyword}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};