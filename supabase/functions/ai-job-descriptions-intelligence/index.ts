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
    const { analysisType, departmentFilter, roleFilter } = await req.json();

    console.log(`Starting job descriptions analysis: ${analysisType}`);

    // Fetch job descriptions data
    let jobDescriptionsQuery = supabase
      .from('xlsmart_job_descriptions')
      .select('*');

    if (departmentFilter) {
      jobDescriptionsQuery = jobDescriptionsQuery.eq('department', departmentFilter);
    }

    if (roleFilter) {
      jobDescriptionsQuery = jobDescriptionsQuery.eq('role_title', roleFilter);
    }

    const { data: jobDescriptions } = await jobDescriptionsQuery;

    // Fetch related data
    const { data: standardRoles } = await supabase
      .from('xlsmart_standard_roles')
      .select('*');

    const { data: employees } = await supabase
      .from('xlsmart_employees')
      .select('*');

    let result;
    switch (analysisType) {
      case 'jd_optimization':
        result = await performJDOptimization(jobDescriptions || [], standardRoles || [], departmentFilter);
        break;
      case 'market_alignment':
        result = await performMarketAlignment(jobDescriptions || [], standardRoles || []);
        break;
      case 'skills_mapping':
        result = await performSkillsMapping(jobDescriptions || [], employees || []);
        break;
      case 'compliance_analysis':
        result = await performComplianceAnalysis(jobDescriptions || []);
        break;
      default:
        throw new Error('Invalid analysis type');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-job-descriptions-intelligence function:', error);
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

async function performJDOptimization(jobDescriptions: any[], standardRoles: any[], departmentFilter?: string) {
  const systemPrompt = `You are an expert HR analyst specializing in job description optimization. Analyze the provided job descriptions and provide insights on how to optimize them for better candidate attraction, role clarity, and organizational alignment.

Return a JSON object with this structure:
{
  "summary": {
    "totalAnalyzed": number,
    "averageCompleteness": number,
    "averageClarity": number,
    "improvementOpportunities": number
  },
  "optimizationRecommendations": [
    {
      "role": "string",
      "currentScore": number,
      "issues": ["string"],
      "recommendations": ["string"],
      "priority": "high|medium|low"
    }
  ],
  "bestPractices": [
    {
      "category": "string",
      "recommendation": "string",
      "impact": "string"
    }
  ],
  "industryAlignment": {
    "score": number,
    "gaps": ["string"],
    "recommendations": ["string"]
  }
}`;

  const prompt = `Analyze these job descriptions for optimization opportunities:

Job Descriptions: ${JSON.stringify(jobDescriptions.slice(0, 20))}
Standard Roles: ${JSON.stringify(standardRoles.slice(0, 10))}
${departmentFilter ? `Focus on department: ${departmentFilter}` : ''}

Provide specific, actionable recommendations for improving job descriptions to attract better candidates and improve role clarity.`;

  const response = await callLiteLLM(prompt, systemPrompt);
  return JSON.parse(response);
}

async function performMarketAlignment(jobDescriptions: any[], standardRoles: any[]) {
  const systemPrompt = `You are an expert in market analysis and job description benchmarking. Analyze how well the provided job descriptions align with current market standards and industry best practices.

Return a JSON object with this structure:
{
  "marketAlignment": {
    "overallScore": number,
    "industryStandards": number,
    "competitivePositioning": number,
    "salaryAlignment": number
  },
  "roleAnalysis": [
    {
      "role": "string",
      "marketAlignment": number,
      "strengthAreas": ["string"],
      "improvementAreas": ["string"],
      "marketTrends": ["string"]
    }
  ],
  "industryTrends": [
    {
      "trend": "string",
      "impact": "string",
      "recommendation": "string"
    }
  ],
  "competitiveAnalysis": {
    "advantages": ["string"],
    "gaps": ["string"],
    "recommendations": ["string"]
  }
}`;

  const prompt = `Analyze market alignment for these job descriptions:

Job Descriptions: ${JSON.stringify(jobDescriptions.slice(0, 15))}
Standard Roles: ${JSON.stringify(standardRoles.slice(0, 10))}

Consider current market trends, industry standards, and competitive positioning. Provide insights on how these JDs compare to market benchmarks.`;

  const response = await callLiteLLM(prompt, systemPrompt);
  return JSON.parse(response);
}

async function performSkillsMapping(jobDescriptions: any[], employees: any[]) {
  const systemPrompt = `You are an expert in skills analysis and workforce planning. Analyze how well job description requirements align with current employee skills and capabilities.

Return a JSON object with this structure:
{
  "skillsAlignment": {
    "overallMatch": number,
    "criticalSkillsGap": number,
    "emergingSkillsReadiness": number,
    "skillsInflation": number
  },
  "skillsAnalysis": [
    {
      "role": "string",
      "requiredSkills": ["string"],
      "availableSkills": ["string"],
      "skillsGap": ["string"],
      "overqualifiedAreas": ["string"]
    }
  ],
  "emergingSkills": [
    {
      "skill": "string",
      "importance": "high|medium|low",
      "currentCoverage": number,
      "recommendation": "string"
    }
  ],
  "skillsDevelopment": {
    "priorityAreas": ["string"],
    "trainingRecommendations": ["string"],
    "recruitmentGaps": ["string"]
  }
}`;

  const prompt = `Analyze skills mapping between job descriptions and employee capabilities:

Job Descriptions: ${JSON.stringify(jobDescriptions.slice(0, 15))}
Employee Skills Sample: ${JSON.stringify(employees.slice(0, 20).map(emp => ({
    role: emp.current_role,
    skills: emp.skills,
    experience: emp.years_experience
  })))}

Identify skill gaps, overqualification areas, and alignment opportunities.`;

  const response = await callLiteLLM(prompt, systemPrompt);
  return JSON.parse(response);
}

async function performComplianceAnalysis(jobDescriptions: any[]) {
  const systemPrompt = `You are an expert in employment law and compliance. Analyze job descriptions for legal compliance, inclusivity, and adherence to best practices.

Return a JSON object with this structure:
{
  "complianceScore": {
    "overall": number,
    "legalCompliance": number,
    "inclusivity": number,
    "accessibility": number,
    "equalOpportunity": number
  },
  "complianceIssues": [
    {
      "role": "string",
      "issueType": "string",
      "severity": "high|medium|low",
      "description": "string",
      "recommendation": "string"
    }
  ],
  "inclusivityAnalysis": {
    "languageNeutrality": number,
    "biasDetection": ["string"],
    "accessibilityFeatures": ["string"],
    "improvementAreas": ["string"]
  },
  "legalCompliance": {
    "requiredDisclosures": boolean,
    "discriminationRisk": "low|medium|high",
    "accommodationLanguage": boolean,
    "salaryTransparency": boolean
  }
}`;

  const prompt = `Analyze these job descriptions for compliance and inclusivity:

Job Descriptions: ${JSON.stringify(jobDescriptions.slice(0, 20))}

Focus on legal compliance, inclusive language, accessibility, equal opportunity, and potential bias issues. Provide specific recommendations for improvement.`;

  const response = await callLiteLLM(prompt, systemPrompt);
  return JSON.parse(response);
}