import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { analysisType, departmentFilter, positionLevel } = await req.json();

    console.log(`Starting succession planning analysis: ${analysisType}`);

    // Fetch data
    let employeesQuery = supabase
      .from('xlsmart_employees')
      .select('*')
      .eq('is_active', true);

    if (departmentFilter) {
      employeesQuery = employeesQuery.eq('current_department', departmentFilter);
    }

    const { data: employees, error: employeesError } = await employeesQuery;
    if (employeesError) {
      console.error('Error fetching employees:', employeesError);
      throw new Error(`Failed to fetch employees: ${employeesError.message}`);
    }

    const { data: standardRoles, error: rolesError } = await supabase
      .from('xlsmart_standard_roles')
      .select('*')
      .eq('is_active', true);
    
    if (rolesError) {
      console.error('Error fetching standard roles:', rolesError);
      throw new Error(`Failed to fetch standard roles: ${rolesError.message}`);
    }

    const { data: skillAssessments, error: skillsError } = await supabase
      .from('xlsmart_skill_assessments')
      .select('*');
    
    if (skillsError) {
      console.error('Error fetching skill assessments:', skillsError);
      throw new Error(`Failed to fetch skill assessments: ${skillsError.message}`);
    }

    let result;
    switch (analysisType) {
      case 'leadership_pipeline':
        result = await performLeadershipPipeline(employees || [], standardRoles || [], positionLevel);
        break;
      case 'succession_readiness':
        result = await performSuccessionReadiness(employees || [], skillAssessments || []);
        break;
      case 'high_potential_identification':
        result = await performHighPotentialIdentification(employees || [], skillAssessments || []);
        break;
      case 'leadership_gap_analysis':
        result = await performLeadershipGapAnalysis(employees || [], standardRoles || [], departmentFilter);
        break;
      default:
        throw new Error('Invalid analysis type');
    }

    // Save analysis result to database
    const { data: savedAnalysis, error: saveError } = await supabase
      .from('ai_analysis_results')
      .insert({
        analysis_type: analysisType,
        function_name: 'ai-succession-planning',
        input_parameters: { analysisType, departmentFilter, positionLevel },
        analysis_result: result,
        created_by: 'system', // Will be set by RLS to auth.uid()
        status: 'completed'
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving succession planning analysis:', saveError);
    }

    return new Response(JSON.stringify({
      ...result,
      saved: !saveError,
      analysisId: savedAnalysis?.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-succession-planning function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function callLiteLLM(prompt: string, systemPrompt: string) {
  console.log('Calling LiteLLM proxy for succession planning analysis...');
  
  const response = await fetch('https://proxyllm.ximplify.id/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'azure/gpt-4.1',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 3000,
    }),
  });

  console.log(`LiteLLM proxy response status: ${response.status}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('LiteLLM API error:', errorText);
    throw new Error(`LiteLLM API error: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  console.log('LiteLLM response received successfully');
  return data.choices[0].message.content;
}

async function performLeadershipPipeline(employees: any[], standardRoles: any[], positionLevel?: string) {
  const systemPrompt = `You are an expert in leadership development and succession planning. Analyze the leadership pipeline and identify development opportunities and gaps.

Return a JSON object with this structure:
{
  "pipelineOverview": {
    "totalLeadershipRoles": number,
    "totalPotentialSuccessors": number,
    "averageSuccessionDepth": number,
    "criticalGapsCount": number
  },
  "leadershipLevels": [
    {
      "level": "string",
      "currentCount": number,
      "requiredCount": number,
      "successorCount": number,
      "gapAnalysis": "string"
    }
  ],
  "successionChains": [
    {
      "role": "string",
      "currentLeader": "string",
      "readySuccessors": ["string"],
      "developingSuccessors": ["string"],
      "successionRisk": "high|medium|low"
    }
  ],
  "developmentRecommendations": [
    {
      "employee": "string",
      "currentRole": "string",
      "targetRole": "string",
      "readinessLevel": number,
      "developmentPlan": ["string"],
      "timeToReadiness": "string"
    }
  ]
}`;

  const prompt = `Analyze leadership pipeline and succession planning:

Employee Data: ${JSON.stringify(employees.slice(0, 25).map(emp => ({
    id: emp.id,
    name: `${emp.first_name} ${emp.last_name}`,
    department: emp.department,
    role: emp.current_role,
    performance: emp.performance_rating,
    experience: emp.years_experience,
    skills: emp.skills
  })))}

Leadership Roles: ${JSON.stringify(standardRoles.filter(role => 
    role.role_title?.toLowerCase().includes('manager') || 
    role.role_title?.toLowerCase().includes('director') || 
    role.role_title?.toLowerCase().includes('lead')
  ).slice(0, 10))}

${positionLevel ? `Focus on position level: ${positionLevel}` : ''}

Analyze succession readiness and create development pathways.`;

  try {
    const response = await callLiteLLM(prompt, systemPrompt);
    return JSON.parse(response);
  } catch (error) {
    console.error('Error in performLeadershipPipeline:', error);
    // Return a fallback structure if AI parsing fails
    return {
      pipelineOverview: { totalLeadershipRoles: 0, totalPotentialSuccessors: 0, averageSuccessionDepth: 0, criticalGapsCount: 0 },
      leadershipLevels: [],
      successionChains: [],
      developmentRecommendations: []
    };
  }
}

async function performSuccessionReadiness(employees: any[], skillAssessments: any[]) {
  const systemPrompt = `You are an expert in succession planning and leadership readiness assessment. Evaluate employee readiness for leadership roles and succession opportunities.

Return a JSON object with this structure:
{
  "readinessMetrics": {
    "immediatelyReady": number,
    "readyWithDevelopment": number,
    "longerTermPotential": number,
    "averageReadinessScore": number
  },
  "readinessAssessment": [
    {
      "employee": "string",
      "currentRole": "string",
      "readinessScore": number,
      "readinessCategory": "ready_now|ready_1_year|ready_2_3_years|not_ready",
      "strengthAreas": ["string"],
      "developmentNeeds": ["string"],
      "targetRoles": ["string"]
    }
  ],
  "competencyGaps": [
    {
      "competency": "string",
      "criticalityLevel": "high|medium|low",
      "currentGapSize": number,
      "affectedEmployees": number,
      "developmentSolutions": ["string"]
    }
  ],
  "successionPlans": [
    {
      "criticalRole": "string",
      "incumbentRisk": "high|medium|low",
      "identifiedSuccessors": number,
      "successionStrategy": "string"
    }
  ]
}`;

  const prompt = `Assess succession readiness across the organization:

Employee Performance Data: ${JSON.stringify(employees.slice(0, 20).map(emp => ({
    id: emp.id,
    name: `${emp.first_name} ${emp.last_name}`,
    role: emp.current_role,
    performance: emp.performance_rating,
    experience: emp.years_experience,
    department: emp.department
  })))}

Skills Assessment Results: ${JSON.stringify(skillAssessments.slice(0, 15).map(assessment => ({
    employeeId: assessment.employee_id,
    overallScore: assessment.overall_score,
    skillsEvaluated: assessment.skills_assessed,
    assessmentDate: assessment.assessment_date
  })))}

Evaluate readiness for advancement and create succession strategies.`;

  try {
    const response = await callLiteLLM(prompt, systemPrompt);
    return JSON.parse(response);
  } catch (error) {
    console.error('Error in performSuccessionReadiness:', error);
    return {
      readinessMetrics: { immediatelyReady: 0, readyWithDevelopment: 0, longerTermPotential: 0, averageReadinessScore: 0 },
      readinessAssessment: [],
      competencyGaps: [],
      successionPlans: []
    };
  }
}

async function performHighPotentialIdentification(employees: any[], skillAssessments: any[]) {
  const systemPrompt = `You are an expert in talent identification and high-potential employee assessment. Identify high-potential employees for leadership development and succession planning.

Return a JSON object with this structure:
{
  "hipoIdentification": {
    "totalHiposCandidates": number,
    "confirmedHipos": number,
    "emergingTalent": number,
    "hipoRetentionRate": number
  },
  "hipoProfiles": [
    {
      "employee": "string",
      "hipoCategory": "confirmed|emerging|potential",
      "potentialScore": number,
      "strengthIndicators": ["string"],
      "leadershipReadiness": number,
      "careerVelocity": "fast|moderate|slow",
      "riskFactors": ["string"]
    }
  ],
  "talentSegmentation": [
    {
      "segment": "string",
      "employeeCount": number,
      "characteristics": ["string"],
      "developmentStrategy": "string",
      "retentionPriority": "high|medium|low"
    }
  ],
  "developmentTracking": [
    {
      "employee": "string",
      "developmentPath": "string",
      "progressMetrics": ["string"],
      "nextMilestones": ["string"],
      "expectedPromotionTimeline": "string"
    }
  ]
}`;

  const prompt = `Identify high-potential employees and create development strategies:

Employee Profiles: ${JSON.stringify(employees.slice(0, 25).map(emp => ({
    id: emp.id,
    name: `${emp.first_name} ${emp.last_name}`,
    role: emp.current_role,
    performance: emp.performance_rating,
    experience: emp.years_experience,
    department: emp.department,
    hireDate: emp.hire_date,
    lastPromotion: emp.last_promotion_date
  })))}

Skills and Performance Data: ${JSON.stringify(skillAssessments.slice(0, 15).map(assessment => ({
    employeeId: assessment.employee_id,
    overallScore: assessment.overall_score,
    assessmentDate: assessment.assessment_date,
    improvementTrend: assessment.progress_notes
  })))}

Identify high-potential talent and create targeted development plans.`;

  try {
    const response = await callLiteLLM(prompt, systemPrompt);
    return JSON.parse(response);
  } catch (error) {
    console.error('Error in performHighPotentialIdentification:', error);
    return {
      hipoIdentification: { totalHiposCandidates: 0, confirmedHipos: 0, emergingTalent: 0, hipoRetentionRate: 0 },
      hipoProfiles: [],
      talentSegmentation: [],
      developmentTracking: []
    };
  }
}

async function performLeadershipGapAnalysis(employees: any[], standardRoles: any[], departmentFilter?: string) {
  const systemPrompt = `You are an expert in organizational leadership analysis and workforce planning. Analyze leadership gaps and recommend solutions for building leadership capability.

Return a JSON object with this structure:
{
  "gapAnalysis": {
    "totalLeadershipGaps": number,
    "criticalGaps": number,
    "averageTimeToFill": "string",
    "gapImpactRating": number
  },
  "leadershipGaps": [
    {
      "role": "string",
      "department": "string",
      "gapSeverity": "critical|high|medium|low",
      "requiredCount": number,
      "currentCount": number,
      "impactOnBusiness": "string",
      "urgencyToFill": "immediate|3_months|6_months|1_year"
    }
  ],
  "capabilityGaps": [
    {
      "capability": "string",
      "currentLevel": number,
      "requiredLevel": number,
      "affectedRoles": ["string"],
      "buildVsBuyRecommendation": "build|buy|hybrid"
    }
  ],
  "closureStrategies": [
    {
      "strategy": "string",
      "targetGaps": ["string"],
      "timeframe": "string",
      "investment": "high|medium|low",
      "successProbability": number
    }
  ]
}`;

  const prompt = `Analyze leadership gaps and recommend closure strategies:

Current Leadership: ${JSON.stringify(employees.filter(emp => 
    emp.current_role?.toLowerCase().includes('manager') || 
    emp.current_role?.toLowerCase().includes('director') || 
    emp.current_role?.toLowerCase().includes('lead')
  ).slice(0, 15).map(emp => ({
    role: emp.current_role,
    department: emp.department,
    experience: emp.years_experience,
    performance: emp.performance_rating
  })))}

Required Leadership Roles: ${JSON.stringify(standardRoles.filter(role => 
    role.role_title?.toLowerCase().includes('manager') || 
    role.role_title?.toLowerCase().includes('director') || 
    role.role_title?.toLowerCase().includes('lead')
  ).slice(0, 10))}

${departmentFilter ? `Focus analysis on department: ${departmentFilter}` : ''}

Identify critical leadership gaps and recommend strategies to close them.`;

  try {
    const response = await callLiteLLM(prompt, systemPrompt);
    return JSON.parse(response);
  } catch (error) {
    console.error('Error in performLeadershipGapAnalysis:', error);
    return {
      gapAnalysis: { totalLeadershipGaps: 0, criticalGaps: 0, averageTimeToFill: 'N/A', gapImpactRating: 0 },
      leadershipGaps: [],
      capabilityGaps: [],
      closureStrategies: []
    };
  }
}