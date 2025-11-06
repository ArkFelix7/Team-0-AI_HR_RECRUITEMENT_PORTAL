import React, { useState, useEffect } from 'react';
import { Candidate, CandidateStatus } from '../types';
import { 
  getCandidatesByJob, 
  createCandidate, 
  deleteCandidate,
  getResumeAnalysis,
  saveResumeAnalysis,
  updateResumeRankings,
  getJobById
} from '../services/supabaseService';
import { analyzeResume } from '../services/geminiService';
import { extractTextFromPdf } from '../utils/pdfParser';

interface CandidateListProps {
  jobId: string;
  onViewCandidate: (candidateId: string) => void;
}

const CandidateList: React.FC<CandidateListProps> = ({ jobId, onViewCandidate }) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadCandidates();
  }, [jobId]);

  const loadCandidates = async () => {
    setLoading(true);
    const fetchedCandidates = await getCandidatesByJob(jobId);
    setCandidates(fetchedCandidates);
    setLoading(false);
  };

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeFile) return;

    setUploading(true);

    try {
      const resumeText = await extractTextFromPdf(resumeFile);
      
      const newCandidate = await createCandidate({
        job_id: jobId,
        name,
        email: email || undefined,
        phone: phone || undefined,
        resume_text: resumeText,
        resume_file: resumeFile
      });

      if (newCandidate) {
        setName('');
        setEmail('');
        setPhone('');
        setResumeFile(null);
        setShowAddModal(false);
        loadCandidates();
      }
    } catch (error) {
      console.error('Error adding candidate:', error);
      alert('Failed to add candidate. Please try again.');
    }

    setUploading(false);
  };

  const handleDeleteCandidate = async (candidateId: string) => {
    if (!confirm('Are you sure you want to delete this candidate?')) {
      return;
    }

    const success = await deleteCandidate(candidateId);
    if (success) {
      loadCandidates();
    }
  };

  const handleAnalyzeCandidates = async () => {
    setAnalyzing(true);

    try {
      const job = await getJobById(jobId);
      if (!job) {
        alert('Job not found');
        return;
      }

      for (const candidate of candidates) {
        // Check if already analyzed
        const existing = await getResumeAnalysis(candidate.id);
        if (existing) continue;

        try {
          const analysis = await analyzeResume(candidate.resume_text, job.description);
          await saveResumeAnalysis(
            candidate.id,
            analysis.score,
            analysis.strengths,
            analysis.weaknesses
          );
        } catch (error) {
          console.error(`Error analyzing candidate ${candidate.name}:`, error);
        }
      }

      // Update rankings
      await updateResumeRankings(jobId);
      loadCandidates();
    } catch (error) {
      console.error('Error during analysis:', error);
      alert('Failed to analyze candidates');
    }

    setAnalyzing(false);
  };

  const getStatusBadge = (status: CandidateStatus) => {
    const colors: Record<CandidateStatus, string> = {
      [CandidateStatus.APPLIED]: 'bg-gray-600',
      [CandidateStatus.RESUME_SCREENED]: 'bg-blue-600',
      [CandidateStatus.CALL_SCHEDULED]: 'bg-yellow-600',
      [CandidateStatus.CALL_COMPLETED]: 'bg-purple-600',
      [CandidateStatus.INTERVIEW_SCHEDULED]: 'bg-orange-600',
      [CandidateStatus.INTERVIEW_COMPLETED]: 'bg-indigo-600',
      [CandidateStatus.REJECTED]: 'bg-red-600',
      [CandidateStatus.ACCEPTED]: 'bg-green-600'
    };

    return (
      <span className={`px-2 py-1 text-xs rounded-full ${colors[status]}`}>
        {status.replace(/_/g, ' ').toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <p className="text-gray-400">Loading candidates...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg">
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Candidates ({candidates.length})</h2>
        <div className="flex gap-2">
          {candidates.length > 0 && (
            <button
              onClick={handleAnalyzeCandidates}
              disabled={analyzing}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {analyzing ? 'Analyzing...' : '🤖 Analyze Candidates'}
            </button>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
          >
            + Add Candidate
          </button>
        </div>
      </div>

      <div className="divide-y divide-gray-700">
        {candidates.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <p>No candidates yet for this position.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-3 text-indigo-400 hover:text-indigo-300 text-sm"
            >
              Add your first candidate
            </button>
          </div>
        ) : (
          candidates.map(candidate => (
            <div
              key={candidate.id}
              className="p-4 hover:bg-gray-700/50 cursor-pointer transition-colors"
              onClick={() => onViewCandidate(candidate.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium text-white">{candidate.name}</h3>
                    {getStatusBadge(candidate.status as CandidateStatus)}
                  </div>
                  {candidate.email && (
                    <p className="text-sm text-gray-400 mt-1">{candidate.email}</p>
                  )}
                  {candidate.phone && (
                    <p className="text-sm text-gray-400">{candidate.phone}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Added: {new Date(candidate.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCandidate(candidate.id);
                  }}
                  className="ml-2 text-gray-500 hover:text-red-400 transition-colors"
                  title="Delete candidate"
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Candidate Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-gray-700">
              <h3 className="text-xl font-semibold">Add New Candidate</h3>
            </div>

            <form onSubmit={handleAddCandidate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Resume (PDF) *
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                  required
                  className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !resumeFile}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {uploading ? 'Adding...' : 'Add Candidate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateList;
