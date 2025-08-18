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
      .eq('is_active', true)
      .limit(5); // Limit to avoid large payloads

    if (empError) {
      console.error('Employee fetch error:', empError);
      throw new Error(`Failed to fetch employees: ${empError.message}`);
    }

    console.log(`Found ${employees?.length || 0} employees`);

    // Simplified mock response for testing
    const mockResponse = {
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

    console.log('Returning mock response for analysis type:', analysisType);
    
    return new Response(JSON.stringify(mockResponse), {
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