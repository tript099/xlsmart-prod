import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const litellmApiKey = Deno.env.get('LITELLM_API_KEY');
    if (!litellmApiKey) {
      throw new Error('LiteLLM API key not configured');
    }

    const { sessionId } = await req.json();

    console.log('Starting role standardization for session:', sessionId);

    // Fetch uploaded XL data
    const { data: xlData, error: xlError } = await supabase
      .from('xl_roles_data')
      .select('*')
      .eq('session_id', sessionId);

    if (xlError) {
      throw new Error(`Failed to fetch XL data: ${xlError.message}`);
    }

    // Fetch uploaded SMART data
    const { data: smartData, error: smartError } = await supabase
      .from('smart_roles_data')
      .select('*')
      .eq('session_id', sessionId);

    if (smartError) {
      throw new Error(`Failed to fetch SMART data: ${smartError.message}`);
    }

    console.log('Data fetched:', {
      xlCount: xlData?.length || 0,
      smartCount: smartData?.length || 0
    });

    // Update session status
    await supabase
      .from('xlsmart_upload_sessions')
      .update({ status: 'standardizing' })
      .eq('id', sessionId);

    // Prepare data for AI analysis
    const xlSample = xlData?.slice(0, 10) || [];
    const smartSample = smartData?.slice(0, 10) || [];

    const prompt = `Analyze these telecommunications role data from XL and SMART sources and create standardized roles:

XL Roles Sample (${xlData?.length || 0} total):
${xlSample.map(role => JSON.stringify({
  role_title: role.role_title,
  department: role.department,
  role_family: role.role_family,
  seniority_band: role.seniority_band,
  required_skills: role.required_skills,
  experience_min_years: role.experience_min_years
})).join('\n')}

SMART Roles Sample (${smartData?.length || 0} total):
${smartSample.map(role => JSON.stringify({
  role_title: role.role_title,
  department: role.department,
  role_family: role.role_family,
  seniority_band: role.seniority_band,
  required_skills: role.required_skills,
  experience_min_years: role.experience_min_years
})).join('\n')}

Create 8-15 standardized roles that best represent both XL and SMART role structures. Return ONLY valid JSON:

{
  "standardizedRoles": [
    {
      "standardized_role_title": "Network Operations Engineer",
      "standardized_department": "Network Operations",
      "standardized_role_family": "Engineering",
      "standardized_seniority_band": "Senior",
      "standardized_role_purpose": "Manages and monitors network infrastructure operations",
      "standardized_core_responsibilities": "Network monitoring, incident response, capacity planning",
      "standardized_required_skills": "Network protocols, monitoring tools, troubleshooting",
      "standardized_preferred_skills": "Automation, scripting, cloud platforms",
      "standardized_certifications": "CCNA, CCNP, Network+",
      "standardized_tools_platforms": "Nagios, SolarWinds, Cisco, Juniper",
      "standardized_experience_min_years": 3,
      "standardized_education": "Bachelor's in Engineering/Computer Science",
      "standardized_location": "Jakarta/Remote",
      "xl_source_count": 5,
      "smart_source_count": 3,
      "confidence_score": 85
    }
  ],
  "mappings": [
    {
      "original_role_title": "RAN Performance Engineer",
      "original_source": "xl",
      "standardized_role_title": "Network Operations Engineer",
      "mapping_confidence": 85,
      "mapping_reason": "Similar responsibilities in network operations and performance monitoring"
    }
  ]
}`;

    // Call LiteLLM Proxy API
    console.log('Calling LiteLLM Proxy API...');
    const litellmResponse = await fetch('https://proxyllm.ximplify.id/v1/chat/completions', {
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
            content: 'You are an expert in telecommunications role standardization. Return only valid JSON without any markdown formatting.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 4000
      }),
    });

    if (!litellmResponse.ok) {
      throw new Error(`LiteLLM API error: ${litellmResponse.statusText}`);
    }

    const litellmData = await litellmResponse.json();
    let aiResponseText = litellmData.choices[0].message.content;

    // Clean and parse AI response
    aiResponseText = aiResponseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let aiResult;
    try {
      aiResult = JSON.parse(aiResponseText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Invalid AI response format');
    }

    console.log('AI analysis complete:', {
      standardizedRoles: aiResult.standardizedRoles?.length || 0,
      mappings: aiResult.mappings?.length || 0
    });

    // Insert standardized roles
    const standardizedRoles = aiResult.standardizedRoles || [];
    const standardizedRolesWithSession = standardizedRoles.map((role: any) => ({
      ...role,
      session_id: sessionId
    }));

    // Map to the correct table structure for xlsmart_standard_roles
    const xlsmartStandardRoles = standardizedRoles.map((role: any) => ({
      role_title: role.standardized_role_title,
      department: role.standardized_department,
      job_family: role.standardized_role_family,
      role_level: role.standardized_seniority_band,
      role_category: role.standardized_role_family,
      standard_description: role.standardized_role_purpose,
      core_responsibilities: [role.standardized_core_responsibilities],
      required_skills: role.standardized_required_skills ? role.standardized_required_skills.split(',').map((s: string) => s.trim()) : [],
      education_requirements: [role.standardized_education],
      experience_range_min: role.standardized_experience_min_years || 0,
      experience_range_max: (role.standardized_experience_min_years || 0) + 5,
      keywords: role.standardized_tools_platforms ? role.standardized_tools_platforms.split(',').map((s: string) => s.trim()) : [],
      created_by: 'd77125e3-bb96-442c-a2d1-80f15baf497d', // Default system user UUID
      industry_alignment: 'Telecommunications'
    }));

    const { data: insertedRoles, error: rolesError } = await supabase
      .from('xlsmart_standard_roles')
      .insert(xlsmartStandardRoles)
      .select('id, role_title');

    if (rolesError) {
      console.error('Error inserting standardized roles:', rolesError);
      throw new Error(`Failed to insert standardized roles: ${rolesError.message}`);
    }

    // Create mappings
    const mappings = aiResult.mappings || [];
    const mappingsWithStandardizedIds = mappings.map((mapping: any) => {
      const standardizedRole = insertedRoles?.find(r => 
        r.role_title === mapping.standardized_role_title
      );
      
      return {
        session_id: sessionId,
        original_role_title: mapping.original_role_title,
        original_source: mapping.original_source,
        standardized_role_id: standardizedRole?.id,
        mapping_confidence: mapping.mapping_confidence || 0,
        mapping_reason: mapping.mapping_reason || ''
      };
    }).filter(m => m.standardized_role_id); // Only include mappings with valid standardized role IDs

    // Insert into xlsmart_role_mappings instead
    const xlsmartMappings = mappingsWithStandardizedIds.map((mapping: any) => ({
      catalog_id: sessionId, // Use session as catalog
      original_role_title: mapping.original_role_title,
      original_department: mapping.original_source === 'xl' ? 
        (xlData?.find((r: any) => r.role_title === mapping.original_role_title)?.department || '') :
        (smartData?.find((r: any) => r.role_title === mapping.original_role_title)?.department || ''),
      original_level: mapping.original_source === 'xl' ? 
        (xlData?.find((r: any) => r.role_title === mapping.original_role_title)?.seniority_band || '') :
        (smartData?.find((r: any) => r.role_title === mapping.original_role_title)?.seniority_band || ''),
      standardized_role_title: mapping.standardized_role_title,
      standardized_department: standardizedRoles.find((r: any) => r.standardized_role_title === mapping.standardized_role_title)?.standardized_department || '',
      standardized_level: standardizedRoles.find((r: any) => r.standardized_role_title === mapping.standardized_role_title)?.standardized_seniority_band || '',
      job_family: standardizedRoles.find((r: any) => r.standardized_role_title === mapping.standardized_role_title)?.standardized_role_family || '',
      standard_role_id: mapping.standardized_role_id,
      mapping_confidence: mapping.mapping_confidence,
      mapping_status: mapping.mapping_confidence >= 80 ? 'auto_mapped' : 'manual_review',
      requires_manual_review: mapping.mapping_confidence < 80
    }));

    if (xlsmartMappings.length > 0) {
      const { error: mappingsError } = await supabase
        .from('xlsmart_role_mappings')
        .insert(xlsmartMappings);

      if (mappingsError) {
        console.error('Error inserting mappings:', mappingsError);
      }
    }

    // Update session status
    await supabase
      .from('xlsmart_upload_sessions')
      .update({
        status: 'completed',
        ai_analysis: {
          step: 'standardization_complete',
          standardized_roles_created: insertedRoles?.length || 0,
          mappings_created: xlsmartMappings.length,
          xl_count: xlData?.length || 0,
          smart_count: smartData?.length || 0
        }
      })
      .eq('id', sessionId);

    return new Response(JSON.stringify({
      success: true,
      standardizedRolesCreated: insertedRoles?.length || 0,
      mappingsCreated: xlsmartMappings.length,
      xlDataProcessed: xlData?.length || 0,
      smartDataProcessed: smartData?.length || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in standardize-uploaded-roles function:', error);
    
    // Update session with error
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const { sessionId } = await req.json().catch(() => ({}));
    if (sessionId) {
      await supabase
        .from('xlsmart_upload_sessions')
        .update({
          status: 'completed',
          error_message: error.message
        })
        .eq('id', sessionId);
    }

    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});