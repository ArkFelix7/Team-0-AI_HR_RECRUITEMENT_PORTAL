// TypeScript types for the entire HR Portal system

// ========== Enums ==========
export enum CandidateStatus {
  APPLIED = 'applied',
  RESUME_SCREENED = 'resume_screened',
  CALL_SCHEDULED = 'call_scheduled',
  CALL_COMPLETED = 'call_completed',
  INTERVIEW_SCHEDULED = 'interview_scheduled',
  INTERVIEW_COMPLETED = 'interview_completed',
  REJECTED = 'rejected',
  ACCEPTED = 'accepted'
}

export enum JobStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
  DRAFT = 'draft'
}

export enum Speaker {
  USER = 'User',
  AI = 'AI',
  MODEL = 'model'
}

export enum InterviewStage {
  SETUP,
  PRE_INTERVIEW,
  IN_INTERVIEW,
  ANALYSIS
}

export enum WorkflowStage {
  JOB_CREATION = 'job_creation',
  RESUME_SCREENING = 'resume_screening',
  CALL_SCHEDULING = 'call_scheduling',
  VIDEO_INTERVIEW = 'video_interview',
  FINAL_DECISION = 'final_decision'
}

// ========== Database Types ==========
export interface Job {
  id: string;
  title: string;
  department: string;
  description: string;
  status: JobStatus;
  created_at: string;
  updated_at: string;
}

export interface Candidate {
  id: string;
  job_id: string;
  name: string;
  email?: string;
  phone?: string;
  resume_text: string;
  resume_file_url?: string;
  status: CandidateStatus;
  created_at: string;
  updated_at: string;
}

export interface ResumeAnalysis {
  id: string;
  candidate_id: string;
  score: number;
  ranking?: number;
  strengths: string;
  weaknesses: string;
  analyzed_at: string;
}

export interface CallSession {
  id: string;
  candidate_id: string;
  call_audio_url?: string;
  call_duration_seconds?: number;
  scheduled_interview_date?: string;
  confirmed_slot?: string;
  call_summary?: string;
  personality_analysis?: string;
  transcript?: TranscriptEntry[];
  call_started_at?: string;
  call_ended_at?: string;
  created_at: string;
}

export interface VideoInterview {
  id: string;
  candidate_id: string;
  video_recording_url?: string;
  video_duration_seconds?: number;
  transcript?: TranscriptEntry[];
  emotion_data?: string;
  interview_started_at?: string;
  interview_ended_at?: string;
  created_at: string;
}

export interface InterviewAnalysis {
  id: string;
  video_interview_id: string;
  candidate_id: string;
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
  analyzed_at: string;
}

// ========== UI/Component Types ==========
export interface TranscriptEntry {
  speaker: Speaker | string;
  text: string;
  isFinal?: boolean;
}

export interface Score {
  score: number;
  reasoning: string;
}

export interface EmotionAnalysis {
  summary: string;
  dominantEmotion: string;
}

export interface Analysis {
  overallImpression: string;
  confidence: Score;
  expressiveness: Score;
  knowledge: Score;
  communicationSkills: Score;
  strengths: string[];
  areasForImprovement: string[];
  emotionAnalysis: EmotionAnalysis;
}

export interface CallAnalysis {
  confirmedSlot: string;
  summary: string;
  personalityAnalysis: string;
}

// ========== Complete Candidate View (with all related data) ==========
export interface CandidateWithDetails extends Candidate {
  job?: Job;
  resume_analysis?: ResumeAnalysis;
  call_session?: CallSession;
  video_interview?: VideoInterview;
  interview_analysis?: InterviewAnalysis;
}

// ========== Form Types ==========
export interface CreateJobInput {
  title: string;
  department: string;
  description: string;
  status?: JobStatus;
}

export interface CreateCandidateInput {
  job_id: string;
  name: string;
  email?: string;
  phone?: string;
  resume_text: string;
  resume_file?: File;
}

export interface UpdateCandidateStatusInput {
  candidate_id: string;
  status: CandidateStatus;
}
