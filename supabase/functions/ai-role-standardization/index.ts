import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId } = await req.json();
    
    console.log('Starting AI role standardization for session:', sessionId);

    // Get upload session details
    const { data: session, error: sessionError } = await supabase
      .from('xlsmart_upload_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      throw new Error('Upload session not found');
    }

    const liteLLMApiKey = Deno.env.get('LITELLM_API_KEY');
    if (!liteLLMApiKey) {
      throw new Error('LiteLLM API key not configured');
    }

    // Update session status
    await supabase
      .from('xlsmart_upload_sessions')
      .update({ status: 'standardizing' })
      .eq('id', sessionId);

    const standardRoles: any[] = [];
    const roleMappings: any[] = [];

    console.log('Starting AI role standardization for session:', sessionId);

    // Fetch data from xl_roles_data and smart_roles_data tables
    const { data: xlData, error: xlError } = await supabase
      .from('xl_roles_data')
      .select('*')
      .eq('session_id', sessionId)
      .limit(10);

    const { data: smartData, error: smartError } = await supabase
      .from('smart_roles_data')
      .select('*')
      .eq('session_id', sessionId)
      .limit(10);

    if (xlError && smartError) {
      console.error('Error fetching role data:', { xlError, smartError });
      throw new Error('Failed to fetch role data from both sources');
    }

    const sampleData = [...(xlData || []), ...(smartData || [])];
    if (sampleData.length === 0) {
      console.log('No role data found for session:', sessionId);
      throw new Error('No role data found for this session');
    }

    // Get existing standard roles from database for AI comparison
    const { data: existingRoles, error: rolesError } = await supabase
      .from('xlsmart_standard_roles')
      .select('id, role_title, department, job_family, role_level, standard_description')
      .eq('is_active', true);

    if (rolesError) {
      console.error('Error fetching existing roles:', rolesError);
    }

    console.log('Sample role data:', sampleData.slice(0, 3));
    console.log('Existing standard roles:', existingRoles?.length || 0);

    // Use AI to analyze uploaded roles and normalize against existing standards
    const aiPrompt = `
You are an expert HR data analyst. Analyze the uploaded role data and normalize it against existing standard roles.

UPLOADED ROLE DATA (sample):
${JSON.stringify(sampleData.slice(0, 5), null, 2)}

EXISTING STANDARD ROLES IN DATABASE:
${JSON.stringify(existingRoles?.slice(0, 10) || [], null, 2)}

Your tasks:
1. **NORMALIZE AGAINST EXISTING**: First check if uploaded roles can be mapped to existing standard roles
2. **CREATE NEW STANDARDS**: Only create new standard roles if uploaded roles don't match existing ones
3. **PROPER MAPPING**: Map each uploaded role to the best matching standard role (existing or new)

IMPORTANT RULES:
- If an uploaded role matches an existing standard role (similar title, department, skills), map to the existing one
- Only create new standard roles when uploaded roles are genuinely different
- Use consistent naming and categorization
- Focus on telecommunications industry standards

Respond with JSON:
{
  "analysis": "Brief analysis of the uploaded roles vs existing standards",
  "existingMatches": [
    {
      "uploaded_role_title": "Original Role Title",
      "standard_role_id": "existing_role_uuid",
      "confidence": 0.85,
      "reasoning": "Why this mapping makes sense"
    }
  ],
  "newStandardRoles": [
    {
      "role_title": "New Standardized Role Name",
      "job_family": "Engineering/Operations/Sales/etc",
      "role_level": "Junior/Mid/Senior/Lead/Manager",
      "department": "Department Name",
      "standard_description": "Clear role description",
      "core_responsibilities": ["responsibility1", "responsibility2"],
      "required_skills": ["skill1", "skill2"],
      "keywords": ["keyword1", "keyword2"]
    }
  ],
  "mappingInstructions": "How to map uploaded roles to standards (both existing and new)"
}
`;

    const aiResponse = await fetch('https://proxyllm.ximplify.id/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${liteLLMApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'azure/gpt-4.1',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert HR data analyst specializing in telecommunications role standardization. Analyze role data carefully and normalize against existing standards. Always respond with valid JSON.' 
          },
          { role: 'user', content: aiPrompt }
        ],
        max_tokens: 4000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('LiteLLM API error:', errorText);
      throw new Error(`LiteLLM API error: ${aiResponse.statusText} - ${errorText}`);
    }

    const aiData = await aiResponse.json();
    let analysis;
    
    try {
      analysis = JSON.parse(aiData.choices[0].message.content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiData.choices[0].message.content);
      throw new Error('Failed to parse AI response as JSON');
    }

    console.log('AI Analysis:', analysis);

    // Create NEW standard roles only (existing ones are already in database)
    for (const standardRole of analysis.newStandardRoles || []) {
      const { data: createdRole, error: roleError } = await supabase
        .from('xlsmart_standard_roles')
        .insert({
          role_title: standardRole.role_title,
          job_family: standardRole.job_family,
          role_level: standardRole.role_level,
          role_category: 'Technical',
          department: standardRole.department,
          standard_description: standardRole.standard_description,
          core_responsibilities: standardRole.core_responsibilities || [],
          required_skills: standardRole.required_skills || [],
          keywords: standardRole.keywords || [],
          created_by: session.created_by,
          industry_alignment: 'Telecommunications'
        })
        .select()
        .single();

      if (roleError) {
        console.error('Error creating standard role:', roleError);
        continue;
      }

      standardRoles.push(createdRole);
    }

    // Create a role catalog entry
    const { data: catalogData, error: catalogError } = await supabase
      .from('xlsmart_role_catalogs')
      .insert({
        source_company: 'AI Standardized Upload',
        file_name: 'AI Analysis',
        file_format: 'json',
        upload_status: 'processing',
        total_roles: sampleData.length,
        uploaded_by: session.created_by
      })
      .select()
      .single();

    if (catalogError) {
      console.error('Error creating catalog:', catalogError);
      throw new Error('Failed to create role catalog');
    }

    // Get all uploaded role data for this session
    const { data: allXlData } = await supabase
      .from('xl_roles_data')
      .select('*')
      .eq('session_id', sessionId);

    const { data: allSmartData } = await supabase
      .from('smart_roles_data')
      .select('*')
      .eq('session_id', sessionId);

    const allUploadedRoles = [...(allXlData || []), ...(allSmartData || [])];

    // Create mappings using AI analysis
    for (const uploadedRole of allUploadedRoles) {
      if (!uploadedRole.role_title) continue;

      let bestMatch = null;
      let confidence = 0;

      // First check if AI found an existing match
      const existingMatch = analysis.existingMatches?.find(
        (match: any) => match.uploaded_role_title.toLowerCase() === uploadedRole.role_title.toLowerCase()
      );

      if (existingMatch) {
        // Use existing standard role
        const existingRole = existingRoles?.find(role => role.id === existingMatch.standard_role_id);
        if (existingRole) {
          bestMatch = existingRole;
          confidence = existingMatch.confidence || 0.8;
        }
      } else {
        // Map to newly created standard role
        bestMatch = standardRoles.find(sr => 
          sr.role_title.toLowerCase().includes(uploadedRole.role_title.toLowerCase()) ||
          uploadedRole.role_title.toLowerCase().includes(sr.role_title.toLowerCase())
        );
        confidence = 0.75;
      }

      if (bestMatch) {
        roleMappings.push({
          original_role_title: uploadedRole.role_title,
          original_department: uploadedRole.department,
          original_level: uploadedRole.seniority_band,
          standardized_role_title: bestMatch.role_title,
          standardized_department: bestMatch.department,
          standardized_level: bestMatch.role_level,
          job_family: bestMatch.job_family,
          standard_role_id: bestMatch.id,
          mapping_confidence: confidence * 100,
          mapping_status: 'ai_mapped',
          requires_manual_review: confidence < 0.8,
          catalog_id: catalogData.id
        });
      }
    }

    // Insert role mappings
    if (roleMappings.length > 0) {
      const { error: mappingsError } = await supabase
        .from('xlsmart_role_mappings')
        .insert(roleMappings);

      if (mappingsError) {
        console.error('Error inserting role mappings:', mappingsError);
        throw new Error('Failed to insert role mappings');
      }
    }

    // Update session with completion
    await supabase
      .from('xlsmart_upload_sessions')
      .update({ 
        status: 'completed',
        ai_analysis: {
          standardRolesCreated: standardRoles.length,
          roleMappingsCreated: roleMappings.length
        }
      })
      .eq('id', sessionId);

    console.log('AI standardization complete');

    return new Response(JSON.stringify({
      success: true,
      standardRolesCreated: standardRoles.length,
      roleMappingsCreated: roleMappings.length,
      message: 'AI role standardization completed successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in AI role standardization:', error);
    
    // Update session with error
    try {
      await supabase
        .from('xlsmart_upload_sessions')
        .update({ 
          status: 'failed',
          error_message: error.message 
        })
        .eq('id', sessionId);
    } catch (updateError) {
      console.error('Failed to update session with error:', updateError);
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