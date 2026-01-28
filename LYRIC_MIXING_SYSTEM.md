# Dynamic Sega Lyric Mixing System

## Overview
This system implements personalized lyric selection and mixing for a blind study, combining human-written and AI-generated Sega lyrics based on user preferences.

## Data Flow

```
User Input (ModerationFlow) 
    ↓
User Preferences (age, segaFamiliarity, aiSentiment)
    ↓
Lyric Selection & Mixing (API)
    ↓
Shuffled Mixed Lyrics
    ↓
Survey Display
```

## File Structure

### 1. `src/app/utils/randomize_lyrics.js`
**Purpose**: Select personalized human lyrics and fetch AI lyrics

**Functions**:
- `selectHumanLyrics(userPreferences)`: 
  - Fetches all lyrics from `survey_data` table
  - Scores each lyric based on:
    - Age proximity
    - Popularity
    - Comments density
    - Sega familiarity (traditional vs modern preference)
    - AI sentiment (experimental vs traditional preference)
  - Returns top 5 scored lyrics
  - Marks each with `is_ai: false`

- `fetchAILyrics(sessionId)`:
  - Fetches AI lyrics from `survey_ai_lyrics` table
  - Transforms flat structure into array of lyric objects
  - Marks each with `is_ai: true`
  - Returns up to 5 AI lyrics

**Input**: 
```javascript
{
  age: 25,
  segaFamiliarity: 3,
  aiSentiment: 4
}
```

**Output**:
```javascript
[
  {
    sid: 1,
    genre: "Politics",
    lyrics: "...",
    is_ai: false,
    source: "human"
  },
  // ... 4 more
]
```

### 2. `src/app/utils/dataMixer.js`
**Purpose**: Mix and shuffle human and AI lyrics

**Functions**:
- `mixLyrics(humanLyrics, aiLyrics)`:
  - Merges both arrays (total 10 items)
  - Uses Fisher-Yates shuffle for true randomization
  - Adds `displayIndex` to each lyric
  - Returns mixed array with metadata

- `fallbackToHumanOnly(humanLyrics)`:
  - Used when AI lyrics are unavailable
  - Shuffles human lyrics only
  - Returns with fallback flag

**Input**:
```javascript
humanLyrics: [5 human lyrics]
aiLyrics: [5 AI lyrics]
```

**Output**:
```javascript
{
  mixedLyrics: [10 shuffled lyrics],
  metadata: {
    totalCount: 10,
    humanCount: 5,
    aiCount: 5,
    shuffleTimestamp: "2026-01-28T..."
  }
}
```

### 3. `src/app/api/mix-lyrics/route.js`
**Purpose**: Server-side API endpoint for lyric mixing

**Endpoint**: `POST /api/mix-lyrics`

**Request Body**:
```javascript
{
  session_id: "uuid",
  age: 25,
  segaFamiliarity: 3,
  aiSentiment: 4
}
```

**Response**:
```javascript
{
  success: true,
  session_id: "uuid",
  lyrics: [10 mixed lyrics],
  metadata: {...},
  timestamp: "2026-01-28T..."
}
```

**Process**:
1. Select 5 human lyrics based on preferences
2. Fetch AI lyrics for session
3. Mix and shuffle
4. Return mixed array

### 4. `src/app/utils/sessionUtils.js`
**Added Function**: `mixLyricsForSession()`

**Purpose**: Client-side function to call mixing API

### 5. `src/app/screen/ModerationFlow.js`
**Updated**: Now passes user preferences on completion

**Change**:
```javascript
onComplete({
  age,
  segaFamiliarity,
  aiSentiment
})
```

### 6. `src/app/page.js`
**Updated**: Manages state and orchestrates the flow

**State Variables**:
- `userPreferences`: Stores user input from ModerationFlow
- `mixedLyrics`: Stores the final mixed array

**Flow**:
1. User completes ModerationFlow
2. Preferences saved to state
3. View changes to 'loading'
4. `fetchDataAndMixLyrics()` called
5. Mixed lyrics fetched and stored
6. View changes to 'survey'
7. Survey receives mixed lyrics

### 7. `src/app/screen/survey.js`
**Updated**: Now receives mixed lyrics as `records` prop

**Props**:
- `records`: Array of mixed lyrics (10 items)
- `sessionId`: Current session ID

## Scoring Algorithm

### Age Proximity
```javascript
score += Math.max(0, 10 - Math.abs(lyric.age - userAge))
```

### Sega Familiarity
- High (4-5): Prefer traditional/tipik genres (+15 points)
- Low (1-2): Prefer modern/engager genres (+15 points)

### AI Sentiment
- Pro-AI (4-5): Prefer experimental/engager (+10 points)
- Anti-AI (1-2): Prefer traditional/tipik (+10 points)

### Randomness
- Add 0-5 random points to avoid repetition

## Error Handling

### No AI Lyrics Available
- Falls back to human-only mode
- Shuffles 5 human lyrics
- Sets `fallbackMode: true` in metadata

### Database Errors
- Logs error to console
- Returns error response with 500 status
- Frontend proceeds to survey even on error

### Empty Survey Data
- Throws error: "No human lyrics found"
- Prevents survey from loading with no data

## Security Features

- ✅ All database queries server-side
- ✅ No client-side exposure of `is_ai` flag during survey
- ✅ Supabase credentials in environment variables
- ✅ Input validation on API routes

## Testing

### Test Flow
1. Load webpage
2. Complete ModerationFlow with different preferences
3. Check terminal for mixing logs
4. Verify 10 lyrics displayed in Survey
5. Confirm shuffle order is random

### Expected Terminal Output
```
✅ Moderation completed with preferences: {age: 25, segaFamiliarity: 3, aiSentiment: 4}
🔄 Loading survey data and mixing lyrics...
🎭 Mixing lyrics with user preferences: {...}
🎵 Starting lyric mixing process...
📊 Step 1: Selecting human lyrics...
📊 Found 50 human lyrics in database
✅ Selected 5 human lyrics:
  1. Genre: Politics, SID: 12
  2. Genre: Romance, SID: 34
  ...
🤖 Step 2: Fetching AI lyrics...
✅ Found 5 AI-generated lyrics
🎭 Step 3: Mixing lyrics...
📦 Total lyrics before shuffle: 10
✅ Lyrics mixed and shuffled successfully
🎲 Shuffle order (for verification):
  1. AI - Genre: Celebration, ID: celebration_3
  2. HUMAN - Genre: Politics, SID: 12
  ...
✅ Mixed lyrics loaded: {totalCount: 10, humanCount: 5, aiCount: 5}
```

## Database Tables Used

### `survey_data` (Human Lyrics)
- `sid`: Unique ID
- `genre`: Lyric genre
- `lyrics`: Lyric text
- `age`: Author age
- `popularity`: Popularity score
- `comments_density`: Engagement metric

### `survey_ai_lyrics` (AI Lyrics)
- `session_id`: Session identifier
- `politics_ai_id`, `politics_ai_sega`: Politics lyric
- `engager_ai_id`, `engager_ai_sega`: Engager lyric
- `romance_ai_id`, `romance_ai_sega`: Romance lyric
- `celebration_ai_id`, `celebration_ai_sega`: Celebration lyric
- `tipik_ai_id`, `tipik_ai_sega`: Tipik lyric

## Future Enhancements

1. Cache mixed lyrics to avoid re-mixing on page refresh
2. Add more sophisticated scoring algorithms
3. Implement A/B testing for different mixing strategies
4. Add analytics to track which lyrics perform better
5. Store mixing metadata in database for analysis