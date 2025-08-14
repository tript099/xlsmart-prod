import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MobilityAnalytics {
  mobilityRate: number;
  retentionRate: number;
  activePlans: number;
  atRiskEmployees: number;
  totalEmployees: number;
  loading: boolean;
}

export const useMobilityAnalytics = (): MobilityAnalytics => {
  const [analytics, setAnalytics] = useState<MobilityAnalytics>({
    mobilityRate: 0,
    retentionRate: 0,
    activePlans: 0,
    atRiskEmployees: 0,
    totalEmployees: 0,
    loading: true
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Fetch employee data
        const { data: employees, count: totalEmployees } = await supabase
          .from('xlsmart_employees')
          .select('*', { count: 'exact' });

        const activeEmployees = employees?.filter(emp => emp.is_active).length || 0;

        // Calculate retention rate (assuming active employees represent retained employees)
        const retentionRate = totalEmployees ? Math.round((activeEmployees / totalEmployees) * 100) : 0;

        // Calculate mobility rate (employees with role assignments)
        const mobilityCount = employees?.filter(emp => emp.role_assignment_status === 'approved').length || 0;
        const mobilityRate = totalEmployees ? Math.round((mobilityCount / totalEmployees) * 100) : 0;

        // Estimate active plans (employees in pending assignment status)
        const activePlans = employees?.filter(emp => emp.role_assignment_status === 'pending').length || 0;

        // Estimate at-risk employees (those with low performance or without assignments)
        const atRiskEmployees = employees?.filter(emp => 
          (emp.performance_rating && emp.performance_rating < 3) || !emp.standard_role_id
        ).length || 0;

        setAnalytics({
          mobilityRate,
          retentionRate,
          activePlans,
          atRiskEmployees,
          totalEmployees: totalEmployees || 0,
          loading: false
        });
      } catch (error) {
        console.error('Error fetching mobility analytics:', error);
        setAnalytics(prev => ({ ...prev, loading: false }));
      }
    };

    fetchAnalytics();
  }, []);

  return analytics;
};