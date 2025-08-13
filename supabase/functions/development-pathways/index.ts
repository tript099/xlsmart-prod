import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { employeeProfile, careerGoals, currentSkills, industryTrends } = await req.json();

    console.log('Development Pathways request:', { employeeProfile, careerGoals, currentSkills });

    const systemPrompt = `You are an expert Career Development and Learning Pathways AI.
Your role is to create personalized development pathways based on employee profiles, career goals, and industry trends.

Guidelines:
- Create structured learning pathways with clear progression steps
- Recommend specific courses, certifications, and skill development activities
- Consider both technical and soft skills development
- Include timeline estimates and prerequisites
- Suggest mentoring and coaching opportunities
- Align recommendations with industry trends and future job market needs
- Provide alternative pathways for different career directions
- Include measurable milestones and success metrics

Format your response as a comprehensive development plan with:
1. Skill Gap Analysis
2. Primary Development Pathway
3. Alternative Career Tracks
4. Learning Resources & Activities
5. Timeline & Milestones
6. Success Metrics
7. Networking & Mentoring Opportunities`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: `Employee Profile: ${JSON.stringify(employeeProfile)}
Career Goals: ${careerGoals}
Current Skills: ${JSON.stringify(currentSkills)}
Industry Trends: ${industryTrends || 'Consider current market trends'}

Please create a comprehensive development pathway plan for this employee.`
          }
        ],
        temperature: 0.7,
        max_tokens: 2500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const developmentPlan = data.choices[0].message.content;

    console.log('Generated development pathway successfully');

    return new Response(JSON.stringify({ 
      developmentPlan,
      success: true 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in development-pathways function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});