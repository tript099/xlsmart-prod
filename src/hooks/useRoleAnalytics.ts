import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface RoleAnalytics {
  totalRoles: number;
  mappingAccuracy: number;
  standardizationRate: number;
  roleCategories: number;
  totalMappings: number;
  activeCatalogs: number;
  loading: boolean;
}

export const useRoleAnalytics = (): RoleAnalytics => {
  const [analytics, setAnalytics] = useState<RoleAnalytics>({
    totalRoles: 0,
    mappingAccuracy: 0,
    standardizationRate: 0,
    roleCategories: 0,
    totalMappings: 0,
    activeCatalogs: 0,
    loading: true
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Fetch standard roles count
        const { count: totalRoles } = await supabase
          .from('xlsmart_standard_roles')
          .select('*', { count: 'exact', head: true });

        // Fetch distinct role categories (job families)
        const { data: jobFamilies } = await supabase
          .from('xlsmart_standard_roles')
          .select('job_family')
          .not('job_family', 'is', null);

        const uniqueJobFamilies = new Set(jobFamilies?.map(role => role.job_family)).size;

        // Fetch role mappings for accuracy calculation
        const { data: mappings, count: totalMappings } = await supabase
          .from('xlsmart_role_mappings')
          .select('mapping_confidence', { count: 'exact' });

        // Calculate average mapping accuracy (values are decimals 0.0-1.0, convert to percentages)
        const avgAccuracy = mappings?.length > 0 
          ? mappings.reduce((sum, m) => sum + (m.mapping_confidence || 0), 0) / mappings.length 
          : 0;

        // Fetch role catalogs
        const { count: activeCatalogs } = await supabase
          .from('xlsmart_role_catalogs')
          .select('*', { count: 'exact', head: true })
          .eq('upload_status', 'completed');

        // Calculate standardization rate (mapped roles vs total roles uploaded)
        const standardizationRate = totalMappings && totalRoles 
          ? Math.min(100, Math.round((totalMappings / totalRoles) * 100))
          : 0;

        setAnalytics({
          totalRoles: totalRoles || 0,
          mappingAccuracy: Math.round(avgAccuracy * 100), // Convert decimal to percentage
          standardizationRate,
          roleCategories: uniqueJobFamilies,
          totalMappings: totalMappings || 0,
          activeCatalogs: activeCatalogs || 0,
          loading: false
        });
      } catch (error) {
        console.error('Error fetching role analytics:', error);
        setAnalytics(prev => ({ ...prev, loading: false }));
      }
    };

    fetchAnalytics();
  }, []);

  return analytics;
};