-- Quick Fix: RLS Policies for Development
-- Run this in Supabase SQL Editor to fix the 406 errors

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all for authenticated users" ON jobs;
DROP POLICY IF EXISTS "Allow all for anon" ON jobs;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON candidates;
DROP POLICY IF EXISTS "Allow all for anon" ON candidates;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON resume_analysis;
DROP POLICY IF EXISTS "Allow all for anon" ON resume_analysis;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON call_sessions;
DROP POLICY IF EXISTS "Allow all for anon" ON call_sessions;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON video_interviews;
DROP POLICY IF EXISTS "Allow all for anon" ON video_interviews;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON interview_analysis;
DROP POLICY IF EXISTS "Allow all for anon" ON interview_analysis;

-- Create permissive policies for development (REMOVE IN PRODUCTION!)
-- Jobs table
CREATE POLICY "Enable all for anon on jobs" ON jobs FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated on jobs" ON jobs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Candidates table
CREATE POLICY "Enable all for anon on candidates" ON candidates FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated on candidates" ON candidates FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Resume Analysis table
CREATE POLICY "Enable all for anon on resume_analysis" ON resume_analysis FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated on resume_analysis" ON resume_analysis FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Call Sessions table
CREATE POLICY "Enable all for anon on call_sessions" ON call_sessions FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated on call_sessions" ON call_sessions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Video Interviews table
CREATE POLICY "Enable all for anon on video_interviews" ON video_interviews FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated on video_interviews" ON video_interviews FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Interview Analysis table
CREATE POLICY "Enable all for anon on interview_analysis" ON interview_analysis FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated on interview_analysis" ON interview_analysis FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Verify policies are created
SELECT schemaname, tablename, policyname, roles, cmd 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
