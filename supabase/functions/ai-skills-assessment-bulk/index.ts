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

const litellmApiKey = Deno.env.get('LITELLM_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { assessmentType, identifier, targetRoleId, employees: providedEmployees } = await req.json();
    
    console.log(`Starting bulk skills assessment: ${assessmentType} - ${identifier}`);
    
    let employees;
    
    // Check if employees array is provided directly
    if (providedEmployees && Array.isArray(providedEmployees)) {
      employees = providedEmployees;
    } else {
      // Get employees based on assessment type
      let employeesQuery = supabase
        .from('xlsmart_employees')
        .select('*')
        .eq('is_active', true);

      switch (assessmentType) {
        case 'company':
          employeesQuery = employeesQuery.eq('source_company', identifier);
          break;
        case 'department':
          employeesQuery = employeesQuery.eq('current_department', identifier);
          break;
        case 'role':
          employeesQuery = employeesQuery.eq('current_position', identifier);
          break;
        case 'all':
          // No additional filter needed for 'all'
          break;
        default:
          throw new Error('Invalid assessment type');
      }

      const { data: employeesData, error: employeesError } = await employeesQuery;
      if (employeesError) throw employeesError;
      employees = employeesData;
    }

    if (!employees || employees.length === 0) {
      throw new Error(`No employees found for ${assessmentType}: ${identifier}`);
    }

    // Create assessment session
    const { data: session, error: sessionError } = await supabase
      .from('xlsmart_upload_sessions')
      .insert({
        session_name: `Bulk Skills Assessment - ${assessmentType.toUpperCase()}: ${identifier}`,
        file_names: [`bulk_assessment_${assessmentType}`],
        temp_table_names: [],
        total_rows: employees.length,
        status: 'processing',
        created_by: '00000000-0000-0000-0000-000000000000' // System user
      })
      .select()
      .single();

    if (sessionError) throw sessionError;

    // Get target role if specified
    let targetRole = null;
    if (targetRoleId) {
      const { data: role } = await supabase
        .from('xlsmart_job_descriptions')
        .select('*')
        .eq('id', targetRoleId)
        .single();
      targetRole = role;
    }

    // Background processing with EdgeRuntime.waitUntil
    const processAssessments = async () => {
      const BATCH_SIZE = 20; // Process 20 employees at a time
      let processedCount = 0;
      let completedCount = 0;
      let errorCount = 0;

      try {
        for (let i = 0; i < employees.length; i += BATCH_SIZE) {
          const batch = employees.slice(i, i + BATCH_SIZE);
          
          // Process batch in parallel but with controlled concurrency
          const batchPromises = batch.map(async (employee) => {
            try {
              const assessment = await runEmployeeAssessment(employee, targetRole);
              
              // Store assessment result
              const { error: insertError } = await supabase
                .from('xlsmart_skill_assessments')
                .insert({
                  employee_id: employee.id,
                  job_description_id: targetRoleId,
                  overall_match_percentage: assessment.overallMatch || 0,
                  skill_gaps: assessment.skillGaps || [],
                  recommendations: assessment.recommendations || 'No recommendations available',
                  next_role_recommendations: assessment.nextRoles || [],
                  ai_analysis: `Bulk assessment via ${assessmentType}`,
                  assessed_by: session.created_by
                });

              if (insertError) {
                console.error(`Database insert error for employee ${employee.id}:`, insertError);
                throw insertError;
              }

              completedCount++;
              return { success: true, employee: employee.id };
            } catch (error) {
              console.error(`Error assessing employee ${employee.id}:`, error);
              errorCount++;
              return { success: false, employee: employee.id, error: error.message };
            }
          });

          await Promise.all(batchPromises);
          processedCount += batch.length;

          // Update progress
          await supabase
            .from('xlsmart_upload_sessions')
            .update({
              ai_analysis: {
                processed: processedCount,
                completed: completedCount,
                errors: errorCount,
                total: employees.length,
                assessmentType,
                identifier
              }
            })
            .eq('id', session.id);

          // Small delay between batches to prevent overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Mark session as completed
        await supabase
          .from('xlsmart_upload_sessions')
          .update({
            status: 'completed',
            ai_analysis: {
              processed: processedCount,
              completed: completedCount,
              errors: errorCount,
              total: employees.length,
              assessmentType,
              identifier,
              completion_time: new Date().toISOString()
            }
          })
          .eq('id', session.id);

        console.log(`Bulk assessment completed: ${completedCount} assessments, ${errorCount} errors`);

      } catch (error) {
        console.error('Error in bulk assessment processing:', error);
        await supabase
          .from('xlsmart_upload_sessions')
          .update({
            status: 'error',
            error_message: error.message
          })
          .eq('id', session.id);
      }
    };

    // Start background processing
    EdgeRuntime.waitUntil(processAssessments());

    return new Response(JSON.stringify({
      success: true,
      sessionId: session.id,
      message: `Started bulk assessment for ${employees.length} employees`,
      estimatedDuration: `${Math.ceil(employees.length / 20)} minutes`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-skills-assessment-bulk function:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function runEmployeeAssessment(employee: any, targetRole: any) {
  if (!litellmApiKey) {
    return {
      overallMatch: 50,
      skillGaps: [],
      recommendations: 'AI assessment unavailable - no LiteLLM API key configured',
      nextRoles: []
    };
  }

  try {
    const employeeProfile = `
Employee: ${employee.first_name} ${employee.last_name}
Current Position: ${employee.current_position}
Department: ${employee.current_department || 'Not specified'}
Experience: ${employee.years_of_experience || 0} years
Skills: ${Array.isArray(employee.skills) ? employee.skills.join(', ') : employee.skills || 'Not specified'}
Certifications: ${Array.isArray(employee.certifications) ? employee.certifications.join(', ') : employee.certifications || 'Not specified'}
`;

    const targetRoleInfo = targetRole ? `
Target Role: ${targetRole.title}
Required Skills: ${Array.isArray(targetRole.required_skills) ? targetRole.required_skills.join(', ') : 'Not specified'}
Required Qualifications: ${Array.isArray(targetRole.required_qualifications) ? targetRole.required_qualifications.join(', ') : 'Not specified'}
Experience Level: ${targetRole.experience_level || 'Not specified'}
` : 'No specific target role - general assessment';

    const prompt = `Analyze this employee's skills and provide a detailed assessment.

${employeeProfile}

${targetRoleInfo}

Provide a JSON response with:
1. overallMatch: percentage (0-100) of how well the employee matches the target role or their career progression potential
2. skillGaps: array of objects with {skill, currentLevel, requiredLevel, gap}
3. recommendations: detailed text recommendations for skill development
4. nextRoles: array of 3-5 suggested career progression roles

Focus on actionable insights and realistic assessments.`;

    const response = await fetch('https://proxyllm.ximplify.id/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${litellmApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'azure/gpt-4.1', // Using the model pattern from other functions
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert HR analyst specializing in skills assessment and career development. Always respond with valid JSON.' 
          },
          { role: 'user', content: prompt }
        ],
        max_completion_tokens: 1000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LiteLLM API error:', errorText);
      throw new Error(`LiteLLM API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('LiteLLM response received successfully');
    
    // Clean up any markdown code blocks before JSON parsing
    const content = data.choices[0].message.content;
    const cleanContent = content.replace(/```json\s*|\s*```/g, '').trim();
    
    // Additional cleaning - remove any trailing content after the last }
    const lastBraceIndex = cleanContent.lastIndexOf('}');
    const finalContent = lastBraceIndex !== -1 ? cleanContent.substring(0, lastBraceIndex + 1) : cleanContent;
    
    const result = JSON.parse(finalContent);

    return {
      overallMatch: result.overallMatch || 50,
      skillGaps: result.skillGaps || [],
      recommendations: result.recommendations || 'No specific recommendations available',
      nextRoles: result.nextRoles || []
    };

  } catch (error) {
    console.error('Error in AI assessment:', error);
    return {
      overallMatch: 50,
      skillGaps: [],
      recommendations: `Assessment error: ${error.message}`,
      nextRoles: []
    };
  }
}