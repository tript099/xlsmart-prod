-- Insert sample skills data into skills_master table
INSERT INTO skills_master (id, skill_name, category, description, level, created_by) VALUES
(gen_random_uuid(), 'JavaScript', 'Programming', 'Frontend and backend JavaScript development', 'intermediate', '00000000-0000-0000-0000-000000000000'),
(gen_random_uuid(), 'Python', 'Programming', 'Python programming for data science and web development', 'intermediate', '00000000-0000-0000-0000-000000000000'),
(gen_random_uuid(), 'SQL', 'Database', 'Structured Query Language for database management', 'beginner', '00000000-0000-0000-0000-000000000000'),
(gen_random_uuid(), 'React', 'Frontend', 'React framework for building user interfaces', 'intermediate', '00000000-0000-0000-0000-000000000000'),
(gen_random_uuid(), 'Node.js', 'Backend', 'Server-side JavaScript runtime', 'intermediate', '00000000-0000-0000-0000-000000000000'),
(gen_random_uuid(), 'Data Analysis', 'Analytics', 'Analyzing and interpreting data', 'beginner', '00000000-0000-0000-0000-000000000000'),
(gen_random_uuid(), 'Project Management', 'Management', 'Planning and executing projects', 'intermediate', '00000000-0000-0000-0000-000000000000'),
(gen_random_uuid(), 'AWS', 'Cloud', 'Amazon Web Services cloud platform', 'beginner', '00000000-0000-0000-0000-000000000000'),
(gen_random_uuid(), 'Docker', 'DevOps', 'Containerization technology', 'beginner', '00000000-0000-0000-0000-000000000000'),
(gen_random_uuid(), 'Machine Learning', 'AI/ML', 'Artificial intelligence and machine learning', 'beginner', '00000000-0000-0000-0000-000000000000'),
(gen_random_uuid(), 'Communication', 'Soft Skills', 'Effective verbal and written communication', 'intermediate', '00000000-0000-0000-0000-000000000000'),
(gen_random_uuid(), 'Leadership', 'Management', 'Leading teams and driving results', 'intermediate', '00000000-0000-0000-0000-000000000000'),
(gen_random_uuid(), 'Problem Solving', 'Soft Skills', 'Analytical thinking and solution development', 'intermediate', '00000000-0000-0000-0000-000000000000'),
(gen_random_uuid(), 'Agile', 'Methodology', 'Agile development methodology', 'beginner', '00000000-0000-0000-0000-000000000000'),
(gen_random_uuid(), 'Git', 'Tools', 'Version control system', 'intermediate', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;