// Force redeploy for API key refresh
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, context = "hr_assistant" } = await req.json();
    
    // You can configure LiteLLM to use different providers
    // For now, we'll use OpenAI but you can easily switch to other models
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompts = {
      hr_assistant: "You are an HR AI assistant for XLSMART, a merged telecom company. Help with role standardization, job descriptions, employee assessments, and career development. Be professional and concise.",
      jd_generator: "You are a job description generator for XLSMART. Create comprehensive, industry-standard job descriptions based on role information provided.",
      skill_assessor: "You are a skill assessment AI for XLSMART. Analyze employee profiles against job requirements and provide skill gap analysis and recommendations."
    };

    const response = await fetch('https://proxyllm.ximplify.id/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'azure/gpt-4.1',
        messages: [
          { 
            role: 'system', 
            content: systemPrompts[context as keyof typeof systemPrompts] || systemPrompts.hr_assistant
          },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    return new Response(JSON.stringify({ 
      response: aiResponse,
      context: context 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to process AI chat request'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});