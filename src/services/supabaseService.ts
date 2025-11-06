import { supabase } from '../lib/supabase';
import {
  Job,
  Candidate,
  ResumeAnalysis,
  CallSession,
  VideoInterview,
  InterviewAnalysis,
  CreateJobInput,
  CreateCandidateInput,
  CandidateStatus,
  CandidateWithDetails,
  TranscriptEntry
} from '../types';

// ========== JOB OPERATIONS ==========
export const createJob = async (jobData: CreateJobInput): Promise<Job | null> => {
  const { data, error } = await supabase
    .from('jobs')
    .insert([jobData])
    .select()
    .single();

  if (error) {
    console.error('Error creating job:', error);
    return null;
  }
  return data as Job;
};

export const getJobs = async (): Promise<Job[]> => {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching jobs:', error);
    return [];
  }
  return data as Job[];
};

export const getJobById = async (jobId: string): Promise<Job | null> => {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (error) {
    console.error('Error fetching job:', error);
    return null;
  }
  return data as Job;
};

export const deleteJob = async (jobId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('jobs')
    .delete()
    .eq('id', jobId);

  if (error) {
    console.error('Error deleting job:', error);
    return false;
  }
  return true;
};

// ========== CANDIDATE OPERATIONS ==========
export const createCandidate = async (candidateData: CreateCandidateInput): Promise<Candidate | null> => {
  let resume_file_url: string | undefined;

  // Upload resume file if provided
  if (candidateData.resume_file) {
    resume_file_url = await uploadFile(
      candidateData.resume_file,
      'resumes',
      `${candidateData.job_id}/${Date.now()}_${candidateData.resume_file.name}`
    );
  }

  const { data, error } = await supabase
    .from('candidates')
    .insert([{
      job_id: candidateData.job_id,
      name: candidateData.name,
      email: candidateData.email,
      phone: candidateData.phone,
      resume_text: candidateData.resume_text,
      resume_file_url
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating candidate:', error);
    return null;
  }
  return data as Candidate;
};

export const getCandidatesByJob = async (jobId: string): Promise<Candidate[]> => {
  const { data, error } = await supabase
    .from('candidates')
    .select('*')
    .eq('job_id', jobId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching candidates:', error);
    return [];
  }
  return data as Candidate[];
};

export const getCandidateById = async (candidateId: string): Promise<Candidate | null> => {
  const { data, error } = await supabase
    .from('candidates')
    .select('*')
    .eq('id', candidateId)
    .single();

  if (error) {
    console.error('Error fetching candidate:', error);
    return null;
  }
  return data as Candidate;
};

export const updateCandidateStatus = async (candidateId: string, status: CandidateStatus): Promise<boolean> => {
  const { error } = await supabase
    .from('candidates')
    .update({ status })
    .eq('id', candidateId);

  if (error) {
    console.error('Error updating candidate status:', error);
    return false;
  }
  return true;
};

export const deleteCandidate = async (candidateId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('candidates')
    .delete()
    .eq('id', candidateId);

  if (error) {
    console.error('Error deleting candidate:', error);
    return false;
  }
  return true;
};

// Get candidate with all related data
export const getCandidateWithDetails = async (candidateId: string): Promise<CandidateWithDetails | null> => {
  const candidate = await getCandidateById(candidateId);
  if (!candidate) return null;

  const [job, resumeAnalysis, callSession, videoInterview] = await Promise.all([
    getJobById(candidate.job_id),
    getResumeAnalysis(candidateId),
    getCallSession(candidateId),
    getVideoInterview(candidateId)
  ]);

  let interviewAnalysis: InterviewAnalysis | undefined;
  if (videoInterview) {
    const analysis = await getInterviewAnalysis(videoInterview.id);
    interviewAnalysis = analysis || undefined;
  }

  return {
    ...candidate,
    job: job || undefined,
    resume_analysis: resumeAnalysis || undefined,
    call_session: callSession || undefined,
    video_interview: videoInterview || undefined,
    interview_analysis: interviewAnalysis
  };
};

// ========== RESUME ANALYSIS OPERATIONS ==========
export const saveResumeAnalysis = async (
  candidateId: string,
  score: number,
  strengths: string,
  weaknesses: string
): Promise<ResumeAnalysis | null> => {
  const { data, error } = await supabase
    .from('resume_analysis')
    .upsert([{
      candidate_id: candidateId,
      score,
      strengths,
      weaknesses
    }])
    .select()
    .single();

  if (error) {
    console.error('Error saving resume analysis:', error);
    return null;
  }

  // Update candidate status
  await updateCandidateStatus(candidateId, CandidateStatus.RESUME_SCREENED);

  return data as ResumeAnalysis;
};

export const getResumeAnalysis = async (candidateId: string): Promise<ResumeAnalysis | null> => {
  const { data, error } = await supabase
    .from('resume_analysis')
    .select('*')
    .eq('candidate_id', candidateId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No rows returned
    console.error('Error fetching resume analysis:', error);
    return null;
  }
  return data as ResumeAnalysis;
};

export const updateResumeRankings = async (jobId: string): Promise<void> => {
  // Get all candidates with analysis for this job
  const candidates = await getCandidatesByJob(jobId);
  
  const analysesPromises = candidates.map(c => getResumeAnalysis(c.id));
  const analyses = await Promise.all(analysesPromises);
  
  // Filter out null and sort by score
  const validAnalyses = analyses
    .filter((a): a is ResumeAnalysis => a !== null)
    .sort((a, b) => b.score - a.score);

  // Update rankings
  const updatePromises = validAnalyses.map((analysis, index) => 
    supabase
      .from('resume_analysis')
      .update({ ranking: index + 1 })
      .eq('id', analysis.id)
  );

  await Promise.all(updatePromises);
};

// ========== CALL SESSION OPERATIONS ==========
export const saveCallSession = async (
  candidateId: string,
  callData: {
    call_audio_blob?: Blob;
    call_duration_seconds?: number;
    scheduled_interview_date?: string;
    confirmed_slot?: string;
    call_summary?: string;
    personality_analysis?: string;
    transcript?: TranscriptEntry[];
    call_started_at?: string;
    call_ended_at?: string;
  }
): Promise<CallSession | null> => {
  let call_audio_url: string | undefined;

  // Upload audio file if provided
  if (callData.call_audio_blob) {
    call_audio_url = await uploadFile(
      callData.call_audio_blob,
      'call-recordings',
      `${candidateId}/${Date.now()}_call_recording.webm`
    );
  }

  const { data, error } = await supabase
    .from('call_sessions')
    .insert([{
      candidate_id: candidateId,
      call_audio_url,
      call_duration_seconds: callData.call_duration_seconds,
      scheduled_interview_date: callData.scheduled_interview_date,
      confirmed_slot: callData.confirmed_slot,
      call_summary: callData.call_summary,
      personality_analysis: callData.personality_analysis,
      transcript: callData.transcript as any,
      call_started_at: callData.call_started_at,
      call_ended_at: callData.call_ended_at
    }])
    .select()
    .single();

  if (error) {
    console.error('Error saving call session:', error);
    return null;
  }

  // Update candidate status
  await updateCandidateStatus(candidateId, CandidateStatus.CALL_COMPLETED);

  return data as CallSession;
};

export const getCallSession = async (candidateId: string): Promise<CallSession | null> => {
  const { data, error } = await supabase
    .from('call_sessions')
    .select('*')
    .eq('candidate_id', candidateId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching call session:', error);
    return null;
  }
  return data as CallSession;
};

// ========== VIDEO INTERVIEW OPERATIONS ==========
export const saveVideoInterview = async (
  candidateId: string,
  videoData: {
    video_blob?: Blob;
    video_duration_seconds?: number;
    transcript?: TranscriptEntry[];
    emotion_data?: string;
    interview_started_at?: string;
    interview_ended_at?: string;
  }
): Promise<VideoInterview | null> => {
  let video_recording_url: string | undefined;

  // Upload video file if provided
  if (videoData.video_blob) {
    video_recording_url = await uploadFile(
      videoData.video_blob,
      'video-interviews',
      `${candidateId}/${Date.now()}_interview.webm`
    );
  }

  const { data, error } = await supabase
    .from('video_interviews')
    .insert([{
      candidate_id: candidateId,
      video_recording_url,
      video_duration_seconds: videoData.video_duration_seconds,
      transcript: videoData.transcript as any,
      emotion_data: videoData.emotion_data,
      interview_started_at: videoData.interview_started_at,
      interview_ended_at: videoData.interview_ended_at
    }])
    .select()
    .single();

  if (error) {
    console.error('Error saving video interview:', error);
    return null;
  }

  // Update candidate status
  await updateCandidateStatus(candidateId, CandidateStatus.INTERVIEW_COMPLETED);

  return data as VideoInterview;
};

export const getVideoInterview = async (candidateId: string): Promise<VideoInterview | null> => {
  const { data, error } = await supabase
    .from('video_interviews')
    .select('*')
    .eq('candidate_id', candidateId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching video interview:', error);
    return null;
  }
  return data as VideoInterview;
};

// ========== INTERVIEW ANALYSIS OPERATIONS ==========
export const saveInterviewAnalysis = async (
  videoInterviewId: string,
  candidateId: string,
  analysisData: {
    overall_impression: string;
    confidence_score: number;
    confidence_reasoning: string;
    expressiveness_score: number;
    expressiveness_reasoning: string;
    knowledge_score: number;
    knowledge_reasoning: string;
    communication_score: number;
    communication_reasoning: string;
    strengths: string[];
    areas_for_improvement: string[];
    emotion_summary: string;
    dominant_emotion: string;
  }
): Promise<InterviewAnalysis | null> => {
  const { data, error } = await supabase
    .from('interview_analysis')
    .upsert([{
      video_interview_id: videoInterviewId,
      candidate_id: candidateId,
      ...analysisData,
      strengths: analysisData.strengths as any,
      areas_for_improvement: analysisData.areas_for_improvement as any
    }])
    .select()
    .single();

  if (error) {
    console.error('Error saving interview analysis:', error);
    return null;
  }
  return data as InterviewAnalysis;
};

export const getInterviewAnalysis = async (videoInterviewId: string): Promise<InterviewAnalysis | null> => {
  const { data, error } = await supabase
    .from('interview_analysis')
    .select('*')
    .eq('video_interview_id', videoInterviewId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching interview analysis:', error);
    return null;
  }
  return data as InterviewAnalysis;
};

// ========== FILE STORAGE OPERATIONS ==========
export const uploadFile = async (
  file: Blob | File,
  bucket: string,
  path: string
): Promise<string | undefined> => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Error uploading file:', error);
    return undefined;
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
};

export const deleteFile = async (bucket: string, path: string): Promise<boolean> => {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) {
    console.error('Error deleting file:', error);
    return false;
  }
  return true;
};
