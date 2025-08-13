import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log('🚀 Function loaded successfully');

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

console.log('📋 Environment check:', {
  hasUrl: !!supabaseUrl,
  hasServiceKey: !!supabaseServiceKey,
  hasApiKey: !!Deno.env.get('OPENAI_API_KEY')
});

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  console.log('🚀 Request received:', req.method, new Date().toISOString());
  
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight handled');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📥 Parsing request body...');
    const requestBody = await req.json();
    console.log('📋 Request details:', {
      action: requestBody.action,
      hasData: !!requestBody.excelData || !!requestBody.sessionId
    });
    
    const { action, sessionName, excelData, sessionId } = requestBody;
    
    // Test endpoint
    if (action === 'test') {
      console.log('🧪 Test endpoint called');
      return new Response(JSON.stringify({
        success: true,
        message: 'Edge function is working with LiteLLM',
        timestamp: new Date().toISOString(),
        liteLLMEndpoint: 'https://proxyllm.ximplify.id',
        hasLiteLLMKey: !!Deno.env.get('OPENAI_API_KEY')
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (action === 'upload') {
      console.log('📤 Starting upload action');
      console.log('📊 Excel data received:', excelData?.length, 'files');

      // Create upload session without user authentication since JWT is disabled
      console.log('💾 Creating upload session...');
      const { data: session, error: sessionError } = await supabase
        .from('xlsmart_upload_sessions')
        .insert({
          session_name: sessionName,
          file_names: excelData.map((file: any) => file.fileName),
          temp_table_names: [], // Not using actual tables
          total_rows: excelData.reduce((sum: number, file: any) => sum + file.rows.length, 0),
          status: 'analyzing',
          ai_analysis: {
            raw_data: excelData // Store all Excel data as JSON
          }
        })
        .select()
        .single();

      if (sessionError) {
        console.error('❌ Session creation error:', sessionError);
        throw new Error(`Failed to create upload session: ${sessionError.message}`);
      }

      console.log('✅ Upload session created with ID:', session.id);

      return new Response(JSON.stringify({
        success: true,
        sessionId: session.id,
        totalRows: session.total_rows,
        message: `Successfully stored ${session.total_rows} rows from ${excelData.length} files`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'standardize') {
      console.log('🧠 Starting AI standardization action');
      console.log('📋 Session ID:', sessionId);

      // Get upload session data without authentication
      console.log('📤 Fetching upload session data...');
      const { data: session, error: sessionError } = await supabase
        .from('xlsmart_upload_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError || !session) {
        console.error('❌ Session fetch error:', sessionError);
        throw new Error('Upload session not found or access denied');
      }

      const rawData = session.ai_analysis?.raw_data;
      if (!rawData || !Array.isArray(rawData)) {
        throw new Error('No valid raw data found in upload session');
      }

      console.log('🤖 Calling LiteLLM for AI standardization...');
      
      // Create AI prompt for role standardization
      const prompt = `You are an AI expert in telecommunications role standardization. 

TASK: Analyze these two role catalogs and create standardized telecommunications roles with accurate mappings.

INPUT DATA:
${JSON.stringify(rawData, null, 2)}

INSTRUCTIONS:
1. Analyze the role structures and identify common patterns
2. Create 10-15 standardized telecommunications roles that cover the key functions
3. Map each original role to the most appropriate standardized role
4. Provide confidence scores (0-100) for each mapping
5. Focus on telecommunications industry standards

OUTPUT FORMAT (JSON only):
{
  "standardRoles": [
    {
      "title": "Network Operations Engineer",
      "department": "Network Operations", 
      "roleFamily": "Network Engineering",
      "seniorityBand": "IC3-IC5",
      "description": "Manages network infrastructure and ensures optimal performance"
    }
  ],
  "mappings": [
    {
      "originalRole": "RAN Performance Engineer",
      "standardRole": "Network Operations Engineer", 
      "confidence": 85,
      "reasoning": "Direct mapping for network performance optimization"
    }
  ]
}`;

      // Call LiteLLM
      const litellmResponse = await fetch('https://proxyllm.ximplify.id/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are an expert in telecommunications role standardization. Return only valid JSON.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.1,
          max_tokens: 4000
        }),
      });

      if (!litellmResponse.ok) {
        const errorText = await litellmResponse.text();
        console.error('❌ LiteLLM API error:', errorText);
        throw new Error(`LiteLLM API failed: ${litellmResponse.status} - ${errorText}`);
      }

      const aiResult = await litellmResponse.json();
      console.log('✅ LiteLLM response received');
      
      let parsedResult;
      try {
        parsedResult = JSON.parse(aiResult.choices[0].message.content);
      } catch (parseError) {
        console.error('❌ Failed to parse AI response:', parseError);
        throw new Error('Invalid JSON response from AI');
      }

      // Create standard roles and mappings in database
      console.log('💾 Saving standardized roles to database...');
      
      // Insert standard roles
      const { data: standardRoles, error: rolesError } = await supabase
        .from('xlsmart_standard_roles')
        .insert(
          parsedResult.standardRoles.map((role: any) => ({
            role_title: role.title,
            department: role.department,
            job_family: role.roleFamily,
            role_level: role.seniorityBand,
            role_category: role.department,
            standard_description: role.description
          }))
        )
        .select();

      if (rolesError) {
        console.error('❌ Error creating standard roles:', rolesError);
        throw new Error(`Failed to create standard roles: ${rolesError.message}`);
      }

      // Insert role mappings
      const { data: mappings, error: mappingsError } = await supabase
        .from('xlsmart_role_mappings')
        .insert(
          parsedResult.mappings.map((mapping: any) => ({
            original_role_title: mapping.originalRole,
            standardized_role_title: mapping.standardRole,
            mapping_confidence: mapping.confidence,
            catalog_id: session.id
          }))
        )
        .select();

      if (mappingsError) {
        console.error('❌ Error creating role mappings:', mappingsError);
        throw new Error(`Failed to create role mappings: ${mappingsError.message}`);
      }

      // Update session status
      await supabase
        .from('xlsmart_upload_sessions')
        .update({ 
          status: 'completed',
          ai_analysis: {
            ...session.ai_analysis,
            standardization_result: parsedResult
          }
        })
        .eq('id', sessionId);

      console.log('✅ AI standardization completed successfully');

      return new Response(JSON.stringify({
        success: true,
        standardRolesCreated: standardRoles?.length || 0,
        mappingsCreated: mappings?.length || 0,
        message: 'AI role standardization completed successfully'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      success: false,
      error: 'Invalid action specified' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Function error:', error);
    console.error('📍 Error stack:', error.stack);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});