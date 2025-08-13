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

      // Get current user ID from authorization header  
      const authHeader = req.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Authorization header missing or invalid');
      }
      
      const token = authHeader.replace('Bearer ', '');
      console.log('🔑 Authenticating user...');
      
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      
      if (userError || !user) {
        console.error('❌ Auth error:', userError);
        throw new Error(`Authentication failed: ${userError?.message || 'User not found'}`);
      }

      console.log('✅ User authenticated:', user.id);

      // Create upload session with JSON storage
      console.log('💾 Creating upload session...');
      const { data: session, error: sessionError } = await supabase
        .from('xlsmart_upload_sessions')
        .insert({
          session_name: sessionName,
          file_names: excelData.map((file: any) => file.fileName),
          temp_table_names: [], // Not using actual tables
          total_rows: excelData.reduce((sum: number, file: any) => sum + file.rows.length, 0),
          status: 'analyzing',
          created_by: user.id,
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