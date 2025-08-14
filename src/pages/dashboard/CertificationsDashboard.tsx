import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, TrendingUp, Calendar, Users } from "lucide-react";

const CertificationsDashboard = () => {
  const certificationStats = [
    { 
      value: "1,456", 
      label: "Active Certifications", 
      icon: Award, 
      color: "text-blue-600",
      description: "Valid certifications"
    },
    { 
      value: "78%", 
      label: "Renewal Rate", 
      icon: TrendingUp, 
      color: "text-green-600",
      description: "On-time renewals"
    },
    { 
      value: "234", 
      label: "Expiring Soon", 
      icon: Calendar, 
      color: "text-orange-600",
      description: "Next 90 days"
    },
    { 
      value: "89%", 
      label: "Compliance Rate", 
      icon: Users, 
      color: "text-purple-600",
      description: "Required certifications"
    }
  ];

  const certificationTypes = [
    { name: "AWS Certified Solutions Architect", count: 234, status: "Active", trend: "+12%" },
    { name: "PMP Project Management", count: 187, status: "Active", trend: "+8%" },
    { name: "Cisco Network Professional", count: 156, status: "Active", trend: "+15%" },
    { name: "Microsoft Azure Administrator", count: 143, status: "Active", trend: "+20%" },
    { name: "CompTIA Security+", count: 98, status: "Active", trend: "+5%" },
  ];

  const expiringCertifications = [
    { employee: "John Smith", certification: "AWS Solutions Architect", expiry: "2024-03-15", status: "Critical" },
    { employee: "Sarah Johnson", certification: "PMP", expiry: "2024-04-20", status: "Warning" },
    { employee: "Mike Chen", certification: "Cisco CCNP", expiry: "2024-05-10", status: "Warning" },
    { employee: "Lisa Park", certification: "Azure Administrator", expiry: "2024-06-05", status: "Info" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-foreground">Certifications</h1>
        <p className="text-muted-foreground text-lg">
          Track professional certifications, manage renewals, and ensure compliance
        </p>
      </div>

      {/* Certification Stats */}
      <section className="bg-muted/50 rounded-xl p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-2">Certification Analytics</h2>
          <p className="text-muted-foreground">
            Overview of organizational certification status and compliance
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {certificationStats.map((stat, index) => (
            <Card key={index} className="hover:shadow-md transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${
                    index % 4 === 0 ? 'from-blue-500 to-blue-600' :
                    index % 4 === 1 ? 'from-green-500 to-green-600' :
                    index % 4 === 2 ? 'from-orange-500 to-orange-600' :
                    'from-purple-500 to-purple-600'
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

      {/* Certification Overview */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Popular Certifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {certificationTypes.map((cert, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{cert.name}</p>
                    <p className="text-sm text-muted-foreground">{cert.count} employees</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      {cert.trend}
                    </Badge>
                    <Badge variant="default">
                      {cert.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expiring Certifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {expiringCertifications.map((cert, index) => (
                <div key={index} className={`p-3 rounded-lg border ${
                  cert.status === 'Critical' ? 'bg-red-50 border-red-200' :
                  cert.status === 'Warning' ? 'bg-orange-50 border-orange-200' :
                  'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-medium ${
                        cert.status === 'Critical' ? 'text-red-800' :
                        cert.status === 'Warning' ? 'text-orange-800' :
                        'text-blue-800'
                      }`}>
                        {cert.employee}
                      </p>
                      <p className={`text-sm ${
                        cert.status === 'Critical' ? 'text-red-600' :
                        cert.status === 'Warning' ? 'text-orange-600' :
                        'text-blue-600'
                      }`}>
                        {cert.certification}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${
                        cert.status === 'Critical' ? 'text-red-600' :
                        cert.status === 'Warning' ? 'text-orange-600' :
                        'text-blue-600'
                      }`}>
                        {cert.expiry}
                      </p>
                      <Badge 
                        variant="outline" 
                        className={
                          cert.status === 'Critical' ? 'border-red-300 text-red-700' :
                          cert.status === 'Warning' ? 'border-orange-300 text-orange-700' :
                          'border-blue-300 text-blue-700'
                        }
                      >
                        {cert.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Certification Management */}
      <section>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-2">Certification Management</h2>
          <p className="text-muted-foreground">
            Tools and features for managing organizational certifications
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-md transition-all duration-200 cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-primary" />
                <span>Add Certification</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Register new employee certifications and set renewal reminders
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-all duration-200 cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-primary" />
                <span>Renewal Tracking</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Monitor certification expiry dates and automate renewal notifications
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-all duration-200 cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span>Compliance Reports</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Generate compliance reports and track certification requirements
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default CertificationsDashboard;