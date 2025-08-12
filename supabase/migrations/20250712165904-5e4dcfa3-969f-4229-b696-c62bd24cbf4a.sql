-- Add resume requirement toggle to jobs table
ALTER TABLE public.jobs 
ADD COLUMN requires_resume boolean NOT NULL DEFAULT false;

-- Add resume storage to job applications table
ALTER TABLE public.job_applications 
ADD COLUMN resume_url text;

-- Create storage bucket for resumes (if not exists)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for resumes
CREATE POLICY "Users can upload their own resumes" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own resumes" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Job posters can view applicant resumes" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'resumes' AND 
  EXISTS (
    SELECT 1 FROM job_applications ja
    JOIN jobs j ON ja.job_id = j.id
    WHERE j.user_id = auth.uid()
    AND ja.resume_url = storage.objects.name
  )
);