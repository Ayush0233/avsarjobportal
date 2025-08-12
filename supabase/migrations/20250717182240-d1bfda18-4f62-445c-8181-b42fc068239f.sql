-- Add missing columns to profiles table for location data
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add missing columns to job_applications table for applicant data
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS applicant_location TEXT;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS message TEXT;