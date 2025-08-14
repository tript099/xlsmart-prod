import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CertificationAnalytics {
  totalCertifications: number;
  activeCertifications: number;
  expiringSoon: number;
  renewalRate: number;
  complianceRate: number;
  totalEmployees: number;
  loading: boolean;
}

export const useCertificationAnalytics = (): CertificationAnalytics => {
  const [analytics, setAnalytics] = useState<CertificationAnalytics>({
    totalCertifications: 0,
    activeCertifications: 0,
    expiringSoon: 0,
    renewalRate: 0,
    complianceRate: 0,
    totalEmployees: 0,
    loading: true
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Fetch total certifications
        const { data: certifications, count: totalCertifications } = await supabase
          .from('employee_certifications')
          .select('*', { count: 'exact' });

        // Get current date for calculations
        const currentDate = new Date();
        const next90Days = new Date();
        next90Days.setDate(currentDate.getDate() + 90);

        // Calculate active certifications (not expired)
        const activeCertifications = certifications?.filter(cert => 
          !cert.expiry_date || new Date(cert.expiry_date) > currentDate
        ).length || 0;

        // Calculate expiring soon (next 90 days)
        const expiringSoon = certifications?.filter(cert => 
          cert.expiry_date && 
          new Date(cert.expiry_date) <= next90Days && 
          new Date(cert.expiry_date) > currentDate
        ).length || 0;

        // Get total employees for compliance rate calculation
        const { count: totalEmployees } = await supabase
          .from('xlsmart_employees')
          .select('*', { count: 'exact', head: true });

        // Calculate renewal rate (active vs total)
        const renewalRate = totalCertifications 
          ? Math.round((activeCertifications / totalCertifications) * 100)
          : 0;

        // Calculate compliance rate (employees with certifications)
        const employeesWithCerts = new Set(certifications?.map(cert => cert.employee_id)).size;
        const complianceRate = totalEmployees 
          ? Math.round((employeesWithCerts / totalEmployees) * 100)
          : 0;

        setAnalytics({
          totalCertifications: totalCertifications || 0,
          activeCertifications,
          expiringSoon,
          renewalRate,
          complianceRate,
          totalEmployees: totalEmployees || 0,
          loading: false
        });
      } catch (error) {
        console.error('Error fetching certification analytics:', error);
        setAnalytics(prev => ({ ...prev, loading: false }));
      }
    };

    fetchAnalytics();
  }, []);

  return analytics;
};