import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const liteLLMApiKey = Deno.env.get('LITELLM_API_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { employeeIds, assignImmediately = true } = await req.json();

    console.log(`Starting AI role assignment for ${employeeIds?.length || 0} employees`);

    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      throw new Error('Employee IDs array is required');
    }

    if (!liteLLMApiKey) {
      throw new Error('LITELLM_API_KEY not configured');
    }

    // Get employees
    const { data: employees, error: employeesError } = await supabase
      .from('xlsmart_employees')
      .select('*')
      .in('id', employeeIds)
      .is('standard_role_id', null);

    if (employeesError) {
      throw new Error(`Failed to fetch employees: ${employeesError.message}`);
    }

    if (!employees || employees.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No unassigned employees found',
        processed: 0,
        assigned: 0,
        errors: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get standard roles
    const { data: standardRoles, error: rolesError } = await supabase
      .from('xlsmart_standard_roles')
      .select('*')
      .eq('is_active', true);

    if (rolesError) {
      throw new Error(`Failed to fetch standard roles: ${rolesError.message}`);
    }

    if (!standardRoles || standardRoles.length === 0) {
      throw new Error('No standard roles available');
    }

    console.log(`Processing ${employees.length} employees with ${standardRoles.length} standard roles`);

    let assigned = 0;
    let errors = 0;
    const errorDetails: string[] = [];

    // Process each employee
    for (const employee of employees) {
      try {
        console.log(`Processing employee: ${employee.first_name} ${employee.last_name}`);
        
        const suggestedRoleId = await assignRoleWithAI(employee, standardRoles, liteLLMApiKey);
        
        if (suggestedRoleId && assignImmediately) {
          const { error: updateError } = await supabase
            .from('xlsmart_employees')
            .update({
              standard_role_id: suggestedRoleId,
              ai_suggested_role_id: suggestedRoleId,
              role_assignment_status: 'assigned',
              assigned_by: employee.uploaded_by,
              assignment_notes: 'Assigned by AI'
            })
            .eq('id', employee.id);

          if (updateError) {
            console.error(`Error assigning role to employee ${employee.id}:`, updateError);
            errors++;
            errorDetails.push(`${employee.first_name} ${employee.last_name}: ${updateError.message}`);
          } else {
            assigned++;
            console.log(`Successfully assigned role to ${employee.first_name} ${employee.last_name}`);
          }
        } else if (!suggestedRoleId) {
          // Update status to indicate AI couldn't find a match
          await supabase
            .from('xlsmart_employees')
            .update({
              role_assignment_status: 'ai_no_match',
              assignment_notes: 'AI could not find suitable role match'
            })
            .eq('id', employee.id);
          
          console.log(`No suitable role found for ${employee.first_name} ${employee.last_name}`);
        }
      } catch (error) {
        console.error(`Error processing employee ${employee.id}:`, error);
        errors++;
        errorDetails.push(`${employee.first_name} ${employee.last_name}: ${error.message}`);
      }
    }

    console.log(`AI assignment completed: ${assigned} assigned, ${errors} errors`);

    return new Response(JSON.stringify({
      success: true,
      processed: employees.length,
      assigned,
      errors,
      message: `Processed ${employees.length} employees: ${assigned} assigned, ${errors} errors`,
      errorDetails: errorDetails.slice(0, 5) // Limit error details
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in AI employee assignment:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function assignRoleWithAI(employee: any, standardRoles: any[], apiKey: string) {
  try {
    const employeeSkills = Array.isArray(employee.skills) ? employee.skills.join(', ') : employee.skills || '';
    const employeeCerts = Array.isArray(employee.certifications) ? employee.certifications.join(', ') : employee.certifications || '';
    
    const prompt = `You are an expert HR system that assigns employees to the most appropriate standard roles. Analyze this employee profile and find the BEST MATCHING standard role from the available options.

Employee Profile:
- Name: ${employee.first_name} ${employee.last_name}
- Current Position: ${employee.current_position}
- Department: ${employee.current_department || 'N/A'}
- Level: ${employee.current_level || 'N/A'}
- Experience: ${employee.years_of_experience || 0} years
- Skills: ${employeeSkills}
- Certifications: ${employeeCerts}

Available Standard Roles (YOU MUST CHOOSE FROM THESE):
${standardRoles.map(role => `- ID: ${role.id}
  Title: ${role.role_title}
  Family: ${role.job_family}
  Level: ${role.role_level}
  Category: ${role.role_category}
  Department: ${role.department}`).join('\n\n')}

INSTRUCTIONS:
- You MUST select ONE of the provided standard role IDs
- Choose the role with the highest overall match score
- Consider skills, experience, and current position
- Return ONLY the UUID of the selected role
- If truly no role fits, return "NO_MATCH"

Return only the UUID:`;

    const response = await fetch('https://api.litellm.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert HR system that assigns employees to standard roles. Always return only a valid role UUID from the provided list.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 100
      }),
    });

    if (!response.ok) {
      throw new Error(`LiteLLM API error: ${response.statusText}`);
    }

    const data = await response.json();
    const assignedRoleId = data.choices[0].message.content.trim();
    
    if (assignedRoleId !== "NO_MATCH" && assignedRoleId.length === 36) {
      // Verify the role ID exists
      const roleExists = standardRoles.find(role => role.id === assignedRoleId);
      if (roleExists) {
        console.log(`AI selected role "${roleExists.role_title}" for employee ${employee.first_name} ${employee.last_name}`);
        return assignedRoleId;
      }
    }
    
    console.log(`AI found no suitable role for employee ${employee.first_name} ${employee.last_name}`);
    return null;
  } catch (error) {
    console.error('Error in AI role assignment:', error);
    return null;
  }
}