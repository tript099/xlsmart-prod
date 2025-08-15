import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface JobDescriptionStats {
  totalJDs: number;
  activeJDs: number;
  draftJDs: number;
  approvedJDs: number;
  reviewJDs: number;
  pendingJDs: number; // draft + review combined
  loading: boolean;
}

export const useJobDescriptionStats = (): JobDescriptionStats => {
  const [stats, setStats] = useState<JobDescriptionStats>({
    totalJDs: 0,
    activeJDs: 0,
    draftJDs: 0,
    approvedJDs: 0,
    reviewJDs: 0,
    pendingJDs: 0,
    loading: true
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log('Fetching JD stats...');
        
        // Get total count
        const { count: totalCount, error: totalError } = await supabase
          .from('xlsmart_job_descriptions')
          .select('*', { count: 'exact', head: true });

        if (totalError) {
          console.error('Error fetching total count:', totalError);
        }

        // Get counts by status
        const [
          { count: draftCount, error: draftError },
          { count: approvedCount, error: approvedError },
          { count: reviewCount, error: reviewError },
          { count: publishedCount, error: publishedError }
        ] = await Promise.all([
          supabase
            .from('xlsmart_job_descriptions')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'draft'),
          supabase
            .from('xlsmart_job_descriptions')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'approved'),
          supabase
            .from('xlsmart_job_descriptions')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'review'),
          supabase
            .from('xlsmart_job_descriptions')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'published')
        ]);

        if (draftError) console.error('Error fetching draft count:', draftError);
        if (approvedError) console.error('Error fetching approved count:', approvedError);
        if (reviewError) console.error('Error fetching review count:', reviewError);
        if (publishedError) console.error('Error fetching published count:', publishedError);

        const activeCount = (publishedCount || 0);
        const pendingCount = (draftCount || 0) + (reviewCount || 0);

        console.log('JD Stats:', {
          total: totalCount,
          draft: draftCount,
          review: reviewCount,
          approved: approvedCount,
          published: publishedCount,
          pending: pendingCount
        });

        setStats({
          totalJDs: totalCount || 0,
          activeJDs: activeCount,
          draftJDs: draftCount || 0,
          approvedJDs: approvedCount || 0,
          reviewJDs: reviewCount || 0,
          pendingJDs: pendingCount,
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