-- Add status field to job_applications table
ALTER TABLE public.job_applications 
ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied'));

-- Add RLS policy to allow job posters to update application status
CREATE POLICY "Job posters can update application status" 
ON public.job_applications 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM jobs 
  WHERE jobs.id = job_applications.job_id 
  AND jobs.user_id = auth.uid()
));