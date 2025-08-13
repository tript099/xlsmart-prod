import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Loader2, 
  FileText, 
  Download, 
  Copy, 
  Sparkles, 
  Building2, 
  Bot, 
  Send, 
  Edit,
  Zap,
  Users,
  MessageCircle,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface GeneratedJD {
  id?: string;
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

interface StandardRole {
  id: string;
  role_title: string;
  job_family: string;
  role_level: string;
  department: string;
  standard_description: string;
  core_responsibilities: any; // JSON type from database
  required_skills: any; // JSON type from database
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const AIJobDescriptionGeneratorEnhanced = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('single');
  
  // Single JD Generation
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedJD, setGeneratedJD] = useState<GeneratedJD | null>(null);
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

  // Bulk Generation
  const [standardRoles, setStandardRoles] = useState<StandardRole[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isBulkGenerating, setBulkGenerating] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkResults, setBulkResults] = useState<{success: number, failed: number, total: number}>({
    success: 0, failed: 0, total: 0
  });

  // Chatbot for JD Updates
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [selectedJDForChat, setSelectedJDForChat] = useState<GeneratedJD | null>(null);
  const [existingJDs, setExistingJDs] = useState<GeneratedJD[]>([]);

  // Load standard roles and existing JDs on component mount
  useEffect(() => {
    loadStandardRoles();
    loadExistingJDs();
  }, []);

  const loadStandardRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('xlsmart_standard_roles')
        .select('*')
        .eq('is_active', true)
        .order('role_title');

      if (error) throw error;
      setStandardRoles(data || []);
    } catch (error) {
      console.error('Error loading standard roles:', error);
      toast({
        title: "Error",
        description: "Failed to load standard roles",
        variant: "destructive",
      });
    }
  };

  const loadExistingJDs = async () => {
    try {
      const { data, error } = await supabase
        .from('xlsmart_job_descriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedJDs: GeneratedJD[] = (data || []).map(jd => ({
        id: jd.id,
        title: jd.title,
        summary: jd.summary || '',
        responsibilities: Array.isArray(jd.responsibilities) ? (jd.responsibilities as string[]) : [],
        requiredQualifications: Array.isArray(jd.required_qualifications) ? (jd.required_qualifications as string[]) : [],
        preferredQualifications: Array.isArray(jd.preferred_qualifications) ? (jd.preferred_qualifications as string[]) : [],
        benefits: [],
        fullDescription: `${jd.summary || ''}\n\nResponsibilities:\n${
          Array.isArray(jd.responsibilities) ? (jd.responsibilities as string[]).join('\n') : ''
        }\n\nQualifications:\n${
          Array.isArray(jd.required_qualifications) ? (jd.required_qualifications as string[]).join('\n') : ''
        }`,
        keywords: [],
        estimatedSalary: {
          min: jd.salary_range_min || 0,
          max: jd.salary_range_max || 0,
          currency: jd.currency || 'IDR'
        }
      }));
      
      setExistingJDs(formattedJDs);
    } catch (error) {
      console.error('Error loading existing JDs:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSingleGenerate = async () => {
    if (!formData.roleTitle.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a role title",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-job-description-generator', {
        body: formData
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.message);

      setGeneratedJD(data.jobDescription);
      await loadExistingJDs(); // Refresh the list
      
      toast({
        title: "✅ Job Description Generated!",
        description: `Successfully created JD for ${formData.roleTitle}`,
        duration: 5000,
      });
    } catch (error) {
      console.error('Error generating JD:', error);
      toast({
        title: "❌ Generation Failed",
        description: error instanceof Error ? error.message : 'Failed to generate job description',
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBulkGenerate = async () => {
    if (selectedRoles.length === 0) {
      toast({
        title: "No Roles Selected",
        description: "Please select at least one role for bulk generation",
        variant: "destructive",
      });
      return;
    }

    setBulkGenerating(true);
    setBulkProgress(0);
    setBulkResults({ success: 0, failed: 0, total: selectedRoles.length });

    const rolesToProcess = standardRoles.filter(role => selectedRoles.includes(role.id));
    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < rolesToProcess.length; i++) {
      const role = rolesToProcess[i];
      
      try {
        const { data, error } = await supabase.functions.invoke('ai-job-description-generator', {
          body: {
            roleTitle: role.role_title,
            department: role.department,
            level: role.role_level,
            employmentType: 'full_time',
            locationStatus: 'office',
            requirements: Array.isArray(role.required_skills) ? (role.required_skills as string[]).join(', ') : '',
            customInstructions: `Based on standardized role: ${role.standard_description}`,
            tone: 'professional',
            language: 'en'
          }
        });

        if (error) throw error;
        if (!data.success) throw new Error(data.message);

        successCount++;
      } catch (error) {
        console.error(`Error generating JD for ${role.role_title}:`, error);
        failedCount++;
      }

      const progress = ((i + 1) / rolesToProcess.length) * 100;
      setBulkProgress(progress);
      setBulkResults({ success: successCount, failed: failedCount, total: selectedRoles.length });

      // Small delay to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    await loadExistingJDs(); // Refresh the list
    setBulkGenerating(false);

    toast({
      title: "🎉 Bulk Generation Complete!",
      description: `Generated ${successCount} JDs successfully. ${failedCount} failed.`,
      duration: 8000,
    });
  };

  const handleChatSend = async () => {
    if (!chatInput.trim() || !selectedJDForChat) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: `Update this job description based on the user's request: "${chatInput}"\n\nCurrent JD:\n${selectedJDForChat.fullDescription}`,
          context: 'jd_generator'
        }
      });

      if (error) throw error;

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error in chat:', error);
      toast({
        title: "Chat Error",
        description: "Failed to get response from AI assistant",
        variant: "destructive",
      });
    } finally {
      setIsChatLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "✅ Copied!",
        description: "Text copied to clipboard",
        duration: 2000,
      });
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const downloadAsText = (text: string, filename: string) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <Card className="border-border bg-card">
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <Sparkles className="h-6 w-6 text-primary" />
            AI-Powered Job Description Generator
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Create individual JDs, generate in bulk for standardized roles, or update existing JDs with AI assistance
          </p>
        </CardHeader>

        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="single" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Single JD
              </TabsTrigger>
              <TabsTrigger value="bulk" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Bulk Generation
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Update with AI
              </TabsTrigger>
            </TabsList>

            {/* Single JD Generation */}
            <TabsContent value="single" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Form inputs */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="roleTitle">Role Title *</Label>
                    <Input
                      id="roleTitle"
                      value={formData.roleTitle}
                      onChange={(e) => handleInputChange('roleTitle', e.target.value)}
                      placeholder="e.g., Senior Network Engineer"
                      className="bg-background border-border"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        value={formData.department}
                        onChange={(e) => handleInputChange('department', e.target.value)}
                        placeholder="e.g., Network Operations"
                        className="bg-background border-border"
                      />
                    </div>
                    <div>
                      <Label htmlFor="level">Level</Label>
                      <Select value={formData.level} onValueChange={(value) => handleInputChange('level', value)}>
                        <SelectTrigger className="bg-background border-border">
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
                  </div>

                  <div>
                    <Label htmlFor="requirements">Key Requirements</Label>
                    <Textarea
                      id="requirements"
                      value={formData.requirements}
                      onChange={(e) => handleInputChange('requirements', e.target.value)}
                      placeholder="List key skills, experience, and qualifications..."
                      className="bg-background border-border h-24"
                    />
                  </div>

                  <Button
                    onClick={handleSingleGenerate}
                    disabled={isGenerating || !formData.roleTitle.trim()}
                    className="w-full xl-button-primary"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating JD...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Job Description
                      </>
                    )}
                  </Button>
                </div>

                {/* Generated JD Preview */}
                <div className="space-y-4">
                  {generatedJD ? (
                    <Card className="border-border">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center justify-between">
                          {generatedJD.title}
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(generatedJD.fullDescription)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadAsText(generatedJD.fullDescription, `${generatedJD.title}.txt`)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Summary</h4>
                          <p className="text-sm text-muted-foreground">{generatedJD.summary}</p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Key Responsibilities</h4>
                          <ul className="list-disc list-inside space-y-1">
                            {generatedJD.responsibilities.map((resp, index) => (
                              <li key={index} className="text-sm text-muted-foreground">{resp}</li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="border-border border-dashed">
                      <CardContent className="flex items-center justify-center h-64">
                        <div className="text-center text-muted-foreground">
                          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Generated job description will appear here</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Bulk Generation */}
            <TabsContent value="bulk" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Standard Roles</h3>
                    <Badge variant="secondary">{standardRoles.length} available</Badge>
                  </div>
                  
                  <ScrollArea className="h-96 border rounded-md p-4">
                    <div className="space-y-2">
                      {standardRoles.map((role) => (
                        <div key={role.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                          <input
                            type="checkbox"
                            checked={selectedRoles.includes(role.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedRoles(prev => [...prev, role.id]);
                              } else {
                                setSelectedRoles(prev => prev.filter(id => id !== role.id));
                              }
                            }}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{role.role_title}</h4>
                            <p className="text-xs text-muted-foreground">{role.department} • {role.role_level}</p>
                            <p className="text-xs text-muted-foreground mt-1">{role.standard_description?.substring(0, 100)}...</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedRoles(standardRoles.map(r => r.id))}
                      disabled={isBulkGenerating}
                    >
                      Select All
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedRoles([])}
                      disabled={isBulkGenerating}
                    >
                      Clear All
                    </Button>
                  </div>

                  <Button
                    onClick={handleBulkGenerate}
                    disabled={isBulkGenerating || selectedRoles.length === 0}
                    className="w-full xl-button-primary"
                    size="lg"
                  >
                    {isBulkGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating {selectedRoles.length} JDs...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        Generate {selectedRoles.length} Job Descriptions
                      </>
                    )}
                  </Button>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Bulk Generation Progress</h3>
                  
                  {isBulkGenerating && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{Math.round(bulkProgress)}%</span>
                      </div>
                      <Progress value={bulkProgress} className="w-full" />
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-green-600">{bulkResults.success}</div>
                          <div className="text-xs text-muted-foreground">Success</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-red-600">{bulkResults.failed}</div>
                          <div className="text-xs text-muted-foreground">Failed</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-blue-600">{bulkResults.total}</div>
                          <div className="text-xs text-muted-foreground">Total</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {!isBulkGenerating && selectedRoles.length > 0 && (
                    <Card className="border-border">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          Ready to generate {selectedRoles.length} job descriptions
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* AI Chat for Updates */}
            <TabsContent value="chat" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Select Job Description to Update</h3>
                  
                  <ScrollArea className="h-96 border rounded-md p-4">
                    <div className="space-y-2">
                      {existingJDs.map((jd) => (
                        <Card 
                          key={jd.id} 
                          className={`cursor-pointer transition-colors ${
                            selectedJDForChat?.id === jd.id ? 'border-primary' : 'border-border'
                          }`}
                          onClick={() => {
                            setSelectedJDForChat(jd);
                            setChatMessages([{
                              id: 'welcome',
                              role: 'assistant',
                              content: `I'll help you update the job description for "${jd.title}". What changes would you like to make?`,
                              timestamp: new Date()
                            }]);
                          }}
                        >
                          <CardContent className="p-4">
                            <h4 className="font-medium text-sm">{jd.title}</h4>
                            <p className="text-xs text-muted-foreground mt-1">{jd.summary.substring(0, 100)}...</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                <div className="space-y-4">
                  {selectedJDForChat ? (
                    <>
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <Bot className="h-5 w-5 text-primary" />
                        AI Assistant - {selectedJDForChat.title}
                      </h3>
                      
                      <Card className="border-border">
                        <CardContent className="p-0">
                          <ScrollArea className="h-80 p-4">
                            <div className="space-y-4">
                              {chatMessages.map((message) => (
                                <div
                                  key={message.id}
                                  className={`flex gap-3 ${
                                    message.role === 'user' ? 'justify-end' : 'justify-start'
                                  }`}
                                >
                                  <div
                                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                      message.role === 'user'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-card-foreground'
                                    }`}
                                  >
                                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                    <p className="text-xs opacity-70 mt-1">
                                      {message.timestamp.toLocaleTimeString()}
                                    </p>
                                  </div>
                                </div>
                              ))}
                              {isChatLoading && (
                                <div className="flex gap-3 justify-start">
                                  <div className="bg-muted rounded-lg px-4 py-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  </div>
                                </div>
                              )}
                            </div>
                          </ScrollArea>
                          
                          <div className="flex gap-2 p-4 border-t border-border">
                            <Input
                              value={chatInput}
                              onChange={(e) => setChatInput(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleChatSend();
                                }
                              }}
                              placeholder="Ask me to update the job description..."
                              disabled={isChatLoading}
                              className="flex-1 bg-background border-border"
                            />
                            <Button 
                              onClick={handleChatSend} 
                              disabled={isChatLoading || !chatInput.trim()}
                              size="icon"
                              className="xl-button-primary"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    <Card className="border-border border-dashed">
                      <CardContent className="flex items-center justify-center h-80">
                        <div className="text-center text-muted-foreground">
                          <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Select a job description to start updating with AI</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};