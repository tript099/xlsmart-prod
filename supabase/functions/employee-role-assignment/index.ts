import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId } = await req.json();
    
    console.log(`Starting AI role assignment for session: ${sessionId}`);
    
    // Get the session details
    const { data: session, error: sessionError } = await supabase
      .from('xlsmart_upload_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError) throw sessionError;

    // Get employees that were uploaded by the same user around the session time
    // We'll use the session creator and a reasonable time window
    const sessionCreatedAt = new Date(session.created_at);
    const sessionStartTime = new Date(sessionCreatedAt.getTime() - (10 * 60 * 1000)); // 10 minutes before
    const sessionEndTime = new Date(sessionCreatedAt.getTime() + (60 * 60 * 1000)); // 1 hour after

    const { data: employees, error: employeesError } = await supabase
      .from('xlsmart_employees')
      .select('*')
      .gte('created_at', sessionStartTime.toISOString())
      .lte('created_at', sessionEndTime.toISOString())
      .eq('uploaded_by', session.created_by)
      .eq('role_assignment_status', 'pending'); // Only employees pending assignment

    if (employeesError) {
      console.error('Error fetching employees:', employeesError);
      throw employeesError;
    }

    if (!employees || employees.length === 0) {
      console.log(`No unassigned employees found for session ${sessionId}. Checking all employees by user...`);
      
      // Fallback: get all pending employees for this user
      const { data: allEmployees, error: allEmployeesError } = await supabase
        .from('xlsmart_employees')
        .select('*')
        .eq('uploaded_by', session.created_by)
        .eq('role_assignment_status', 'pending');

      if (allEmployeesError) throw allEmployeesError;
      
      if (!allEmployees || allEmployees.length === 0) {
        throw new Error('No unassigned employees found for this user');
      }
      
      employees = allEmployees;
    }

    // Get existing standard roles for AI matching
    const { data: standardRoles, error: rolesError } = await supabase
      .from('xlsmart_standard_roles')
      .select('*')
      .eq('is_active', true);

    if (rolesError) throw rolesError;

    if (!standardRoles || standardRoles.length === 0) {
      throw new Error('No standard roles available for assignment');
    }

    console.log(`Found ${employees.length} employees and ${standardRoles.length} standard roles`);

    // Update session status to indicate role assignment started
    await supabase
      .from('xlsmart_upload_sessions')
      .update({ status: 'assigning_roles' })
      .eq('id', sessionId);

    // Process employees in batches for role assignment
    const BATCH_SIZE = 10; // Smaller batches for AI processing
    let processedCount = 0;
    let assignedCount = 0;
    let errorCount = 0;

    // Background processing with EdgeRuntime.waitUntil
    const assignRoles = async () => {
      for (let i = 0; i < employees.length; i += BATCH_SIZE) {
        const batch = employees.slice(i, i + BATCH_SIZE);
        
        try {
          // Process each employee in the batch
          for (const employee of batch) {
            try {
              // Use AI to get role suggestion (don't auto-assign)
              const suggestedRoleId = await assignRoleWithAI(employee, standardRoles);
              
              if (suggestedRoleId) {
                // Store AI suggestion without auto-assigning
                const { error: updateError } = await supabase
                  .from('xlsmart_employees')
                  .update({ 
                    ai_suggested_role_id: suggestedRoleId,
                    role_assignment_status: 'ai_suggested'
                  })
                  .eq('id', employee.id);

                if (updateError) {
                  console.error('Error storing AI suggestion:', updateError);
                  errorCount++;
                } else {
                  assignedCount++; // Count as processed with suggestion
                }
              }
              
              processedCount++;

            } catch (employeeError) {
              console.error('Error processing employee for role assignment:', employeeError);
              errorCount++;
              processedCount++;
            }
          }

          // Update progress
          await supabase
            .from('xlsmart_upload_sessions')
            .update({
              ai_analysis: {
                processed: processedCount,
                assigned: assignedCount,
                errors: errorCount,
                total: employees.length
              }
            })
            .eq('id', sessionId);

          console.log(`Batch completed: ${processedCount}/${employees.length} processed`);

        } catch (batchError) {
          console.error('Error processing batch for role assignment:', batchError);
          errorCount += batch.length;
          processedCount += batch.length;
        }

        // Small delay between batches to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Mark session as role assignment completed
      await supabase
        .from('xlsmart_upload_sessions')
        .update({
          status: 'roles_assigned',
          ai_analysis: {
            processed: processedCount,
            assigned: assignedCount,
            errors: errorCount,
            total: employees.length,
            completion_time: new Date().toISOString()
          }
        })
        .eq('id', sessionId);

      console.log(`Role assignment completed: ${assignedCount} assigned, ${errorCount} errors`);
    };

    // Start background processing
    EdgeRuntime.waitUntil(assignRoles());

    return new Response(JSON.stringify({
      success: true,
      sessionId: sessionId,
      message: `Started AI role analysis for ${employees.length} employees. Please review suggestions in the assignment interface.`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in employee-role-assignment function:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function assignRoleWithAI(employee: any, standardRoles: any[]) {
  if (!openAIApiKey) {
    console.log('No OpenAI API key, skipping AI role assignment');
    return null;
  }

  try {
    const employeeSkills = Array.isArray(employee.skills) ? employee.skills.join(', ') : employee.skills || '';
    const employeeCerts = Array.isArray(employee.certifications) ? employee.certifications.join(', ') : employee.certifications || '';
    
    // Extract aspirations and location from skills if they were stored there
    let aspirations = '';
    let location = '';
    if (Array.isArray(employee.skills)) {
      const aspirationsSkill = employee.skills.find((s: string) => s.startsWith('Aspirations:'));
      const locationSkill = employee.skills.find((s: string) => s.startsWith('Location:'));
      if (aspirationsSkill) aspirations = aspirationsSkill.replace('Aspirations:', '').trim();
      if (locationSkill) location = locationSkill.replace('Location:', '').trim();
    }

    const prompt = `You are an expert HR system that assigns employees to the most appropriate standard roles. Analyze this employee profile and find the BEST MATCHING standard role from the available options.

Employee Profile:
- Employee ID: ${employee.employee_number}
- Name: ${employee.first_name} ${employee.last_name}
- Current Position: ${employee.current_position}
- Department: ${employee.current_department}
- Level: ${employee.current_level}
- Experience: ${employee.years_of_experience} years
- Skills: ${employeeSkills}
- Certifications: ${employeeCerts}
- Performance Rating: ${employee.performance_rating || 'N/A'}
- Aspirations: ${aspirations || 'N/A'}
- Location: ${location || 'N/A'}

Available Standard Roles (YOU MUST CHOOSE FROM THESE):
${standardRoles.map(role => `- ID: ${role.id}
  Title: ${role.role_title}
  Family: ${role.job_family}
  Level: ${role.role_level}
  Category: ${role.role_category}
  Department: ${role.department}
  Description: ${role.standard_description || 'N/A'}`).join('\n\n')}

ANALYSIS CRITERIA:
1. **Skills Match**: Compare employee skills with role requirements
2. **Experience Level**: Match years of experience with role level expectations
3. **Current Position**: Consider similarity to existing role title
4. **Department Alignment**: Prefer roles in same/similar departments
5. **Career Progression**: Consider employee aspirations and growth path

INSTRUCTIONS:
- You MUST select ONE of the provided standard role IDs
- Choose the role with the highest overall match score
- Consider both current fit and growth potential
- Return ONLY the UUID of the selected role
- If truly no role fits (very rare), return "NO_MATCH"

Return only the UUID:`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert HR system that assigns employees to the most appropriate standard roles. You must analyze employee profiles and match them to existing standard roles based on skills, experience, and career fit. Always return only a valid role UUID from the provided list.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 100
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const assignedRoleId = data.choices[0].message.content.trim();
    
    if (assignedRoleId !== "NO_MATCH" && assignedRoleId.length === 36) { // UUID format check
      // Verify the role ID exists in our standard roles
      const roleExists = standardRoles.find(role => role.id === assignedRoleId);
      if (roleExists) {
        console.log(`Assigned role "${roleExists.role_title}" (${assignedRoleId}) to employee ${employee.first_name} ${employee.last_name}`);
        return assignedRoleId;
      } else {
        console.log(`Invalid role ID returned: ${assignedRoleId}`);
        return null;
      }
    }
    
    console.log(`No suitable role found for employee ${employee.first_name} ${employee.last_name}`);
    return null;
  } catch (error) {
    console.error('Error in AI role assignment:', error);
    return null;
  }
}