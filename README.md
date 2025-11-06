# HR Portal - Unified Recruitment System

A comprehensive AI-powered recruitment platform that manages the complete hiring workflow from job posting to final interview analysis.

## Features

### 🎯 Complete Recruitment Pipeline
1. **Job Management** - Create and manage job postings
2. **Resume Screening** - AI-powered resume analysis and candidate ranking
3. **Phone Screening** - Automated AI call scheduling with recording and analysis
4. **Technical Interview** - Video interview with real-time emotion detection
5. **Comprehensive Analytics** - Detailed insights at every stage

### 🤖 AI-Powered Analysis
- **Resume Matching**: Gemini AI analyzes resumes against job descriptions
- **Candidate Ranking**: Automatic scoring and ranking of applicants
- **Call Analysis**: Personality and communication assessment
- **Interview Evaluation**: Technical skills, confidence, and soft skills scoring
- **Emotion Detection**: Real-time facial expression analysis during interviews

### 📊 Data Persistence
- All candidate data stored in Supabase
- Audio and video recordings saved to cloud storage
- Complete audit trail of recruitment process
- Historical data for analytics and compliance

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Storage)
- **AI**: Google Gemini API
- **Build Tool**: Vite

## Setup Instructions

### 1. Prerequisites
- Node.js 18+ installed
- Supabase account
- Google Gemini API key

### 2. Supabase Setup

#### Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be provisioned

#### Run the Database Schema
1. In your Supabase dashboard, go to the SQL Editor
2. Copy the contents of `supabase/schema.sql`
3. Run the SQL script to create all tables

#### Create Storage Buckets
1. Go to Storage in your Supabase dashboard
2. Create three public buckets:
   - `resumes`
   - `call-recordings`
   - `video-interviews`

#### Get Your Credentials
1. Go to Project Settings > API
2. Copy your Project URL and anon/public key

### 3. Get Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the API key

### 4. Project Setup

```bash
# Navigate to the project directory
cd hr-portal-unified

# Install dependencies
npm install

# Copy environment variables
copy .env.example .env

# Edit .env and add your credentials:
# VITE_SUPABASE_URL=your_supabase_project_url
# VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
# VITE_GEMINI_API_KEY=your_gemini_api_key
```

### 5. Run the Application

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Usage Workflow

### 1. Create a Job Posting
- Click "New Job" button
- Fill in job title, department, and description
- Submit to create the posting

### 2. Add Candidates
- Select a job from the list
- Click "Add Candidate"
- Upload candidate's resume (PDF) and enter their details
- Submit to add to the database

### 3. Analyze Resumes
- Click "Analyze Candidates" button
- AI will analyze all candidates against the job description
- View scores, strengths, and weaknesses
- Candidates are automatically ranked

### 4. Schedule Phone Call (Integration Ready)
- Click on a candidate to view details
- Use the integrated call scheduling feature
- AI will conduct phone screening and schedule interview
- Call recording and analysis are automatically saved

### 5. Conduct Video Interview (Integration Ready)
- Navigate to the interview stage
- Video interview with real-time emotion detection
- Recording and complete analysis saved to database

### 6. Review Complete Profile
- View all candidate data in one place
- Access resume analysis, call recordings, and interview videos
- Make informed hiring decisions based on comprehensive data

## Database Schema

The application uses the following main tables:

- `jobs` - Job postings
- `candidates` - Applicant information
- `resume_analysis` - AI-generated resume analysis
- `call_sessions` - Phone call recordings and analysis
- `video_interviews` - Interview recordings
- `interview_analysis` - Comprehensive interview evaluation

See `supabase/schema.sql` for complete schema details.

## Integration Points

### Resume Analysis (✅ Implemented)
Located in `src/services/geminiService.ts` - `analyzeResume()`

### Call Scheduling (🔌 Integration Ready)
The existing call scheduler from `gemini-ai-interview-scheduler-with-dual-recording` can be integrated by:
1. Importing the call components
2. Passing candidate and job data
3. Saving results using `saveCallSession()` in `src/services/supabaseService.ts`

### Video Interview (🔌 Integration Ready)
The existing video interview from `ai-technical-interviewer` can be integrated by:
1. Importing interview components
2. Loading candidate resume and job description
3. Saving results using `saveVideoInterview()` and `saveInterviewAnalysis()`

## File Storage

Files are stored in Supabase Storage with public access:
- Resumes: `resumes/{job_id}/{timestamp}_{filename}.pdf`
- Call Recordings: `call-recordings/{candidate_id}/{timestamp}_call_recording.webm`
- Video Interviews: `video-interviews/{candidate_id}/{timestamp}_interview.webm`

## Security Notes

⚠️ **For Development Only**: The current setup has open RLS policies for easier development.

**For Production**:
1. Remove the "Allow all for anon" policies in `schema.sql`
2. Implement proper authentication
3. Add row-level security based on user roles
4. Restrict storage bucket access
5. Add input validation and sanitization

## Future Enhancements

- [ ] Advanced emotion analysis using both call and video data
- [ ] Voice pitch and tone analysis
- [ ] Non-verbal cue classification
- [ ] Candidate comparison tools
- [ ] Analytics dashboard
- [ ] Email notifications
- [ ] Calendar integration
- [ ] Bulk operations
- [ ] Export reports
- [ ] Mobile responsive design improvements

## Troubleshooting

### PDF Parsing Issues
Make sure the PDF.js worker is loading correctly. The CDN URL is configured in `src/utils/pdfParser.ts`.

### Supabase Connection Issues
- Verify your `.env` file has correct credentials
- Check that RLS policies are properly configured
- Ensure storage buckets exist and are public

### Gemini API Issues
- Verify API key is valid
- Check API quota limits
- Ensure proper error handling in console

## License

MIT License - See LICENSE file for details

## Support

For issues and questions, please open an issue on GitHub.
