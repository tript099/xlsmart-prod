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

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const litellmApiKey = Deno.env.get('LITELLM_API_KEY');
    if (!litellmApiKey) {
      throw new Error('LITELLM_API_KEY not configured');
    }

    console.log('Starting bulk role assignment...');

    // Get all employees without assigned roles
    const { data: employees, error: employeesError } = await supabaseClient
      .from('xlsmart_employees')
      .select('*')
      .is('standard_role_id', null)
      .eq('is_active', true);

    if (employeesError) {
      throw new Error(`Failed to fetch employees: ${employeesError.message}`);
    }

    // Get all active standard roles
    const { data: standardRoles, error: rolesError } = await supabaseClient
      .from('xlsmart_standard_roles')
      .select('*')
      .eq('is_active', true);

    if (rolesError) {
      throw new Error(`Failed to fetch standard roles: ${rolesError.message}`);
    }

    console.log(`Found ${employees?.length || 0} employees without roles and ${standardRoles?.length || 0} standard roles`);

    if (!employees?.length) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No employees need role assignment',
        assigned: 0,
        failed: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let assignedCount = 0;
    let failedCount = 0;

    // Process employees in batches
    for (let i = 0; i < employees.length; i++) {
      const employee = employees[i];
      
      try {
        console.log(`Processing employee ${i + 1}/${employees.length}: ${employee.first_name} ${employee.last_name}`);
        
        const assignedRoleId = await assignRoleWithAI(employee, standardRoles, litellmApiKey);
        
        if (assignedRoleId) {
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
            console.log(`Successfully assigned role to ${employee.first_name} ${employee.last_name}`);
          }
        } else {
          // Mark as no match found
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

        // Small delay to avoid rate limiting
        if (i < employees.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

      } catch (error) {
        console.error(`Error processing employee ${employee.id}:`, error);
        failedCount++;
      }
    }

    console.log(`Bulk assignment completed: ${assignedCount} assigned, ${failedCount} failed`);

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
    console.error('Error in bulk-assign-roles function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function assignRoleWithAI(employee: any, standardRoles: any[], apiKey: string): Promise<string | null> {
  try {
    const rolesContext = standardRoles.map(role => 
      `- ${role.role_title} (${role.department}, ${role.role_level}): ${role.standard_description || 'No description'}`
    ).join('\n');

    const prompt = `You are an HR expert tasked with assigning the most appropriate standard role to an employee based on their profile.

Employee Profile:
- Name: ${employee.first_name} ${employee.last_name}
- Current Position: ${employee.current_position}
- Department: ${employee.current_department || 'Not specified'}
- Level: ${employee.current_level || 'Not specified'}
- Experience: ${employee.years_of_experience || 'Not specified'} years
- Skills: ${JSON.stringify(employee.skills) || 'Not specified'}
- Original Role: ${employee.original_role_title || 'Not specified'}

Available Standard Roles:
${rolesContext}

Instructions:
1. Analyze the employee's current position, department, skills, and experience
2. Find the best matching standard role from the list above
3. Consider role title similarity, department alignment, and experience level
4. If no good match exists (confidence < 70%), respond with "NO_MATCH"
5. Otherwise, respond with only the role ID (UUID format)

Your response must be either:
- A UUID of the matching role (e.g., "123e4567-e89b-12d3-a456-426614174000")
- "NO_MATCH" if no suitable role found

Response:`;

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

    if (!response.ok) {
      console.error(`AI API request failed: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content?.trim();

    if (!aiResponse) {
      console.error('Empty response from AI');
      return null;
    }

    if (aiResponse === 'NO_MATCH') {
      console.log(`No suitable role found for ${employee.first_name} ${employee.last_name}`);
      return null;
    }

    // Validate that the response is a valid UUID and exists in standard roles
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(aiResponse)) {
      console.error(`Invalid UUID format in AI response: ${aiResponse}`);
      return null;
    }

    const roleExists = standardRoles.some(role => role.id === aiResponse);
    if (!roleExists) {
      console.error(`AI returned non-existent role ID: ${aiResponse}`);
      return null;
    }

    return aiResponse;

  } catch (error) {
    console.error('Error in assignRoleWithAI:', error);
    return null;
  }
}