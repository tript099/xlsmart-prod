import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, TrendingUp, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SkillInventoryDashboard = () => {
  const inventoryStats = [
    { 
      value: "1,847", 
      label: "Total Skills", 
      icon: Package, 
      color: "text-blue-600",
      description: "Mapped skills"
    },
    { 
      value: "234", 
      label: "Core Skills", 
      icon: TrendingUp, 
      color: "text-green-600",
      description: "Critical for business"
    },
    { 
      value: "456", 
      label: "Emerging Skills", 
      icon: Package, 
      color: "text-purple-600",
      description: "Future requirements"
    },
    { 
      value: "89%", 
      label: "Coverage Rate", 
      icon: TrendingUp, 
      color: "text-orange-600",
      description: "Skills mapped to employees"
    }
  ];

  const skillCategories = [
    { 
      category: "Technical Skills", 
      count: 567, 
      proficiency: "Advanced", 
      demand: "High",
      growth: "+12%"
    },
    { 
      category: "Soft Skills", 
      count: 234, 
      proficiency: "Intermediate", 
      demand: "Medium",
      growth: "+8%"
    },
    { 
      category: "Domain Expertise", 
      count: 345, 
      proficiency: "Expert", 
      demand: "High",
      growth: "+15%"
    },
    { 
      category: "Leadership", 
      count: 123, 
      proficiency: "Intermediate", 
      demand: "Medium",
      growth: "+5%"
    },
    { 
      category: "Certifications", 
      count: 456, 
      proficiency: "Verified", 
      demand: "High",
      growth: "+20%"
    },
  ];

  const topSkills = [
    { skill: "JavaScript", employees: 456, level: "4.2/5", trend: "↗" },
    { skill: "Project Management", employees: 345, level: "3.8/5", trend: "↗" },
    { skill: "Data Analysis", employees: 298, level: "3.9/5", trend: "↗" },
    { skill: "Cloud Computing", employees: 267, level: "3.6/5", trend: "↗" },
    { skill: "Machine Learning", employees: 189, level: "3.4/5", trend: "↗" },
    { skill: "Communication", employees: 543, level: "4.1/5", trend: "→" },
    { skill: "Problem Solving", employees: 487, level: "4.0/5", trend: "↗" },
    { skill: "Agile Methodologies", employees: 234, level: "3.7/5", trend: "↗" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-foreground">Skill Inventory</h1>
        <p className="text-muted-foreground text-lg">
          Comprehensive mapping of organizational skills and competencies
        </p>
      </div>

      {/* Inventory Stats */}
      <section className="bg-muted/50 rounded-xl p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-2">Skill Inventory Overview</h2>
          <p className="text-muted-foreground">
            Complete view of skills distribution and coverage across the organization
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {inventoryStats.map((stat, index) => (
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

      {/* Search and Filter */}
      <section>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-2">Skill Search & Analysis</h2>
          <p className="text-muted-foreground">
            Search and filter skills to analyze competency gaps and opportunities
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search skills, competencies, or employees..."
                  className="pl-10"
                />
              </div>
              <Button variant="outline" className="flex items-center space-x-2">
                <Filter className="h-4 w-4" />
                <span>Advanced Filters</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-4">Top Skills by Employee Count</h3>
                <div className="space-y-3">
                  {topSkills.slice(0, 4).map((skill, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{skill.skill}</p>
                        <p className="text-sm text-muted-foreground">{skill.employees} employees</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{skill.level}</p>
                        <span className="text-green-600 text-sm">{skill.trend}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-4">Skill Categories</h3>
                <div className="space-y-3">
                  {skillCategories.slice(0, 4).map((category, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{category.category}</p>
                        <p className="text-sm text-muted-foreground">{category.count} skills</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className={
                          category.demand === 'High' ? 'border-red-300 text-red-700' :
                          'border-orange-300 text-orange-700'
                        }>
                          {category.demand}
                        </Badge>
                        <span className="text-green-600 text-sm">{category.growth}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Detailed Skill Analysis */}
      <section>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-2">Detailed Skill Analysis</h2>
          <p className="text-muted-foreground">
            Comprehensive breakdown of skills by category and proficiency level
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Category</th>
                    <th className="text-left py-3 px-4 font-semibold">Skills Count</th>
                    <th className="text-left py-3 px-4 font-semibold">Avg Proficiency</th>
                    <th className="text-left py-3 px-4 font-semibold">Demand</th>
                    <th className="text-left py-3 px-4 font-semibold">Growth</th>
                  </tr>
                </thead>
                <tbody>
                  {skillCategories.map((category, index) => (
                    <tr key={index} className="border-b hover:bg-muted/30">
                      <td className="py-3 px-4 font-medium">{category.category}</td>
                      <td className="py-3 px-4">{category.count}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className={
                          category.proficiency === 'Expert' ? 'border-green-300 text-green-700' :
                          category.proficiency === 'Advanced' ? 'border-blue-300 text-blue-700' :
                          'border-orange-300 text-orange-700'
                        }>
                          {category.proficiency}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className={
                          category.demand === 'High' ? 'border-red-300 text-red-700' :
                          'border-yellow-300 text-yellow-700'
                        }>
                          {category.demand}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-green-600 font-medium">{category.growth}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Skill Inventory Actions */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-all duration-200 cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-primary" />
              <span>Export Inventory</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Download comprehensive skill inventory reports
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all duration-200 cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span>Skill Gap Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Identify critical skill gaps and requirements
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all duration-200 cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-primary" />
              <span>Skill Mapping</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Map skills to roles and career pathways
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default SkillInventoryDashboard;