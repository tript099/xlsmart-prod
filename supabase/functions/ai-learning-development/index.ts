import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const litellmApiKey = Deno.env.get('LITELLM_API_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { analysisType, employeeId, departmentFilter } = await req.json();

    console.log('Starting learning & development analysis:', { analysisType, employeeId, departmentFilter });

    // Fetch employee data with skills
    const { data: employees, error: empError } = await supabase
      .from('xlsmart_employees')
      .select('*')
      .eq('is_active', true);

    if (empError) {
      console.error('Error fetching employees:', empError);
      throw empError;
    }

    // Fetch skill assessments
    const { data: skillAssessments, error: skillError } = await supabase
      .from('xlsmart_skill_assessments')
      .select('*');

    if (skillError) {
      console.error('Error fetching skill assessments:', skillError);
      throw skillError;
    }

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

    // Fetch skills master
    const { data: skillsMaster, error: skillsMasterError } = await supabase
      .from('skills_master')
      .select('*');

    if (skillsMasterError) {
      console.error('Error fetching skills master:', skillsMasterError);
      throw skillsMasterError;
    }

    // Fetch training records
    const { data: trainings, error: trainingError } = await supabase
      .from('employee_trainings')
      .select('*');

    if (trainingError) {
      console.error('Error fetching trainings:', trainingError);
      throw trainingError;
    }

    // Fetch certifications
    const { data: certifications, error: certError } = await supabase
      .from('employee_certifications')
      .select('*');

    if (certError) {
      console.error('Error fetching certifications:', certError);
      throw certError;
    }

    // Fetch standard roles for requirements
    const { data: standardRoles, error: rolesError } = await supabase
      .from('xlsmart_standard_roles')
      .select('*');

    if (rolesError) {
      console.error('Error fetching standard roles:', rolesError);
      throw rolesError;
    }

    let analysisResult;

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

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

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

async function callLiteLLM(prompt: string, systemPrompt: string) {
  const response = await fetch('https://proxyllm.ximplify.id/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${litellmApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'azure/gpt-4.1',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error('LiteLLM API error:', data);
    throw new Error(`LiteLLM API error: ${data.error?.message || 'Unknown error'}`);
  }
  
  return data.choices[0].message.content;
}

async function performPersonalizedLearningAnalysis(
  employees: any[], skillAssessments: any[], employeeSkills: any[], 
  skillsMaster: any[], trainings: any[], standardRoles: any[], employeeId?: string
) {
  const targetEmployees = employeeId ? employees.filter(emp => emp.id === employeeId) : employees.slice(0, 20);

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

  const prompt = `Create personalized learning plans for ${targetEmployees.length} employees:

EMPLOYEES:
${JSON.stringify(targetEmployees, null, 2)}

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

  const result = await callLiteLLM(prompt, systemPrompt);
  return JSON.parse(result);
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

  const result = await callLiteLLM(prompt, systemPrompt);
  return JSON.parse(result);
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

  const result = await callLiteLLM(prompt, systemPrompt);
  return JSON.parse(result);
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

  const result = await callLiteLLM(prompt, systemPrompt);
  return JSON.parse(result);
}