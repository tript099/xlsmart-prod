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

    const { sessionId, xlData, smartData } = await req.json();

    console.log('Starting role data upload:', {
      sessionId,
      xlDataCount: xlData?.length || 0,
      smartDataCount: smartData?.length || 0
    });

    let totalInserted = 0;

    // Insert XL data
    if (xlData && xlData.length > 0) {
      const xlRolesData = xlData.map((row: any) => ({
        session_id: sessionId,
        role_id: row['RoleID'] || null,
        department: row['Department'] || null,
        role_family: row['RoleFamily'] || null,
        role_title: row['RoleTitle'] || 'Unknown Role',
        seniority_band: row['SeniorityBand'] || null,
        role_purpose: row['RolePurpose'] || null,
        core_responsibilities: row['CoreResponsibilities'] || null,
        required_skills: row['RequiredSkills'] || null,
        preferred_skills: row['PreferredSkills'] || null,
        certifications: row['Certifications'] || null,
        tools_platforms: row['ToolsPlatforms'] || null,
        experience_min_years: row['ExperienceMinYears'] ? parseInt(row['ExperienceMinYears']) : null,
        education: row['Education'] || null,
        location: row['Location'] || null,
        role_variant: row['RoleVariant'] || null,
        alternate_titles: row['AlternateTitles'] || null
      }));

      const { error: xlError } = await supabase
        .from('xl_roles_data')
        .insert(xlRolesData);

      if (xlError) {
        console.error('Error inserting XL data:', xlError);
        throw new Error(`Failed to insert XL data: ${xlError.message}`);
      }

      totalInserted += xlRolesData.length;
      console.log('Successfully inserted XL roles:', xlRolesData.length);
    }

    // Insert SMART data
    if (smartData && smartData.length > 0) {
      const smartRolesData = smartData.map((row: any) => ({
        session_id: sessionId,
        role_id: row['RoleID'] || null,
        department: row['Department'] || null,
        role_family: row['RoleFamily'] || null,
        role_title: row['RoleTitle'] || 'Unknown Role',
        seniority_band: row['SeniorityBand'] || null,
        role_purpose: row['RolePurpose'] || null,
        core_responsibilities: row['CoreResponsibilities'] || null,
        required_skills: row['RequiredSkills'] || null,
        preferred_skills: row['PreferredSkills'] || null,
        certifications: row['Certifications'] || null,
        tools_platforms: row['ToolsPlatforms'] || null,
        experience_min_years: row['ExperienceMinYears'] ? parseInt(row['ExperienceMinYears']) : null,
        education: row['Education'] || null,
        location: row['Location'] || null,
        role_variant: row['RoleVariant'] || null,
        alternate_titles: row['AlternateTitles'] || null
      }));

      const { error: smartError } = await supabase
        .from('smart_roles_data')
        .insert(smartRolesData);

      if (smartError) {
        console.error('Error inserting SMART data:', smartError);
        throw new Error(`Failed to insert SMART data: ${smartError.message}`);
      }

      totalInserted += smartRolesData.length;
      console.log('Successfully inserted SMART roles:', smartRolesData.length);
    }

    // Update session status
    const { error: sessionError } = await supabase
      .from('xlsmart_upload_sessions')
      .update({
        status: 'uploaded',
        total_rows: totalInserted,
        ai_analysis: {
          step: 'upload_complete',
          xl_count: xlData?.length || 0,
          smart_count: smartData?.length || 0,
          total_uploaded: totalInserted
        }
      })
      .eq('id', sessionId);

    if (sessionError) {
      console.error('Error updating session:', sessionError);
    }

    return new Response(JSON.stringify({
      success: true,
      totalInserted,
      xlCount: xlData?.length || 0,
      smartCount: smartData?.length || 0,
      message: 'Role data uploaded successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in upload-role-data function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});