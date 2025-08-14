import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const litellmApiKey = Deno.env.get('LITELLM_API_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { analysisType, departmentFilter, metricType } = await req.json();

    console.log(`Starting diversity & inclusion analysis: ${analysisType}`);

    // Fetch data
    let employeesQuery = supabase
      .from('xlsmart_employees')
      .select('*');

    if (departmentFilter) {
      employeesQuery = employeesQuery.eq('department', departmentFilter);
    }

    const { data: employees } = await employeesQuery;

    const { data: standardRoles } = await supabase
      .from('xlsmart_standard_roles')
      .select('*');

    const { data: jobDescriptions } = await supabase
      .from('xlsmart_job_descriptions')
      .select('*');

    let result;
    switch (analysisType) {
      case 'bias_detection':
        result = await performBiasDetection(employees || [], standardRoles || [], jobDescriptions || []);
        break;
      case 'diversity_metrics':
        result = await performDiversityMetrics(employees || [], departmentFilter);
        break;
      case 'inclusion_sentiment':
        result = await performInclusionSentiment(employees || [], metricType);
        break;
      case 'pay_equity_analysis':
        result = await performPayEquityAnalysis(employees || [], departmentFilter);
        break;
      default:
        throw new Error('Invalid analysis type');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-diversity-inclusion function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function callLiteLLM(prompt: string, systemPrompt: string) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${litellmApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`LiteLLM API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function performBiasDetection(employees: any[], standardRoles: any[], jobDescriptions: any[]) {
  const systemPrompt = `You are an expert in diversity, equity, inclusion, and bias detection in HR processes. Analyze data patterns to identify potential bias in hiring, promotion, and compensation decisions.

Return a JSON object with this structure:
{
  "biasDetection": {
    "overallBiasRisk": "high|medium|low",
    "detectedBiasTypes": ["string"],
    "affectedProcesses": ["string"],
    "confidenceLevel": number
  },
  "hiringBias": [
    {
      "biasType": "string",
      "affectedRoles": ["string"],
      "evidenceIndicators": ["string"],
      "severity": "high|medium|low",
      "recommendation": "string"
    }
  ],
  "promotionBias": [
    {
      "biasType": "string",
      "affectedGroups": ["string"],
      "promotionRateDisparity": number,
      "evidencePatterns": ["string"],
      "correctiveActions": ["string"]
    }
  ],
  "languageBias": [
    {
      "source": "string",
      "biasType": "string",
      "problematicTerms": ["string"],
      "inclusiveAlternatives": ["string"],
      "impact": "high|medium|low"
    }
  ],
  "mitigationStrategies": [
    {
      "strategy": "string",
      "targetBias": "string",
      "implementation": "string",
      "expectedOutcome": "string"
    }
  ]
}`;

  const prompt = `Analyze for bias patterns across HR processes:

Employee Demographics & Progression: ${JSON.stringify(employees.slice(0, 25).map(emp => ({
    department: emp.department,
    role: emp.current_role,
    performance: emp.performance_rating,
    experience: emp.years_experience,
    hireDate: emp.hire_date,
    salary: emp.salary,
    lastPromotion: emp.last_promotion_date
  })))}

Role Requirements: ${JSON.stringify(standardRoles.slice(0, 10).map(role => ({
    title: role.role_title,
    department: role.department,
    requirements: role.required_skills,
    level: role.role_level
  })))}

Job Description Language: ${JSON.stringify(jobDescriptions.slice(0, 8).map(jd => ({
    role: jd.role_title,
    requirements: jd.requirements,
    description: jd.job_summary
  })))}

Detect bias patterns and recommend bias mitigation strategies.`;

  const response = await callLiteLLM(prompt, systemPrompt);
  return JSON.parse(response);
}

async function performDiversityMetrics(employees: any[], departmentFilter?: string) {
  const systemPrompt = `You are an expert in diversity analytics and workforce representation analysis. Calculate comprehensive diversity metrics and identify areas for improvement.

Return a JSON object with this structure:
{
  "diversityOverview": {
    "diversityIndex": number,
    "representationScore": number,
    "leadershipDiversityGap": number,
    "improvementTrend": "positive|negative|stable"
  },
  "representationMetrics": [
    {
      "dimension": "string",
      "overallRepresentation": number,
      "leadershipRepresentation": number,
      "targetRepresentation": number,
      "gap": number
    }
  ],
  "departmentAnalysis": [
    {
      "department": "string",
      "diversityScore": number,
      "representationGaps": ["string"],
      "strengthAreas": ["string"],
      "improvementOpportunities": ["string"]
    }
  ],
  "pipelineAnalysis": [
    {
      "level": "string",
      "diversityMetrics": {
        "current": number,
        "target": number,
        "trend": "string"
      },
      "interventionNeeded": boolean
    }
  ],
  "recommendations": [
    {
      "focus": "string",
      "action": "string",
      "timeline": "string",
      "expectedImpact": "high|medium|low"
    }
  ]
}`;

  const prompt = `Analyze diversity representation and metrics:

Employee Data: ${JSON.stringify(employees.slice(0, 30).map(emp => ({
    department: emp.department,
    role: emp.current_role,
    level: emp.current_role?.toLowerCase().includes('manager') || emp.current_role?.toLowerCase().includes('director') ? 'leadership' : 'individual_contributor',
    experience: emp.years_experience,
    hireDate: emp.hire_date
  })))}

${departmentFilter ? `Focus analysis on department: ${departmentFilter}` : ''}

Calculate diversity metrics and identify representation gaps across all organizational levels.`;

  const response = await callLiteLLM(prompt, systemPrompt);
  return JSON.parse(response);
}

async function performInclusionSentiment(employees: any[], metricType?: string) {
  const systemPrompt = `You are an expert in inclusion analysis and organizational culture assessment. Analyze inclusion indicators and sentiment patterns across the workforce.

Return a JSON object with this structure:
{
  "inclusionMetrics": {
    "overallInclusionScore": number,
    "belongingSentiment": number,
    "psychologicalSafety": number,
    "equitableOpportunities": number
  },
  "inclusionIndicators": [
    {
      "indicator": "string",
      "currentScore": number,
      "benchmarkScore": number,
      "trend": "improving|declining|stable",
      "impact": "high|medium|low"
    }
  ],
  "groupExperiences": [
    {
      "group": "string",
      "inclusionScore": number,
      "keyStrengths": ["string"],
      "challengeAreas": ["string"],
      "supportNeeds": ["string"]
    }
  ],
  "barrierAnalysis": [
    {
      "barrier": "string",
      "prevalence": "high|medium|low",
      "affectedGroups": ["string"],
      "businessImpact": "string",
      "removalStrategy": "string"
    }
  ],
  "inclusionStrategies": [
    {
      "strategy": "string",
      "targetOutcome": "string",
      "implementationSteps": ["string"],
      "successMetrics": ["string"]
    }
  ]
}`;

  const prompt = `Analyze inclusion sentiment and organizational culture:

Employee Engagement Indicators: ${JSON.stringify(employees.slice(0, 25).map(emp => ({
    department: emp.department,
    role: emp.current_role,
    performance: emp.performance_rating,
    experience: emp.years_experience,
    tenureYears: emp.years_experience
  })))}

${metricType ? `Focus on metric type: ${metricType}` : ''}

Assess inclusion levels and identify strategies to improve belonging and equity.`;

  const response = await callLiteLLM(prompt, systemPrompt);
  return JSON.parse(response);
}

async function performPayEquityAnalysis(employees: any[], departmentFilter?: string) {
  const systemPrompt = `You are an expert in pay equity analysis and compensation fairness. Analyze compensation patterns to identify and address pay equity gaps.

Return a JSON object with this structure:
{
  "equityOverview": {
    "overallEquityScore": number,
    "significantGaps": number,
    "adjustmentRecommendations": number,
    "complianceRisk": "high|medium|low"
  },
  "payGapAnalysis": [
    {
      "comparison": "string",
      "payGapPercentage": number,
      "adjustedGapPercentage": number,
      "significance": "significant|moderate|minimal",
      "affectedEmployees": number
    }
  ],
  "roleEquityAnalysis": [
    {
      "role": "string",
      "equityScore": number,
      "payRange": {
        "min": number,
        "max": number,
        "median": number
      },
      "gapIndicators": ["string"],
      "correctionPriority": "high|medium|low"
    }
  ],
  "remediationPlan": [
    {
      "action": "string",
      "affectedEmployees": number,
      "budgetImpact": number,
      "timeline": "string",
      "complianceImportance": "critical|important|moderate"
    }
  ],
  "preventionMeasures": [
    {
      "measure": "string",
      "implementation": "string",
      "expectedOutcome": "string",
      "monitoringMethod": "string"
    }
  ]
}`;

  const prompt = `Analyze pay equity and compensation fairness:

Compensation Data: ${JSON.stringify(employees.slice(0, 25).map(emp => ({
    department: emp.department,
    role: emp.current_role,
    salary: emp.salary,
    experience: emp.years_experience,
    performance: emp.performance_rating,
    hireDate: emp.hire_date
  })))}

${departmentFilter ? `Focus analysis on department: ${departmentFilter}` : ''}

Identify pay equity gaps and recommend remediation strategies.`;

  const response = await callLiteLLM(prompt, systemPrompt);
  return JSON.parse(response);
}