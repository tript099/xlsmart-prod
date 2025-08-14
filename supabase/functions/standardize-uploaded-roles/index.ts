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
    console.log('=== STANDARDIZATION FUNCTION STARTED ===');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const litellmApiKey = Deno.env.get('LITELLM_API_KEY');
    if (!litellmApiKey) {
      throw new Error('LiteLLM API key not configured');
    }

    const { sessionId } = await req.json();

    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    console.log('Starting role standardization for session:', sessionId);

    // Update session status to 'standardizing'
    await supabase
      .from('xlsmart_upload_sessions')
      .update({ 
        status: 'standardizing',
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    // Fetch data from xl_roles_data and smart_roles_data
    const { data: xlData, error: xlError } = await supabase
      .from('xl_roles_data')
      .select('*')
      .eq('session_id', sessionId);

    if (xlError) {
      console.error('Error fetching XL data:', xlError);
      throw new Error(`Failed to fetch XL data: ${xlError.message}`);
    }

    const { data: smartData, error: smartError } = await supabase
      .from('smart_roles_data')
      .select('*')
      .eq('session_id', sessionId);

    if (smartError) {
      console.error('Error fetching SMART data:', smartError);
      throw new Error(`Failed to fetch SMART data: ${smartError.message}`);
    }

    console.log('Data fetched:', {
      xlCount: xlData?.length || 0,
      smartCount: smartData?.length || 0
    });

    // Simple success response for now to test basic functionality
    await supabase
      .from('xlsmart_upload_sessions')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    console.log('=== STANDARDIZATION COMPLETED SUCCESSFULLY ===');

    return new Response(JSON.stringify({
      success: true,
      standardizedRolesCreated: 0,
      mappingsCreated: 0,
      message: 'Basic functionality working - AI processing temporarily disabled for testing'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('=== ERROR IN STANDARDIZATION ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      message: 'Standardization failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});