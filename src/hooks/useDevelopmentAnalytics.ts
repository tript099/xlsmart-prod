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
  refresh: () => void;
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
    loading: true,
    refresh: () => {}
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Fetch all data in parallel for better performance
        const [
          employeesResult,
          developmentPlansResult,
          trainingEnrollmentsResult,
          trainingCompletionsResult,
          trainingAnalyticsResult,
          certificationsResult,
          skillsResult
        ] = await Promise.all([
          // Total employees
          supabase
            .from('xlsmart_employees')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true),
          
          // Active development plans (learning paths)
          supabase
            .from('xlsmart_development_plans')
            .select('*', { count: 'exact', head: true })
            .eq('plan_status', 'active'),
          
          // Training enrollments
          supabase
            .from('employee_training_enrollments')
            .select('*', { count: 'exact' }),
          
          // Training completions
          supabase
            .from('training_completions')
            .select('*', { count: 'exact' }),
          
          // Training analytics for learning hours
          supabase
            .from('training_analytics')
            .select('*')
            .eq('metric_type', 'learning_hours'),
          
          // Certifications
          supabase
            .from('employee_certifications')
            .select('*', { count: 'exact', head: true }),
          
          // Skills from employees
          supabase
            .from('xlsmart_employees')
            .select('skills')
            .eq('is_active', true)
        ]);

        // Calculate learning paths (active development plans)
        const learningPaths = developmentPlansResult.count || 0;

        // Calculate completion rate based on development plan progress
        const developmentPlansData = developmentPlansResult.data || [];
        const totalProgress = developmentPlansData.reduce((sum, plan) => {
          return sum + (plan.progress_percentage || 0);
        }, 0);
        const completionRate = developmentPlansData.length > 0 
          ? Math.round(totalProgress / developmentPlansData.length) 
          : 0;

        // Get total enrollments for training count
        const totalEnrollments = trainingEnrollmentsResult.count || 0;

        // Calculate average learning hours from training analytics
        const learningHoursData = trainingAnalyticsResult.data || [];
        const totalLearningHours = learningHoursData.reduce((sum, record) => {
          return sum + (record.metric_value || 0);
        }, 0);
        const avgLearningHours = learningHoursData.length > 0 
          ? Math.round(totalLearningHours / learningHoursData.length) 
          : 0;

        // Calculate skills developed from development plans (recommended courses/certifications)
        const allRecommendedSkills = new Set<string>();
        developmentPlansData.forEach(plan => {
          // Extract skills from recommended courses
          if (plan.recommended_courses && Array.isArray(plan.recommended_courses)) {
            plan.recommended_courses.forEach((course: any) => {
              if (course.skills && Array.isArray(course.skills)) {
                course.skills.forEach((skill: string) => allRecommendedSkills.add(skill));
              }
            });
          }
          // Extract skills from development areas
          if (plan.development_areas && Array.isArray(plan.development_areas)) {
            plan.development_areas.forEach((area: string) => allRecommendedSkills.add(area));
          }
        });
        const skillsDeveloped = allRecommendedSkills.size;

        setAnalytics({
          learningPaths,
          completionRate,
          avgLearningHours,
          skillsDeveloped,
          totalEmployees: employeesResult.count || 0,
          totalTrainings: totalEnrollments,
          totalCertifications: certificationsResult.count || 0,
          loading: false,
          refresh: fetchAnalytics
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