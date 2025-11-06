# Deployment & Integration Guide

## Quick Start

### 1. Install Dependencies

```bash
cd hr-portal-unified
npm install
```

### 2. Setup Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_GEMINI_API_KEY=your-gemini-api-key-here
```

### 3. Setup Supabase Database

1. Copy the SQL from `supabase/schema.sql`
2. Go to Supabase Dashboard > SQL Editor
3. Paste and run the schema

4. Create storage buckets:
   - Go to Storage
   - Create bucket `resumes` (public)
   - Create bucket `call-recordings` (public)
   - Create bucket `video-interviews` (public)

### 4. Run the Application

```bash
npm run dev
```

Visit `http://localhost:5173`

---

## Integration with Existing Components

### Integrating Call Scheduler

From `gemini-ai-interview-scheduler-with-dual-recording`, integrate the call functionality:

1. **Copy the LiveAPI call components** to `hr-portal-unified/src/components/CallScheduler.tsx`

2. **Modify the call result handler** to save to Supabase:

```typescript
// After call ends and analysis is complete
import { saveCallSession } from '../services/supabaseService';

const handleCallComplete = async (
  transcript: TranscriptEntry[],
  analysis: CallAnalysis,
  audioBlob: Blob,
  duration: number
) => {
  await saveCallSession(candidateId, {
    call_audio_blob: audioBlob,
    call_duration_seconds: duration,
    confirmed_slot: analysis.confirmedSlot,
    call_summary: analysis.summary,
    personality_analysis: analysis.personalityAnalysis,
    transcript: transcript,
    call_started_at: startTime.toISOString(),
    call_ended_at: new Date().toISOString()
  });
  
  // Refresh candidate data
  loadCandidate();
};
```

3. **Add a "Schedule Call" button** in `CandidateDetail.tsx`:

```typescript
{candidate.resume_analysis && !candidate.call_session && (
  <button 
    onClick={() => setShowCallModal(true)}
    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg"
  >
    📞 Schedule Phone Call
  </button>
)}
```

### Integrating Video Interview

From `ai-technical-interviewer`, integrate the video interview:

1. **Copy video interview components** to `hr-portal-unified/src/components/VideoInterview.tsx`

2. **Modify to use candidate data**:

```typescript
import { saveVideoInterview, saveInterviewAnalysis } from '../services/supabaseService';

const handleInterviewComplete = async (
  transcript: TranscriptEntry[],
  analysis: Analysis,
  videoBlob: Blob,
  emotionData: string,
  duration: number
) => {
  // Save video interview
  const videoInterview = await saveVideoInterview(candidateId, {
    video_blob: videoBlob,
    video_duration_seconds: duration,
    transcript: transcript,
    emotion_data: emotionData,
    interview_started_at: startTime.toISOString(),
    interview_ended_at: new Date().toISOString()
  });
  
  if (videoInterview) {
    // Save analysis
    await saveInterviewAnalysis(
      videoInterview.id,
      candidateId,
      {
        overall_impression: analysis.overallImpression,
        confidence_score: analysis.confidence.score,
        confidence_reasoning: analysis.confidence.reasoning,
        expressiveness_score: analysis.expressiveness.score,
        expressiveness_reasoning: analysis.expressiveness.reasoning,
        knowledge_score: analysis.knowledge.score,
        knowledge_reasoning: analysis.knowledge.reasoning,
        communication_score: analysis.communicationSkills.score,
        communication_reasoning: analysis.communicationSkills.reasoning,
        strengths: analysis.strengths,
        areas_for_improvement: analysis.areasForImprovement,
        emotion_summary: analysis.emotionAnalysis.summary,
        dominant_emotion: analysis.emotionAnalysis.dominantEmotion
      }
    );
  }
  
  loadCandidate();
};
```

3. **Add "Start Interview" button** in `CandidateDetail.tsx`:

```typescript
{candidate.call_session && !candidate.video_interview && (
  <button 
    onClick={() => setShowInterviewModal(true)}
    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg"
  >
    🎥 Start Technical Interview
  </button>
)}
```

---

## Project Structure

```
hr-portal-unified/
├── src/
│   ├── components/
│   │   ├── JobList.tsx              # Job posting management
│   │   ├── CandidateList.tsx        # Candidate management
│   │   ├── CandidateDetail.tsx      # Complete candidate profile
│   │   ├── CallScheduler.tsx        # (To integrate)
│   │   └── VideoInterview.tsx       # (To integrate)
│   ├── services/
│   │   ├── supabaseService.ts       # All database operations
│   │   └── geminiService.ts         # AI analysis functions
│   ├── lib/
│   │   └── supabase.ts              # Supabase client
│   ├── types/
│   │   ├── index.ts                 # Application types
│   │   └── database.ts              # Database types
│   ├── utils/
│   │   └── pdfParser.ts             # PDF text extraction
│   ├── App.tsx                      # Main application
│   ├── main.tsx                     # Entry point
│   └── index.css                    # Tailwind styles
├── supabase/
│   └── schema.sql                   # Database schema
├── .env.example                     # Environment template
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## API Reference

### Supabase Service Functions

#### Jobs
- `createJob(jobData)` - Create new job posting
- `getJobs()` - Get all jobs
- `getJobById(jobId)` - Get single job
- `deleteJob(jobId)` - Delete job

#### Candidates
- `createCandidate(candidateData)` - Add candidate with resume
- `getCandidatesByJob(jobId)` - Get all candidates for a job
- `getCandidateById(candidateId)` - Get single candidate
- `getCandidateWithDetails(candidateId)` - Get candidate with all related data
- `updateCandidateStatus(candidateId, status)` - Update workflow status
- `deleteCandidate(candidateId)` - Delete candidate

#### Resume Analysis
- `saveResumeAnalysis(candidateId, score, strengths, weaknesses)` - Save AI analysis
- `getResumeAnalysis(candidateId)` - Get analysis
- `updateResumeRankings(jobId)` - Recalculate rankings

#### Call Sessions
- `saveCallSession(candidateId, callData)` - Save call recording and analysis
- `getCallSession(candidateId)` - Get call data

#### Video Interviews
- `saveVideoInterview(candidateId, videoData)` - Save interview recording
- `getVideoInterview(candidateId)` - Get interview data
- `saveInterviewAnalysis(videoInterviewId, candidateId, analysisData)` - Save analysis
- `getInterviewAnalysis(videoInterviewId)` - Get analysis

#### File Storage
- `uploadFile(file, bucket, path)` - Upload to Supabase Storage
- `deleteFile(bucket, path)` - Delete file

### Gemini Service Functions

- `analyzeResume(resumeText, jobDescription)` - AI resume analysis
- `analyzeCallTranscript(transcript)` - Call analysis
- `analyzeInterview(transcript, candidateName, jobDescription, resumeHighlights, emotionData)` - Interview analysis

---

## Testing Checklist

### 1. Job Management
- [ ] Create a new job posting
- [ ] View job in the list
- [ ] Select different jobs
- [ ] Delete a job

### 2. Candidate Management
- [ ] Add candidate with PDF resume
- [ ] View candidate in list
- [ ] Check status badge updates
- [ ] Delete candidate

### 3. Resume Analysis
- [ ] Click "Analyze Candidates"
- [ ] Verify AI generates scores
- [ ] Check strengths/weaknesses appear
- [ ] Verify rankings are correct

### 4. Candidate Detail View
- [ ] Click on candidate to view details
- [ ] Check resume tab shows analysis
- [ ] Verify workflow progress bar
- [ ] Test back navigation

### 5. Data Persistence
- [ ] Refresh page - data should persist
- [ ] Check Supabase dashboard for records
- [ ] Verify files in Storage buckets

---

## Performance Optimization

### Lazy Loading
For production, consider lazy loading components:

```typescript
const CallScheduler = lazy(() => import('./components/CallScheduler'));
const VideoInterview = lazy(() => import('./components/VideoInterview'));
```

### Caching
Implement React Query for better data caching:

```bash
npm install @tanstack/react-query
```

### Image Optimization
For resume PDFs and recordings, implement pagination and streaming.

---

## Deployment

### Deploy to Vercel

```bash
npm install -g vercel
vercel login
vercel --prod
```

Add environment variables in Vercel dashboard.

### Deploy to Netlify

```bash
npm run build
```

Upload `dist` folder to Netlify or use Netlify CLI.

---

## Monitoring & Analytics

### Add Sentry for Error Tracking

```bash
npm install @sentry/react
```

### Add Analytics

```typescript
// Track key events
- Job created
- Candidate added
- Analysis completed
- Call scheduled
- Interview completed
```

---

## Security Checklist for Production

- [ ] Remove anon RLS policies
- [ ] Implement authentication (Supabase Auth)
- [ ] Add user roles (HR, Admin, Interviewer)
- [ ] Secure file uploads (validate file types, size limits)
- [ ] Add rate limiting on AI API calls
- [ ] Sanitize all user inputs
- [ ] Enable CORS properly
- [ ] Use HTTPS only
- [ ] Implement API key rotation
- [ ] Add audit logs
- [ ] Backup database regularly

---

## Support & Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)

For questions, check the README or open an issue.
