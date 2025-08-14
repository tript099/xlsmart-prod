import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AIJobDescriptionGeneratorEnhanced } from "@/components/AIJobDescriptionGeneratorEnhanced";
import { FileText, Zap, CheckCircle, Clock } from "lucide-react";

const JobDescriptionsDashboard = () => {
  const jdStats = [
    { 
      value: "1,247", 
      label: "Generated JDs", 
      icon: FileText, 
      color: "text-blue-600",
      description: "Total job descriptions"
    },
    { 
      value: "98%", 
      label: "Accuracy Rate", 
      icon: CheckCircle, 
      color: "text-green-600",
      description: "AI generation accuracy"
    },
    { 
      value: "3.2 min", 
      label: "Avg Generation Time", 
      icon: Clock, 
      color: "text-purple-600",
      description: "Time per JD"
    },
    { 
      value: "847", 
      label: "Active JDs", 
      icon: Zap, 
      color: "text-orange-600",
      description: "Currently in use"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-foreground">Job Descriptions</h1>
        <p className="text-muted-foreground text-lg">
          Generate, manage, and analyze job descriptions with AI assistance
        </p>
      </div>

      {/* JD Stats */}
      <section className="bg-muted/50 rounded-xl p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-2">Job Description Statistics</h2>
          <p className="text-muted-foreground">
            Overview of job description generation and management metrics
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {jdStats.map((stat, index) => (
            <Card key={index} className="hover:shadow-md transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${
                    index % 4 === 0 ? 'from-blue-500 to-blue-600' :
                    index % 4 === 1 ? 'from-green-500 to-green-600' :
                    index % 4 === 2 ? 'from-purple-500 to-purple-600' :
                    'from-orange-500 to-orange-600'
                  }`}>
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className={`text-2xl font-bold ${stat.color}`}>
                      {stat.value}
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {stat.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stat.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* AI Job Description Generator */}
      <section>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-2">AI Job Description Generator</h2>
          <p className="text-muted-foreground">
            Create comprehensive job descriptions using AI-powered analysis and industry best practices
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-primary" />
              <span>Generate Job Descriptions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AIJobDescriptionGeneratorEnhanced />
          </CardContent>
        </Card>
      </section>

      {/* JD Management Features */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Generations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Senior Software Engineer</p>
                  <p className="text-sm text-muted-foreground">Generated 2 hours ago</p>
                </div>
                <div className="text-green-600 text-sm">✓ Approved</div>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Data Analyst</p>
                  <p className="text-sm text-muted-foreground">Generated 4 hours ago</p>
                </div>
                <div className="text-yellow-600 text-sm">⏳ Review</div>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Project Manager</p>
                  <p className="text-sm text-muted-foreground">Generated 6 hours ago</p>
                </div>
                <div className="text-green-600 text-sm">✓ Published</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quality Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Completeness Score</span>
                <span className="font-semibold text-green-600">95%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Industry Alignment</span>
                <span className="font-semibold text-blue-600">92%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Skills Coverage</span>
                <span className="font-semibold text-purple-600">88%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Compliance Rate</span>
                <span className="font-semibold text-orange-600">97%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default JobDescriptionsDashboard;