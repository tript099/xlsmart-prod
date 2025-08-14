import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, BarChart3, TrendingUp, Users } from "lucide-react";

const WorkforceAnalyticsDashboard = () => {
  const analyticsStats = [
    { 
      value: "2,847", 
      label: "Total Workforce", 
      icon: Users, 
      color: "text-blue-600",
      description: "Active employees"
    },
    { 
      value: "4.2%", 
      label: "Turnover Rate", 
      icon: TrendingUp, 
      color: "text-green-600",
      description: "Annual rate"
    },
    { 
      value: "87%", 
      label: "Engagement Score", 
      icon: BarChart3, 
      color: "text-purple-600",
      description: "Employee satisfaction"
    },
    { 
      value: "92%", 
      label: "Retention Rate", 
      icon: PieChart, 
      color: "text-orange-600",
      description: "12-month retention"
    }
  ];

  const departmentData = [
    { department: "Engineering", employees: 1234, utilization: "94%", satisfaction: "4.2/5" },
    { department: "Sales", employees: 567, utilization: "89%", satisfaction: "4.0/5" },
    { department: "Marketing", employees: 234, utilization: "92%", satisfaction: "4.1/5" },
    { department: "Operations", employees: 456, utilization: "91%", satisfaction: "3.9/5" },
    { department: "Support", employees: 356, utilization: "88%", satisfaction: "4.3/5" },
  ];

  const skillDistribution = [
    { skill: "Technical Skills", percentage: 78, color: "bg-blue-500" },
    { skill: "Leadership", percentage: 45, color: "bg-green-500" },
    { skill: "Communication", percentage: 89, color: "bg-purple-500" },
    { skill: "Project Management", percentage: 62, color: "bg-orange-500" },
    { skill: "Data Analysis", percentage: 54, color: "bg-pink-500" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-foreground">Workforce Analytics</h1>
        <p className="text-muted-foreground text-lg">
          Advanced insights into workforce composition, performance, and trends
        </p>
      </div>

      {/* Analytics Stats */}
      <section className="bg-muted/50 rounded-xl p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-2">Workforce Metrics</h2>
          <p className="text-muted-foreground">
            Key performance indicators for organizational health and efficiency
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {analyticsStats.map((stat, index) => (
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

      {/* Department Analysis */}
      <section>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-2">Department Analysis</h2>
          <p className="text-muted-foreground">
            Performance metrics and insights by department
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Department</th>
                    <th className="text-left py-3 px-4 font-semibold">Employees</th>
                    <th className="text-left py-3 px-4 font-semibold">Utilization</th>
                    <th className="text-left py-3 px-4 font-semibold">Satisfaction</th>
                    <th className="text-left py-3 px-4 font-semibold">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {departmentData.map((dept, index) => (
                    <tr key={index} className="border-b hover:bg-muted/30">
                      <td className="py-3 px-4 font-medium">{dept.department}</td>
                      <td className="py-3 px-4">{dept.employees}</td>
                      <td className="py-3 px-4">
                        <span className="text-green-600 font-medium">{dept.utilization}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-blue-600 font-medium">{dept.satisfaction}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-green-600">↗ +2.3%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Skills Distribution & Trends */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Skills Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {skillDistribution.map((skill, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{skill.skill}</span>
                    <span className="text-sm text-muted-foreground">{skill.percentage}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${skill.color}`}
                      style={{ width: `${skill.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workforce Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="font-medium text-green-800">Hiring Trend</p>
                <p className="text-sm text-green-600">↗ 15% increase in new hires this quarter</p>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="font-medium text-blue-800">Skill Development</p>
                <p className="text-sm text-blue-600">↗ 23% increase in training completions</p>
              </div>
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="font-medium text-purple-800">Engagement</p>
                <p className="text-sm text-purple-600">↗ 8% improvement in satisfaction scores</p>
              </div>
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="font-medium text-orange-800">Retention</p>
                <p className="text-sm text-orange-600">↗ 5% improvement in retention rates</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Advanced Analytics */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-all duration-200 cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="h-5 w-5 text-primary" />
              <span>Diversity Analytics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Analyze workforce diversity and inclusion metrics
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all duration-200 cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <span>Performance Trends</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Track performance patterns and productivity metrics
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all duration-200 cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span>Predictive Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              AI-powered predictions for workforce planning
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default WorkforceAnalyticsDashboard;