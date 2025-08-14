-- Fix the remaining function search path issue for get_current_user_role
ALTER FUNCTION public.get_current_user_role() SET search_path TO 'public';