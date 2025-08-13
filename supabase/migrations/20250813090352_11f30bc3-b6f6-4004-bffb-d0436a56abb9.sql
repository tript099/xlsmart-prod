-- Delete all roles and skills data for fresh testing
-- Delete in order to avoid foreign key constraint violations

-- Delete skill assessments first
DELETE FROM xlsmart_skill_assessments;

-- Delete development plans
DELETE FROM xlsmart_development_plans;

-- Delete employee skills relationships
DELETE FROM employee_skills;

-- Delete employee certifications
DELETE FROM employee_certifications;

-- Delete employee trainings
DELETE FROM employee_trainings;

-- Delete skill gap analysis
DELETE FROM skill_gap_analysis;

-- Delete job descriptions
DELETE FROM xlsmart_job_descriptions;

-- Delete role mappings
DELETE FROM xlsmart_role_mappings;

-- Delete role catalogs
DELETE FROM xlsmart_role_catalogs;

-- Delete xlsmart employees
DELETE FROM xlsmart_employees;

-- Delete standard roles
DELETE FROM xlsmart_standard_roles;

-- Delete skills master
DELETE FROM skills_master;

-- Delete employees
DELETE FROM employees;

-- Delete job descriptions (general)
DELETE FROM job_descriptions;