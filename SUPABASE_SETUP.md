# Supabase Setup Guide - HR Portal

## Quick Fix for Current Issues

You're seeing these errors:
1. ❌ **Bucket not found** - Storage buckets need to be created
2. ❌ **406 errors** - RLS policies blocking access
3. ✅ **Gemini API fixed** - Now using `gemini-1.5-flash` model

## Step-by-Step Setup

### 1. Create Storage Buckets

Go to your Supabase project dashboard:

1. Navigate to **Storage** in the left sidebar
2. Click **New Bucket**
3. Create these 3 buckets:

   **Bucket 1:**
   - Name: `resumes`
   - Public: ✅ Yes
   - Click Create

   **Bucket 2:**
   - Name: `call-recordings`
   - Public: ✅ Yes
   - Click Create

   **Bucket 3:**
   - Name: `video-interviews`
   - Public: ✅ Yes
   - Click Create

### 2. Set Storage Policies

For each bucket you just created:

1. Click on the bucket name
2. Go to **Policies** tab
3. Click **New Policy**
4. Choose **For full customization** 
5. Enable ALL operations: SELECT, INSERT, UPDATE, DELETE
6. For **Target roles**, select: `public`, `anon`, `authenticated`
7. For **USING expression**, enter: `true`
8. For **WITH CHECK expression**, enter: `true`
9. Click **Save**

**OR** run the SQL file:
- Go to **SQL Editor**
- Copy and paste the contents of `supabase/storage-setup.sql`
- Click **Run**

### 3. Verify Database Tables

Make sure you've already run `supabase/schema.sql`:

1. Go to **SQL Editor**
2. Run this query to check tables exist:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

You should see: `jobs`, `candidates`, `resume_analysis`, `call_sessions`, `video_interviews`, `interview_analysis`

### 4. Test the Application

1. Hard refresh your browser (Ctrl+Shift+R)
2. Try adding a candidate with a PDF resume
3. Click **Analyze Candidates** button

## Troubleshooting

### Still getting "Bucket not found"?
- Double-check bucket names are exactly: `resumes`, `call-recordings`, `video-interviews` (lowercase, with hyphens)
- Ensure buckets are marked as **Public**

### Still getting 406 errors?
- Make sure RLS policies allow `anon` role (for development)
- Check that the policies were created successfully in SQL Editor

### Gemini API errors?
- Verify your `VITE_GEMINI_API_KEY` is correct in `.env`
- Make sure you have credits in your Google AI Studio account

## Current Status

✅ Fixed: Gemini API model (now using `gemini-1.5-flash`)
✅ Fixed: PDF parser (using CDN version)
⏳ Pending: Storage buckets creation (manual step above)
⏳ Pending: Storage policies setup (manual step above)

After completing steps 1-2 above, the "Analyze Candidates" feature should work perfectly!
