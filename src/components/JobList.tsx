import React, { useState } from 'react';
import { Job, JobStatus } from '../types';
import { createJob, deleteJob } from '../services/supabaseService';

interface JobListProps {
  jobs: Job[];
  selectedJobId: string | null;
  onSelectJob: (jobId: string) => void;
  onJobCreated: () => void;
  onJobDeleted: () => void;
}

const JobList: React.FC<JobListProps> = ({ jobs, selectedJobId, onSelectJob, onJobCreated, onJobDeleted }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    const newJob = await createJob({
      title,
      department,
      description,
      status: JobStatus.ACTIVE
    });

    if (newJob) {
      setTitle('');
      setDepartment('');
      setDescription('');
      setShowCreateModal(false);
      onJobCreated();
    }

    setCreating(false);
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job posting? All candidates will be removed.')) {
      return;
    }

    const success = await deleteJob(jobId);
    if (success) {
      onJobDeleted();
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg">
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Job Postings</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
        >
          + New Job
        </button>
      </div>

      <div className="divide-y divide-gray-700">
        {jobs.length === 0 ? (
          <div className="p-6 text-center text-gray-400">
            <p>No job postings yet.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-3 text-indigo-400 hover:text-indigo-300 text-sm"
            >
              Create your first job posting
            </button>
          </div>
        ) : (
          jobs.map(job => (
            <div
              key={job.id}
              onClick={() => onSelectJob(job.id)}
              className={`p-4 cursor-pointer transition-colors ${
                selectedJobId === job.id
                  ? 'bg-indigo-900/30 border-l-4 border-indigo-500'
                  : 'hover:bg-gray-700/50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white truncate">{job.title}</h3>
                  <p className="text-sm text-gray-400 mt-0.5">{job.department}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(job.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteJob(job.id);
                  }}
                  className="ml-2 text-gray-500 hover:text-red-400 transition-colors"
                  title="Delete job"
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Job Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-gray-700">
              <h3 className="text-xl font-semibold">Create New Job Posting</h3>
            </div>

            <form onSubmit={handleCreateJob} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Job Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., Senior Software Engineer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Department *
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., Engineering"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Job Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={6}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Describe the role, responsibilities, and requirements..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobList;
