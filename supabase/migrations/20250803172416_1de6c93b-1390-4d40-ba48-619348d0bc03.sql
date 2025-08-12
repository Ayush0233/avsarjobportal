-- Add job_type column to jobs table
ALTER TABLE public.jobs 
ADD COLUMN job_type text NOT NULL DEFAULT 'General';