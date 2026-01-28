# AI Readiness Polling System

## Status: ✅ COMPLETE

## Overview
This system ensures users wait on the LoaderScreen until OpenAI has fully generated all AI lyrics and populated the `survey_ai_lyrics` table, preventing premature survey access.

## Problem Solved
If a user completes ModerationFlow quickly (before OpenAI finishes generating lyrics), they would previously see the survey without AI lyrics. This polling system ensures they wait until all AI lyrics are ready.

## Implementation

### 1. Check AI Ready API (`src/app/api/check-ai-ready/route.js`)

**Endpoint**: `GET /api/check-ai-ready?session_id={sessionId}`

**Purpose**: Check if all 6 AI lyrics genres are fully populated

**Logic**:
1. Fetch `survey_ai_lyrics` record for session
2. Check each of 6 genres (politics, engager, romance, celebration, tipik, seggae)
3. Verify both `{genre}_ai_id` and `{genre}_ai_sega` are populated (not "-" and not null)
4. Return status based on completion

**Response Statuses**:

#### Not Started
```javascript
{
  ready: false,
  status: 'not_started',
  message: 'AI lyrics generation not started',
  session_id: "abc-123"
}
```

#### Generating (In Progress)
```javascript
{
  ready: false,
  status: 'generating',
  message: 'AI lyrics generation in progress',
  session_id: "abc-123",
  genres_populated: 3,
  total_genres: 6,
  genre_status: {
    politics: true,
    engager: true,
    romance: true,
    celebration: false,
    tipik: false,
    seggae: false
  }
}
```

#### Complete
```javascript
{
  ready: true,
  status: 'complete',
  message: 'All AI lyrics generated successfully',
  session_id: "abc-123",
  genres_populated: 6,
  total_genres: 6,
  genre_status: {
    politics: true,
    engager: true,
    romance: true,
    celebration: true,
    tipik: true,
    seggae: true
  }
}
```

#### Error
```javascript
{
  ready: false,
  status: 'error',
  error: "Database error message",
  session_id: "abc-123"
}
```

### 2. Session Utils (`src/app/utils/sessionUtils.js`)

**New Function**: `checkAILyricsReady(sessionId)`

**Purpose**: Client-side function to check AI readiness

**Returns**: Status object from API

**Usage**:
```javascript
const status = await checkAILyricsReady(sessionId);
if (status.ready) {
  // Proceed to mixing
} else {
  // Keep waiting
}
```

### 3. Main Page (`src/app/page.js`)

**New State**:
```javascript
const [loadingMessage, setLoadingMessage] = useState('Preparing survey...');
```

**Updated Flow**:
```javascript
fetchDataAndMixLyrics() {
  1. Check AI lyrics readiness
  2. If not ready:
     - Update loading message with progress
     - Poll again after 3 seconds
     - Return (stay on LoaderScreen)
  3. If ready:
     - Proceed with mixing lyrics
     - Load survey
}
```

**Loading Messages**:
- `"Checking AI lyrics generation..."`
- `"Generating AI lyrics... (3/6 genres)"`
- `"AI lyrics ready! Mixing with human lyrics..."`
- `"Mixing lyrics..."`
- `"Almost ready..."`

### 4. Loader Screen (`src/app/screen/LoaderScreen.js`)

**Updated**: Now accepts `message` prop to display dynamic status

## Data Flow

```
User completes ModerationFlow
    ↓
View changes to 'loading'
    ↓
fetchDataAndMixLyrics() called
    ↓
Check AI lyrics readiness
    ↓
┌─────────────────────────────────┐
│ AI Lyrics Ready?                │
├─────────────────────────────────┤
│ NO  → Update message            │
│       Wait 3 seconds            │
│       Check again (loop)        │
│                                 │
│ YES → Proceed with mixing       │
│       Load survey               │
└─────────────────────────────────┘
```

## Polling Mechanism

### Polling Interval
- **Frequency**: Every 3 seconds
- **Method**: Recursive setTimeout (not setInterval)
- **Reason**: Ensures previous check completes before next one starts

### Polling Logic
```javascript
const fetchDataAndMixLyrics = async () => {
  const aiStatus = await checkAILyricsReady(sessionId);
  
  if (!aiStatus.ready) {
    // Update UI with progress
    setLoadingMessage(`Generating AI lyrics... (${aiStatus.genres_populated}/6 genres)`);
    
    // Poll again after 3 seconds
    setTimeout(() => {
      fetchDataAndMixLyrics();
    }, 3000);
    return; // Stay on LoaderScreen
  }
  
  // AI ready - proceed with mixing
  // ...
};
```

### Why Not setInterval?
- `setTimeout` is safer - waits for API response before next call
- Prevents overlapping requests
- Easier to cancel/cleanup
- More predictable behavior

## Terminal Output

### User Completes ModerationFlow Quickly

```
✅ Moderation completed with preferences: {age: 25, segaFamiliarity: 3, aiSentiment: 4}
🔄 Loading survey data and checking AI lyrics status...

🔍 Checking AI lyrics status for session: abc-123
⏳ AI lyrics record not found yet
⏳ AI lyrics not ready yet. Status: not_started
📊 Progress: 0/6 genres

[Wait 3 seconds]

🔍 Checking AI lyrics status for session: abc-123
📊 AI Lyrics Status: 2/6 genres populated
Genre status: {politics: true, engager: true, romance: false, ...}
⏳ AI lyrics still generating... (2/6)
⏳ AI lyrics not ready yet. Status: generating
📊 Progress: 2/6 genres

[Wait 3 seconds]

🔍 Checking AI lyrics status for session: abc-123
📊 AI Lyrics Status: 6/6 genres populated
✅ All AI lyrics are ready!
✅ AI lyrics are ready! Proceeding with mixing...

🎭 Mixing lyrics with user preferences: {...}
✅ Mixed lyrics loaded: {totalCount: 11, humanCount: 5, aiCount: 6}
```

### User Completes ModerationFlow After AI Generation

```
✅ Moderation completed with preferences: {age: 25, segaFamiliarity: 3, aiSentiment: 4}
🔄 Loading survey data and checking AI lyrics status...

🔍 Checking AI lyrics status for session: abc-123
📊 AI Lyrics Status: 6/6 genres populated
✅ All AI lyrics are ready!
✅ AI lyrics are ready! Proceeding with mixing...

[Proceeds immediately to mixing]
```

## User Experience

### Fast User (Completes ModerationFlow in 30 seconds)
1. Completes forms quickly
2. Sees LoaderScreen with message: "Checking AI lyrics generation..."
3. Message updates: "Generating AI lyrics... (2/6 genres)"
4. Message updates: "Generating AI lyrics... (4/6 genres)"
5. Message updates: "AI lyrics ready! Mixing with human lyrics..."
6. Brief pause: "Almost ready..."
7. Survey loads with all lyrics

**Total wait time**: ~30-60 seconds (depending on OpenAI speed)

### Slow User (Completes ModerationFlow in 2+ minutes)
1. Takes time filling forms
2. OpenAI generates lyrics in background
3. Completes forms
4. Sees LoaderScreen briefly: "Checking AI lyrics generation..."
5. Immediately: "AI lyrics ready! Mixing with human lyrics..."
6. Brief pause: "Almost ready..."
7. Survey loads

**Total wait time**: ~2-3 seconds (just mixing time)

## Error Handling

### OpenAI Generation Fails
```javascript
// After multiple polls with no progress
if (pollCount > 20) { // 20 polls = 60 seconds
  console.error('AI generation timeout');
  setLoadingMessage('AI generation taking longer than expected...');
  // Could implement fallback to human-only mode
}
```

### Database Error
```javascript
{
  ready: false,
  status: 'error',
  error: "Connection failed"
}
// Logs error but continues polling
```

### Network Error
```javascript
// checkAILyricsReady catches errors
return { ready: false, status: 'error' };
// Continues polling
```

## Benefits

1. **No Premature Access**: Users never see incomplete survey
2. **Progress Feedback**: Users see generation progress
3. **Flexible Timing**: Works regardless of user speed
4. **Graceful Degradation**: Continues even with errors
5. **No Blocking**: Background generation doesn't block UI
6. **User Confidence**: Clear messaging about what's happening

## Configuration

### Polling Interval
```javascript
// Current: 3 seconds
setTimeout(() => {
  fetchDataAndMixLyrics();
}, 3000);

// Can be adjusted based on:
// - Average OpenAI response time
// - User experience preferences
// - Server load considerations
```

### Timeout (Future Enhancement)
```javascript
const MAX_POLLS = 40; // 40 * 3s = 2 minutes max wait
let pollCount = 0;

if (pollCount++ > MAX_POLLS) {
  // Fallback to human-only mode or show error
}
```

## Testing

### Test Scenarios

#### 1. Fast User
```
1. Start app
2. Quickly complete ModerationFlow (< 30 seconds)
3. Observe LoaderScreen polling
4. Verify progress messages update
5. Confirm survey loads when ready
```

#### 2. Slow User
```
1. Start app
2. Slowly complete ModerationFlow (> 2 minutes)
3. Observe LoaderScreen briefly
4. Confirm immediate progression to survey
```

#### 3. AI Generation Failure
```
1. Disable OpenAI API key
2. Complete ModerationFlow
3. Observe polling continues
4. Verify error handling
```

### Verification Queries

**Check AI lyrics status**:
```sql
SELECT 
  session_id,
  politics_ai_id, politics_ai_sega,
  engager_ai_id, engager_ai_sega,
  romance_ai_id, romance_ai_sega,
  celebration_ai_id, celebration_ai_sega,
  tipik_ai_id, tipik_ai_sega,
  seggae_ai_id, seggae_ai_sega
FROM survey_ai_lyrics
WHERE session_id = 'your-session-id';
```

**Check for incomplete records**:
```sql
SELECT 
  session_id,
  CASE WHEN politics_ai_sega = '-' OR politics_ai_sega IS NULL THEN 0 ELSE 1 END +
  CASE WHEN engager_ai_sega = '-' OR engager_ai_sega IS NULL THEN 0 ELSE 1 END +
  CASE WHEN romance_ai_sega = '-' OR romance_ai_sega IS NULL THEN 0 ELSE 1 END +
  CASE WHEN celebration_ai_sega = '-' OR celebration_ai_sega IS NULL THEN 0 ELSE 1 END +
  CASE WHEN tipik_ai_sega = '-' OR tipik_ai_sega IS NULL THEN 0 ELSE 1 END +
  CASE WHEN seggae_ai_sega = '-' OR seggae_ai_sega IS NULL THEN 0 ELSE 1 END
  as genres_populated
FROM survey_ai_lyrics;
```

## Future Enhancements

1. **Progress Bar**: Visual progress indicator (0-100%)
2. **Estimated Time**: Show estimated time remaining
3. **Retry Logic**: Automatic retry on errors
4. **Timeout Handling**: Fallback after max wait time
5. **WebSocket**: Real-time updates instead of polling
6. **Caching**: Cache readiness status to reduce API calls
7. **Analytics**: Track average generation times