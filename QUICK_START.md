# 🚀 Quick Start Guide - HR Portal Unified

## ⚡ Fast Setup (5 Minutes)

### Step 1: Create Supabase Project (2 min)
1. Go to https://supabase.com
2. Click "New Project"
3. Name: `hr-portal`
4. Password: (choose strong password)
5. Region: (closest to you)
6. Click "Create new project"
7. ⏰ Wait ~2 minutes for provisioning

### Step 2: Setup Database (1 min)
1. In Supabase dashboard, click "SQL Editor"
2. Open file: `d:\hack-o-clock2\hr-portal-unified\supabase\schema.sql`
3. Copy ALL contents
4. Paste in Supabase SQL Editor
5. Click "Run" (green play button)
6. ✅ You should see "Success. No rows returned"

### Step 3: Create Storage Buckets (1 min)
1. In Supabase dashboard, click "Storage"
2. Click "New bucket"
3. Name: `resumes`, Public: ✅ ON
4. Repeat for `call-recordings` (public)
5. Repeat for `video-interviews` (public)

### Step 4: Get Credentials (1 min)
1. Click "Project Settings" (gear icon)
2. Click "API"
3. Copy "Project URL"
4. Copy "anon public" key
5. Keep this tab open

### Step 5: Configure Project
1. Go to `d:\hack-o-clock2\hr-portal-unified`
2. Copy `.env.example` to `.env`
3. Edit `.env`:
```env
VITE_SUPABASE_URL=paste_your_project_url_here
VITE_SUPABASE_ANON_KEY=paste_your_anon_key_here
VITE_GEMINI_API_KEY=your_gemini_key_here
```

### Step 6: Install & Run
```bash
# Free up disk space first if needed
# Then:
cd d:\hack-o-clock2\hr-portal-unified
npm install
npm run dev
```

---

## 🧪 Quick Test

### Test 1: Create Job (30 seconds)
1. Click "+ New Job"
2. Title: `Senior Software Engineer`
3. Department: `Engineering`
4. Description: 
```
Looking for experienced React developer with:
- 5+ years React/TypeScript
- Supabase experience
- Strong problem-solving
```
5. Click "Create Job"
6. ✅ Job appears in left sidebar

### Test 2: Add Candidate (1 minute)
1. Select your job
2. Click "+ Add Candidate"
3. Name: `John Doe`
4. Email: `john@example.com`
5. Upload a PDF resume (any PDF works for testing)
6. Click "Add Candidate"
7. ✅ Candidate appears in list

### Test 3: AI Analysis (30 seconds)
1. Click "🤖 Analyze Candidates"
2. Wait ~10 seconds
3. ✅ Score and analysis appear

### Test 4: View Details (30 seconds)
1. Click on candidate name
2. ✅ See complete profile
3. ✅ View resume analysis tab
4. Click "Back to Candidates"

---

## 🔑 Where to Get API Keys

### Gemini API Key (Free)
1. Go to https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key
4. Paste in `.env`

### Supabase Keys (Free)
- Already obtained in Step 4 above
- Project URL + anon key

---

## 📁 Project Files Overview

```
hr-portal-unified/
│
├── 📘 README.md              ← Full documentation
├── 📙 DEPLOYMENT.md          ← Integration guide  
├── 📗 PROJECT_SUMMARY.md     ← What was built
├── 📕 QUICK_START.md         ← This file
│
├── supabase/
│   └── schema.sql            ← Database setup (run this!)
│
├── src/
│   ├── App.tsx               ← Main application
│   ├── components/           ← UI components
│   │   ├── JobList.tsx
│   │   ├── CandidateList.tsx
│   │   └── CandidateDetail.tsx
│   ├── services/             ← Business logic
│   │   ├── supabaseService.ts  ← Database operations
│   │   └── geminiService.ts    ← AI analysis
│   └── types/                ← TypeScript types
│
└── .env.example              ← Copy to .env
```

---

## 🎯 What Each Component Does

### JobList.tsx
- Shows all job postings
- Create/delete jobs
- Select job to view candidates

### CandidateList.tsx
- Shows candidates for selected job
- Add new candidates
- Upload PDF resumes
- Trigger AI analysis
- Shows status badges

### CandidateDetail.tsx
- Complete candidate profile
- Workflow progress bar
- 3 tabs:
  - 📄 Resume Analysis (score, ranking)
  - 📞 Call Analysis (when integrated)
  - 🎥 Interview Analysis (when integrated)

---

## 🔧 Troubleshooting

### "npm install" fails with disk space error
```bash
# Check disk space
dir C:\Users\aarya\AppData\Local\npm-cache

# Clear npm cache
npm cache clean --force

# Delete node_modules if exists
rmdir /s node_modules

# Try again
npm install
```

### "Cannot connect to Supabase"
- ✅ Check `.env` file exists (not `.env.example`)
- ✅ Check URL and key are correct (no extra spaces)
- ✅ Check internet connection
- ✅ Verify Supabase project is running

### "Gemini API error"
- ✅ Check API key is valid
- ✅ Check you have free quota
- ✅ Try visiting https://makersuite.google.com

### PDF upload fails
- ✅ Check Supabase storage buckets exist
- ✅ Verify buckets are public
- ✅ Check file is valid PDF
- ✅ Check file size < 50MB

### Database errors
- ✅ Re-run schema.sql in Supabase
- ✅ Check all tables were created
- ✅ Verify RLS policies exist

---

## 📊 Database Quick Check

Run this in Supabase SQL Editor to verify setup:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Should show:
-- - jobs
-- - candidates  
-- - resume_analysis
-- - call_sessions
-- - video_interviews
-- - interview_analysis
```

---

## 🎨 UI Overview

```
┌─────────────────────────────────────────┐
│  🎯 HR Recruitment Portal               │
├─────────┬───────────────────────────────┤
│ Jobs    │ Candidates                    │
│         │                               │
│ [+] New │ [+] Add  [🤖] Analyze        │
│         │                               │
│ ▶ SWE   │ John Doe    [APPLIED]        │
│   PM    │ Jane Smith  [SCREENED]       │
│   QA    │ Bob Wilson  [COMPLETED]      │
│         │                               │
└─────────┴───────────────────────────────┘
```

Click candidate → See full profile with analysis

---

## 🔄 Workflow Status Meanings

- **APPLIED** - Just added, resume uploaded
- **RESUME_SCREENED** - AI analysis complete
- **CALL_SCHEDULED** - Phone call booked (future)
- **CALL_COMPLETED** - Call done, analysis saved (future)
- **INTERVIEW_SCHEDULED** - Video interview booked (future)
- **INTERVIEW_COMPLETED** - Interview done, analysis saved (future)
- **REJECTED** - Not moving forward
- **ACCEPTED** - Offer extended

---

## 💾 Data Persistence Check

After adding data, refresh the page (F5):
- ✅ Jobs should still be there
- ✅ Candidates should still be there
- ✅ Analysis should still be there

If data disappears:
- ❌ Check Supabase connection
- ❌ Verify .env is loaded
- ❌ Check browser console for errors

---

## 🎓 Learn More

- **Full Documentation**: README.md
- **Integration Guide**: DEPLOYMENT.md
- **Implementation Details**: PROJECT_SUMMARY.md
- **Supabase Docs**: https://supabase.com/docs
- **Gemini Docs**: https://ai.google.dev/docs

---

## 🆘 Getting Help

### Check the Docs First
1. Read PROJECT_SUMMARY.md
2. Read DEPLOYMENT.md
3. Check Supabase dashboard for errors

### Common Issues
- Most errors are from .env configuration
- Check browser console (F12) for errors
- Verify database schema was run successfully

### Still Stuck?
- Check Supabase logs (Logs section in dashboard)
- Verify API keys are valid
- Clear browser cache and try again

---

## ✅ Success Checklist

Before using the app:
- [ ] Supabase project created
- [ ] Database schema run successfully
- [ ] 3 storage buckets created (resumes, call-recordings, video-interviews)
- [ ] .env file created with correct values
- [ ] npm install completed
- [ ] npm run dev is running
- [ ] Browser opened to http://localhost:5173

First test:
- [ ] Created a job posting
- [ ] Added a candidate with PDF
- [ ] Ran AI analysis
- [ ] Viewed candidate details
- [ ] Refreshed page - data persists

---

## 🚀 You're Ready!

The HR Portal is now set up and ready to use. Start by:
1. Creating a few job postings
2. Adding candidates with real or test resumes
3. Running AI analysis to see rankings
4. Viewing detailed candidate profiles

**Next steps** (optional):
- Integrate call scheduler components
- Integrate video interview components
- Customize UI colors/styling
- Add more fields to candidate profiles

**Enjoy your new HR Portal!** 🎉
