import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, TrendingUp, Calendar, Users, Loader2, Shield, CheckCircle } from "lucide-react";
import { useCertificationAnalytics } from "@/hooks/useCertificationAnalytics";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const CertificationsDashboard = () => {
  const certAnalytics = useCertificationAnalytics();
  const [activeDialog, setActiveDialog] = useState<string | null>(null);
  const [recentCertifications, setRecentCertifications] = useState<any[]>([]);
  const [loadingCerts, setLoadingCerts] = useState(true);

  useEffect(() => {
    // Sample certification data for demo
    setTimeout(() => {
      setRecentCertifications([
        {
          certification_name: "AWS Certified Solutions Architect",
          certification_type: "technical",
          provider: "Amazon Web Services",
          issue_date: "2024-08-15",
          expiry_date: "2027-08-15",
          compliance_required: false,
          xlsmart_employees: { first_name: "John", last_name: "Smith", current_department: "Engineering" }
        },
        {
          certification_name: "PMP - Project Management Professional",
          certification_type: "professional", 
          provider: "Project Management Institute",
          issue_date: "2024-06-20",
          expiry_date: "2027-06-20",
          compliance_required: false,
          xlsmart_employees: { first_name: "Sarah", last_name: "Johnson", current_department: "Operations" }
        },
        {
          certification_name: "CISSP - Information Security Professional",
          certification_type: "compliance",
          provider: "ISC2",
          issue_date: "2024-09-10",
          expiry_date: "2025-02-15",
          compliance_required: true,
          xlsmart_employees: { first_name: "Mike", last_name: "Davis", current_department: "IT Security" }
        },
        {
          certification_name: "Scrum Master Certified",
          certification_type: "professional",
          provider: "Scrum Alliance", 
          issue_date: "2024-07-05",
          expiry_date: "2026-07-05",
          compliance_required: false,
          xlsmart_employees: { first_name: "Emily", last_name: "Brown", current_department: "Product" }
        },
        {
          certification_name: "Google Cloud Professional Data Engineer",
          certification_type: "technical",
          provider: "Google Cloud",
          issue_date: "2024-05-30",
          expiry_date: "2026-05-30", 
          compliance_required: false,
          xlsmart_employees: { first_name: "David", last_name: "Wilson", current_department: "Data Science" }
        },
        {
          certification_name: "CompTIA Security+",
          certification_type: "compliance",
          provider: "CompTIA",
          issue_date: "2024-04-18",
          expiry_date: "2025-01-20",
          compliance_required: true,
          xlsmart_employees: { first_name: "Lisa", last_name: "Garcia", current_department: "IT Security" }
        }
      ]);
      setLoadingCerts(false);
    }, 300);
  }, []);
  const certificationStats = [
    { 
      value: certAnalytics.loading ? "..." : certAnalytics.activeCertifications.toLocaleString(), 
      label: "Active Certifications", 
      icon: Award, 
      color: "text-blue-600",
      description: "Valid certifications"
    },
    { 
      value: certAnalytics.loading ? "..." : `${certAnalytics.renewalRate}%`, 
      label: "Renewal Rate", 
      icon: TrendingUp, 
      color: "text-green-600",
      description: "On-time renewals"
    },
    { 
      value: certAnalytics.loading ? "..." : certAnalytics.expiringSoon.toString(), 
      label: "Expiring Soon", 
      icon: Calendar, 
      color: "text-orange-600",
      description: "Next 90 days"
    },
    { 
      value: certAnalytics.loading ? "..." : `${certAnalytics.complianceRate}%`, 
      label: "Compliance Rate", 
      icon: Users, 
      color: "text-purple-600",
      description: "Required certifications"
    }
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
            {certAnalytics.totalEmployees > 0 && ` across ${certAnalytics.totalEmployees} employees`}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {certificationStats.map((stat, index) => (
            <Card key={index} className="hover:shadow-md transition-all duration-200 cursor-pointer">
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
                    <div className={`text-2xl font-bold ${stat.color} flex items-center gap-2`}>
                      {certAnalytics.loading && <Loader2 className="h-4 w-4 animate-spin" />}
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
              {certAnalytics.totalCertifications > 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  <Award className="h-12 w-12 mx-auto mb-4 text-primary/30" />
                  <p className="font-medium">Certification Types</p>
                  <p className="text-sm">Detailed breakdown will be available with more certification data.</p>
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium">Total Certifications: {certAnalytics.totalCertifications}</p>
                    <p className="text-xs text-muted-foreground">Across different types and authorities</p>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 text-muted-foreground">
                  <Award className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                  <p className="font-medium">No Certifications Found</p>
                  <p className="text-sm">Start by adding employee certification data to see popular certifications here.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expiring Certifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {certAnalytics.expiringSoon > 0 ? (
                <div className="space-y-3">
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <h3 className="font-medium text-orange-800 mb-2">Action Required</h3>
                    <p className="text-sm text-orange-700">
                      {certAnalytics.expiringSoon} certifications will expire in the next 90 days.
                    </p>
                    <p className="text-xs text-orange-600 mt-1">
                      Review and plan renewal activities to maintain compliance.
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>• Contact employees to schedule renewal training</p>
                    <p>• Update certification tracking systems</p>
                    <p>• Monitor compliance requirements</p>
                  </div>
                </div>
              ) : certAnalytics.totalCertifications > 0 ? (
                <div className="text-center p-8 text-green-600">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-green-500/50" />
                  <p className="font-medium">All Clear!</p>
                  <p className="text-sm text-muted-foreground">No certifications expiring in the next 90 days.</p>
                </div>
              ) : (
                <div className="text-center p-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                  <p className="font-medium">No Expiration Data</p>
                  <p className="text-sm">Add employee certifications to monitor expiry dates.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Recent Certifications */}
      <section>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-2">Recent Certifications</h2>
          <p className="text-muted-foreground">
            Latest employee certifications and achievements
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Active Certifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingCerts ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading certifications...</span>
              </div>
            ) : recentCertifications.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {recentCertifications.map((cert, index) => (
                  <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm leading-tight mb-1">
                          {cert.certification_name}
                        </h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          {cert.xlsmart_employees.first_name} {cert.xlsmart_employees.last_name}
                        </p>
                      </div>
                      <Badge 
                        variant={cert.certification_type === 'compliance' ? 'destructive' : 
                                cert.certification_type === 'technical' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {cert.certification_type}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Provider:</span>
                        <span>{cert.provider}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Department:</span>
                        <span>{cert.xlsmart_employees.current_department}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Issued:</span>
                        <span>{new Date(cert.issue_date).toLocaleDateString()}</span>
                      </div>
                      {cert.expiry_date && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Expires:</span>
                          <span className={
                            new Date(cert.expiry_date) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
                              ? 'text-orange-600 font-medium'
                              : ''
                          }>
                            {new Date(cert.expiry_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-3 flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      <span className="text-xs text-green-600 font-medium">Verified</span>
                      {cert.compliance_required && (
                        <>
                          <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                          <Badge variant="outline" className="text-xs">Required</Badge>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 text-muted-foreground">
                <Award className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                <p className="font-medium">No Certifications Found</p>
                <p className="text-sm">Employee certifications will appear here once added to the system.</p>
              </div>
            )}
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