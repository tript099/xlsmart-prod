import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DevelopmentPathwaysAI } from "@/components/DevelopmentPathwaysAI";
import { BookOpen, TrendingUp, Clock, Award } from "lucide-react";

const DevelopmentDashboard = () => {
  const developmentStats = [
    { 
      value: "1,234", 
      label: "Learning Paths", 
      icon: BookOpen, 
      color: "text-blue-600",
      description: "Active development plans"
    },
    { 
      value: "89%", 
      label: "Completion Rate", 
      icon: TrendingUp, 
      color: "text-green-600",
      description: "Learning objectives met"
    },
    { 
      value: "24.5", 
      label: "Avg Learning Hours", 
      icon: Clock, 
      color: "text-purple-600",
      description: "Per employee/month"
    },
    { 
      value: "567", 
      label: "Skills Developed", 
      icon: Award, 
      color: "text-orange-600",
      description: "New competencies"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-foreground">Development Pathways</h1>
        <p className="text-muted-foreground text-lg">
          Create personalized learning paths and track skill development progress
        </p>
      </div>

      {/* Development Stats */}
      <section className="bg-muted/50 rounded-xl p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-2">Development Analytics</h2>
          <p className="text-muted-foreground">
            Overview of learning and development metrics
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {developmentStats.map((stat, index) => (
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

      {/* AI Development Pathways */}
      <section>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-2">AI Development Pathways</h2>
          <p className="text-muted-foreground">
            Generate personalized learning paths with AI-powered skill gap analysis
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <span>Development Path Generator</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DevelopmentPathwaysAI />
          </CardContent>
        </Card>
      </section>

      {/* Development Insights */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Popular Learning Tracks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Cloud Computing</p>
                  <p className="text-sm text-muted-foreground">456 learners</p>
                </div>
                <div className="text-blue-600 text-sm">92% completion</div>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Data Science</p>
                  <p className="text-sm text-muted-foreground">378 learners</p>
                </div>
                <div className="text-green-600 text-sm">87% completion</div>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Leadership Skills</p>
                  <p className="text-sm text-muted-foreground">234 learners</p>
                </div>
                <div className="text-purple-600 text-sm">95% completion</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Learning Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Technical Skills</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 h-2 bg-muted rounded-full">
                    <div className="w-4/5 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                  <span className="text-sm font-medium">80%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Soft Skills</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 h-2 bg-muted rounded-full">
                    <div className="w-3/4 h-2 bg-green-500 rounded-full"></div>
                  </div>
                  <span className="text-sm font-medium">75%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Industry Knowledge</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 h-2 bg-muted rounded-full">
                    <div className="w-3/5 h-2 bg-purple-500 rounded-full"></div>
                  </div>
                  <span className="text-sm font-medium">60%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Compliance Training</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 h-2 bg-muted rounded-full">
                    <div className="w-full h-2 bg-orange-500 rounded-full"></div>
                  </div>
                  <span className="text-sm font-medium">100%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default DevelopmentDashboard;