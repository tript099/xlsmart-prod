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

        // Demo data for mobility rate - realistic percentage of annual internal moves
        const mobilityRate = 18;

        // Demo data for active plans - realistic number of current mobility plans
        const activePlans = 6;

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