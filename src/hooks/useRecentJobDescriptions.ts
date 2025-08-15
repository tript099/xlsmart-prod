import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface RecentJobDescription {
  id: string;
  title: string;
  status: string;
  created_at: string;
}

export const useRecentJobDescriptions = () => {
  const [recentJDs, setRecentJDs] = useState<RecentJobDescription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔄 useRecentJobDescriptions effect triggered');
    const fetchRecentJDs = async () => {
      try {
        const { data, error } = await supabase
          .from('xlsmart_job_descriptions')
          .select('id, title, status, created_at')
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) throw error;

        setRecentJDs(data || []);
      } catch (error) {
        console.error('Error fetching recent job descriptions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentJDs();
  }, []);

  return { recentJDs, loading };
};