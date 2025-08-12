
-- Make the resumes bucket public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'resumes';

-- Create policy to allow authenticated users to select/download resumes
CREATE POLICY "Allow authenticated users to download resumes" ON storage.objects
FOR SELECT USING (
  bucket_id = 'resumes' AND 
  auth.role() = 'authenticated'
);

-- Create policy to allow users to upload their own resumes
CREATE POLICY "Allow users to upload their own resumes" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'resumes' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy to allow users to update their own resumes
CREATE POLICY "Allow users to update their own resumes" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'resumes' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy to allow users to delete their own resumes
CREATE POLICY "Allow users to delete their own resumes" ON storage.objects
FOR DELETE USING (
  bucket_id = 'resumes' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
