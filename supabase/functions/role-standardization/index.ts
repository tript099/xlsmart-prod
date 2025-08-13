import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    console.log('Starting role standardization process...');
    console.log('Request method:', req.method);

    // Get the API key from Supabase secrets
    const litellmApiKey = Deno.env.get('LITELLM_API_KEY');
    console.log('LiteLLM API key found:', !!litellmApiKey);
    
    if (!litellmApiKey) {
      console.error('LITELLM_API_KEY not found in environment variables');
      return new Response(JSON.stringify({ 
        success: false,
        error: 'LITELLM_API_KEY not configured' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('Supabase URL found:', !!supabaseUrl);
    console.log('Supabase Service Key found:', !!supabaseServiceKey);
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Supabase configuration missing' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Request body parsed successfully');
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Invalid JSON in request body' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { sessionId, xlRoles, smartRoles } = requestBody;

    if (!sessionId) {
      console.error('Session ID is required but not provided');
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Session ID is required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing ${xlRoles?.length || 0} XL roles and ${smartRoles?.length || 0} Smart roles`);

    // Update session status
    await supabase
      .from('xlsmart_upload_sessions')
      .update({ status: 'standardizing' })
      .eq('id', sessionId);

    // Create AI prompt
    const prompt = `Analyze these role data from XL and Smart sources and create standardized telecommunications roles:

XL Roles (${xlRoles?.length || 0} roles):
${xlRoles?.slice(0, 5).map((role: any) => JSON.stringify(role)).join('\n') || 'No XL roles provided'}

Smart Roles (${smartRoles?.length || 0} roles):
${smartRoles?.slice(0, 5).map((role: any) => JSON.stringify(role)).join('\n') || 'No Smart roles provided'}

Create 8-12 standardized roles that best represent both XL and Smart role structures. Return valid JSON:

{
  "standardRoles": [
    {
      "role_title": "Network Operations Engineer",
      "department": "Network Operations", 
      "job_family": "Engineering",
      "role_level": "IC3-IC5",
      "role_category": "Technology",
      "standard_description": "Manages and monitors network infrastructure operations",
      "industry_alignment": "Telecommunications"
    }
  ],
  "mappings": [
    {
      "original_role_title": "RAN Performance Engineer",
      "original_department": "Network",
      "original_level": "Senior",
      "standardized_role_title": "Network Operations Engineer",
      "standardized_department": "Network Operations",
      "standardized_level": "IC4",
      "job_family": "Engineering",
      "mapping_confidence": 85,
      "mapping_status": "auto_mapped",
      "catalog_id": "${sessionId}"
    }
  ]
}`;

    console.log('Calling LiteLLM API...');

    // Call LiteLLM API
    let response;
    try {
      response = await fetch('https://proxyllm.ximplify.id/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${litellmApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'azure/gpt-4.1',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert HR analyst specializing in telecommunications. Create comprehensive standardized role definitions and accurate mappings. Respond only with valid JSON.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });
    } catch (fetchError) {
      console.error('Failed to call LiteLLM API:', fetchError);
      return new Response(JSON.stringify({ 
        success: false,
        error: `LiteLLM API connection failed: ${fetchError.message}` 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('LiteLLM response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LiteLLM API Error:', errorText);
      return new Response(JSON.stringify({ 
        success: false,
        error: `LiteLLM API error: ${response.status} ${response.statusText} - ${errorText}` 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let aiData, analysis;
    try {
      aiData = await response.json();
      console.log('AI response received, parsing...');
      analysis = JSON.parse(aiData.choices[0].message.content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Failed to parse AI response' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user from session
    const { data: session } = await supabase
      .from('xlsmart_upload_sessions')
      .select('created_by')
      .eq('id', sessionId)
      .single();

    if (!session) {
      throw new Error('Session not found');
    }

    console.log(`Creating ${analysis.standardRoles.length} standard roles...`);

    // Insert standard roles
    const { data: createdRoles, error: rolesError } = await supabase
      .from('xlsmart_standard_roles')
      .insert(
        analysis.standardRoles.map((role: any) => ({
          ...role,
          created_by: session.created_by
        }))
      )
      .select();

    if (rolesError) {
      console.error('Error creating standard roles:', rolesError);
      throw rolesError;
    }

    console.log(`Creating ${analysis.mappings.length} role mappings...`);

    // Insert mappings
    const { data: createdMappings, error: mappingsError } = await supabase
      .from('xlsmart_role_mappings')
      .insert(analysis.mappings)
      .select();

    if (mappingsError) {
      console.error('Error creating mappings:', mappingsError);
      throw mappingsError;
    }

    // Update session with completion
    await supabase
      .from('xlsmart_upload_sessions')
      .update({ 
        status: 'completed',
        ai_analysis: {
          standardRolesCreated: createdRoles?.length || 0,
          mappingsCreated: createdMappings?.length || 0,
          xlRolesProcessed: xlRoles?.length || 0,
          smartRolesProcessed: smartRoles?.length || 0
        }
      })
      .eq('id', sessionId);

    console.log('Role standardization completed successfully');

    return new Response(JSON.stringify({
      success: true,
      standardRoles: createdRoles?.length || 0,
      mappings: createdMappings?.length || 0,
      xlRoles: xlRoles?.length || 0,
      smartRoles: smartRoles?.length || 0,
      totalProcessed: (xlRoles?.length || 0) + (smartRoles?.length || 0)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in role-standardization function:', error);
    
    // Try to update session status to failed if we have a sessionId
    try {
      const { sessionId } = await req.json().catch(() => ({}));
      if (sessionId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        await supabase
          .from('xlsmart_upload_sessions')
          .update({ 
            status: 'failed',
            error_message: error.message 
          })
          .eq('id', sessionId);
      }
    } catch (updateError) {
      console.error('Failed to update session status:', updateError);
    }

    return new Response(JSON.stringify({ 
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});