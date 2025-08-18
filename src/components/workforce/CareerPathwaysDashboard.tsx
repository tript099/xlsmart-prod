import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Users, Target, Clock, ArrowRight, Star } from "lucide-react";

interface CareerPathwaysProps {
  metrics: any;
}

export const CareerPathwaysDashboard = ({ metrics }: CareerPathwaysProps) => {
  if (!metrics) return null;

  // Simulated career pathway data based on available metrics
  const careerPathways = [
    {
      currentRole: "Software Engineer",
      employees: Math.floor((metrics.totalEmployees || 0) * 0.25),
      nextRoles: ["Senior Software Engineer", "Tech Lead", "Engineering Manager"],
      readinessScore: 78,
      timeframe: "6-12 months",
      requiredSkills: ["Leadership", "System Design", "Mentoring"]
    },
    {
      currentRole: "Business Analyst",
      employees: Math.floor((metrics.totalEmployees || 0) * 0.15),
      nextRoles: ["Senior Business Analyst", "Product Manager", "Solutions Architect"],
      readinessScore: 65,
      timeframe: "8-15 months",
      requiredSkills: ["Product Management", "Stakeholder Management", "Strategic Thinking"]
    },
    {
      currentRole: "Marketing Specialist",
      employees: Math.floor((metrics.totalEmployees || 0) * 0.12),
      nextRoles: ["Marketing Manager", "Brand Manager", "Digital Marketing Lead"],
      readinessScore: 72,
      timeframe: "6-10 months",
      requiredSkills: ["Team Leadership", "Budget Management", "Campaign Strategy"]
    },
    {
      currentRole: "Data Analyst",
      employees: Math.floor((metrics.totalEmployees || 0) * 0.18),
      nextRoles: ["Senior Data Analyst", "Data Scientist", "Analytics Manager"],
      readinessScore: 84,
      timeframe: "4-8 months",
      requiredSkills: ["Machine Learning", "Data Engineering", "Statistical Modeling"]
    }
  ];

  const getReadinessColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getReadinessBadge = (score: number) => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "destructive";
  };

  return (
    <div className="space-y-6">
      {/* Career Pathways Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{metrics.careerPathways?.totalPathways || 0}</p>
                <p className="text-sm text-muted-foreground">Active Pathways</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-secondary" />
              <div>
                <p className="text-2xl font-bold">{metrics.mobilityPlanning?.readyForPromotion || 0}</p>
                <p className="text-sm text-muted-foreground">Ready for Promotion</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-accent" />
              <div>
                <p className="text-2xl font-bold">{metrics.mobilityPlanning?.internalMoves || 0}</p>
                <p className="text-sm text-muted-foreground">Internal Moves</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{metrics.careerPathways?.avgReadinessScore || 0}%</p>
                <p className="text-sm text-muted-foreground">Avg Readiness</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Career Pathways */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span>Career Progression Analytics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {careerPathways.map((pathway, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-lg">{pathway.currentRole}</h4>
                    <p className="text-sm text-muted-foreground">
                      {pathway.employees} employees in this role
                    </p>
                  </div>
                  <Badge variant={getReadinessBadge(pathway.readinessScore)}>
                    {pathway.readinessScore}% Ready
                  </Badge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Career Progression */}
                  <div className="space-y-3">
                    <h5 className="font-medium text-sm">Next Career Steps</h5>
                    <div className="space-y-2">
                      {pathway.nextRoles.map((role, roleIndex) => (
                        <div key={roleIndex} className="flex items-center space-x-2 p-2 bg-muted/30 rounded">
                          <ArrowRight className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">{role}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Readiness Progress */}
                  <div className="space-y-3">
                    <h5 className="font-medium text-sm">Readiness Score</h5>
                    <div className="space-y-2">
                      <Progress value={pathway.readinessScore} className="h-3" />
                      <div className="flex justify-between text-sm">
                        <span className={getReadinessColor(pathway.readinessScore)}>
                          {pathway.readinessScore}% Ready
                        </span>
                        <span className="text-muted-foreground">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {pathway.timeframe}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Required Skills */}
                  <div className="space-y-3">
                    <h5 className="font-medium text-sm">Development Focus</h5>
                    <div className="flex flex-wrap gap-1">
                      {pathway.requiredSkills.map((skill, skillIndex) => (
                        <Badge key={skillIndex} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                    <Button size="sm" className="w-full mt-2">
                      Create Development Plan
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Succession Planning */}
      <Card>
        <CardHeader>
          <CardTitle>Succession Planning Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                role: "Engineering Manager",
                criticality: "High",
                successors: 3,
                readiness: "2 ready now, 1 in 6 months",
                risk: "Low"
              },
              {
                role: "Product Manager",
                criticality: "High",
                successors: 2,
                readiness: "1 ready now, 1 in 12 months",
                risk: "Medium"
              },
              {
                role: "Sales Director",
                criticality: "Critical",
                successors: 1,
                readiness: "1 ready in 8 months",
                risk: "High"
              }
            ].map((succession, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{succession.role}</h4>
                  <Badge variant={
                    succession.criticality === "Critical" ? "destructive" :
                    succession.criticality === "High" ? "secondary" : "outline"
                  }>
                    {succession.criticality}
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Successors:</span>
                    <span className="font-medium">{succession.successors}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Readiness:</span>
                    <p className="text-xs mt-1">{succession.readiness}</p>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Risk:</span>
                    <Badge variant={
                      succession.risk === "High" ? "destructive" :
                      succession.risk === "Medium" ? "secondary" : "outline"
                    }>
                      {succession.risk}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};