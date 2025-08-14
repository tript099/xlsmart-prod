import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('=== BULK ASSIGN ROLES FUNCTION STARTED ===');

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if LiteLLM API key exists
    const litellmApiKey = Deno.env.get('LITELLM_API_KEY');
    console.log('LiteLLM API Key available:', !!litellmApiKey);
    
    if (!litellmApiKey) {
      console.error('LITELLM_API_KEY not configured');
      return new Response(JSON.stringify({
        success: false,
        error: 'LITELLM_API_KEY not configured',
        assigned: 0,
        failed: 0,
        total: 0
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Fetching employees without assigned roles...');

    // Get all employees without assigned roles
    const { data: employees, error: employeesError } = await supabaseClient
      .from('xlsmart_employees')
      .select('*')
      .is('standard_role_id', null)
      .eq('is_active', true);

    if (employeesError) {
      console.error('Failed to fetch employees:', employeesError);
      throw new Error(`Failed to fetch employees: ${employeesError.message}`);
    }

    console.log(`Found ${employees?.length || 0} employees without roles`);

    // Get all active standard roles
    const { data: standardRoles, error: rolesError } = await supabaseClient
      .from('xlsmart_standard_roles')
      .select('*')
      .eq('is_active', true);

    if (rolesError) {
      console.error('Failed to fetch standard roles:', rolesError);
      throw new Error(`Failed to fetch standard roles: ${rolesError.message}`);
    }

    console.log(`Found ${standardRoles?.length || 0} standard roles`);

    if (!employees?.length) {
      console.log('No employees need role assignment');
      return new Response(JSON.stringify({
        success: true,
        message: 'No employees need role assignment',
        assigned: 0,
        failed: 0,
        total: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!standardRoles?.length) {
      console.error('No standard roles available');
      return new Response(JSON.stringify({
        success: false,
        error: 'No standard roles available',
        assigned: 0,
        failed: employees.length,
        total: employees.length
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let assignedCount = 0;
    let failedCount = 0;

    console.log('Starting role assignment process...');

    // Process employees one by one with detailed logging
    for (let i = 0; i < employees.length; i++) {
      const employee = employees[i];
      console.log(`\n--- Processing employee ${i + 1}/${employees.length} ---`);
      console.log(`Employee: ${employee.first_name} ${employee.last_name}`);
      console.log(`Position: ${employee.current_position}`);
      console.log(`Department: ${employee.current_department || 'N/A'}`);
      console.log(`Level: ${employee.current_level || 'N/A'}`);
      
      try {
        const assignedRoleId = await assignRoleWithAI(employee, standardRoles, litellmApiKey);
        
        if (assignedRoleId) {
          console.log(`AI suggested role ID: ${assignedRoleId}`);
          
          // Update employee with assigned role
          const { error: updateError } = await supabaseClient
            .from('xlsmart_employees')
            .update({
              standard_role_id: assignedRoleId,
              role_assignment_status: 'ai_suggested',
              assignment_notes: 'AI bulk assignment'
            })
            .eq('id', employee.id);

          if (updateError) {
            console.error(`Failed to update employee ${employee.id}:`, updateError);
            failedCount++;
          } else {
            assignedCount++;
            console.log(`✅ Successfully assigned role to ${employee.first_name} ${employee.last_name}`);
          }
        } else {
          console.log(`❌ AI could not find suitable role for ${employee.first_name} ${employee.last_name}`);
          
          // Mark as pending (no suitable match)
          const { error: updateError } = await supabaseClient
            .from('xlsmart_employees')
            .update({
              role_assignment_status: 'pending',
              assignment_notes: 'AI could not find suitable role match'
            })
            .eq('id', employee.id);

          if (updateError) {
            console.error(`Failed to update employee ${employee.id} status:`, updateError);
          }
          failedCount++;
        }

        // Small delay to avoid overwhelming the AI API
        if (i < employees.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }

      } catch (error) {
        console.error(`Error processing employee ${employee.id}:`, error);
        failedCount++;
      }
    }

    console.log(`\n=== BULK ASSIGNMENT COMPLETED ===`);
    console.log(`Total employees: ${employees.length}`);
    console.log(`Successfully assigned: ${assignedCount}`);
    console.log(`Failed assignments: ${failedCount}`);

    return new Response(JSON.stringify({
      success: true,
      message: `Bulk role assignment completed`,
      assigned: assignedCount,
      failed: failedCount,
      total: employees.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('=== BULK ASSIGN ROLES ERROR ===');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unknown error occurred',
      assigned: 0,
      failed: 0,
      total: 0
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function assignRoleWithAI(employee: any, standardRoles: any[], apiKey: string): Promise<string | null> {
  console.log(`🤖 Starting AI role assignment for ${employee.first_name} ${employee.last_name}`);
  
  try {
    // Build a cleaner context of available roles
    const rolesContext = standardRoles.map(role => 
      `ID: ${role.id} | Title: ${role.role_title} | Dept: ${role.department} | Level: ${role.role_level}`
    ).join('\n');

    console.log(`Available roles count: ${standardRoles.length}`);

    const prompt = `You are an HR expert. Assign the most appropriate standard role to this employee.

EMPLOYEE PROFILE:
- Name: ${employee.first_name} ${employee.last_name}
- Current Position: ${employee.current_position}
- Department: ${employee.current_department || 'Not specified'}
- Level: ${employee.current_level || 'Not specified'}
- Experience: ${employee.years_of_experience || 'Not specified'} years
- Skills: ${Array.isArray(employee.skills) ? employee.skills.join(', ') : 'Not specified'}

AVAILABLE STANDARD ROLES:
${rolesContext}

INSTRUCTIONS:
1. Find the best matching role based on job title similarity and department
2. If you find a good match, respond with ONLY the role ID (UUID format)
3. If no good match exists, respond with "NO_MATCH"

Your response must be either a UUID or "NO_MATCH". Nothing else.

Response:`;

    console.log('Calling AI API...');
    
    const response = await fetch('https://proxyllm.ximplify.id/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 100,
        temperature: 0.1,
      }),
    });

    console.log(`AI API response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI API request failed: ${response.status} ${response.statusText}`);
      console.error('Error response:', errorText);
      return null;
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content?.trim();

    console.log(`AI raw response: "${aiResponse}"`);

    if (!aiResponse) {
      console.error('Empty response from AI');
      return null;
    }

    if (aiResponse === 'NO_MATCH') {
      console.log(`AI determined no suitable role for ${employee.first_name} ${employee.last_name}`);
      return null;
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(aiResponse)) {
      console.error(`Invalid UUID format in AI response: "${aiResponse}"`);
      return null;
    }

    // Validate role exists
    const matchedRole = standardRoles.find(role => role.id === aiResponse);
    if (!matchedRole) {
      console.error(`AI returned non-existent role ID: ${aiResponse}`);
      return null;
    }

    console.log(`✅ AI matched role: ${matchedRole.role_title} (${matchedRole.department})`);
    return aiResponse;

  } catch (error) {
    console.error(`Error in AI role assignment for ${employee.first_name} ${employee.last_name}:`, error);
    return null;
  }
}