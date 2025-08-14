import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { currentContent, updateRequest } = await req.json();
    
    const openAIApiKey = Deno.env.get('LITELLM_API_KEY');
    if (!openAIApiKey) {
      throw new Error('LiteLLM API key not configured');
    }

    const prompt = `You are an expert HR professional. Update the following job description based on this request: "${updateRequest}"

Current Job Description:
${currentContent}

Please provide only the updated job description content in a clear, professional format. Do not create a completely new job description, just modify the existing one based on the user's request.

Return the updated content in a natural, readable format suitable for a job posting.`;

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
            content: 'You are an expert HR professional. Provide clear, concise updates to job descriptions. Return only the updated content without any metadata or explanations.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LiteLLM API error:', errorText);
      throw new Error(`LiteLLM API error: ${response.statusText}`);
    }

    const aiData = await response.json();
    const updatedContent = aiData.choices[0].message.content;

    return new Response(JSON.stringify({
      success: true,
      updatedContent: updatedContent,
      message: 'Job description updated successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in AI JD updater:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      message: 'Failed to update job description'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});