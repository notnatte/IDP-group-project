
-- Add phone number to courses table
ALTER TABLE public.courses ADD COLUMN phone_number TEXT;

-- Add job description and salary to jobs table
ALTER TABLE public.jobs ADD COLUMN description TEXT;
ALTER TABLE public.jobs ADD COLUMN salary TEXT;

-- Create storage bucket for course PDFs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('course-pdfs', 'course-pdfs', false, 52428800, '{"application/pdf"}');

-- Create storage bucket for payment receipts
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('payment-receipts', 'payment-receipts', false, 10485760, '{"image/png","image/jpeg","image/jpg"}');

-- Create storage bucket for CVs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('cvs', 'cvs', false, 10485760, '{"application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document"}');

-- Add pdf_storage_path to courses table (replacing pdf_url)
ALTER TABLE public.courses ADD COLUMN pdf_storage_path TEXT;

-- Add receipt_storage_path to payments table (replacing receipt_url)
ALTER TABLE public.payments ADD COLUMN receipt_storage_path TEXT;

-- Add cv_storage_path to job_applications table
ALTER TABLE public.job_applications ADD COLUMN cv_storage_path TEXT;

-- Create RLS policies for course-pdfs bucket
CREATE POLICY "Authenticated users can view course PDFs they own" ON storage.objects
FOR SELECT USING (
  bucket_id = 'course-pdfs' AND 
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.payments p
    JOIN public.courses c ON p.course_id = c.id
    WHERE c.pdf_storage_path = storage.objects.name 
    AND p.user_id = auth.uid() 
    AND p.status = 'approved'
  )
);

CREATE POLICY "Instructors can upload course PDFs" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'course-pdfs' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Instructors can update their course PDFs" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'course-pdfs' AND
  auth.uid() IS NOT NULL
);

-- Create RLS policies for payment-receipts bucket
CREATE POLICY "Users can upload payment receipts" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'payment-receipts' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view their own receipts" ON storage.objects
FOR SELECT USING (
  bucket_id = 'payment-receipts' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Admins can view all payment receipts" ON storage.objects
FOR SELECT USING (
  bucket_id = 'payment-receipts' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Create RLS policies for CVs bucket
CREATE POLICY "Users can upload CVs" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'cvs' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view their own CVs" ON storage.objects
FOR SELECT USING (
  bucket_id = 'cvs' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Employers can view CVs for their job applications" ON storage.objects
FOR SELECT USING (
  bucket_id = 'cvs' AND
  EXISTS (
    SELECT 1 FROM public.job_applications ja
    JOIN public.jobs j ON ja.job_id = j.id
    WHERE ja.cv_storage_path = storage.objects.name 
    AND j.employer_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all CVs" ON storage.objects
FOR SELECT USING (
  bucket_id = 'cvs' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
