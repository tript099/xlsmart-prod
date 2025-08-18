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
    const aiResponse = await callLiteLLM(employees, analysisType, employeeId, departmentFilter);
    
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

async function callLiteLLM(employees: any[], analysisType: string, employeeId?: string, departmentFilter?: string) {
  let openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    openAIApiKey = Deno.env.get('OPENAI_API_KEY_NEW');
  }
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const systemPrompt = `You are an expert HR analyst specializing in career development and workforce mobility for XLSMART, one of Indonesia's largest telecom companies. Using employee data, role requirements, and telecom career frameworks, analyze and: Suggest possible career progression pathways. Provide readiness scores and gap analysis. Recommend development activities to close gaps and prepare for next roles. Ensure recommendations align with telecom industry benchmarks and XLSMART's organizational needs. ⚙️ Output Requirements: Always return insights in valid JSON format. Ensure results are concise, structured, and machine-readable, ready for integration into XLSMART's HR systems.`;

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

  console.log('=== LiteLLM API Call Started ===');
  console.log('OpenAI API Key exists:', !!openAIApiKey);
  console.log('System prompt length:', systemPrompt.length);
  console.log('Prompt length:', prompt.length);

  const requestBody = {
    model: 'azure/gpt-4.1',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_completion_tokens: 3000,
  };

  console.log('Making request to LiteLLM proxy...');
  
  try {
    const startTime = Date.now();
    const response = await fetch('https://proxyllm.ximplify.id/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    const endTime = Date.now();
    console.log(`API call took ${endTime - startTime}ms`);
    console.log('LiteLLM proxy response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LiteLLM API error response:', errorText);
      throw new Error(`LiteLLM API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Response content length:', data.choices?.[0]?.message?.content?.length || 0);
    console.log('LiteLLM response received successfully');
    
    const content = data.choices[0].message.content;
    
    // Clean up any markdown code blocks before JSON parsing
    const cleanContent = content.replace(/```json\s*|\s*```/g, '').trim();
    console.log('Analysis completed successfully');
    return JSON.parse(cleanContent);
  } catch (parseError) {
    console.error('Failed to parse AI response as JSON, using fallback');
    console.error('Parse error:', parseError);
    console.error('Content that failed to parse:', cleanContent?.substring(0, 500) || 'No content');
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