import { useState, useEffect } from 'react';
import JobList from './components/JobList';
import CandidateList from './components/CandidateList';
import CandidateDetail from './components/CandidateDetail';
import { Job } from './types';
import { getJobs } from './services/supabaseService';

function App() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setLoading(true);
    setError(null);
    
    // Check if Supabase is configured
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
      setError('Supabase not configured. Please add your credentials to .env file.');
      setLoading(false);
      return;
    }
    
    try {
      const fetchedJobs = await getJobs();
      setJobs(fetchedJobs);
      if (fetchedJobs.length > 0 && !selectedJobId) {
        setSelectedJobId(fetchedJobs[0].id);
      }
    } catch (err) {
      console.error('Error loading jobs:', err);
      setError('Failed to load jobs. Please check your Supabase configuration.');
    }
    setLoading(false);
  };

  const handleJobCreated = () => {
    loadJobs();
  };

  const handleJobDeleted = () => {
    loadJobs();
    setSelectedJobId(jobs.length > 1 ? jobs[0].id : null);
  };

  const handleViewCandidate = (candidateId: string) => {
    setSelectedCandidateId(candidateId);
  };

  const handleBackToCandidates = () => {
    setSelectedCandidateId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading HR Portal...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-gray-800 rounded-lg shadow-xl p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-white mb-4">Configuration Required</h1>
            <p className="text-gray-300 mb-6">{error}</p>
            <div className="bg-gray-900 rounded-lg p-4 text-left">
              <p className="text-sm text-gray-400 mb-2">To get started:</p>
              <ol className="list-decimal list-inside text-sm text-gray-300 space-y-2">
                <li>Create a Supabase project at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">supabase.com</a></li>
                <li>Copy your Project URL and anon key</li>
                <li>Update the <code className="bg-gray-800 px-2 py-1 rounded">.env</code> file with your credentials</li>
                <li>Run the <code className="bg-gray-800 px-2 py-1 rounded">schema.sql</code> in Supabase SQL Editor</li>
                <li>Refresh this page</li>
              </ol>
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-6 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">HR Recruitment Portal</h1>
              <p className="text-sm text-gray-400">Complete AI-Powered Hiring Workflow</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>Jobs: {jobs.length}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {selectedCandidateId ? (
          <CandidateDetail 
            candidateId={selectedCandidateId}
            onBack={handleBackToCandidates}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Job List - Left Sidebar */}
            <div className="lg:col-span-1">
              <JobList
                jobs={jobs}
                selectedJobId={selectedJobId}
                onSelectJob={setSelectedJobId}
                onJobCreated={handleJobCreated}
                onJobDeleted={handleJobDeleted}
              />
            </div>

            {/* Candidate List - Main Area */}
            <div className="lg:col-span-2">
              {selectedJobId ? (
                <CandidateList
                  jobId={selectedJobId}
                  onViewCandidate={handleViewCandidate}
                />
              ) : (
                <div className="bg-gray-800 rounded-lg p-12 text-center">
                  <p className="text-gray-400">Select a job to view candidates</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
