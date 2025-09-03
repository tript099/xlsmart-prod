import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DevelopmentAnalytics {
  learningPaths: number;
  completionRate: number;
  avgLearningHours: number;
  skillsDeveloped: number;
  totalEmployees: number;
  totalTrainings: number;
  totalCertifications: number;
  loading: boolean;
}

export const useDevelopmentAnalytics = (): DevelopmentAnalytics => {
  const [analytics, setAnalytics] = useState<DevelopmentAnalytics>({
    learningPaths: 0,
    completionRate: 0,
    avgLearningHours: 0,
    skillsDeveloped: 0,
    totalEmployees: 0,
    totalTrainings: 0,
    totalCertifications: 0,
    loading: true
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Fetch employee data
        const { count: totalEmployees } = await supabase
          .from('xlsmart_employees')
          .select('*', { count: 'exact', head: true });

        // Fetch training data
        const { data: trainings, count: totalTrainings } = await supabase
          .from('employee_trainings')
          .select('*', { count: 'exact' });

        // Fetch certification data
        const { count: totalCertifications } = await supabase
          .from('employee_certifications')
          .select('*', { count: 'exact', head: true });

        // Fetch skills data
        const { count: skillsDeveloped } = await supabase
          .from('skills_master')
          .select('*', { count: 'exact', head: true });

        // Demo data for learning paths - realistic number of active development tracks
        const learningPaths = 12;

        // Demo data for completion rate - realistic completion percentage
        const completionRate = 78;

        // Demo data for average learning hours per employee per month
        const avgLearningHours = 8;

        setAnalytics({
          learningPaths,
          completionRate,
          avgLearningHours,
          skillsDeveloped: skillsDeveloped || 0,
          totalEmployees: totalEmployees || 0,
          totalTrainings: totalTrainings || 0,
          totalCertifications: totalCertifications || 0,
          loading: false
        });
      } catch (error) {
        console.error('Error fetching development analytics:', error);
        setAnalytics(prev => ({ ...prev, loading: false }));
      }
    };

    fetchAnalytics();
  }, []);

  return analytics;
};