# Vercel Deployment Guide

## 🚀 Quick Deploy to Vercel

### Prerequisites
- GitHub repository with hr-portal-unified code
- Vercel account (sign up at vercel.com)
- Supabase project set up
- Gemini API key

---

## Step-by-Step Deployment

### 1. Prepare Your Repository

Make sure your repository has been pushed to GitHub:
```bash
cd d:\hack-o-clock2\hr-portal-unified
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Import Project to Vercel

1. Go to **[vercel.com/new](https://vercel.com/new)**
2. Click **"Import Git Repository"**
3. Select your repository from the list
4. **Important Configuration:**
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (if deploying from hr-portal-unified root)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)

### 3. Configure Environment Variables

Before clicking "Deploy", add these environment variables:

Click on **"Environment Variables"** and add:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

**Important Notes:**
- ✅ Environment variable names MUST start with `VITE_`
- ✅ Add variables to **ALL** environments (Production, Preview, Development)
- ✅ Get Supabase credentials from: Project Settings → API
- ✅ Get Gemini API key from: [Google AI Studio](https://makersuite.google.com/app/apikey)

### 4. Deploy

1. Click **"Deploy"**
2. Wait for build to complete (2-3 minutes)
3. Once deployed, click **"Visit"** to see your live app

---

## Troubleshooting Common Issues

### ❌ Blank Page After Deployment

**Problem**: Website shows blank page

**Solution**:
1. Open browser console (F12)
2. Look for errors like "API_KEY environment variable not set"
3. Go to Vercel Project Settings → Environment Variables
4. Verify all three variables are added correctly
5. Click **"Redeploy"** from Deployments tab

### ❌ Environment Variables Not Working

**Problem**: Console shows "API key not configured"

**Checklist**:
- ✅ Variable names start with `VITE_` prefix?
- ✅ Variables added to ALL environments?
- ✅ Values don't have extra spaces or quotes?
- ✅ Redeployed after adding variables?

**Fix**:
1. Delete existing environment variables
2. Re-add them carefully (copy-paste values)
3. Make sure to select "All" for environment
4. Trigger a new deployment

### ❌ 404 Errors for CSS/JS Files

**Problem**: Failed to load resources

**Solution**:
1. Check build logs in Vercel dashboard
2. Verify `dist` folder is being created
3. Ensure `vite.config.ts` has correct base URL
4. Redeploy

### ❌ Supabase Connection Error

**Problem**: Can't connect to Supabase

**Checklist**:
- ✅ Supabase URL is correct (ends with `.supabase.co`)
- ✅ Using `anon/public` key, not `service_role` key
- ✅ RLS policies are set up in Supabase
- ✅ Storage buckets exist and are public

---

## After Deployment

### 1. Test the Application

Visit your deployed URL and test:
- ✅ Create a new job posting
- ✅ Add a candidate with PDF resume
- ✅ Analyze resumes (should work)
- ✅ Schedule call (should work)
- ✅ Start video interview (should work)

### 2. Check Browser Console

Open F12 and verify:
- ✅ No errors about missing API keys
- ✅ No 404 errors
- ✅ Network requests to Supabase working
- ✅ No CORS errors

### 3. Monitor Build Logs

In Vercel dashboard:
1. Go to **Deployments** tab
2. Click on latest deployment
3. View **Build Logs**
4. Check for any warnings or errors

---

## Environment Variables Reference

| Variable | Where to Get It | Example |
|----------|----------------|---------|
| `VITE_SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL | `https://abc123.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → Project API keys (anon public) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `VITE_GEMINI_API_KEY` | Google AI Studio → Get API Key | `AIzaSyAbc123...` |

---

## Custom Domain (Optional)

To add your own domain:
1. Go to Vercel Project Settings → Domains
2. Add your domain (e.g., `hr-portal.yourdomain.com`)
3. Update DNS records as instructed by Vercel
4. Wait for SSL certificate to be issued (automatic)

---

## Continuous Deployment

Once set up, every push to your GitHub repository will automatically:
1. Trigger a new build in Vercel
2. Run tests (if configured)
3. Deploy to production (or preview for branches)
4. Send deployment status to GitHub

---

## Production Checklist

Before going live:
- [ ] Environment variables configured
- [ ] Supabase RLS policies tested
- [ ] Storage buckets created and public
- [ ] API rate limits checked (Gemini)
- [ ] Error handling tested
- [ ] Browser compatibility tested
- [ ] Mobile responsiveness verified

---

## Support

If you encounter issues:
1. Check Vercel build logs
2. Check browser console
3. Verify environment variables
4. Review Supabase connection
5. Test Gemini API key separately

---

## Quick Redeploy

To force a new deployment:
```bash
# Make a small change
git commit --allow-empty -m "Force redeploy"
git push origin main
```

Or in Vercel Dashboard:
1. Go to Deployments
2. Click "..." menu on latest deployment
3. Click "Redeploy"
