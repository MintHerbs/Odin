# Migration Summary: Local → Vercel Serverless

## What Changed

### ❌ Removed (Local-Only)
- `child_process.spawn()` calls
- `src/app/utils/scriptRunner.js` (no longer needed on Vercel)
- Direct execution of `example.mjs` via Node.js

### ✅ Added (Vercel-Compatible)
- `src/app/lib/generateLyrics.js` - Core generation logic
- `src/app/api/generate-ai-lyrics/route.js` - Edge Runtime API (25s timeout)
- Updated `src/app/api/trigger-gen/route.js` - Now calls internal API

### 🔧 Modified
- All Supabase clients now have validation checks
- OpenAI API calls use correct `chat.completions.create()` method
- Environment variables properly validated

## File Changes

| File | Status | Purpose |
|------|--------|---------|
| `src/app/lib/generateLyrics.js` | **NEW** | Reusable lyrics generation logic |
| `src/app/api/generate-ai-lyrics/route.js` | **NEW** | Edge Runtime endpoint for generation |
| `src/app/api/trigger-gen/route.js` | **MODIFIED** | Now calls `/api/generate-ai-lyrics` |
| `example.mjs` | **KEPT** | Still works locally, not used on Vercel |
| `src/app/utils/scriptRunner.js` | **KEPT** | Works locally, not used on Vercel |

## API Flow Comparison

### Before (Local)
```
User → /api/trigger-gen → spawn('node', 'example.mjs') → Background Process
                                                        ↓
                                                   Supabase Insert
```

### After (Vercel)
```
User → /api/trigger-gen → /api/generate-ai-lyrics (Edge Runtime)
                                    ↓
                          Sequential Generation (5 lyrics)
                                    ↓
                          Supabase Insert (one by one)
```

## Key Technical Details

### Edge Runtime Configuration
```javascript
export const runtime = 'edge';
export const maxDuration = 25; // seconds
```

### OpenAI API Call (Fixed)
```javascript
// ❌ WRONG (was in example.mjs)
await openai.responses.create({ ... })

// ✅ CORRECT (now in generateLyrics.js)
await openai.chat.completions.create({
  model: "ft:gpt-4o-mini-2024-07-18:munazir:sega-llm-primary-odin:D4BxIHVt",
  messages: [{ role: "user", content: prompt }],
  temperature: 0.85,
  max_tokens: 1200,
  frequency_penalty: 0.3
})
```

### Generation Strategy
- **Parallel** (before): All 5 genres at once → Risk of timeout
- **Sequential** (now): One genre at a time → Safer, progressive storage

## Environment Variables Checklist

### Vercel Dashboard → Settings → Environment Variables

| Variable | Scope | Required |
|----------|-------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | All | ✅ Yes |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | All | ✅ Yes |
| `OPENAI_API_KEY` | All | ✅ Yes (NO prefix) |
| `OPENAI_ORG_ID` | All | ⚠️ Optional |

## Testing Checklist

### Local Testing
```bash
npm run dev
curl -X POST http://localhost:3000/api/trigger-gen \
  -H "Content-Type: application/json" \
  -d '{"session_id": "test-123"}'
```

### Vercel Testing
```bash
curl -X POST https://your-app.vercel.app/api/trigger-gen \
  -H "Content-Type: application/json" \
  -d '{"session_id": "test-456"}'
```

### Verify in Supabase
```sql
SELECT * FROM session_ai_lyrics WHERE session_id = 'test-123';
-- Should show 5 records (one per genre)
```

## Deployment Commands

```bash
# Build locally first
npm run build

# Deploy to Vercel
vercel --prod

# Or push to GitHub (if connected to Vercel)
git add .
git commit -m "Vercel serverless migration"
git push origin main
```

## Rollback Instructions

If you need to revert:

1. **Restore old trigger-gen route:**
   ```bash
   git revert HEAD
   ```

2. **Use local development only:**
   - The old `example.mjs` + `spawn()` approach still works locally
   - Just won't work on Vercel

3. **Quick fix for Vercel:**
   - Keep the new `/api/generate-ai-lyrics` route
   - It works on both local and Vercel

## Performance Expectations

| Metric | Value |
|--------|-------|
| Time per lyric | 3-5 seconds |
| Total generation time | 15-25 seconds |
| Vercel timeout limit | 25 seconds (Edge) |
| Success rate | ~95% (within timeout) |

## Monitoring

### Check Generation Status
```bash
# Poll this endpoint
curl "https://your-app.vercel.app/api/check-ai-ready?session_id=test-123"

# Response when ready:
{
  "ready": true,
  "status": "complete",
  "genres_populated": 5,
  "total_genres": 5
}
```

### View Vercel Logs
1. Vercel Dashboard → Your Project
2. Deployments → Latest Deployment
3. Functions → `/api/generate-ai-lyrics`
4. View real-time logs

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Timeout after 10s | ✅ Fixed: Using Edge Runtime (25s) |
| spawn() not working | ✅ Fixed: Using direct API calls |
| Missing env vars | Add to Vercel dashboard |
| Polling never completes | Check Supabase for partial data |
| OpenAI API error | Verify `OPENAI_API_KEY` is set |

## Success Criteria

✅ Build completes without errors  
✅ Local testing works  
✅ Vercel deployment succeeds  
✅ Environment variables set  
✅ Generation completes within 25s  
✅ All 5 lyrics stored in Supabase  
✅ Frontend polling detects completion  

## Next Steps

1. Deploy to Vercel
2. Test with real session
3. Monitor first 10 user sessions
4. Adjust timeout/generation strategy if needed
5. Consider queue system for scale (optional)
