import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Upload, Users, FileText, Brain, TrendingUp, MessageCircle } from "lucide-react";
import { AIChat } from "@/components/AIChat";
import { RoleUpload } from "@/components/RoleUpload";

const Index = () => {
  const [activeDialog, setActiveDialog] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">XLSMART HR Platform</h1>
              <p className="text-muted-foreground">AI-Powered Talent Management & Role Standardization</p>
            </div>
            <Button>Get Started</Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Bulk Role Upload */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Bulk Role Upload
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Upload XL and SMART role catalogs and auto-map to XLSMART Standard Roles
              </p>
              <Dialog open={activeDialog === 'upload'} onOpenChange={(open) => setActiveDialog(open ? 'upload' : null)}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    Upload Role Catalogs
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <RoleUpload />
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* AI JD Generator */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                AI JD Generator
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Generate job descriptions for standardized roles with AI assistance
              </p>
              <Button variant="outline" className="w-full">
                Generate JDs
              </Button>
            </CardContent>
          </Card>

          {/* Employee Assessment */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Employee Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Match employees vs target JDs and identify skill gaps
              </p>
              <Button variant="outline" className="w-full">
                Assess Skills
              </Button>
            </CardContent>
          </Card>

          {/* AI Chatbot */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                HR AI Assistant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Chat with AI to tweak JDs, get recommendations, and insights
              </p>
              <Dialog open={activeDialog === 'chat'} onOpenChange={(open) => setActiveDialog(open ? 'chat' : null)}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    Open Chat
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <AIChat />
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Skill Analytics */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Skill Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Track skill distribution, gaps, and development progress
              </p>
              <Button variant="outline" className="w-full">
                View Analytics
              </Button>
            </CardContent>
          </Card>

          {/* Development Plans */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Development Plans
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Personalized learning paths and career recommendations
              </p>
              <Button variant="outline" className="w-full">
                Create Plans
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-primary">2,847</div>
              <p className="text-muted-foreground">Total Employees</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-primary">156</div>
              <p className="text-muted-foreground">Standardized Roles</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-primary">89%</div>
              <p className="text-muted-foreground">Mapping Accuracy</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-primary">342</div>
              <p className="text-muted-foreground">Skills Identified</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Index;