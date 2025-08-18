import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WorkforceMetrics {
  totalEmployees: number;
  averageExperience: number;
  skillDistribution: { [key: string]: number };
  departmentBreakdown: { [key: string]: number };
  performanceMetrics: {
    averageRating: number;
    highPerformers: number;
    lowPerformers: number;
  };
  trainingMetrics: {
    totalTrainings: number;
    completionRate: number;
    averageHours: number;
  };
  certificationMetrics: {
    totalCertifications: number;
    expiringCertifications: number;
    topCertifications: { name: string; count: number }[];
  };
  skillGaps: {
    criticalGaps: number;
    totalAssessments: number;
    averageMatchPercentage: number;
  };
  roleDistribution: { [key: string]: number };
  retentionRisk: {
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
  };
}

export const useWorkforceAnalytics = () => {
  const [metrics, setMetrics] = useState<WorkforceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkforceAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch employees data
      const { data: employees, error: empError } = await supabase
        .from('xlsmart_employees')
        .select('*')
        .eq('is_active', true);

      if (empError) throw empError;

      // Fetch skill assessments
      const { data: skillAssessments, error: skillError } = await supabase
        .from('xlsmart_skill_assessments')
        .select('*');

      if (skillError) throw skillError;

      // Fetch employee skills
      const { data: employeeSkills, error: empSkillsError } = await supabase
        .from('employee_skills')
        .select('*');

      if (empSkillsError) throw empSkillsError;

      // Fetch trainings
      const { data: trainings, error: trainingError } = await supabase
        .from('employee_trainings')
        .select('*');

      if (trainingError) throw trainingError;

      // Fetch certifications
      const { data: certifications, error: certError } = await supabase
        .from('employee_certifications')
        .select('*');

      if (certError) throw certError;

      // Fetch role mappings
      const { data: roleMappings, error: roleError } = await supabase
        .from('xlsmart_role_mappings')
        .select('*');

      if (roleError) throw roleError;

      // Fetch skill gap analysis
      const { data: skillGaps, error: gapError } = await supabase
        .from('skill_gap_analysis')
        .select('*');

      if (gapError) throw gapError;

      // Calculate metrics
      const totalEmployees = employees?.length || 0;
      
      const averageExperience = employees?.reduce((sum, emp) => 
        sum + (emp.years_of_experience || 0), 0) / totalEmployees || 0;

      // Department breakdown
      const departmentBreakdown: { [key: string]: number } = {};
      employees?.forEach(emp => {
        const dept = emp.current_department || 'Unknown';
        departmentBreakdown[dept] = (departmentBreakdown[dept] || 0) + 1;
      });

      // Skills distribution
      const skillDistribution: { [key: string]: number } = {};
      employees?.forEach(emp => {
        if (emp.skills && Array.isArray(emp.skills)) {
          emp.skills.forEach((skill: any) => {
            const skillName = typeof skill === 'string' ? skill : skill.name || 'Unknown';
            skillDistribution[skillName] = (skillDistribution[skillName] || 0) + 1;
          });
        }
      });

      // Performance metrics
      const performanceRatings = employees?.map(emp => emp.performance_rating).filter(Boolean) || [];
      const averageRating = performanceRatings.reduce((sum, rating) => sum + rating, 0) / performanceRatings.length || 0;
      const highPerformers = performanceRatings.filter(rating => rating >= 4).length;
      const lowPerformers = performanceRatings.filter(rating => rating <= 2).length;

      // Training metrics
      const totalTrainings = trainings?.length || 0;
      const completedTrainings = trainings?.filter(t => t.completion_date).length || 0;
      const completionRate = totalTrainings > 0 ? (completedTrainings / totalTrainings) * 100 : 0;
      const averageHours = trainings?.reduce((sum, t) => sum + (t.duration_hours || 0), 0) / totalTrainings || 0;

      // Certification metrics
      const totalCertifications = certifications?.length || 0;
      const now = new Date();
      const threeMonthsFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
      const expiringCertifications = certifications?.filter(cert => 
        cert.expiry_date && new Date(cert.expiry_date) <= threeMonthsFromNow
      ).length || 0;

      // Top certifications
      const certificationCounts: { [key: string]: number } = {};
      certifications?.forEach(cert => {
        certificationCounts[cert.certification_name] = (certificationCounts[cert.certification_name] || 0) + 1;
      });
      const topCertifications = Object.entries(certificationCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Skill gaps
      const totalAssessments = skillAssessments?.length || 0;
      const averageMatchPercentage = skillAssessments?.reduce((sum, assessment) => 
        sum + (Number(assessment.overall_match_percentage) || 0), 0) / totalAssessments || 0;
      const criticalGaps = skillGaps?.filter(gap => 
        gap.overall_match_percentage && Number(gap.overall_match_percentage) < 60
      ).length || 0;

      // Role distribution
      const roleDistribution: { [key: string]: number } = {};
      employees?.forEach(emp => {
        const role = emp.current_position || 'Unknown';
        roleDistribution[role] = (roleDistribution[role] || 0) + 1;
      });

      // Retention risk (based on churn and rotation risk scores)
      const highRisk = skillAssessments?.filter(assessment => 
        (assessment.churn_risk_score || 0) > 70 || (assessment.rotation_risk_score || 0) > 70
      ).length || 0;
      const mediumRisk = skillAssessments?.filter(assessment => 
        ((assessment.churn_risk_score || 0) > 40 && (assessment.churn_risk_score || 0) <= 70) ||
        ((assessment.rotation_risk_score || 0) > 40 && (assessment.rotation_risk_score || 0) <= 70)
      ).length || 0;
      const lowRisk = totalEmployees - highRisk - mediumRisk;

      const calculatedMetrics: WorkforceMetrics = {
        totalEmployees,
        averageExperience: Math.round(averageExperience * 10) / 10,
        skillDistribution,
        departmentBreakdown,
        performanceMetrics: {
          averageRating: Math.round(averageRating * 10) / 10,
          highPerformers,
          lowPerformers
        },
        trainingMetrics: {
          totalTrainings,
          completionRate: Math.round(completionRate),
          averageHours: Math.round(averageHours)
        },
        certificationMetrics: {
          totalCertifications,
          expiringCertifications,
          topCertifications
        },
        skillGaps: {
          criticalGaps,
          totalAssessments,
          averageMatchPercentage: Math.round(averageMatchPercentage)
        },
        roleDistribution,
        retentionRisk: {
          highRisk,
          mediumRisk,
          lowRisk
        }
      };

      setMetrics(calculatedMetrics);
    } catch (err) {
      console.error('Error fetching workforce analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkforceAnalytics();
  }, []);

  return {
    metrics,
    loading,
    error,
    refetch: fetchWorkforceAnalytics
  };
};