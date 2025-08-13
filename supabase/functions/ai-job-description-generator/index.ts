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
    const { 
      roleTitle, 
      department, 
      level, 
      employmentType = 'full_time',
      locationStatus = 'office',
      salaryRange,
      requirements = [],
      customInstructions = '',
      tone = 'professional',
      language = 'en'
    } = await req.json();

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Get similar standard roles for context
    const { data: standardRoles, error: rolesError } = await supabase
      .from('xlsmart_standard_roles')
      .select('role_title, standard_description, core_responsibilities, required_skills, education_requirements')
      .ilike('role_title', `%${roleTitle}%`)
      .eq('is_active', true)
      .limit(3);

    if (rolesError) {
      console.error('Error fetching standard roles:', rolesError);
    }

    // Get company context from employees data
    const { data: companyContext, error: contextError } = await supabase
      .from('xlsmart_employees')
      .select('current_department, current_position')
      .eq('current_department', department)
      .limit(10);

    const contextInfo = standardRoles?.length > 0 
      ? `\n\nSimilar roles in our database:\n${standardRoles.map(role => 
          `- ${role.role_title}: ${role.standard_description}`
        ).join('\n')}`
      : '';

    const aiPrompt = `You are an expert HR professional and job description writer specializing in telecommunications companies with 10,000+ employees.

Create a comprehensive, engaging job description for the following role:

ROLE DETAILS:
- Position: ${roleTitle}
- Department: ${department}
- Level: ${level}
- Employment Type: ${employmentType}
- Work Location: ${locationStatus}
- Salary Range: ${salaryRange || 'Competitive package'}

ADDITIONAL REQUIREMENTS:
${requirements.length > 0 ? requirements.join('\n- ') : 'Standard telecommunications industry requirements'}

CUSTOM INSTRUCTIONS:
${customInstructions}

TONE: ${tone} (professional, friendly, or corporate)
LANGUAGE: ${language}

${contextInfo}

Create a job description with the following structure:
1. **Company Overview** (2-3 sentences about telecommunications leadership)
2. **Role Summary** (compelling 2-3 sentence overview)
3. **Key Responsibilities** (5-7 bullet points with action verbs)
4. **Required Qualifications** (education, experience, technical skills)
5. **Preferred Qualifications** (nice-to-have skills)
6. **What We Offer** (benefits, growth opportunities, culture)
7. **Application Process** (how to apply)

Make it compelling, specific to telecommunications industry, and optimized for attracting top talent. Use inclusive language and highlight growth opportunities.

Respond in JSON format:
{
  "title": "Generated job title",
  "summary": "Role summary paragraph",
  "responsibilities": ["responsibility 1", "responsibility 2", ...],
  "requiredQualifications": ["qualification 1", "qualification 2", ...],
  "preferredQualifications": ["preferred 1", "preferred 2", ...],
  "benefits": ["benefit 1", "benefit 2", ...],
  "fullDescription": "Complete formatted job description",
  "keywords": ["seo keyword 1", "keyword 2", ...],
  "estimatedSalary": {
    "min": 75000,
    "max": 120000,
    "currency": "IDR"
  }
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert HR professional and job description writer for large telecommunications companies. Always respond with valid JSON.' 
          },
          { role: 'user', content: aiPrompt }
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const aiData = await response.json();
    let generatedJD;
    
    try {
      generatedJD = JSON.parse(aiData.choices[0].message.content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiData.choices[0].message.content);
      throw new Error('Failed to generate job description - invalid AI response format');
    }

    // Save to database
    const { data: savedJD, error: saveError } = await supabase
      .from('xlsmart_job_descriptions')
      .insert({
        title: generatedJD.title,
        summary: generatedJD.summary,
        role_mapping_id: null, // Can be linked later
        responsibilities: generatedJD.responsibilities,
        required_qualifications: generatedJD.requiredQualifications,
        preferred_qualifications: generatedJD.preferredQualifications,
        required_skills: [], // Can be extracted from qualifications
        preferred_skills: [],
        salary_range_min: generatedJD.estimatedSalary?.min,
        salary_range_max: generatedJD.estimatedSalary?.max,
        currency: generatedJD.estimatedSalary?.currency || 'IDR',
        experience_level: level,
        education_level: 'bachelor', // Default, can be customized
        employment_type: employmentType,
        location_type: locationStatus,
        ai_generated: true,
        generated_by: null, // Will be set by RLS
        ai_prompt_used: aiPrompt,
        tone: tone,
        language: language,
        status: 'draft'
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving job description:', saveError);
      // Still return the generated content even if save fails
    }

    console.log('Successfully generated job description for:', roleTitle);

    return new Response(JSON.stringify({
      success: true,
      jobDescription: generatedJD,
      saved: !saveError,
      id: savedJD?.id,
      message: 'Job description generated successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in AI job description generator:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      message: 'Failed to generate job description'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});