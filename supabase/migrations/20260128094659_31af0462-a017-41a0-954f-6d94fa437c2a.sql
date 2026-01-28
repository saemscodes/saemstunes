-- Add instructor columns to courses table
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS instructor_name TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS instructor_avatar TEXT;