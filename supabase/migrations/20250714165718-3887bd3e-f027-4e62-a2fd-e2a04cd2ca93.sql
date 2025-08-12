-- Add new fields to jobs table for better organization details
ALTER TABLE public.jobs 
ADD COLUMN organization_name TEXT,
ADD COLUMN city TEXT,
ADD COLUMN address TEXT;

-- Update the location field to be nullable since we're replacing it with separate fields
ALTER TABLE public.jobs 
ALTER COLUMN location DROP NOT NULL;