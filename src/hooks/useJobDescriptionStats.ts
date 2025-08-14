import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface JobDescriptionStats {
  totalJDs: number;
  activeJDs: number;
  draftJDs: number;
  approvedJDs: number;
  loading: boolean;
}

export const useJobDescriptionStats = (): JobDescriptionStats => {
  const [stats, setStats] = useState<JobDescriptionStats>({
    totalJDs: 0,
    activeJDs: 0,
    draftJDs: 0,
    approvedJDs: 0,
    loading: true
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get total count
        const { count: totalCount } = await supabase
          .from('xlsmart_job_descriptions')
          .select('*', { count: 'exact', head: true });

        // Get counts by status
        const [
          { count: draftCount },
          { count: approvedCount }
        ] = await Promise.all([
          supabase
            .from('xlsmart_job_descriptions')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'draft'),
          supabase
            .from('xlsmart_job_descriptions')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'approved')
        ]);

        const activeCount = (approvedCount || 0);

        setStats({
          totalJDs: totalCount || 0,
          activeJDs: activeCount,
          draftJDs: draftCount || 0,
          approvedJDs: approvedCount || 0,
          loading: false
        });
      } catch (error) {
        console.error('Error fetching job description stats:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
  }, []);

  return stats;
};