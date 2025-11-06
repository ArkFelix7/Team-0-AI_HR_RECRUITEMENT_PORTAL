// Database types generated from Supabase schema
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      jobs: {
        Row: {
          id: string
          title: string
          department: string
          description: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          department: string
          description: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          department?: string
          description?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      candidates: {
        Row: {
          id: string
          job_id: string
          name: string
          email: string | null
          phone: string | null
          resume_text: string
          resume_file_url: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_id: string
          name: string
          email?: string | null
          phone?: string | null
          resume_text: string
          resume_file_url?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          name?: string
          email?: string | null
          phone?: string | null
          resume_text?: string
          resume_file_url?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      resume_analysis: {
        Row: {
          id: string
          candidate_id: string
          score: number
          ranking: number | null
          strengths: string
          weaknesses: string
          analyzed_at: string
        }
        Insert: {
          id?: string
          candidate_id: string
          score: number
          ranking?: number | null
          strengths: string
          weaknesses: string
          analyzed_at?: string
        }
        Update: {
          id?: string
          candidate_id?: string
          score?: number
          ranking?: number | null
          strengths?: string
          weaknesses?: string
          analyzed_at?: string
        }
      }
      call_sessions: {
        Row: {
          id: string
          candidate_id: string
          call_audio_url: string | null
          call_duration_seconds: number | null
          scheduled_interview_date: string | null
          confirmed_slot: string | null
          call_summary: string | null
          personality_analysis: string | null
          transcript: Json | null
          call_started_at: string | null
          call_ended_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          candidate_id: string
          call_audio_url?: string | null
          call_duration_seconds?: number | null
          scheduled_interview_date?: string | null
          confirmed_slot?: string | null
          call_summary?: string | null
          personality_analysis?: string | null
          transcript?: Json | null
          call_started_at?: string | null
          call_ended_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          candidate_id?: string
          call_audio_url?: string | null
          call_duration_seconds?: number | null
          scheduled_interview_date?: string | null
          confirmed_slot?: string | null
          call_summary?: string | null
          personality_analysis?: string | null
          transcript?: Json | null
          call_started_at?: string | null
          call_ended_at?: string | null
          created_at?: string
        }
      }
      video_interviews: {
        Row: {
          id: string
          candidate_id: string
          video_recording_url: string | null
          video_duration_seconds: number | null
          transcript: Json | null
          emotion_data: string | null
          interview_started_at: string | null
          interview_ended_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          candidate_id: string
          video_recording_url?: string | null
          video_duration_seconds?: number | null
          transcript?: Json | null
          emotion_data?: string | null
          interview_started_at?: string | null
          interview_ended_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          candidate_id?: string
          video_recording_url?: string | null
          video_duration_seconds?: number | null
          transcript?: Json | null
          emotion_data?: string | null
          interview_started_at?: string | null
          interview_ended_at?: string | null
          created_at?: string
        }
      }
      interview_analysis: {
        Row: {
          id: string
          video_interview_id: string
          candidate_id: string
          overall_impression: string
          confidence_score: number
          confidence_reasoning: string
          expressiveness_score: number
          expressiveness_reasoning: string
          knowledge_score: number
          knowledge_reasoning: string
          communication_score: number
          communication_reasoning: string
          strengths: Json
          areas_for_improvement: Json
          emotion_summary: string
          dominant_emotion: string
          analyzed_at: string
        }
        Insert: {
          id?: string
          video_interview_id: string
          candidate_id: string
          overall_impression: string
          confidence_score: number
          confidence_reasoning: string
          expressiveness_score: number
          expressiveness_reasoning: string
          knowledge_score: number
          knowledge_reasoning: string
          communication_score: number
          communication_reasoning: string
          strengths: Json
          areas_for_improvement: Json
          emotion_summary: string
          dominant_emotion: string
          analyzed_at?: string
        }
        Update: {
          id?: string
          video_interview_id?: string
          candidate_id?: string
          overall_impression?: string
          confidence_score?: number
          confidence_reasoning?: string
          expressiveness_score?: number
          expressiveness_reasoning?: string
          knowledge_score?: number
          knowledge_reasoning?: string
          communication_score?: number
          communication_reasoning?: string
          strengths?: Json
          areas_for_improvement?: Json
          emotion_summary?: string
          dominant_emotion?: string
          analyzed_at?: string
        }
      }
    }
  }
}
