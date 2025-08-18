import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

console.log('Environment check:');
console.log('SUPABASE_URL exists:', !!supabaseUrl);
console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!supabaseServiceKey);
console.log('OPENAI_API_KEY exists:', !!openAIApiKey);
console.log('OPENAI_API_KEY length:', openAIApiKey?.length || 0);

serve(async (req) => {
  console.log('=== AI Learning Development Function Started ===');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Function Start - Environment Check ===');
    console.log('SUPABASE_URL present:', !!Deno.env.get('SUPABASE_URL'));
    console.log('SUPABASE_SERVICE_ROLE_KEY present:', !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
    console.log('OPENAI_API_KEY present:', !!Deno.env.get('OPENAI_API_KEY'));
    console.log('OPENAI_API_KEY length:', Deno.env.get('OPENAI_API_KEY')?.length || 0);
    
    // Validate environment variables first
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!supabaseUrl) {
      console.error('SUPABASE_URL environment variable is not set');
      throw new Error('SUPABASE_URL environment variable is not set');
    }
    if (!supabaseServiceKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
      throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
    }
    if (!openAIApiKey) {
      console.error('OPENAI_API_KEY environment variable is not set');
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }

    console.log('Initializing Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('Supabase client initialized successfully');
    
    console.log('Parsing request body...');
    const requestBody = await req.json();
    console.log('Request body received:', JSON.stringify(requestBody, null, 2));
    
    const { analysisType, employeeId, departmentFilter } = requestBody;

    console.log('Starting learning & development analysis:', { analysisType, employeeId, departmentFilter });

    // Fetch employee data with skills
    console.log('=== Database Query 1: Fetching employees ===');
    try {
      const { data: employees, error: empError } = await supabase
        .from('xlsmart_employees')
        .select('*')
        .eq('is_active', true);

      console.log('Employee query completed. Error:', empError);
      console.log('Employees found:', employees?.length || 0);

      if (empError) {
        console.error('Error fetching employees:', empError);
        throw new Error(`Failed to fetch employees: ${empError.message}`);
      }

      console.log('=== Database Query 2: Fetching skill assessments ===');
      // Fetch skill assessments
      const { data: skillAssessments, error: skillError } = await supabase
        .from('xlsmart_skill_assessments')
        .select('*');

      console.log('Skill assessments query completed. Error:', skillError);
      console.log('Skill assessments found:', skillAssessments?.length || 0);

      if (skillError) {
        console.error('Error fetching skill assessments:', skillError);
        throw skillError;
      }

      console.log('=== Database Query 3: Fetching employee skills ===');
      // Fetch employee skills
      const { data: employeeSkills, error: empSkillsError } = await supabase
        .from('employee_skills')
        .select(`
          *,
          skill_id,
          employee_id
        `);

      if (empSkillsError) {
        console.error('Error fetching employee skills:', empSkillsError);
        throw empSkillsError;
      }

      console.log('=== Database Query 4: Fetching skills master ===');
      // Fetch skills master
      const { data: skillsMaster, error: skillsMasterError } = await supabase
        .from('skills_master')
        .select('*');

      if (skillsMasterError) {
        console.error('Error fetching skills master:', skillsMasterError);
        throw skillsMasterError;
      }

      console.log('=== Database Query 5: Fetching trainings ===');
      // Fetch training records
      const { data: trainings, error: trainingError } = await supabase
        .from('employee_trainings')
        .select('*');

      if (trainingError) {
        console.error('Error fetching trainings:', trainingError);
        throw trainingError;
      }

      console.log('=== Database Query 6: Fetching certifications ===');
      // Fetch certifications
      const { data: certifications, error: certError } = await supabase
        .from('employee_certifications')
        .select('*');

      if (certError) {
        console.error('Error fetching certifications:', certError);
        throw certError;
      }

      console.log('=== Database Query 7: Fetching standard roles ===');
      // Fetch standard roles for requirements
      const { data: standardRoles, error: rolesError } = await supabase
        .from('xlsmart_standard_roles')
        .select('*');

      if (rolesError) {
        console.error('Error fetching standard roles:', rolesError);
        throw rolesError;
      }

      console.log('=== All database queries completed successfully ===');
      console.log('Data summary:', {
        employees: employees?.length,
        skillAssessments: skillAssessments?.length,
        employeeSkills: employeeSkills?.length,
        skillsMaster: skillsMaster?.length,
        trainings: trainings?.length,
        certifications: certifications?.length,
        standardRoles: standardRoles?.length
      });

      let analysisResult;

      console.log('=== Starting AI Analysis ===');
      switch (analysisType) {
        case 'personalized_learning':
          analysisResult = await performPersonalizedLearningAnalysis(
            employees, skillAssessments, employeeSkills, skillsMaster, trainings, standardRoles, employeeId
          );
          break;
        case 'skills_development':
          analysisResult = await performSkillsDevelopmentAnalysis(
            employees, skillAssessments, employeeSkills, skillsMaster, standardRoles, departmentFilter
          );
          break;
        case 'training_effectiveness':
          analysisResult = await performTrainingEffectivenessAnalysis(
            employees, trainings, certifications, skillAssessments, employeeSkills
          );
          break;
        case 'learning_strategy':
          analysisResult = await performLearningStrategyAnalysis(
            employees, skillAssessments, trainings, standardRoles, departmentFilter
          );
          break;
        default:
          throw new Error('Invalid analysis type');
      }

      console.log('=== AI Analysis completed successfully ===');
      return new Response(JSON.stringify(analysisResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      throw new Error(`Database operation failed: ${dbError.message}`);
    }

  } catch (error) {
    console.error('Error in learning & development analysis:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to perform learning & development analysis'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function callOpenAI(prompt: string, systemPrompt: string) {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openAIApiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

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

  const data = await response.json();
  if (!response.ok) {
    console.error('LiteLLM API error:', data);
    throw new Error(`LiteLLM API error: ${data.error?.message || 'Unknown error'}`);
  }
  
  return data.choices[0].message.content;
}

function cleanJsonResponse(text: string): string {
  console.log('Raw AI response length:', text.length);
  console.log('Raw AI response preview:', text.substring(0, 500));
  console.log('Raw AI response contains opening brace at:', text.indexOf('{'));
  console.log('Raw AI response contains closing brace at:', text.lastIndexOf('}'));
  
  // Remove markdown code blocks first
  let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  
  // If text starts with explanation, try to find just the JSON part
  const jsonStart = cleaned.search(/\{[\s\S]*"personalizedPlans"/);
  if (jsonStart !== -1) {
    cleaned = cleaned.substring(jsonStart);
    console.log('Found JSON starting at position:', jsonStart);
  }
  
  // Find the JSON object boundaries more carefully
  const firstBrace = cleaned.indexOf('{');
  if (firstBrace === -1) {
    console.warn('No opening brace found, returning minimal response');
    return '{"personalizedPlans":[],"learningRecommendations":{"immediateActions":[],"quarterlyGoals":[],"annualTargets":[],"budgetEstimate":0}}';
  }
  
  // Find the matching closing brace by counting braces
  let braceCount = 0;
  let lastBrace = -1;
  for (let i = firstBrace; i < cleaned.length; i++) {
    if (cleaned[i] === '{') braceCount++;
    if (cleaned[i] === '}') {
      braceCount--;
      if (braceCount === 0) {
        lastBrace = i;
        break;
      }
    }
  }
  
  if (lastBrace === -1) {
    console.warn('No matching closing brace found. Brace count at end:', braceCount);
    console.warn('Text after last opening brace:', cleaned.substring(Math.max(0, cleaned.length - 200)));
    
    // Try to find the last closing brace even if unmatched
    const lastCloseBrace = cleaned.lastIndexOf('}');
    if (lastCloseBrace > firstBrace) {
      console.log('Using last closing brace found at position:', lastCloseBrace);
      lastBrace = lastCloseBrace;
    } else {
      return '{"personalizedPlans":[],"learningRecommendations":{"immediateActions":[],"quarterlyGoals":[],"annualTargets":[],"budgetEstimate":0}}';
    }
  }
  
  cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  console.log('Extracted JSON length:', cleaned.length);
  
  // Try to parse as-is first
  try {
    const parsed = JSON.parse(cleaned);
    console.log('JSON parsed successfully on first attempt');
    return cleaned;
  } catch (e) {
    console.log('JSON needs cleaning, attempting fixes. Error:', e.message);
    
    // Remove trailing commas
    cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
    
    // Remove control characters and non-printable characters
    cleaned = cleaned.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
    
    // Fix common quote issues by escaping unescaped quotes in string values
    cleaned = cleaned.replace(/"([^"\\]*)\\?"([^"\\]*[^\\])"/g, '"$1\\"$2"');
    
    // Try parsing again
    try {
      const parsed = JSON.parse(cleaned);
      console.log('JSON fixed and parsed successfully after cleaning');
      return cleaned;
    } catch (e2) {
      console.error('Could not fix JSON after cleaning attempts. Final error:', e2.message);
      console.error('Problematic JSON snippet (first 1000 chars):', cleaned.substring(0, 1000));
      console.error('Problematic JSON snippet (last 500 chars):', cleaned.substring(Math.max(0, cleaned.length - 500)));
      return '{"personalizedPlans":[],"learningRecommendations":{"immediateActions":[],"quarterlyGoals":[],"annualTargets":[],"budgetEstimate":0}}';
    }
  }
}

async function performPersonalizedLearningAnalysis(
  employees: any[], skillAssessments: any[], employeeSkills: any[], 
  skillsMaster: any[], trainings: any[], standardRoles: any[], employeeId?: string
) {
  // Limit employees to prevent overly large responses
  const targetEmployees = employeeId 
    ? employees.filter(emp => emp.id === employeeId).slice(0, 1)
    : employees.slice(0, 5); // Reduced from 20 to 5

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

  const prompt = `Create personalized learning plans for ${targetEmployees.length} employees (limit analysis to essential data only):

EMPLOYEES (limited data):
${JSON.stringify(targetEmployees.map(emp => ({
  id: emp.id,
  name: `${emp.first_name} ${emp.last_name}`,
  position: emp.current_position,
  department: emp.current_department,
  experience: emp.years_of_experience
})), null, 2)}

SKILL ASSESSMENTS:
${JSON.stringify(skillAssessments.filter(sa => 
  targetEmployees.some(emp => emp.id === sa.employee_id)
), null, 2)}

EMPLOYEE SKILLS:
${JSON.stringify(employeeSkills.filter(es => 
  targetEmployees.some(emp => emp.id === es.employee_id)
), null, 2)}

SKILLS MASTER:
${JSON.stringify(skillsMaster, null, 2)}

TRAINING HISTORY:
${JSON.stringify(trainings.filter(t => 
  targetEmployees.some(emp => emp.id === t.employee_id)
), null, 2)}

STANDARD ROLES (for career targeting):
${JSON.stringify(standardRoles, null, 2)}

Provide personalized learning analysis focusing on:
1. Individual skill development needs and gaps
2. Career-aligned learning pathways
3. Certification recommendations for professional growth
4. Customized learning preferences and delivery methods`;

  const result = await callOpenAI(prompt, systemPrompt);
  console.log('AI Response received, length:', result.length);
  console.log('AI Response first 1000 chars:', result.substring(0, 1000));
  console.log('AI Response last 500 chars:', result.substring(Math.max(0, result.length - 500)));
  
  try {
    const cleanedResult = cleanJsonResponse(result);
    console.log('Cleaned JSON length:', cleanedResult.length);
    console.log('Cleaned JSON preview:', cleanedResult.substring(0, 500));
    const parsed = JSON.parse(cleanedResult);
    console.log('Successfully parsed JSON with keys:', Object.keys(parsed));
    return parsed;
  } catch (parseError) {
    console.error('Failed to parse personalized learning analysis result:', parseError);
    console.error('Parse error details:', parseError.message);
    console.error('Raw result length:', result.length);
    throw new Error(`Failed to parse AI response: ${parseError.message}`);
  }
}

async function performSkillsDevelopmentAnalysis(
  employees: any[], skillAssessments: any[], employeeSkills: any[], 
  skillsMaster: any[], standardRoles: any[], departmentFilter?: string
) {
  const filteredEmployees = departmentFilter 
    ? employees.filter(emp => emp.current_department === departmentFilter)
    : employees;

  const systemPrompt = `You are an AI skills development strategist. Analyze organizational skills data to create strategic development programs and identify learning priorities.

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
  ],
  "emergingSkillsStrategy": [
    {
      "emergingSkill": "string",
      "industryTrend": "string",
      "organizationalNeed": "string",
      "developmentApproach": "string",
      "timeline": "string",
      "earlyAdopters": ["employeeId1", "employeeId2"]
    }
  ],
  "departmentSpecificNeeds": [
    {
      "department": "string",
      "criticalSkills": ["skill1", "skill2"],
      "currentProficiency": number,
      "targetProficiency": number,
      "developmentStrategy": "string",
      "timeline": "string"
    }
  ]
}`;

  const prompt = `Analyze skills development strategy for ${filteredEmployees.length} employees:

EMPLOYEES:
${JSON.stringify(filteredEmployees, null, 2)}

SKILL ASSESSMENTS:
${JSON.stringify(skillAssessments.filter(sa => 
  filteredEmployees.some(emp => emp.id === sa.employee_id)
), null, 2)}

EMPLOYEE SKILLS:
${JSON.stringify(employeeSkills.filter(es => 
  filteredEmployees.some(emp => emp.id === es.employee_id)
), null, 2)}

SKILLS MASTER:
${JSON.stringify(skillsMaster, null, 2)}

STANDARD ROLES REQUIREMENTS:
${JSON.stringify(standardRoles, null, 2)}

Provide comprehensive skills development analysis focusing on:
1. Organizational skills gaps and development priorities
2. Strategic skills development programs
3. Emerging skills preparation and future-readiness
4. Department-specific development needs and strategies`;

  const result = await callOpenAI(prompt, systemPrompt);
  try {
    const cleanedResult = cleanJsonResponse(result);
    return JSON.parse(cleanedResult);
  } catch (parseError) {
    console.error('Failed to parse skills development analysis result:', parseError);
    console.error('Raw result:', result);
    throw new Error(`Failed to parse AI response: ${parseError.message}`);
  }
}

async function performTrainingEffectivenessAnalysis(
  employees: any[], trainings: any[], certifications: any[], 
  skillAssessments: any[], employeeSkills: any[]
) {
  const systemPrompt = `You are an AI training effectiveness analyst. Evaluate training programs' impact on skill development and business outcomes.

Return analysis in JSON format:
{
  "trainingEffectivenessMetrics": {
    "totalTrainingsCompleted": number,
    "avgCompletionRate": number,
    "skillImprovementRate": number,
    "certificationSuccessRate": number,
    "trainingROI": number
  },
  "programPerformance": [
    {
      "programName": "string",
      "completionRate": number,
      "averageRating": number,
      "skillImprovementMeasured": number,
      "businessImpact": "High|Medium|Low",
      "recommendations": ["rec1", "rec2"],
      "continuationDecision": "Continue|Modify|Discontinue"
    }
  ],
  "learnerEffectiveness": [
    {
      "employeeId": "string",
      "trainingsCompleted": number,
      "skillGrowthRate": number,
      "learningEngagement": "High|Medium|Low",
      "knowledgeRetention": number,
      "applicationRate": number,
      "recommendedLearningPath": "string"
    }
  ],
  "optimizationRecommendations": {
    "contentImprovements": ["improvement1", "improvement2"],
    "deliveryEnhancements": ["enhancement1", "enhancement2"],
    "measurementImprovements": ["measurement1", "measurement2"],
    "budgetOptimization": ["optimization1", "optimization2"]
  }
}`;

  const prompt = `Analyze training effectiveness across the organization:

EMPLOYEES:
${JSON.stringify(employees.slice(0, 50), null, 2)}

TRAINING RECORDS:
${JSON.stringify(trainings, null, 2)}

CERTIFICATIONS:
${JSON.stringify(certifications, null, 2)}

SKILL ASSESSMENTS:
${JSON.stringify(skillAssessments, null, 2)}

EMPLOYEE SKILLS PROGRESSION:
${JSON.stringify(employeeSkills, null, 2)}

Provide comprehensive training effectiveness analysis focusing on:
1. Overall training program performance metrics
2. Individual program effectiveness and ROI
3. Learner-specific effectiveness and engagement
4. Strategic optimization recommendations for L&D programs`;

  const result = await callOpenAI(prompt, systemPrompt);
  try {
    const cleanedResult = cleanJsonResponse(result);
    return JSON.parse(cleanedResult);
  } catch (parseError) {
    console.error('Failed to parse training effectiveness analysis result:', parseError);
    console.error('Raw result:', result);
    throw new Error(`Failed to parse AI response: ${parseError.message}`);
  }
}

async function performLearningStrategyAnalysis(
  employees: any[], skillAssessments: any[], trainings: any[], 
  standardRoles: any[], departmentFilter?: string
) {
  const filteredEmployees = departmentFilter 
    ? employees.filter(emp => emp.current_department === departmentFilter)
    : employees;

  const systemPrompt = `You are an AI learning strategy consultant. Develop comprehensive learning and development strategies aligned with business objectives and future workforce needs.

Return analysis in JSON format:
{
  "strategicLearningVision": {
    "visionStatement": "string",
    "strategicObjectives": ["objective1", "objective2"],
    "successMetrics": ["metric1", "metric2"],
    "timeframe": "string"
  },
  "learningStrategyPillars": [
    {
      "pillarName": "string",
      "description": "string",
      "keyInitiatives": ["initiative1", "initiative2"],
      "investmentArea": "string",
      "expectedOutcomes": ["outcome1", "outcome2"]
    }
  ],
  "capabilityBuildingPlan": [
    {
      "capability": "string",
      "currentState": "string",
      "desiredState": "string",
      "developmentApproach": "string",
      "timeline": "string",
      "resourceRequirements": ["resource1", "resource2"],
      "successMeasures": ["measure1", "measure2"]
    }
  ],
  "learningInfrastructure": {
    "technologyNeeds": ["tech1", "tech2"],
    "contentStrategy": "string",
    "deliveryModel": "string",
    "partnershipStrategy": "string",
    "budgetAllocation": [
      {"category": "string", "percentage": number, "justification": "string"}
    ]
  },
  "implementationRoadmap": {
    "phase1": {"duration": "string", "focus": "string", "milestones": ["milestone1"]},
    "phase2": {"duration": "string", "focus": "string", "milestones": ["milestone1"]},
    "phase3": {"duration": "string", "focus": "string", "milestones": ["milestone1"]}
  }
}`;

  const prompt = `Develop strategic learning and development strategy:

ORGANIZATIONAL CONTEXT:
- Total Employees: ${filteredEmployees.length}
- Department Filter: ${departmentFilter || 'All Departments'}

EMPLOYEE WORKFORCE:
${JSON.stringify(filteredEmployees.slice(0, 30), null, 2)}

CURRENT SKILL ASSESSMENTS:
${JSON.stringify(skillAssessments.slice(0, 20), null, 2)}

TRAINING LANDSCAPE:
${JSON.stringify(trainings.slice(0, 20), null, 2)}

FUTURE ROLE REQUIREMENTS:
${JSON.stringify(standardRoles, null, 2)}

Provide comprehensive learning strategy analysis focusing on:
1. Strategic vision and objectives for organizational learning
2. Core capability building plans and priorities
3. Learning infrastructure and technology requirements
4. Implementation roadmap with phased approach and milestones`;

  const result = await callOpenAI(prompt, systemPrompt);
  try {
    const cleanedResult = cleanJsonResponse(result);
    return JSON.parse(cleanedResult);
  } catch (parseError) {
    console.error('Failed to parse learning strategy analysis result:', parseError);
    console.error('Raw result:', result);
    throw new Error(`Failed to parse AI response: ${parseError.message}`);
  }
}