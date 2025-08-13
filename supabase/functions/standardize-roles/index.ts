import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { roleData, sourceCompany, catalogId } = await req.json();
    
    console.log('Processing role standardization for:', { sourceCompany, catalogId, roleCount: roleData.length });

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Step 1: Get all standard roles for AI matching
    const { data: standardRoles, error: standardRolesError } = await supabase
      .from('xlsmart_standard_roles')
      .select('*')
      .eq('is_active', true);

    if (standardRolesError) {
      throw new Error(`Failed to fetch standard roles: ${standardRolesError.message}`);
    }

    console.log(`Found ${standardRoles.length} standard roles for matching`);

    const mappingResults = [];

    // Step 2: Process each input role
    for (const inputRole of roleData) {
      console.log('Processing role:', inputRole.title);

      // Create AI prompt for role standardization
      const aiPrompt = `
You are an AI specialist in HR role standardization for telecommunications companies. Your task is to map the following role from ${sourceCompany.toUpperCase()} to the most appropriate XLSMART standard role.

INPUT ROLE:
- Title: ${inputRole.title}
- Department: ${inputRole.department || 'Not specified'}
- Level: ${inputRole.level || 'Not specified'}
- Description: ${inputRole.description || 'Not specified'}

AVAILABLE STANDARD ROLES:
${standardRoles.map(role => `
- ${role.role_title} (${role.job_family}, ${role.role_level}, ${role.department})
  Keywords: ${JSON.parse(role.keywords).join(', ')}
`).join('')}

Please analyze the input role and provide:
1. The BEST matching standard role ID from the list above
2. Confidence score (0-100)
3. Whether manual review is needed (true/false)
4. Brief explanation of the mapping decision

Respond in JSON format:
{
  "standardRoleId": "uuid-of-best-match",
  "standardRoleTitle": "exact title from standard roles",
  "confidence": 85,
  "requiresManualReview": false,
  "explanation": "Brief explanation of why this mapping was chosen"
}

If confidence is below 80%, set requiresManualReview to true.
`;

      // Call OpenAI for role mapping
      const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are an expert HR role standardization AI for telecommunications companies. Always respond with valid JSON.' },
            { role: 'user', content: aiPrompt }
          ],
          temperature: 0.3,
          max_tokens: 500,
        }),
      });

      if (!aiResponse.ok) {
        throw new Error(`OpenAI API error: ${aiResponse.statusText}`);
      }

      const aiData = await aiResponse.json();
      let aiMapping;
      
      try {
        aiMapping = JSON.parse(aiData.choices[0].message.content);
      } catch (parseError) {
        console.error('Failed to parse AI response:', aiData.choices[0].message.content);
        // Fallback: try to find a reasonable default mapping
        const fallbackRole = standardRoles.find(role => 
          role.job_family.toLowerCase().includes(inputRole.department?.toLowerCase() || '') ||
          role.role_title.toLowerCase().includes(inputRole.title.toLowerCase().split(' ')[0])
        ) || standardRoles[0];
        
        aiMapping = {
          standardRoleId: fallbackRole.id,
          standardRoleTitle: fallbackRole.role_title,
          confidence: 50,
          requiresManualReview: true,
          explanation: 'Fallback mapping due to AI parsing error'
        };
      }

      // Find the actual standard role details
      const matchedStandardRole = standardRoles.find(role => role.id === aiMapping.standardRoleId);
      
      if (!matchedStandardRole) {
        console.error('AI returned invalid standard role ID:', aiMapping.standardRoleId);
        continue;
      }

      // Create mapping record
      const mappingRecord = {
        catalog_id: catalogId,
        original_role_title: inputRole.title,
        original_department: inputRole.department || null,
        original_level: inputRole.level || null,
        standardized_role_title: matchedStandardRole.role_title,
        standardized_department: matchedStandardRole.department,
        standardized_level: matchedStandardRole.role_level,
        job_family: matchedStandardRole.job_family,
        standard_role_id: matchedStandardRole.id,
        mapping_confidence: aiMapping.confidence,
        requires_manual_review: aiMapping.requiresManualReview || aiMapping.confidence < 80,
        mapping_status: aiMapping.requiresManualReview || aiMapping.confidence < 80 ? 'manual_review' : 'auto_mapped'
      };

      mappingResults.push(mappingRecord);
      
      console.log(`Mapped "${inputRole.title}" to "${matchedStandardRole.role_title}" with ${aiMapping.confidence}% confidence`);
    }

    // Step 3: Insert all mappings into database
    const { data: insertedMappings, error: insertError } = await supabase
      .from('xlsmart_role_mappings')
      .insert(mappingResults)
      .select();

    if (insertError) {
      throw new Error(`Failed to insert mappings: ${insertError.message}`);
    }

    // Step 4: Update catalog with results
    const totalRoles = mappingResults.length;
    const autoMappedCount = mappingResults.filter(m => m.mapping_status === 'auto_mapped').length;
    const averageConfidence = mappingResults.reduce((sum, m) => sum + m.mapping_confidence, 0) / totalRoles;

    const { error: updateError } = await supabase
      .from('xlsmart_role_catalogs')
      .update({
        upload_status: 'completed',
        total_roles: totalRoles,
        processed_roles: totalRoles,
        mapping_accuracy: parseFloat(averageConfidence.toFixed(2))
      })
      .eq('id', catalogId);

    if (updateError) {
      throw new Error(`Failed to update catalog: ${updateError.message}`);
    }

    console.log(`Successfully processed ${totalRoles} roles with ${autoMappedCount} auto-mapped and ${totalRoles - autoMappedCount} requiring review`);

    return new Response(JSON.stringify({
      success: true,
      totalRoles,
      autoMappedCount,
      manualReviewCount: totalRoles - autoMappedCount,
      averageConfidence: parseFloat(averageConfidence.toFixed(2)),
      mappings: insertedMappings
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in role standardization:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});