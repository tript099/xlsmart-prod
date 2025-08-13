import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId } = await req.json();
    
    console.log('Starting AI role standardization for session:', sessionId);

    // Get upload session details
    const { data: session, error: sessionError } = await supabase
      .from('xlsmart_upload_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      throw new Error('Upload session not found');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Update session status
    await supabase
      .from('xlsmart_upload_sessions')
      .update({ status: 'standardizing' })
      .eq('id', sessionId);

    const standardRoles: any[] = [];
    const roleMappings: any[] = [];

    // Process each temporary table
    for (const tempTableName of session.temp_table_names) {
      console.log('Processing temporary table:', tempTableName);

      // Get sample data from temporary table to understand structure
      const { data: sampleData, error: sampleError } = await supabase
        .rpc('execute_sql', {
          query: `SELECT * FROM ${tempTableName} LIMIT 10`
        });

      if (sampleError) {
        console.error('Error fetching sample data:', sampleError);
        continue;
      }

      // Get column information
      const { data: columns, error: columnsError } = await supabase
        .rpc('execute_sql', {
          query: `
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = '${tempTableName}' 
            AND column_name NOT IN ('id', 'original_row_number', 'source_file')
            ORDER BY ordinal_position
          `
        });

      if (columnsError) {
        console.error('Error fetching columns:', columnsError);
        continue;
      }

      const columnNames = columns.map((col: any) => col.column_name);
      console.log('Table columns:', columnNames);

      // Use AI to analyze table structure and create standard roles
      const aiPrompt = `
Analyze this temporary role data table and create standardized roles.

Table: ${tempTableName}
Columns: ${columnNames.join(', ')}
Sample Data: ${JSON.stringify(sampleData?.slice(0, 5) || [])}

Your task:
1. Identify the role title column (likely contains role names/titles)
2. Identify department, level, and other key columns
3. Create standardized role definitions
4. Map original roles to standard roles

Respond with JSON:
{
  "titleColumn": "detected_title_column_name",
  "departmentColumn": "detected_department_column_name", 
  "levelColumn": "detected_level_column_name",
  "standardRoles": [
    {
      "role_title": "Standardized Role Name",
      "job_family": "Technology/Sales/Operations/etc",
      "role_level": "Junior/Mid/Senior/Lead/Manager",
      "department": "Department Name",
      "standard_description": "Role description",
      "core_responsibilities": ["responsibility1", "responsibility2"],
      "required_skills": ["skill1", "skill2"],
      "keywords": ["keyword1", "keyword2"]
    }
  ],
  "mappingInstructions": "How to map original roles to standard roles"
}
`;

      const aiResponse = await fetch('https://proxyllm.ximplify.id/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'azure/gpt-4.1',
          messages: [
            { 
              role: 'system', 
              content: 'You are an expert HR data analyst. Analyze role data and create standardized role definitions. Always respond with valid JSON.' 
            },
            { role: 'user', content: aiPrompt }
          ],
          temperature: 0.3,
          max_tokens: 4000,
        }),
      });

      if (!aiResponse.ok) {
        throw new Error(`OpenAI API error: ${aiResponse.statusText}`);
      }

      const aiData = await aiResponse.json();
      let analysis;
      
      try {
        analysis = JSON.parse(aiData.choices[0].message.content);
      } catch (parseError) {
        console.error('Failed to parse AI response:', aiData.choices[0].message.content);
        continue;
      }

      console.log('AI Analysis:', analysis);

      // Create standard roles in database
      for (const standardRole of analysis.standardRoles || []) {
        const { data: createdRole, error: roleError } = await supabase
          .from('xlsmart_standard_roles')
          .insert({
            role_title: standardRole.role_title,
            job_family: standardRole.job_family,
            role_level: standardRole.role_level,
            department: standardRole.department,
            standard_description: standardRole.standard_description,
            core_responsibilities: standardRole.core_responsibilities || [],
            required_skills: standardRole.required_skills || [],
            keywords: standardRole.keywords || [],
            industry_alignment: 'Telecommunications'
          })
          .select()
          .single();

        if (roleError) {
          console.error('Error creating standard role:', roleError);
          continue;
        }

        standardRoles.push(createdRole);
      }

      // Now create mappings from temporary table data to standard roles
      const titleColumn = analysis.titleColumn;
      if (titleColumn) {
        const { data: allRoleData, error: allDataError } = await supabase
          .rpc('execute_sql', {
            query: `SELECT * FROM ${tempTableName}`
          });

        if (!allDataError && allRoleData) {
          for (const row of allRoleData) {
            const originalTitle = row[titleColumn];
            if (!originalTitle) continue;

            // Find best matching standard role using simple text matching for now
            const bestMatch = standardRoles.find(sr => 
              sr.role_title.toLowerCase().includes(originalTitle.toLowerCase()) ||
              originalTitle.toLowerCase().includes(sr.role_title.toLowerCase())
            ) || standardRoles[0]; // Fallback to first standard role

            if (bestMatch) {
              roleMappings.push({
                original_role_title: originalTitle,
                original_department: row[analysis.departmentColumn] || null,
                original_level: row[analysis.levelColumn] || null,
                standardized_role_title: bestMatch.role_title,
                standardized_department: bestMatch.department,
                standardized_level: bestMatch.role_level,
                job_family: bestMatch.job_family,
                standard_role_id: bestMatch.id,
                mapping_confidence: 75, // Default confidence
                mapping_status: 'auto_mapped'
              });
            }
          }
        }
      }
    }

    // Insert role mappings
    if (roleMappings.length > 0) {
      const { error: mappingsError } = await supabase
        .from('xlsmart_role_mappings')
        .insert(roleMappings);

      if (mappingsError) {
        console.error('Error inserting role mappings:', mappingsError);
      }
    }

    // Update session with completion
    await supabase
      .from('xlsmart_upload_sessions')
      .update({ 
        status: 'completed',
        ai_analysis: {
          standardRolesCreated: standardRoles.length,
          roleMappingsCreated: roleMappings.length
        }
      })
      .eq('id', sessionId);

    console.log('AI standardization complete');

    return new Response(JSON.stringify({
      success: true,
      standardRolesCreated: standardRoles.length,
      roleMappingsCreated: roleMappings.length,
      message: 'AI role standardization completed successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in AI role standardization:', error);
    
    // Update session with error
    try {
      const { sessionId } = await req.json();
      await supabase
        .from('xlsmart_upload_sessions')
        .update({ 
          status: 'failed',
          error_message: error.message 
        })
        .eq('id', sessionId);
    } catch (updateError) {
      console.error('Failed to update session with error:', updateError);
    }

    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});