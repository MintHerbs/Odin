# Vercel Deployment Guide

## Overview

This application has been refactored to work on Vercel's serverless environment. The AI lyrics generation that previously used `child_process.spawn()` now uses serverless-compatible API routes.

## Key Changes

### 1. New Serverless Architecture

**Before (Local Development):**
- Used `example.mjs` with `spawn()` to run background processes
- Not compatible with Vercel's serverless functions

**After (Vercel-Compatible):**
- Created `src/app/lib/generateLyrics.js` - Reusable generation logic
- Created `src/app/api/generate-ai-lyrics/route.js` - Edge Runtime API route
- Updated `src/app/api/trigger-gen/route.js` - Now calls the new API instead of spawning

### 2. Edge Runtime Configuration

The new `/api/generate-ai-lyrics` route uses:
```javascript
export const runtime = 'edge';
export const maxDuration = 25; // 25 seconds on Hobby plan
```

This provides:
- Up to 25 seconds execution time (vs 10s for Node.js runtime)
- Better performance for AI generation
- Compatible with Vercel's infrastructure

### 3. Sequential Generation Strategy

To avoid timeouts, lyrics are generated **sequentially** (one at a time) instead of in parallel:
- Each lyric is stored in Supabase immediately after generation
- Progress is logged for monitoring
- If one fails, the error is caught and logged
- The `/api/check-ai-ready` endpoint can detect partial completions

## Environment Variables Required

Ensure these are set in your Vercel project settings:

```bash
# Supabase (Public - can be exposed to client)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key

# OpenAI (Private - server-side only, NO NEXT_PUBLIC_ prefix)
OPENAI_API_KEY=sk-proj-...
OPENAI_ORG_ID=org-...
```

### Setting Environment Variables in Vercel:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable with the appropriate scope:
   - **Production**: For live deployment
   - **Preview**: For preview deployments
   - **Development**: For local development

## Deployment Steps

### 1. Push to GitHub

```bash
git add .
git commit -m "Refactor for Vercel serverless compatibility"
git push origin main
```

### 2. Deploy to Vercel

If you haven't connected your repo yet:

```bash
# Install Vercel CLI
npm i -g vercel

# Login and deploy
vercel login
vercel --prod
```

Or use the Vercel Dashboard:
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure environment variables
5. Deploy

### 3. Verify Deployment

After deployment, test the generation endpoint:

```bash
# Replace with your Vercel URL
curl -X POST https://your-app.vercel.app/api/trigger-gen \
  -H "Content-Type: application/json" \
  -d '{"session_id": "test-123"}'
```

Check the logs in Vercel Dashboard → Deployments → [Your Deployment] → Functions

## API Flow

### User Journey:
1. User completes moderation flow
2. Frontend calls `/api/trigger-gen` with `session_id`
3. `/api/trigger-gen` validates IP and calls `/api/generate-ai-lyrics`
4. `/api/generate-ai-lyrics` generates 5 lyrics sequentially
5. Each lyric is stored in Supabase immediately
6. Frontend polls `/api/check-ai-ready` until all 5 are ready
7. User proceeds to survey

### API Endpoints:

**POST /api/trigger-gen**
- Entry point for starting generation
- Validates IP address (prevents duplicate votes)
- Calls `/api/generate-ai-lyrics` internally

**POST /api/generate-ai-lyrics**
- Edge Runtime (25s timeout)
- Generates 5 random genre lyrics sequentially
- Stores each in `session_ai_lyrics` table immediately
- Returns success/failure

**GET /api/check-ai-ready**
- Checks if all 5 lyrics exist for a session
- Returns `ready: true` when complete
- Frontend polls this every 2-3 seconds

## Timeout Handling

### Current Strategy:
- **Edge Runtime**: 25 seconds max (Hobby plan)
- **Sequential Generation**: ~3-5 seconds per lyric = 15-25 seconds total
- **Immediate Storage**: Each lyric stored as soon as generated

### If Timeouts Still Occur:

**Option 1: Reduce Lyrics Count**
Generate 3 lyrics instead of 5 (modify `GENRES.slice(0, 3)`)

**Option 2: Upgrade Vercel Plan**
- Pro plan: 60 seconds
- Enterprise: 900 seconds

**Option 3: Use External Queue (Advanced)**
Implement a job queue like:
- [Inngest](https://www.inngest.com/) - Serverless queue
- [Upstash QStash](https://upstash.com/qstash) - HTTP-based queue
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs) - Scheduled tasks

## Monitoring & Debugging

### Check Vercel Logs:
1. Go to Vercel Dashboard
2. Select your project
3. Click "Deployments"
4. Click on a deployment
5. Go to "Functions" tab
6. View logs for `/api/generate-ai-lyrics`

### Common Issues:

**Issue: "OPENAI_API_KEY is missing"**
- Solution: Add `OPENAI_API_KEY` to Vercel environment variables (no `NEXT_PUBLIC_` prefix)

**Issue: "Supabase environment variables are missing"**
- Solution: Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

**Issue: Function timeout**
- Solution: Check logs to see which lyric generation timed out
- Consider reducing to 3 genres or upgrading Vercel plan

**Issue: Polling never completes**
- Solution: Check Supabase `session_ai_lyrics` table to see if records were inserted
- Verify the `session_id` matches between frontend and backend

## Testing Locally

The new architecture works locally too:

```bash
# Start dev server
npm run dev

# Test generation
curl -X POST http://localhost:3000/api/trigger-gen \
  -H "Content-Type: application/json" \
  -d '{"session_id": "local-test-123"}'

# Check status
curl "http://localhost:3000/api/check-ai-ready?session_id=local-test-123"
```

## Performance Optimization

### Current Settings:
- `temperature: 0.85` - Creative but consistent
- `frequency_penalty: 0.3` - Reduces repetition
- `max_tokens: 1200` - Enough for 3-4 stanzas

### To Speed Up Generation:
- Reduce `max_tokens` to 800-1000
- Lower `temperature` to 0.7
- Generate fewer genres (3 instead of 5)

## Rollback Plan

If issues occur, you can temporarily revert to the old system:

1. Restore `example.mjs` usage in `trigger-gen/route.js`
2. This will work locally but NOT on Vercel
3. Use this only for local development/testing

## Support

For issues:
1. Check Vercel function logs
2. Verify environment variables are set
3. Test the `/api/generate-ai-lyrics` endpoint directly
4. Check Supabase for partial data

## Next Steps

After successful deployment:
1. Monitor the first few user sessions
2. Check average generation time in logs
3. Adjust timeout settings if needed
4. Consider implementing a queue system for scale
