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

  console.log('=== BULK ASSIGN ROLES - SIMPLIFIED VERSION ===');

  try {
    // Basic environment check
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    console.log('Environment check passed - Supabase credentials available');

    console.log('Creating Supabase client...');
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching employees...');
    const { data: employees, error: employeesError } = await supabaseClient
      .from('xlsmart_employees')
      .select('id, first_name, last_name, current_position, current_department, current_level, years_of_experience, skills, standard_role_id')
      .is('standard_role_id', null)
      .eq('is_active', true)
      .limit(5); // Limit to 5 for testing

    if (employeesError) {
      console.error('Employees fetch error:', employeesError);
      throw new Error(`Failed to fetch employees: ${employeesError.message}`);
    }

    console.log(`Found ${employees?.length || 0} unassigned employees`);

    console.log('Fetching standard roles with job descriptions...');
    const { data: standardRoles, error: rolesError } = await supabaseClient
      .from('xlsmart_standard_roles')
      .select(`
        *,
        job_descriptions:xlsmart_job_descriptions(
          title,
          summary,
          responsibilities,
          required_qualifications,
          required_skills,
          experience_level
        )
      `)
      .eq('is_active', true);

    if (rolesError) {
      console.error('Roles fetch error:', rolesError);
      throw new Error(`Failed to fetch standard roles: ${rolesError.message}`);
    }

    console.log(`Found ${standardRoles?.length || 0} standard roles`);

    if (!employees?.length) {
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
      throw new Error('No standard roles available');
    }

    // Process just the first employee for testing
    const employee = employees[0];
    console.log(`Testing with employee: ${employee.first_name} ${employee.last_name}`);

    // Enhanced role matching with job descriptions
    let assignedRoleId = null;
    
    console.log(`Analyzing employee: ${employee.current_position} with skills: ${employee.skills}`);
    
    // Enhanced matching considering job descriptions
    const findBestMatch = (employee: any, roles: any[]) => {
      let bestMatch = null;
      let bestScore = 0;
      
      for (const role of roles) {
        let score = 0;
        const jd = role.job_descriptions?.[0];
        
        // Job title similarity (30%)
        if (role.role_title.toLowerCase().includes(employee.current_position.toLowerCase()) ||
            employee.current_position.toLowerCase().includes(role.role_title.toLowerCase())) {
          score += 0.3;
        }
        
        // Skills match with job description (40%)
        const roleSkills = [
          ...(Array.isArray(role.required_skills) ? role.required_skills : []),
          ...(Array.isArray(jd?.required_skills) ? jd.required_skills : [])
        ];
        const employeeSkills = Array.isArray(employee.skills) ? employee.skills : [];
        
        const skillMatches = employeeSkills.filter(skill => 
          roleSkills.some(roleSkill => 
            skill.toLowerCase().includes(roleSkill.toLowerCase()) ||
            roleSkill.toLowerCase().includes(skill.toLowerCase())
          )
        ).length;
        
        if (roleSkills.length > 0) {
          score += (skillMatches / roleSkills.length) * 0.4;
        }
        
        // Department match (20%)
        if (role.department && employee.current_department && 
            role.department.toLowerCase() === employee.current_department.toLowerCase()) {
          score += 0.2;
        }
        
        // Experience level match (10%)
        const empExp = employee.years_of_experience || 0;
        if (empExp >= (role.experience_range_min || 0) && empExp <= (role.experience_range_max || 50)) {
          score += 0.1;
        }
        
        if (score > bestScore) {
          bestScore = score;
          bestMatch = role;
        }
      }
      
      return bestMatch;
    };
    
    const matchingRole = findBestMatch(employee, standardRoles);
    
    if (matchingRole) {
      assignedRoleId = matchingRole.id;
      console.log(`Found matching role: ${matchingRole.role_title} (score: calculated)`);
    } else {
      // Assign the first available role as fallback
      assignedRoleId = standardRoles[0].id;
      console.log(`No match found, assigning first role: ${standardRoles[0].role_title}`);
    }

    console.log(`Updating employee with role ID: ${assignedRoleId}`);
    
    const { error: updateError } = await supabaseClient
      .from('xlsmart_employees')
      .update({
        standard_role_id: assignedRoleId,
        role_assignment_status: 'ai_suggested',
        assignment_notes: 'Simple test assignment'
      })
      .eq('id', employee.id);

    if (updateError) {
      console.error('Update error:', updateError);
      throw new Error(`Failed to update employee: ${updateError.message}`);
    }

    console.log('✅ Successfully assigned role');

    return new Response(JSON.stringify({
      success: true,
      message: 'Test assignment completed',
      assigned: 1,
      failed: 0,
      total: 1,
      details: {
        employee: `${employee.first_name} ${employee.last_name}`,
        assigned_role: matchingRole?.role_title || standardRoles[0].role_title,
        matching_used: 'Enhanced job description matching'
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('=== BULK ASSIGN ERROR ===');
    console.error('Error:', error);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      assigned: 0,
      failed: 1,
      total: 0
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});