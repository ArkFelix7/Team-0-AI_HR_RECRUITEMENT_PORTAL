-- HR Portal Complete Database Schema
-- This schema supports the entire recruitment workflow from job posting to final interview

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Jobs table - stores all job postings
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    department TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'draft')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Candidates table - stores all applicants
CREATE TABLE candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    resume_text TEXT NOT NULL,
    resume_file_url TEXT, -- URL to stored PDF in Supabase storage
    status TEXT DEFAULT 'applied' CHECK (status IN ('applied', 'resume_screened', 'call_scheduled', 'call_completed', 'interview_scheduled', 'interview_completed', 'rejected', 'accepted')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resume Analysis - stores AI analysis from gemini-hr-copilot
CREATE TABLE resume_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE UNIQUE,
    score NUMERIC(5,2) CHECK (score >= 0 AND score <= 100),
    ranking INTEGER, -- Ranking among all candidates for the same job
    strengths TEXT,
    weaknesses TEXT,
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Call Scheduling - stores appointment scheduling from AI call
CREATE TABLE call_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    call_audio_url TEXT, -- URL to stored audio file in Supabase storage
    call_duration_seconds INTEGER,
    scheduled_interview_date TIMESTAMP WITH TIME ZONE,
    confirmed_slot TEXT,
    call_summary TEXT,
    personality_analysis TEXT,
    transcript JSONB, -- Stores full transcript as JSON array
    call_started_at TIMESTAMP WITH TIME ZONE,
    call_ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Video Interviews - stores technical interview recordings and analysis
CREATE TABLE video_interviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    video_recording_url TEXT, -- URL to stored video file in Supabase storage
    video_duration_seconds INTEGER,
    transcript JSONB, -- Stores full transcript as JSON array
    emotion_data TEXT, -- Emotion analysis during interview
    interview_started_at TIMESTAMP WITH TIME ZONE,
    interview_ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Interview Analysis - comprehensive analysis from video interview
CREATE TABLE interview_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_interview_id UUID REFERENCES video_interviews(id) ON DELETE CASCADE UNIQUE,
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    overall_impression TEXT,
    confidence_score NUMERIC(5,2) CHECK (confidence_score >= 0 AND confidence_score <= 100),
    confidence_reasoning TEXT,
    expressiveness_score NUMERIC(5,2) CHECK (expressiveness_score >= 0 AND expressiveness_score <= 100),
    expressiveness_reasoning TEXT,
    knowledge_score NUMERIC(5,2) CHECK (knowledge_score >= 0 AND knowledge_score <= 100),
    knowledge_reasoning TEXT,
    communication_score NUMERIC(5,2) CHECK (communication_score >= 0 AND communication_score <= 100),
    communication_reasoning TEXT,
    strengths JSONB, -- Array of strengths
    areas_for_improvement JSONB, -- Array of areas for improvement
    emotion_summary TEXT,
    dominant_emotion TEXT,
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_candidates_job_id ON candidates(job_id);
CREATE INDEX idx_candidates_status ON candidates(status);
CREATE INDEX idx_resume_analysis_candidate_id ON resume_analysis(candidate_id);
CREATE INDEX idx_call_sessions_candidate_id ON call_sessions(candidate_id);
CREATE INDEX idx_video_interviews_candidate_id ON video_interviews(candidate_id);
CREATE INDEX idx_interview_analysis_candidate_id ON interview_analysis(candidate_id);
CREATE INDEX idx_jobs_status ON jobs(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to update updated_at
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_candidates_updated_at BEFORE UPDATE ON candidates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) - Enable for all tables
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_analysis ENABLE ROW LEVEL SECURITY;

-- Create policies (for now, allow all authenticated users - customize based on your needs)
CREATE POLICY "Allow all for authenticated users" ON jobs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON candidates FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON resume_analysis FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON call_sessions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON video_interviews FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON interview_analysis FOR ALL USING (auth.role() = 'authenticated');

-- For anonymous access during development (REMOVE IN PRODUCTION!)
CREATE POLICY "Allow all for anon" ON jobs FOR ALL USING (true);
CREATE POLICY "Allow all for anon" ON candidates FOR ALL USING (true);
CREATE POLICY "Allow all for anon" ON resume_analysis FOR ALL USING (true);
CREATE POLICY "Allow all for anon" ON call_sessions FOR ALL USING (true);
CREATE POLICY "Allow all for anon" ON video_interviews FOR ALL USING (true);
CREATE POLICY "Allow all for anon" ON interview_analysis FOR ALL USING (true);

-- Create storage buckets (execute these in Supabase dashboard or via API)
-- Storage bucket for resume PDFs
-- INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', true);

-- Storage bucket for call audio recordings
-- INSERT INTO storage.buckets (id, name, public) VALUES ('call-recordings', 'call-recordings', true);

-- Storage bucket for video interview recordings
-- INSERT INTO storage.buckets (id, name, public) VALUES ('video-interviews', 'video-interviews', true);

-- Storage policies for buckets
-- CREATE POLICY "Public read access" ON storage.objects FOR SELECT USING (bucket_id = 'resumes');
-- CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'resumes' AND auth.role() = 'authenticated');
-- Similar for other buckets...
