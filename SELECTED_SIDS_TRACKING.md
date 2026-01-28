# Selected SIDs Tracking System

## Overview
This system tracks which human lyrics were selected for each session by storing their SIDs in the `session_real_sega_chosen` table.

## Database Schema

### `session_real_sega_chosen` Table
```sql
CREATE TABLE session_real_sega_chosen (
    session_id TEXT PRIMARY KEY REFERENCES session(session_id),
    sid1 int4, -- ID of the 1st selected human lyric
    sid2 int4, -- ID of the 2nd selected human lyric
    sid3 int4, -- ID of the 3rd selected human lyric
    sid4 int4, -- ID of the 4th selected human lyric
    sid5 int4, -- ID of the 5th selected human lyric
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Implementation

### 1. Updated `selectHumanLyrics()` Function
**File**: `src/app/utils/randomize_lyrics.js`

**Changes**:
- Now returns an object instead of just an array
- Extracts SIDs from selected lyrics
- Returns both lyrics and SIDs

**Return Structure**:
```javascript
{
  lyrics: [
    { sid: 12, genre: "Politics", lyrics: "...", is_ai: false, source: "human" },
    { sid: 34, genre: "Romance", lyrics: "...", is_ai: false, source: "human" },
    { sid: 56, genre: "Celebration", lyrics: "...", is_ai: false, source: "human" },
    { sid: 78, genre: "Tipik", lyrics: "...", is_ai: false, source: "human" },
    { sid: 90, genre: "Engager", lyrics: "...", is_ai: false, source: "human" }
  ],
  selectedSIDs: [12, 34, 56, 78, 90]
}
```

### 2. New `saveSelectedSIDs()` Function
**File**: `src/app/utils/randomize_lyrics.js`

**Purpose**: Save the 5 selected SIDs to the database

**Parameters**:
- `sessionId` (string): The session identifier
- `selectedSIDs` (Array<number>): Array of exactly 5 SIDs

**Validation**:
- Checks that exactly 5 SIDs are provided
- Throws error if count is incorrect

**Database Operation**:
- Uses `upsert()` to handle duplicate session_id
- Maps array to sid1, sid2, sid3, sid4, sid5 columns

**Example**:
```javascript
await saveSelectedSIDs('abc-123-def', [12, 34, 56, 78, 90]);

// Database record:
{
  session_id: 'abc-123-def',
  sid1: 12,
  sid2: 34,
  sid3: 56,
  sid4: 78,
  sid5: 90,
  created_at: '2026-01-28T10:30:00Z'
}
```

### 3. Updated `mix-lyrics` API Route
**File**: `src/app/api/mix-lyrics/route.js`

**New Flow**:
```
1. Select 5 human lyrics (returns lyrics + SIDs)
2. Save selected SIDs to session_real_sega_chosen
3. Fetch AI lyrics
4. Mix and shuffle all lyrics
5. Return mixed lyrics with metadata including selectedSIDs
```

**Response Structure**:
```javascript
{
  success: true,
  session_id: "abc-123-def",
  lyrics: [10 mixed lyrics],
  metadata: {
    totalCount: 10,
    humanCount: 5,
    aiCount: 5,
    selectedSIDs: [12, 34, 56, 78, 90],
    shuffleTimestamp: "2026-01-28T..."
  },
  timestamp: "2026-01-28T..."
}
```

## Data Flow

```
User completes ModerationFlow
    ↓
User preferences sent to /api/mix-lyrics
    ↓
selectHumanLyrics(preferences)
    ↓ returns { lyrics, selectedSIDs }
    ↓
saveSelectedSIDs(sessionId, selectedSIDs)
    ↓ saves to session_real_sega_chosen
    ↓
fetchAILyrics(sessionId)
    ↓
mixLyrics(humanLyrics, aiLyrics)
    ↓
Return mixed lyrics to frontend
```

## Terminal Output

### Expected Logs
```
🎵 Starting lyric mixing process...
Session ID: abc-123-def
User preferences: {age: 25, segaFamiliarity: 3, aiSentiment: 4}

📊 Step 1: Selecting human lyrics...
🎵 Selecting human lyrics based on preferences: {...}
📊 Found 50 human lyrics in database
✅ Selected 5 human lyrics:
  1. Genre: Politics, SID: 12
  2. Genre: Romance, SID: 34
  3. Genre: Celebration, SID: 56
  4. Genre: Tipik, SID: 78
  5. Genre: Engager, SID: 90
📋 Selected SIDs: [12, 34, 56, 78, 90]

💾 Step 2: Saving selected SIDs...
💾 Saving selected SIDs to session_real_sega_chosen...
Session ID: abc-123-def
SIDs: [12, 34, 56, 78, 90]
✅ Successfully saved selected SIDs to database

🤖 Step 3: Fetching AI lyrics...
✅ Found 6 AI-generated lyrics

🎭 Step 4: Mixing lyrics...
📦 Total lyrics before shuffle: 11
✅ Lyrics mixed and shuffled successfully

✅ Lyric mixing completed successfully
📦 Total lyrics: 11
👤 Human: 5, 🤖 AI: 6
📋 Selected human SIDs: [12, 34, 56, 78, 90]
```

## Use Cases

### 1. Analysis & Research
Query which human lyrics were shown to users:
```sql
SELECT 
  s.session_id,
  s.participant_age,
  s.sega_familiarity,
  s.ai_sentiment,
  r.sid1, r.sid2, r.sid3, r.sid4, r.sid5,
  r.created_at
FROM session s
JOIN session_real_sega_chosen r ON s.session_id = r.session_id
ORDER BY r.created_at DESC;
```

### 2. Lyric Performance Tracking
See which human lyrics are most frequently selected:
```sql
SELECT 
  sid,
  COUNT(*) as selection_count
FROM (
  SELECT sid1 as sid FROM session_real_sega_chosen
  UNION ALL
  SELECT sid2 FROM session_real_sega_chosen
  UNION ALL
  SELECT sid3 FROM session_real_sega_chosen
  UNION ALL
  SELECT sid4 FROM session_real_sega_chosen
  UNION ALL
  SELECT sid5 FROM session_real_sega_chosen
) as all_sids
GROUP BY sid
ORDER BY selection_count DESC;
```

### 3. User Preference Analysis
Analyze which genres are selected for different user profiles:
```sql
SELECT 
  s.sega_familiarity,
  sd.genre,
  COUNT(*) as selection_count
FROM session s
JOIN session_real_sega_chosen r ON s.session_id = r.session_id
JOIN survey_data sd ON sd.sid IN (r.sid1, r.sid2, r.sid3, r.sid4, r.sid5)
GROUP BY s.sega_familiarity, sd.genre
ORDER BY s.sega_familiarity, selection_count DESC;
```

## Error Handling

### Invalid SID Count
```javascript
// If selectedSIDs.length !== 5
Error: Expected 5 SIDs, got 3
```

### Database Error
```javascript
// If upsert fails
Error: Failed to save selected SIDs: [error message]
```

### Missing Session ID
```javascript
// If session_id not provided
Error: session_id is required
```

## Benefits

1. **Traceability**: Know exactly which human lyrics each user saw
2. **Analytics**: Track which lyrics perform best
3. **Reproducibility**: Can recreate the exact mix shown to a user
4. **Research**: Analyze selection patterns based on user preferences
5. **Quality Control**: Identify if certain lyrics are over/under-represented
6. **Timestamp**: Track when selections were made

## Migration

### For Existing Databases
If you already have a `session_real_sega_chosen` table without `created_at`:
```sql
ALTER TABLE session_real_sega_chosen 
ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
```

### For New Databases
Use the updated schema in `src/app/backend/database.sql`

## Testing

### Test the Flow
1. Load the webpage
2. Complete ModerationFlow with preferences
3. Check terminal for SID logging
4. Query database:
```sql
SELECT * FROM session_real_sega_chosen 
WHERE session_id = 'your-session-id';
```

### Expected Result
```
session_id | sid1 | sid2 | sid3 | sid4 | sid5 | created_at
-----------+------+------+------+------+------+-------------------------
abc-123    |  12  |  34  |  56  |  78  |  90  | 2026-01-28 10:30:00+00
```

## Future Enhancements

1. Add indexes on sid columns for faster queries
2. Store selection scores for analysis
3. Add genre distribution tracking
4. Implement A/B testing for selection algorithms
5. Add user feedback correlation with selected lyrics