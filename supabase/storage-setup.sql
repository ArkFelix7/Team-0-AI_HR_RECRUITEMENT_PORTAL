-- Storage Buckets Setup for HR Portal
-- Run this AFTER the main schema.sql

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('resumes', 'resumes', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('call-recordings', 'call-recordings', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('video-interviews', 'video-interviews', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for resumes bucket
CREATE POLICY "Public read access for resumes" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'resumes');

CREATE POLICY "Anyone can upload resumes" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'resumes');

CREATE POLICY "Anyone can update resumes" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'resumes');

CREATE POLICY "Anyone can delete resumes" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'resumes');

-- Storage policies for call-recordings bucket
CREATE POLICY "Public read access for calls" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'call-recordings');

CREATE POLICY "Anyone can upload call recordings" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'call-recordings');

CREATE POLICY "Anyone can update call recordings" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'call-recordings');

CREATE POLICY "Anyone can delete call recordings" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'call-recordings');

-- Storage policies for video-interviews bucket
CREATE POLICY "Public read access for videos" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'video-interviews');

CREATE POLICY "Anyone can upload videos" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'video-interviews');

CREATE POLICY "Anyone can update videos" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'video-interviews');

CREATE POLICY "Anyone can delete videos" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'video-interviews');
