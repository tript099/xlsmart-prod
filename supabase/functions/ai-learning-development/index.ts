// Force redeploy for API key refresh
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
    let openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      openAIApiKey = Deno.env.get('OPENAI_API_KEY_NEW');
    }
    
    console.log('Environment check:', {
      supabaseUrl: !!supabaseUrl,
      supabaseServiceKey: !!supabaseServiceKey,
      openAIApiKey: !!openAIApiKey
    });

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
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
      .eq('is_active', true)
      .limit(5);

    if (empError) {
      console.error('Employee fetch error:', empError);
      throw new Error(`Failed to fetch employees: ${empError.message}`);
    }

    console.log(`Found ${employees?.length || 0} employees`);

    // Call LiteLLM for AI analysis
    const aiResponse = await callLiteLLM(employees, analysisType, employeeId, departmentFilter, openAIApiKey);
    
    console.log('Returning AI response for analysis type:', analysisType);
    
    return new Response(JSON.stringify(aiResponse), {
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

async function callLiteLLM(employees: any[], analysisType: string, employeeId?: string, departmentFilter?: string, openAIApiKey?: string) {
  console.log('callLiteLLM - API key exists:', !!openAIApiKey);
  console.log('callLiteLLM - API key length:', openAIApiKey?.length || 0);
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const systemPrompt = `You are an expert in learning and development planning for telecommunications companies.
Generate personalized learning and development recommendations based on employee data and analysis type.
Always respond with valid JSON only, no markdown formatting.`;

  let prompt = '';
  if (analysisType === 'personalized_plans') {
    prompt = `Based on these ${employees.length} employees, create personalized learning development plans.
Include skill development paths, certification goals, and learning preferences for each employee.
Focus on telecommunications industry skills and career progression.

Employee data: ${JSON.stringify(employees.slice(0, 5))}`;
  } else {
    prompt = `Analyze learning and development needs for ${employees.length} employees.
Type: ${analysisType}
${employeeId ? `Focus on employee: ${employeeId}` : ''}
${departmentFilter ? `Department filter: ${departmentFilter}` : ''}`;
  }

  const response = await fetch('https://proxyllm.ximplify.id/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      max_tokens: 3000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('LiteLLM API error:', errorText);
    throw new Error(`LiteLLM API error: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  try {
    return JSON.parse(content);
  } catch (parseError) {
    console.error('Failed to parse AI response:', content);
    // Return a fallback response
    return {
      personalizedPlans: employees?.slice(0, 3).map((emp, index) => ({
        employeeId: emp.id,
        currentProfile: {
          role: emp.current_position,
          experience: emp.years_of_experience,
          skillLevel: "Intermediate",
          learningStyle: "Visual"
        },
        learningObjectives: [
          "Improve technical skills",
          "Develop leadership capabilities",
          "Enhance communication"
        ],
        skillDevelopmentPlan: [
          {
            skillName: "Technical Leadership",
            currentLevel: 3,
            targetLevel: 5,
            priority: "High",
            learningPath: ["Online course", "Mentoring", "Project work"],
            timeline: "6 months",
            resources: ["Internal training", "External certification"]
          }
        ],
        certificationGoals: [
          {
            certification: "Industry Standard Certification",
            relevance: "High",
            preparationTime: "3 months",
            prerequisites: ["Basic knowledge"],
            businessValue: "Career advancement"
          }
        ],
        learningPreferences: {
          modality: "Blended",
          pace: "Self-paced",
          timeCommitment: "10 hours/week"
        }
      })) || [],
      learningRecommendations: {
        immediateActions: [
          "Enroll in leadership course",
          "Start technical certification",
          "Join mentoring program"
        ],
        quarterlyGoals: [
          "Complete certification",
          "Lead a project",
          "Improve performance rating"
        ],
        annualTargets: [
          "Promotion readiness",
          "Skill mastery",
          "Team leadership"
        ],
        budgetEstimate: 50000000
      }
    };
  }
}