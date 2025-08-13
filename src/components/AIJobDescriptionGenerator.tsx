import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Zap, FileText, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const AIJobDescriptionGenerator = () => {
  const [roleTitle, setRoleTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [level, setLevel] = useState("");
  const [generatedJD, setGeneratedJD] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateJobDescription = async () => {
    if (!roleTitle || !department || !level) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: `Generate a comprehensive job description for: ${roleTitle} in ${department} department at ${level} level. Include responsibilities, qualifications, skills, and requirements. Format professionally for XLSMART telecommunications company.`,
          context: 'jd_generator'
        }
      });

      if (error) throw error;
      setGeneratedJD(data.response);
      
      toast({
        title: "Job Description Generated!",
        description: "AI has created a comprehensive job description"
      });
    } catch (error) {
      console.error('Error generating JD:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate job description. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-card-foreground mb-2">AI Job Description Generator</h2>
        <p className="text-muted-foreground">Create comprehensive job descriptions using AI</p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <Zap className="h-5 w-5 text-primary" />
            Generate Job Description
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role-title">Role Title</Label>
              <Textarea
                id="role-title"
                placeholder="e.g., Senior Software Engineer"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                className="min-h-[60px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="Human Resources">Human Resources</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="Operations">Operations</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="level">Level</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Entry">Entry Level</SelectItem>
                  <SelectItem value="Mid">Mid Level</SelectItem>
                  <SelectItem value="Senior">Senior Level</SelectItem>
                  <SelectItem value="Lead">Lead</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Director">Director</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={generateJobDescription} 
            disabled={isGenerating || !roleTitle || !department || !level}
            className="w-full xl-button-primary"
          >
            <Zap className="mr-2 h-4 w-4" />
            {isGenerating ? "Generating..." : "Generate Job Description"}
          </Button>

          {generatedJD && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge className="bg-green-100 text-green-800">
                  <FileText className="mr-1 h-3 w-3" />
                  AI Generated
                </Badge>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
              <div className="p-4 bg-muted rounded-lg border border-border">
                <pre className="whitespace-pre-wrap text-sm text-foreground">
                  {generatedJD}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};