import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('=== ROLE STANDARDIZATION FUNCTION STARTED ===');
  console.log('Request URL:', req.url);
  console.log('Request method:', req.method);
  console.log('Request headers:', Object.fromEntries(req.headers.entries()));

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
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
    const { error: updateError } = await supabase
      .from('xlsmart_upload_sessions')
      .update({ status: 'standardizing' })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Error updating session status:', updateError);
      return new Response(JSON.stringify({ 
        success: false,
        error: `Failed to update session: ${updateError.message}` 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
      
      const aiContent = aiData.choices[0].message.content;
      console.log('Raw AI content:', aiContent);
      
      // Clean the response - sometimes AI adds markdown formatting
      let cleanContent = aiContent.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      console.log('Cleaned AI content:', cleanContent);
      analysis = JSON.parse(cleanContent);
      
      // Validate the response structure
      if (!analysis.standardRoles || !Array.isArray(analysis.standardRoles)) {
        throw new Error('Invalid AI response: missing standardRoles array');
      }
      if (!analysis.mappings || !Array.isArray(analysis.mappings)) {
        throw new Error('Invalid AI response: missing mappings array');
      }
      
      console.log(`Parsed successfully: ${analysis.standardRoles.length} roles, ${analysis.mappings.length} mappings`);
      
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Raw AI response:', aiData?.choices?.[0]?.message?.content);
      return new Response(JSON.stringify({ 
        success: false,
        error: `Failed to parse AI response: ${parseError.message}`,
        rawResponse: aiData?.choices?.[0]?.message?.content?.substring(0, 500)
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user from session
    const { data: session, error: sessionError } = await supabase
      .from('xlsmart_upload_sessions')
      .select('created_by')
      .eq('id', sessionId)
      .maybeSingle();

    if (sessionError) {
      console.error('Error fetching session:', sessionError);
      return new Response(JSON.stringify({ 
        success: false,
        error: `Failed to fetch session: ${sessionError.message}` 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!session) {
      console.error('Session not found:', sessionId);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Session not found' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Creating ${analysis.standardRoles.length} standard roles...`);

    // Get current timestamp for unique naming
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '_');
    
    // Ensure unique role titles by appending session ID
    const rolesWithUniqueNames = analysis.standardRoles.map((role: any, index: number) => ({
      ...role,
      role_title: `${role.role_title}_${sessionId.slice(-8)}_${index + 1}`,
      created_by: session.created_by
    }));

    console.log('Roles with unique names:', rolesWithUniqueNames.map(r => r.role_title));

    // Insert standard roles
    const { data: createdRoles, error: rolesError } = await supabase
      .from('xlsmart_standard_roles')
      .insert(rolesWithUniqueNames)
      .select();

    if (rolesError) {
      console.error('Error creating standard roles:', rolesError);
      return new Response(JSON.stringify({ 
        success: false,
        error: `Failed to create standard roles: ${rolesError.message}` 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Creating ${analysis.mappings.length} role mappings...`);

    // Update mappings to use the correct standardized role titles and IDs
    const mappingsWithCorrectRoles = analysis.mappings.map((mapping: any) => {
      const standardRole = createdRoles?.find(r => 
        r.role_title.startsWith(mapping.standardized_role_title)
      );
      
      return {
        ...mapping,
        standard_role_id: standardRole?.id || null,
        standardized_role_title: standardRole?.role_title || mapping.standardized_role_title
      };
    });

    console.log('Mappings with correct role IDs:', mappingsWithCorrectRoles.slice(0, 2));

    // Insert mappings
    const { data: createdMappings, error: mappingsError } = await supabase
      .from('xlsmart_role_mappings')
      .insert(mappingsWithCorrectRoles)
      .select();

    if (mappingsError) {
      console.error('Error creating mappings:', mappingsError);
      return new Response(JSON.stringify({ 
        success: false,
        error: `Failed to create mappings: ${mappingsError.message}` 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update session with completion
    const { error: finalUpdateError } = await supabase
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

    if (finalUpdateError) {
      console.error('Error updating session completion:', finalUpdateError);
      // Don't return error here since the main work is done
    }

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
    console.error('=== CRITICAL ERROR IN ROLE STANDARDIZATION ===');
    console.error('Error type:', typeof error);
    console.error('Error constructor:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error object:', JSON.stringify(error, null, 2));
    
    // Try to update session status to failed if we have a sessionId
    try {
      const body = await req.clone().json().catch(() => ({}));
      if (body.sessionId) {
        console.log('Attempting to update session status to failed...');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        
        if (supabaseUrl && supabaseServiceKey) {
          const supabase = createClient(supabaseUrl, supabaseServiceKey);
          
          await supabase
            .from('xlsmart_upload_sessions')
            .update({ 
              status: 'failed',
              error_message: error.message 
            })
            .eq('id', body.sessionId);
          
          console.log('Session status updated to failed');
        }
      }
    } catch (updateError) {
      console.error('Failed to update session status:', updateError);
    }

    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'Unknown error occurred',
      details: error.stack || 'No stack trace available'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});