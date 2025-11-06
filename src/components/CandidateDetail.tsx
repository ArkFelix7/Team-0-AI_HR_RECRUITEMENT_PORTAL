import React, { useState, useEffect } from 'react';
import { CandidateWithDetails } from '../types';
import { getCandidateWithDetails } from '../services/supabaseService';
import CallScheduler from './CallScheduler';
import InterviewScheduler from './InterviewScheduler';

interface CandidateDetailProps {
  candidateId: string;
  onBack: () => void;
}

const CandidateDetail: React.FC<CandidateDetailProps> = ({ candidateId, onBack }) => {
  const [candidate, setCandidate] = useState<CandidateWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'resume' | 'call' | 'interview'>('resume');
  const [showCallScheduler, setShowCallScheduler] = useState(false);
  const [showInterviewScheduler, setShowInterviewScheduler] = useState(false);

  useEffect(() => {
    loadCandidate();
  }, [candidateId]);

  const loadCandidate = async () => {
    setLoading(true);
    const data = await getCandidateWithDetails(candidateId);
    setCandidate(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <p className="text-gray-400">Loading candidate details...</p>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <p className="text-red-400">Candidate not found</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <button onClick={onBack} className="text-gray-400 hover:text-white mb-4 flex items-center gap-2">
          ← Back to Candidates
        </button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{candidate.name}</h1>
            {candidate.email && <p className="text-gray-400">{candidate.email}</p>}
            {candidate.phone && <p className="text-gray-400">{candidate.phone}</p>}
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Applied for:</p>
            <p className="text-lg font-semibold">{candidate.job?.title}</p>
            <p className="text-gray-400">{candidate.job?.department}</p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mt-4">
          <span className="px-3 py-1.5 bg-indigo-600 rounded-full text-sm font-medium">
            {candidate.status.replace(/_/g, ' ').toUpperCase()}
          </span>
        </div>
      </div>

      {/* Workflow Progress */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Recruitment Pipeline</h2>
        <div className="flex items-center justify-between">
          {[
            { key: 'resume', label: 'Resume Analysis', icon: '📄', completed: !!candidate.resume_analysis },
            { key: 'call', label: 'Phone Screening', icon: '📞', completed: !!candidate.call_session },
            { key: 'interview', label: 'Technical Interview', icon: '🎥', completed: !!candidate.video_interview }
          ].map((stage, index) => (
            <React.Fragment key={stage.key}>
              <div className="flex flex-col items-center flex-1">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                  stage.completed ? 'bg-green-600' : 'bg-gray-700'
                }`}>
                  {stage.icon}
                </div>
                <p className="text-sm mt-2 text-center">{stage.label}</p>
                {stage.completed && <p className="text-xs text-green-400 mt-1">✓ Completed</p>}
              </div>
              {index < 2 && (
                <div className={`flex-1 h-1 mx-2 ${
                  stage.completed ? 'bg-green-600' : 'bg-gray-700'
                }`}></div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-gray-800 rounded-lg shadow-lg">
        <div className="flex border-b border-gray-700">
          {[
            { key: 'resume', label: 'Resume Analysis', available: !!candidate.resume_analysis },
            { key: 'call', label: 'Call Recording & Analysis', available: !!candidate.call_session },
            { key: 'interview', label: 'Video Interview & Analysis', available: !!candidate.interview_analysis }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              disabled={!tab.available}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-b-2 border-indigo-500 text-white'
                  : 'text-gray-400 hover:text-white'
              } ${!tab.available ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {tab.label}
              {!tab.available && ' (Not Available)'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'resume' && candidate.resume_analysis && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Match Score</p>
                  <p className="text-4xl font-bold text-indigo-400">{candidate.resume_analysis.score.toFixed(1)}%</p>
                </div>
                {candidate.resume_analysis.ranking && (
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-1">Ranking</p>
                    <p className="text-4xl font-bold text-purple-400">#{candidate.resume_analysis.ranking}</p>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 text-green-400">Strengths</h3>
                <p className="text-gray-300 leading-relaxed">{candidate.resume_analysis.strengths}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 text-orange-400">Weaknesses / Gaps</h3>
                <p className="text-gray-300 leading-relaxed">{candidate.resume_analysis.weaknesses}</p>
              </div>

              <div className="bg-gray-700/30 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-2">Resume Preview</h3>
                <p className="text-sm text-gray-400 max-h-48 overflow-y-auto whitespace-pre-wrap">
                  {candidate.resume_text.substring(0, 1000)}...
                </p>
                {candidate.resume_file_url && (
                  <a
                    href={candidate.resume_file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block text-indigo-400 hover:text-indigo-300 text-sm"
                  >
                    📄 View Full Resume →
                  </a>
                )}
              </div>

              {/* Schedule Call Button */}
              {!candidate.call_session && candidate.job && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={() => setShowCallScheduler(true)}
                    className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-8 rounded-lg transition-transform transform hover:scale-105 shadow-lg flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.986.836l.74 4.435a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Schedule Interview Call
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'resume' && !candidate.resume_analysis && (
            <div className="text-center text-gray-400 py-8">
              No resume analysis available yet.
            </div>
          )}

          {activeTab === 'call' && candidate.call_session && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Confirmed Slot</p>
                  <p className="text-lg font-semibold text-cyan-400">
                    {candidate.call_session.confirmed_slot || 'Not confirmed'}
                  </p>
                </div>
                {candidate.call_session.call_duration_seconds && (
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-1">Call Duration</p>
                    <p className="text-lg font-semibold">
                      {Math.floor(candidate.call_session.call_duration_seconds / 60)}:{(candidate.call_session.call_duration_seconds % 60).toString().padStart(2, '0')}
                    </p>
                  </div>
                )}
              </div>

              {candidate.call_session.call_audio_url && (
                <div className="bg-gray-700/30 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3">📞 Call Recording</h3>
                  <audio controls className="w-full">
                    <source src={candidate.call_session.call_audio_url} type="audio/webm" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}

              {candidate.call_session.call_summary && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Call Summary</h3>
                  <p className="text-gray-300 leading-relaxed">{candidate.call_session.call_summary}</p>
                </div>
              )}

              {candidate.call_session.personality_analysis && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Personality Analysis</h3>
                  <p className="text-gray-300 leading-relaxed">{candidate.call_session.personality_analysis}</p>
                </div>
              )}

              {candidate.call_session.transcript && (
                <div className="bg-gray-700/30 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3">Call Transcript</h3>
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {(candidate.call_session.transcript as any[]).map((entry: any, idx: number) => (
                      <div key={idx} className="text-sm">
                        <span className={`font-semibold ${entry.speaker === 'AI' ? 'text-cyan-400' : 'text-blue-400'}`}>
                          {entry.speaker}:
                        </span>
                        <span className="text-gray-300 ml-2">{entry.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Start Interview Button */}
              {!candidate.video_interview && candidate.job && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={() => setShowInterviewScheduler(true)}
                    className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-8 rounded-lg transition-transform transform hover:scale-105 shadow-lg flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Start Technical Interview
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'interview' && candidate.interview_analysis && (
            <div className="space-y-6">
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-2">Overall Impression</h3>
                <p className="text-gray-300 leading-relaxed">{candidate.interview_analysis.overall_impression}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Confidence', score: candidate.interview_analysis.confidence_score, reasoning: candidate.interview_analysis.confidence_reasoning },
                  { label: 'Expressiveness', score: candidate.interview_analysis.expressiveness_score, reasoning: candidate.interview_analysis.expressiveness_reasoning },
                  { label: 'Knowledge', score: candidate.interview_analysis.knowledge_score, reasoning: candidate.interview_analysis.knowledge_reasoning },
                  { label: 'Communication', score: candidate.interview_analysis.communication_score, reasoning: candidate.interview_analysis.communication_reasoning }
                ].map((metric) => (
                  <div key={metric.label} className="bg-gray-700/50 rounded-lg p-4 text-center">
                    <p className="text-gray-400 text-sm mb-2">{metric.label}</p>
                    <p className="text-3xl font-bold text-indigo-400">{metric.score}</p>
                    <p className="text-xs text-gray-500 mt-2">{metric.reasoning}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-green-400">Strengths</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-300">
                    {(candidate.interview_analysis.strengths as any[]).map((strength, idx) => (
                      <li key={idx}>{strength}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-orange-400">Areas for Improvement</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-300">
                    {(candidate.interview_analysis.areas_for_improvement as any[]).map((area, idx) => (
                      <li key={idx}>{area}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-2">Emotion Analysis</h3>
                <p className="text-gray-300 mb-2">{candidate.interview_analysis.emotion_summary}</p>
                <p className="text-sm">
                  <span className="text-gray-400">Dominant Emotion: </span>
                  <span className="text-purple-400 font-semibold">{candidate.interview_analysis.dominant_emotion}</span>
                </p>
              </div>

              {candidate.video_interview?.video_recording_url && (
                <div className="bg-gray-700/30 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3">🎥 Video Recording</h3>
                  <video controls className="w-full max-w-2xl mx-auto rounded-lg">
                    <source src={candidate.video_interview.video_recording_url} type="video/webm" />
                    Your browser does not support the video element.
                  </video>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Call Scheduler Modal */}
      {showCallScheduler && candidate.job && (
        <CallScheduler
          candidateId={candidate.id}
          candidateName={candidate.name}
          candidateEmail={candidate.email}
          candidatePhone={candidate.phone}
          jobDetails={candidate.job}
          resumeAnalysis={candidate.resume_analysis}
          onComplete={() => {
            setShowCallScheduler(false);
            loadCandidate(); // Reload to show updated call data
          }}
          onCancel={() => setShowCallScheduler(false)}
        />
      )}

      {/* Interview Scheduler Modal */}
      {showInterviewScheduler && candidate.job && (
        <InterviewScheduler
          candidateId={candidate.id}
          candidateName={candidate.name}
          jobDetails={candidate.job}
          resumeAnalysis={candidate.resume_analysis}
          onComplete={() => {
            setShowInterviewScheduler(false);
            loadCandidate(); // Reload to show interview data
          }}
        />
      )}
    </div>
  );
};

export default CandidateDetail;
