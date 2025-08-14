import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { analysisType, departmentFilter, timeHorizon } = await req.json();

    console.log(`Starting advanced role intelligence analysis: ${analysisType}`);

    // Fetch data
    let rolesQuery = supabase
      .from('xlsmart_standard_roles')
      .select('*');

    if (departmentFilter) {
      rolesQuery = rolesQuery.eq('department', departmentFilter);
    }

    const { data: standardRoles } = await rolesQuery;

    const { data: employees } = await supabase
      .from('xlsmart_employees')
      .select('*');

    const { data: jobDescriptions } = await supabase
      .from('xlsmart_job_descriptions')
      .select('*');

    let result;
    switch (analysisType) {
      case 'role_evolution':
        result = await performRoleEvolution(standardRoles || [], employees || [], timeHorizon);
        break;
      case 'redundancy_analysis':
        result = await performRedundancyAnalysis(standardRoles || [], employees || []);
        break;
      case 'future_prediction':
        result = await performFuturePrediction(standardRoles || [], jobDescriptions || [], timeHorizon);
        break;
      case 'competitiveness_scoring':
        result = await performCompetitivenessScoring(standardRoles || [], employees || [], departmentFilter);
        break;
      default:
        throw new Error('Invalid analysis type');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-advanced-role-intelligence function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function callLiteLLM(prompt: string, systemPrompt: string) {
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
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error('LiteLLM API error:', data);
    console.error('Response status:', response.status, response.statusText);
    throw new Error(`LiteLLM API error: ${data.error?.message || response.statusText}`);
  }
  
  return data.choices[0].message.content;
}

async function performRoleEvolution(standardRoles: any[], employees: any[], timeHorizon?: string) {
  const systemPrompt = `You are an expert in workforce evolution and role transformation analysis. Analyze how roles are evolving and predict future skill requirements and role changes.

Return a JSON object with this structure:
{
  "evolutionOverview": {
    "rolesAnalyzed": number,
    "evolutionRate": number,
    "disruptionRisk": "high|medium|low",
    "adaptationReadiness": number
  },
  "roleEvolutionTracking": [
    {
      "role": "string",
      "evolutionStage": "emerging|evolving|mature|declining",
      "skillShiftTrends": ["string"],
      "futureSkillRequirements": ["string"],
      "transformationProbability": number,
      "timeToSignificantChange": "string"
    }
  ],
  "emergingRoles": [
    {
      "roleTitle": "string",
      "department": "string",
      "emergenceDrivers": ["string"],
      "requiredSkills": ["string"],
      "timeToMarketNeed": "string",
      "preparednessLevel": "high|medium|low"
    }
  ],
  "skillEvolution": [
    {
      "skillCategory": "string",
      "currentImportance": number,
      "futureImportance": number,
      "evolutionTrend": "increasing|decreasing|stable",
      "affectedRoles": ["string"]
    }
  ]
}`;

  const prompt = `Analyze role evolution patterns and future requirements:

Current Standard Roles: ${JSON.stringify(standardRoles.slice(0, 20).map(role => ({
    title: role.role_title,
    department: role.department,
    level: role.role_level,
    skills: role.required_skills,
    responsibilities: role.responsibilities
  })))}

Employee Role Distribution: ${JSON.stringify(employees.slice(0, 15).map(emp => ({
    role: emp.current_role,
    department: emp.department,
    skills: emp.skills,
    experience: emp.years_experience
  })))}

${timeHorizon ? `Analysis time horizon: ${timeHorizon}` : 'Default 3-year horizon'}

Analyze role evolution trends and predict future role requirements.`;

  const response = await callLiteLLM(prompt, systemPrompt);
  return JSON.parse(response);
}

async function performRedundancyAnalysis(standardRoles: any[], employees: any[]) {
  const systemPrompt = `You are an expert in organizational efficiency and role optimization. Analyze role redundancy and overlap to recommend organizational restructuring opportunities.

Return a JSON object with this structure:
{
  "redundancyOverview": {
    "totalRolesAnalyzed": number,
    "redundantRolesIdentified": number,
    "overlapScore": number,
    "optimizationPotential": number
  },
  "roleOverlapAnalysis": [
    {
      "roleGroup": ["string"],
      "overlapPercentage": number,
      "redundantFunctions": ["string"],
      "consolidationOpportunity": "high|medium|low",
      "impactAssessment": "string"
    }
  ],
  "efficiencyOpportunities": [
    {
      "opportunity": "string",
      "affectedRoles": ["string"],
      "potentialSavings": number,
      "implementationComplexity": "high|medium|low",
      "recommendation": "string"
    }
  ],
  "restructuringOptions": [
    {
      "option": "string",
      "consolidatedRoles": ["string"],
      "newRoleStructure": "string",
      "benefitsExpected": ["string"],
      "risksConsidered": ["string"]
    }
  ],
  "optimizationPlan": [
    {
      "phase": "string",
      "actions": ["string"],
      "timeline": "string",
      "expectedOutcomes": ["string"],
      "successMetrics": ["string"]
    }
  ]
}`;

  const prompt = `Analyze role redundancy and organizational efficiency:

Standard Role Definitions: ${JSON.stringify(standardRoles.slice(0, 20).map(role => ({
    title: role.role_title,
    department: role.department,
    responsibilities: role.responsibilities,
    skills: role.required_skills,
    level: role.role_level
  })))}

Current Employee Roles: ${JSON.stringify(employees.slice(0, 25).map(emp => ({
    role: emp.current_role,
    department: emp.department,
    responsibilities: emp.job_responsibilities,
    skills: emp.skills
  })))}

Identify redundant roles and recommend optimization strategies.`;

  const response = await callLiteLLM(prompt, systemPrompt);
  return JSON.parse(response);
}

async function performFuturePrediction(standardRoles: any[], jobDescriptions: any[], timeHorizon?: string) {
  const systemPrompt = `You are an expert in future of work analysis and role prediction. Predict future role requirements and organizational needs based on industry trends and technological advancement.

Return a JSON object with this structure:
{
  "futurePrediction": {
    "predictionConfidence": number,
    "disruptionLevel": "high|medium|low",
    "newRolesExpected": number,
    "obsoleteRolesExpected": number
  },
  "futureRoles": [
    {
      "predictedRole": "string",
      "department": "string",
      "emergenceTimeframe": "string",
      "drivingFactors": ["string"],
      "requiredSkills": ["string"],
      "preparationStrategy": "string"
    }
  ],
  "roleTransformations": [
    {
      "currentRole": "string",
      "transformedRole": "string",
      "transformationDrivers": ["string"],
      "skillGaps": ["string"],
      "transitionPlan": "string"
    }
  ],
  "obsolescenceRisk": [
    {
      "role": "string",
      "riskLevel": "high|medium|low",
      "obsolescenceFactors": ["string"],
      "mitigationStrategies": ["string"],
      "transitionOptions": ["string"]
    }
  ],
  "preparationRecommendations": [
    {
      "recommendation": "string",
      "targetArea": "string",
      "implementationPriority": "high|medium|low",
      "expectedBenefit": "string",
      "timeline": "string"
    }
  ]
}`;

  const prompt = `Predict future role requirements and transformations:

Current Role Landscape: ${JSON.stringify(standardRoles.slice(0, 15).map(role => ({
    title: role.role_title,
    department: role.department,
    skills: role.required_skills,
    level: role.role_level
  })))}

Job Description Patterns: ${JSON.stringify(jobDescriptions.slice(0, 10).map(jd => ({
    role: jd.role_title,
    requirements: jd.requirements,
    responsibilities: jd.key_responsibilities
  })))}

${timeHorizon ? `Prediction timeframe: ${timeHorizon}` : 'Default 5-year prediction horizon'}

Predict future role evolution and organizational needs.`;

  const response = await callLiteLLM(prompt, systemPrompt);
  return JSON.parse(response);
}

async function performCompetitivenessScoring(standardRoles: any[], employees: any[], departmentFilter?: string) {
  const systemPrompt = `You are an expert in competitive role analysis and market positioning. Analyze role competitiveness in the talent market and recommend strategies to improve talent attraction and retention.

Return a JSON object with this structure:
{
  "competitivenessOverview": {
    "averageCompetitivenessScore": number,
    "marketPositioning": "leader|competitive|lagging",
    "talentAttractionRisk": "high|medium|low",
    "retentionAdvantage": number
  },
  "roleCompetitiveness": [
    {
      "role": "string",
      "competitivenessScore": number,
      "marketDemand": "high|medium|low",
      "talentSupply": "abundant|balanced|scarce",
      "competitiveAdvantages": ["string"],
      "improvementAreas": ["string"]
    }
  ],
  "marketIntelligence": [
    {
      "role": "string",
      "marketTrends": ["string"],
      "salaryBenchmark": "above|at|below_market",
      "skillsPremium": ["string"],
      "competitorAdvantages": ["string"]
    }
  ],
  "talentStrategy": [
    {
      "strategy": "string",
      "targetRoles": ["string"],
      "implementation": "string",
      "expectedImpact": "high|medium|low",
      "investmentRequired": "high|medium|low"
    }
  ],
  "riskMitigation": [
    {
      "risk": "string",
      "affectedRoles": ["string"],
      "mitigationActions": ["string"],
      "monitoringMetrics": ["string"],
      "successCriteria": "string"
    }
  ]
}`;

  const prompt = `Analyze role competitiveness and market positioning:

Standard Roles Portfolio: ${JSON.stringify(standardRoles.slice(0, 20).map(role => ({
    title: role.role_title,
    department: role.department,
    level: role.role_level,
    skills: role.required_skills
  })))}

Current Talent Profile: ${JSON.stringify(employees.slice(0, 20).map(emp => ({
    role: emp.current_role,
    department: emp.department,
    experience: emp.years_experience,
    performance: emp.performance_rating,
    skills: emp.skills
  })))}

${departmentFilter ? `Focus analysis on department: ${departmentFilter}` : ''}

Assess role competitiveness and recommend talent attraction strategies.`;

  const response = await callLiteLLM(prompt, systemPrompt);
  return JSON.parse(response);
}