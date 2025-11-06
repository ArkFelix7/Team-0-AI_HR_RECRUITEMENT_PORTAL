# Call Scheduler Integration - Complete ✅

## What Was Built

A complete AI-powered call scheduling system integrated into the HR Portal that:
1. Uses Gemini Live API for real-time voice conversations
2. Has full context of candidate's resume analysis and job details
3. Records the call audio and saves to Supabase Storage
4. Analyzes the conversation with AI for personality insights
5. Saves all data (transcript, analysis, recording) to database

## Files Created/Modified

### New Files:
1. **`src/components/CallScheduler.tsx`** (600+ lines)
   - Complete call interface with live transcription
   - Audio recording and playback
   - Real-time conversation display
   - Post-call analysis results
   - Modal dialog component

2. **`src/services/callService.ts`** (160 lines)
   - `startLiveCallSession()` - Initiates Gemini Live API session
   - `getPostCallAnalysis()` - Analyzes transcript with AI
   - Context-aware system instructions with resume data

### Modified Files:
1. **`src/components/CandidateDetail.tsx`**
   - Added "Schedule Interview Call" button (appears after resume analysis)
   - Integrated CallScheduler modal
   - Auto-reloads candidate data after call completion

## How It Works

### 1. Context-Aware AI Caller
```typescript
const SYSTEM_INSTRUCTION = `You are calling ${candidateName} for ${jobTitle}

Candidate Background:
- Resume Score: ${resumeScore}/100
- Key Strengths: ${strengths}
- Areas to assess: ${weaknesses}

Task: Schedule technical interview...`
```

The AI knows:
- Candidate's name
- Job title and department
- Resume analysis score
- Strengths and weaknesses to discuss
- Company context

### 2. Live Audio Processing
- Captures microphone input at 16kHz
- Sends PCM audio to Gemini Live API in real-time
- Receives AI voice responses at 24kHz
- Records both sides of conversation
- Displays live transcription

### 3. Database Integration
After call ends:
- Uploads audio recording to Supabase Storage bucket (`call-recordings`)
- Saves to `call_sessions` table:
  - Transcript (JSONB array)
  - Call duration
  - Confirmed interview slot
  - Call summary
  - Personality analysis
  - Audio file URL

## User Flow

1. **From Candidate Detail Page:**
   - HR views candidate with completed resume analysis
   - Clicks "Schedule Interview Call" button
   - CallScheduler modal opens

2. **During Call:**
   - Shows candidate context (resume score, job details)
   - Click "Start Call" → requests microphone permission
   - Live conversation with real-time transcription
   - Both AI and User messages appear in chat bubbles
   - Click "End Call" when done

3. **After Call:**
   - Shows analysis results:
     - ✅ Confirmed interview slot
     - 📝 Call summary
     - 🎭 Personality analysis
   - Audio recording with playback
   - Full transcript
   - Click "Complete & Save" → saves to database

4. **Back to Candidate Detail:**
   - Call session data appears in "Phone Screening" tab
   - Pipeline shows call as completed
   - Can replay recording and review analysis

## Key Features

### ✅ Real-Time Transcription
- Both user and AI speech transcribed instantly
- Displays interim (gray/italic) and final text
- Auto-scrolls chat as conversation progresses

### ✅ Context-Aware Conversation
- AI knows candidate's resume strengths/weaknesses
- Mentions job title naturally in conversation
- Offers specific interview time slots
- Professional and friendly tone

### ✅ Dual Audio Recording
- Records both incoming AI audio and user microphone
- Mixes both channels into single WebM file
- Playback after call ends
- Uploads to Supabase Storage

### ✅ AI-Powered Analysis
- Extracts confirmed interview slot
- Summarizes conversation in 2-3 sentences
- Analyzes candidate's tone, confidence, politeness
- Saves structured data to database

### ✅ Error Handling
- Microphone permission errors
- API connection failures
- Network issues
- User-friendly error messages

## Technical Stack

- **Gemini Live API**: `gemini-2.0-flash-exp` model with native audio
- **Web Audio API**: For audio capture and playback
- **MediaRecorder API**: For recording conversation
- **ScriptProcessor**: For PCM audio encoding
- **AudioContext**: For audio graph management
- **Supabase**: Storage for recordings, database for metadata

## Configuration Required

### Environment Variables (.env)
```
VITE_GEMINI_API_KEY=your_key_here
VITE_SUPABASE_URL=your_url_here
VITE_SUPABASE_ANON_KEY=your_key_here
```

### Supabase Storage Bucket
- Bucket name: `call-recordings`
- Public: Yes
- Policies: Allow anon uploads (for development)

### Database Table
- Table: `call_sessions` (already created from schema.sql)
- Columns: candidate_id, call_audio_url, transcript, analysis fields

## Testing the Feature

### 1. Complete Resume Analysis First
```
1. Add candidate with PDF resume
2. Click "Analyze Candidates"
3. View candidate detail page
```

### 2. Start Call
```
1. Look for "Schedule Interview Call" button
2. Click button → modal opens
3. Review candidate context shown
4. Click "Start Call"
5. Allow microphone when prompted
```

### 3. Have Conversation
```
AI: "Good morning, am I speaking with [Name]?"
You: "Yes, this is [Name]"
AI: "I'm calling about the [Job Title] position..."
```

### 4. Confirm Slot
```
AI offers: Monday 10 AM, Wednesday 2 PM, Friday 4 PM
You: "Wednesday at 2 PM works for me"
AI: "Great! I've confirmed Wednesday at 2 PM"
```

### 5. End Call
```
1. Click "End Call" button
2. Wait for analysis (2-3 seconds)
3. Review results
4. Click "Complete & Save"
```

### 6. Verify Data
```
1. Go back to candidate list
2. Open same candidate
3. Check "Phone Screening" tab
4. Should see:
   - Confirmed slot
   - Call recording (playback)
   - Transcript
   - Analysis
```

## Next Steps

### Immediate:
- ✅ Call scheduler working
- ✅ Context-aware AI
- ✅ Database integration
- ⏳ Add video interview component (similar pattern)

### Future Enhancements:
- Multiple language support
- Calendar integration (Google Calendar, Outlook)
- Email confirmation after call
- SMS reminders for interview slot
- Call quality ratings
- Analytics dashboard for call metrics

## Troubleshooting

### "Microphone access denied"
- Check browser permissions
- Allow microphone in site settings
- Try HTTPS (localhost is OK)

### "Could not connect to AI"
- Verify VITE_GEMINI_API_KEY is set
- Check API key has correct permissions
- Ensure gemini-2.0-flash-exp model is available

### "Bucket not found"
- Create `call-recordings` bucket in Supabase
- Mark as public
- Add RLS policies (see storage-setup.sql)

### Audio not recording
- Check MediaRecorder browser support
- Verify audio context setup
- Check console for errors

### Call data not saving
- Run fix-rls-policies.sql
- Check network tab for 406 errors
- Verify candidate_id exists

## Summary

The call scheduler is now **fully integrated** with:
✅ Resume analysis context
✅ Job details context  
✅ Live voice conversation
✅ Real-time transcription
✅ Audio recording
✅ AI-powered analysis
✅ Database persistence
✅ UI integration in candidate detail page

**The recruitment pipeline now has:**
1. Resume Analysis (AI-powered with Gemini)
2. **Phone Screening (NEW - Live AI calls)** ⭐
3. Video Interview (to be integrated next)

All three stages will store data in Supabase and display in the unified dashboard! 🎉
