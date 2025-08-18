import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('=== AI Learning Development Function Started ===');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Checking environment variables...');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    console.log('Environment check:', {
      supabaseUrl: !!supabaseUrl,
      supabaseServiceKey: !!supabaseServiceKey,
      openAIApiKey: !!openAIApiKey,
      openAIKeyLength: openAIApiKey?.length || 0
    });

    if (!supabaseUrl || !supabaseServiceKey || !openAIApiKey) {
      throw new Error('Missing required environment variables');
    }

    console.log('Parsing request body...');
    const { analysisType, employeeId, departmentFilter } = await req.json();
    console.log('Request params:', { analysisType, employeeId, departmentFilter });

    console.log('Creating Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Fetching employee data...');
    const { data: employees, error: empError } = await supabase
      .from('xlsmart_employees')
      .select('*')
      .eq('is_active', true);

    if (empError) {
      console.error('Employee fetch error:', empError);
      throw new Error(`Failed to fetch employees: ${empError.message}`);
    }

    console.log(`Found ${employees?.length || 0} employees`);

    // Fetch additional data for comprehensive analysis
    console.log('Fetching skill assessments...');
    const { data: skillAssessments, error: skillError } = await supabase
      .from('xlsmart_skill_assessments')
      .select('*');

    console.log('Fetching employee skills...');
    const { data: employeeSkills, error: empSkillsError } = await supabase
      .from('employee_skills')
      .select('*');

    console.log('Fetching skills master...');
    const { data: skillsMaster, error: skillsMasterError } = await supabase
      .from('skills_master')
      .select('*');

    console.log('Fetching trainings...');
    const { data: trainings, error: trainingError } = await supabase
      .from('employee_trainings')
      .select('*');

    console.log('Fetching certifications...');
    const { data: certifications, error: certError } = await supabase
      .from('employee_certifications')
      .select('*');

    console.log('Fetching standard roles...');
    const { data: standardRoles, error: rolesError } = await supabase
      .from('xlsmart_standard_roles')
      .select('*');

    let analysisResult;

    console.log('=== Starting AI Analysis ===');
    switch (analysisType) {
      case 'personalized_learning':
        analysisResult = await performPersonalizedLearningAnalysis(
          employees, skillAssessments, employeeSkills, skillsMaster, trainings, standardRoles, employeeId, openAIApiKey
        );
        break;
      case 'skills_development':
        analysisResult = await performSkillsDevelopmentAnalysis(
          employees, skillAssessments, employeeSkills, skillsMaster, standardRoles, departmentFilter, openAIApiKey
        );
        break;
      case 'training_effectiveness':
        analysisResult = await performTrainingEffectivenessAnalysis(
          employees, trainings, certifications, skillAssessments, employeeSkills, openAIApiKey
        );
        break;
      case 'learning_strategy':
        analysisResult = await performLearningStrategyAnalysis(
          employees, skillAssessments, trainings, standardRoles, departmentFilter, openAIApiKey
        );
        break;
      default:
        throw new Error('Invalid analysis type');
    }

    console.log('=== AI Analysis completed successfully ===');
    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Function error:', error);
    console.error('Error stack:', error.stack);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'AI Learning Development analysis failed',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function callOpenAI(prompt: string, systemPrompt: string, openAIApiKey: string) {
  console.log('Making OpenAI API call...');
  
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
      max_completion_tokens: 2000,
      temperature: 0.7,
    }),
  });

  console.log('OpenAI response status:', response.status);

  if (!response.ok) {
    const errorData = await response.json();
    console.error('OpenAI API error:', errorData);
    throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}

function cleanJsonResponse(text: string): string {
  console.log('Cleaning JSON response...');
  
  // Remove markdown code blocks
  let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  
  // Find JSON boundaries
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  
  if (firstBrace === -1 || lastBrace === -1) {
    console.warn('No valid JSON found, returning fallback');
    return JSON.stringify({
      personalizedPlans: [],
      learningRecommendations: {
        immediateActions: [],
        quarterlyGoals: [],
        annualTargets: [],
        budgetEstimate: 0
      }
    });
  }
  
  cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  
  try {
    JSON.parse(cleaned);
    return cleaned;
  } catch (e) {
    console.error('JSON parse error:', e.message);
    // Return fallback structure
    return JSON.stringify({
      personalizedPlans: [],
      learningRecommendations: {
        immediateActions: [],
        quarterlyGoals: [],
        annualTargets: [],
        budgetEstimate: 0
      }
    });
  }
}

async function performPersonalizedLearningAnalysis(
  employees: any[], skillAssessments: any[], employeeSkills: any[], 
  skillsMaster: any[], trainings: any[], standardRoles: any[], employeeId?: string, openAIApiKey?: string
) {
  console.log('Performing personalized learning analysis...');
  
  const targetEmployees = employeeId 
    ? employees.filter(emp => emp.id === employeeId).slice(0, 1)
    : employees.slice(0, 3); // Limit to 3 for manageable processing

  const systemPrompt = `You are an AI learning & development specialist. Create personalized learning pathways based on individual employee profiles, skills, and career goals.

Return analysis in JSON format:
{
  "personalizedPlans": [
    {
      "employeeId": "string",
      "currentProfile": {
        "role": "string",
        "experience": number,
        "skillLevel": "string",
        "learningStyle": "string"
      },
      "learningObjectives": ["objective1", "objective2"],
      "skillDevelopmentPlan": [
        {
          "skillName": "string",
          "currentLevel": number,
          "targetLevel": number,
          "priority": "High|Medium|Low",
          "learningPath": ["course1", "course2", "practice"],
          "timeline": "string",
          "resources": ["resource1", "resource2"]
        }
      ],
      "certificationGoals": [
        {
          "certification": "string",
          "relevance": "High|Medium|Low",
          "preparationTime": "string",
          "prerequisites": ["prereq1", "prereq2"],
          "businessValue": "string"
        }
      ],
      "learningPreferences": {
        "modality": "Online|Blended|In-person",
        "pace": "Self-paced|Instructor-led|Cohort",
        "timeCommitment": "string"
      }
    }
  ],
  "learningRecommendations": {
    "immediateActions": ["action1", "action2"],
    "quarterlyGoals": ["goal1", "goal2"],
    "annualTargets": ["target1", "target2"],
    "budgetEstimate": number
  }
}`;

  const prompt = `Create personalized learning plans for these employees in telecommunications:

EMPLOYEES:
${JSON.stringify(targetEmployees.map(emp => ({
    id: emp.id,
    name: `${emp.first_name} ${emp.last_name}`,
    position: emp.current_position,
    department: emp.current_department,
    experience: emp.years_of_experience,
    skills: emp.skills,
    certifications: emp.certifications,
    performance: emp.performance_rating
  })), null, 2)}

AVAILABLE SKILLS:
${JSON.stringify(skillsMaster?.slice(0, 20) || [], null, 2)}

STANDARD ROLES (for career targeting):
${JSON.stringify(standardRoles?.slice(0, 10) || [], null, 2)}

Provide personalized learning analysis focusing on telecommunications industry needs.`;

  const result = await callOpenAI(prompt, systemPrompt, openAIApiKey!);
  console.log('Raw AI response received');
  
  try {
    const cleanedResult = cleanJsonResponse(result);
    return JSON.parse(cleanedResult);
  } catch (parseError) {
    console.error('Failed to parse personalized learning analysis result:', parseError);
    throw new Error(`Failed to parse AI response: ${parseError.message}`);
  }
}

async function performSkillsDevelopmentAnalysis(
  employees: any[], skillAssessments: any[], employeeSkills: any[], 
  skillsMaster: any[], standardRoles: any[], departmentFilter?: string, openAIApiKey?: string
) {
  console.log('Performing skills development analysis...');
  
  const filteredEmployees = departmentFilter 
    ? employees.filter(emp => emp.current_department === departmentFilter)
    : employees.slice(0, 10);

  const systemPrompt = `You are an AI skills development strategist. Analyze organizational skills data to create strategic development programs.

Return analysis in JSON format:
{
  "organizationalSkillsGaps": [
    {
      "skillCategory": "string",
      "currentCapability": "string",
      "targetCapability": "string",
      "gapSeverity": "Critical|High|Medium|Low",
      "affectedRoles": ["role1", "role2"],
      "developmentPriority": "High|Medium|Low",
      "recommendedPrograms": ["program1", "program2"]
    }
  ],
  "skillsDevelopmentPrograms": [
    {
      "programName": "string",
      "targetSkills": ["skill1", "skill2"],
      "targetAudience": "string",
      "duration": "string",
      "delivery": "string",
      "expectedOutcomes": ["outcome1", "outcome2"],
      "investmentRequired": number,
      "roi": "string"
    }
  ]
}`;

  const prompt = `Analyze skills development strategy for telecommunications organization:

EMPLOYEES:
${JSON.stringify(filteredEmployees.map(emp => ({
    position: emp.current_position,
    department: emp.current_department,
    skills: emp.skills,
    experience: emp.years_of_experience,
    performance: emp.performance_rating
  })), null, 2)}

AVAILABLE SKILLS:
${JSON.stringify(skillsMaster?.slice(0, 30) || [], null, 2)}

STANDARD ROLES:
${JSON.stringify(standardRoles?.slice(0, 10) || [], null, 2)}

Focus on telecommunications industry skills and development needs.`;

  const result = await callOpenAI(prompt, systemPrompt, openAIApiKey!);
  
  try {
    const cleanedResult = cleanJsonResponse(result);
    return JSON.parse(cleanedResult);
  } catch (parseError) {
    console.error('Failed to parse skills development analysis result:', parseError);
    throw new Error(`Failed to parse AI response: ${parseError.message}`);
  }
}

async function performTrainingEffectivenessAnalysis(
  employees: any[], trainings: any[], certifications: any[], 
  skillAssessments: any[], employeeSkills: any[], openAIApiKey: string
) {
  console.log('Performing training effectiveness analysis...');
  
  const systemPrompt = `You are an AI training effectiveness analyst. Evaluate training programs and provide optimization recommendations.

Return analysis in JSON format:
{
  "trainingEffectivenessMetrics": {
    "totalTrainingsCompleted": number,
    "avgCompletionRate": number,
    "skillImprovementRate": number,
    "trainingROI": number
  },
  "programPerformance": [
    {
      "programName": "string",
      "completionRate": number,
      "averageRating": number,
      "skillImprovementMeasured": number,
      "businessImpact": "High|Medium|Low",
      "continuationDecision": "Continue|Modify|Discontinue",
      "recommendations": ["rec1", "rec2"]
    }
  ]
}`;

  const prompt = `Analyze training effectiveness for telecommunications organization:

EMPLOYEES: ${employees?.length || 0}
TRAININGS: ${trainings?.length || 0}
CERTIFICATIONS: ${certifications?.length || 0}
SKILL ASSESSMENTS: ${skillAssessments?.length || 0}

TRAINING DATA:
${JSON.stringify(trainings?.slice(0, 20) || [], null, 2)}

CERTIFICATION DATA:
${JSON.stringify(certifications?.slice(0, 20) || [], null, 2)}

Evaluate training program effectiveness and ROI.`;

  const result = await callOpenAI(prompt, systemPrompt, openAIApiKey);
  
  try {
    const cleanedResult = cleanJsonResponse(result);
    return JSON.parse(cleanedResult);
  } catch (parseError) {
    console.error('Failed to parse training effectiveness analysis result:', parseError);
    throw new Error(`Failed to parse AI response: ${parseError.message}`);
  }
}

async function performLearningStrategyAnalysis(
  employees: any[], skillAssessments: any[], trainings: any[], 
  standardRoles: any[], departmentFilter?: string, openAIApiKey?: string
) {
  console.log('Performing learning strategy analysis...');
  
  const systemPrompt = `You are an AI learning strategy consultant. Develop strategic L&D plans aligned with business objectives.

Return analysis in JSON format:
{
  "strategicLearningPlan": {
    "vision": "string",
    "objectives": ["obj1", "obj2"],
    "keyInitiatives": ["init1", "init2"],
    "successMetrics": ["metric1", "metric2"],
    "timeline": "string",
    "budgetAllocation": number
  },
  "capabilityGaps": [
    {
      "capability": "string",
      "currentState": "string",
      "desiredState": "string",
      "priority": "High|Medium|Low",
      "interventions": ["int1", "int2"]
    }
  ]
}`;

  const prompt = `Develop strategic learning plan for telecommunications organization:

WORKFORCE SIZE: ${employees?.length || 0}
DEPARTMENTS: ${departmentFilter || 'All'}
TRAINING PROGRAMS: ${trainings?.length || 0}
STANDARD ROLES: ${standardRoles?.length || 0}

Focus on strategic capability building for telecommunications industry.`;

  const result = await callOpenAI(prompt, systemPrompt, openAIApiKey!);
  
  try {
    const cleanedResult = cleanJsonResponse(result);
    return JSON.parse(cleanedResult);
  } catch (parseError) {
    console.error('Failed to parse learning strategy analysis result:', parseError);
    throw new Error(`Failed to parse AI response: ${parseError.message}`);
  }
}