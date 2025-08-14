import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AISkillsAssessmentEnhanced } from "@/components/AISkillsAssessmentEnhanced";
import { SkillsListDetails } from "@/components/SkillsListDetails";
import { Brain, TrendingUp, Award, Users } from "lucide-react";
import { useAIStats } from "@/components/AIStatsProvider";

const SkillsDashboard = () => {
  const aiStats = useAIStats();

  const skillsStats = [
    { 
      value: aiStats.loading ? "..." : aiStats.skills, 
      label: "Total Skills", 
      icon: Brain, 
      color: "text-blue-600",
      description: "Identified skills"
    },
    { 
      value: "78%", 
      label: "Assessment Coverage", 
      icon: Users, 
      color: "text-green-600",
      description: "Employees assessed"
    },
    { 
      value: "4.2", 
      label: "Avg Skill Level", 
      icon: TrendingUp, 
      color: "text-purple-600",
      description: "Out of 5.0 scale"
    },
    { 
      value: "342", 
      label: "Skill Gaps", 
      icon: Award, 
      color: "text-orange-600",
      description: "Identified gaps"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-foreground">Skills Assessment</h1>
        <p className="text-muted-foreground text-lg">
          Analyze skills, identify gaps, and provide personalized recommendations
        </p>
      </div>

      {/* Skills Stats */}
      <section className="bg-muted/50 rounded-xl p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-2">Skills Analytics</h2>
          <p className="text-muted-foreground">
            Overview of skills assessment and gap analysis metrics
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {skillsStats.map((stat, index) => (
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

      {/* AI Skills Assessment */}
      <section>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-2">AI Skills Assessment</h2>
          <p className="text-muted-foreground">
            Conduct comprehensive skills assessments with AI-powered analysis and recommendations
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-primary" />
              <span>Skills Assessment Engine</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AISkillsAssessmentEnhanced />
          </CardContent>
        </Card>
      </section>

      {/* Skills Inventory */}
      <section>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-2">Skills Inventory & Analytics</h2>
          <p className="text-muted-foreground">
            Detailed view of organizational skills with gap analysis and recommendations
          </p>
        </div>

        <Card>
          <CardContent className="p-0">
            <SkillsListDetails />
          </CardContent>
        </Card>
      </section>

      {/* Skills Insights */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Skills in Organization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">JavaScript/TypeScript</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 h-2 bg-muted rounded-full">
                    <div className="w-4/5 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                  <span className="text-sm font-medium">80%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Project Management</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 h-2 bg-muted rounded-full">
                    <div className="w-3/4 h-2 bg-green-500 rounded-full"></div>
                  </div>
                  <span className="text-sm font-medium">75%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Data Analysis</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 h-2 bg-muted rounded-full">
                    <div className="w-3/5 h-2 bg-purple-500 rounded-full"></div>
                  </div>
                  <span className="text-sm font-medium">60%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Skills Gap Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="font-medium text-red-800">Critical Gap: Cloud Computing</p>
                <p className="text-sm text-red-600">65% of roles require this skill</p>
              </div>
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="font-medium text-orange-800">Moderate Gap: Machine Learning</p>
                <p className="text-sm text-orange-600">40% of roles require this skill</p>
              </div>
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="font-medium text-yellow-800">Minor Gap: Agile Methodologies</p>
                <p className="text-sm text-yellow-600">25% of roles require this skill</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default SkillsDashboard;