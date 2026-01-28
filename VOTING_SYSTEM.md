# Voting System Documentation

## Overview
This system collects user votes from the survey and stores them in the `session_votes` table, tracking both AI-generated and human-written lyrics votes.

## Database Schema

### `session_votes` Table
```sql
CREATE TABLE session_votes (
    session_id TEXT PRIMARY KEY,
    
    -- Politics
    politics_ai_id TEXT,
    politics_ai_vote INT4,
    politics_sega_id INT4,
    politics_sega_vote INT4,
    
    -- Engager
    engager_ai_id TEXT,
    engager_ai_vote INT4,
    engager_sega_id INT4,
    engager_sega_vote INT4,
    
    -- Romance
    romance_ai_id TEXT,
    romance_ai_vote INT4,
    romance_sega_id INT4,
    romance_sega_vote INT4,
    
    -- Celebration
    celebration_ai_id TEXT,
    celebration_ai_vote INT4,
    celebration_sega_id INT4,
    celebration_sega_vote INT4,
    
    -- Tipik
    tipik_ai_id TEXT,
    tipik_ai_vote INT4,
    tipik_sega_id INT4,
    tipik_sega_vote INT4,
    
    -- Seggae
    seggae_ai_id TEXT,
    seggae_ai_vote INT4,
    seggae_sega_id INT4,
    seggae_sega_vote INT4,

    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Implementation

### 1. Survey Component (`src/app/screen/survey.js`)

**New State Variables**:
```javascript
const [votes, setVotes] = useState([]); // Store all votes
const [isSubmitting, setIsSubmitting] = useState(false); // Submission status
```

**Vote Collection**:
- Each time user clicks "Next", their vote is recorded
- Vote object structure:
```javascript
{
  lyricId: "politics_1" or 12, // AI ID (string) or Human SID (number)
  genre: "Politics",
  vote: 3, // 1-5 rating
  isAI: true or false,
  lottie: "politics" // Used to determine genre
}
```

**Vote Submission**:
- On last slide, all votes are submitted at once
- Calls `saveVotes(sessionId, votes)` function
- Shows loading state during submission

### 2. Save Votes API (`src/app/api/save-votes/route.js`)

**Endpoint**: `POST /api/save-votes`

**Request Body**:
```javascript
{
  session_id: "abc-123-def",
  votes: [
    {
      lyricId: "politics_1",
      genre: "Politics",
      vote: 4,
      isAI: true,
      lottie: "politics"
    },
    {
      lyricId: 12,
      genre: "Romance",
      vote: 3,
      isAI: false,
      lottie: "romance"
    },
    // ... more votes
  ]
}
```

**Processing Logic**:

1. **Initialize Payload**: All fields set to "-" or null
```javascript
{
  session_id: "abc-123-def",
  politics_ai_id: "-",
  politics_ai_vote: null,
  politics_sega_id: null,
  politics_sega_vote: null,
  // ... all other genres
}
```

2. **Process Each Vote**:
   - Normalize genre to lowercase
   - Check if genre is valid
   - Determine if AI or human based on `isAI` flag
   - Map to correct columns:
     - AI: `{genre}_ai_id` and `{genre}_ai_vote`
     - Human: `{genre}_sega_id` and `{genre}_sega_vote`

3. **Upsert to Database**: Save with conflict resolution on `session_id`

**Response**:
```javascript
{
  success: true,
  session_id: "abc-123-def",
  votes_saved: 11,
  timestamp: "2026-01-28T..."
}
```

### 3. Session Utils (`src/app/utils/sessionUtils.js`)

**New Function**: `saveVotes(sessionId, votes)`

**Purpose**: Client-side function to call the save-votes API

**Usage**:
```javascript
await saveVotes(sessionId, [
  { lyricId: "politics_1", genre: "Politics", vote: 4, isAI: true },
  { lyricId: 12, genre: "Romance", vote: 3, isAI: false },
  // ...
]);
```

## Data Flow

```
User votes on each lyric (1-5 rating)
    ↓
Vote stored in local state array
    ↓
User reaches last slide
    ↓
All votes submitted to /api/save-votes
    ↓
API initializes payload with "-" placeholders
    ↓
API processes each vote:
  - Normalize genre
  - Check if AI or human
  - Map to correct columns
    ↓
Upsert to session_votes table
    ↓
Return success response
```

## Genre Mapping

The `lottie` field from the lyric determines the genre:

| Lottie Value | Genre | Columns Used |
|--------------|-------|--------------|
| politics | Politics | politics_ai_id/vote or politics_sega_id/vote |
| engager | Engager | engager_ai_id/vote or engager_sega_id/vote |
| romance | Romance | romance_ai_id/vote or romance_sega_id/vote |
| celebration | Celebration | celebration_ai_id/vote or celebration_sega_id/vote |
| tipik | Tipik | tipik_ai_id/vote or tipik_sega_id/vote |
| seggae | Seggae | seggae_ai_id/vote or seggae_sega_id/vote |

## Example Database Record

### Input Votes
```javascript
[
  { lyricId: "politics_1", genre: "Politics", vote: 4, isAI: true },
  { lyricId: 12, genre: "Politics", vote: 3, isAI: false },
  { lyricId: "romance_2", genre: "Romance", vote: 5, isAI: true },
  { lyricId: 34, genre: "Romance", vote: 2, isAI: false },
  { lyricId: "celebration_3", genre: "Celebration", vote: 4, isAI: true },
  { lyricId: 56, genre: "Celebration", vote: 3, isAI: false },
  // No tipik, engager, or seggae votes (not displayed)
]
```

### Database Record
```javascript
{
  session_id: "abc-123-def",
  
  // Politics - both AI and human voted
  politics_ai_id: "politics_1",
  politics_ai_vote: 4,
  politics_sega_id: 12,
  politics_sega_vote: 3,
  
  // Engager - not displayed
  engager_ai_id: "-",
  engager_ai_vote: null,
  engager_sega_id: null,
  engager_sega_vote: null,
  
  // Romance - both AI and human voted
  romance_ai_id: "romance_2",
  romance_ai_vote: 5,
  romance_sega_id: 34,
  romance_sega_vote: 2,
  
  // Celebration - both AI and human voted
  celebration_ai_id: "celebration_3",
  celebration_ai_vote: 4,
  celebration_sega_id: 56,
  celebration_sega_vote: 3,
  
  // Tipik - not displayed
  tipik_ai_id: "-",
  tipik_ai_vote: null,
  tipik_sega_id: null,
  tipik_sega_vote: null,
  
  // Seggae - not displayed
  seggae_ai_id: "-",
  seggae_ai_vote: null,
  seggae_sega_id: null,
  seggae_sega_vote: null,
  
  created_at: "2026-01-28T10:30:00Z"
}
```

## Terminal Output

### During Survey
```
[Survey] Slide 0: color_code='blue' -> theme='blue', lottie='politics' -> matched='politics'
📝 Vote recorded: {lyricId: "politics_1", genre: "Politics", vote: 4, isAI: true}
📊 Total votes so far: 1

[Survey] Slide 1: color_code='pink' -> theme='pink', lottie='romance' -> matched='romance'
📝 Vote recorded: {lyricId: 12, genre: "Romance", vote: 3, isAI: false}
📊 Total votes so far: 2

...

🏁 Survey complete! Submitting all votes...
```

### API Processing
```
🗳️  Saving votes for session: abc-123-def
📊 Votes received: [11 votes]
📦 Initialized vote payload with "-" placeholders

  Processing vote 1: {lyricId: "politics_1", genre: "Politics", vote: 4, isAI: true}
    ✅ Mapped AI vote: politics_ai_id = politics_1, politics_ai_vote = 4
  
  Processing vote 2: {lyricId: 12, genre: "Romance", vote: 3, isAI: false}
    ✅ Mapped Sega vote: romance_sega_id = 12, romance_sega_vote = 3
  
  ...

📊 Final vote payload: {full object}
💾 Saving votes to database...
✅ Successfully saved votes to session_votes table
```

## Error Handling

### Incomplete Vote
```javascript
// If lyricId, genre, or vote is missing
⚠️  Skipping incomplete vote: {lyricId: null, genre: "Politics", vote: 3}
```

### Invalid Genre
```javascript
// If genre not in allowed list
⚠️  Invalid genre "invalid_genre", skipping
```

### Database Error
```javascript
// If upsert fails
❌ Database error: [error details]
Response: {success: false, error: "Failed to save votes: ..."}
```

### Submission Failure
```javascript
// In survey.js
❌ Failed to submit votes: [error message]
// Shows error message to user
```

## Analytics Queries

### 1. Vote Distribution by Genre
```sql
SELECT 
  'Politics AI' as type, AVG(politics_ai_vote) as avg_vote, COUNT(*) as count
FROM session_votes WHERE politics_ai_vote IS NOT NULL
UNION ALL
SELECT 
  'Politics Human', AVG(politics_sega_vote), COUNT(*)
FROM session_votes WHERE politics_sega_vote IS NOT NULL
-- Repeat for all genres
ORDER BY type;
```

### 2. AI vs Human Performance
```sql
SELECT 
  genre,
  AVG(ai_vote) as avg_ai_vote,
  AVG(human_vote) as avg_human_vote,
  AVG(ai_vote) - AVG(human_vote) as difference
FROM (
  SELECT 
    'Politics' as genre,
    politics_ai_vote as ai_vote,
    politics_sega_vote as human_vote
  FROM session_votes
  WHERE politics_ai_vote IS NOT NULL AND politics_sega_vote IS NOT NULL
  -- Repeat for all genres
) as votes
GROUP BY genre;
```

### 3. User Confidence Patterns
```sql
SELECT 
  s.sega_familiarity,
  s.ai_sentiment,
  AVG(v.politics_ai_vote) as avg_politics_ai,
  AVG(v.romance_ai_vote) as avg_romance_ai
FROM session s
JOIN session_votes v ON s.session_id = v.session_id
GROUP BY s.sega_familiarity, s.ai_sentiment
ORDER BY s.sega_familiarity, s.ai_sentiment;
```

### 4. Genres Not Displayed
```sql
SELECT 
  session_id,
  CASE WHEN politics_ai_id = '-' AND politics_sega_id IS NULL THEN 'Politics' END as missing_politics,
  CASE WHEN engager_ai_id = '-' AND engager_sega_id IS NULL THEN 'Engager' END as missing_engager,
  CASE WHEN romance_ai_id = '-' AND romance_sega_id IS NULL THEN 'Romance' END as missing_romance,
  CASE WHEN celebration_ai_id = '-' AND celebration_sega_id IS NULL THEN 'Celebration' END as missing_celebration,
  CASE WHEN tipik_ai_id = '-' AND tipik_sega_id IS NULL THEN 'Tipik' END as missing_tipik,
  CASE WHEN seggae_ai_id = '-' AND seggae_sega_id IS NULL THEN 'Seggae' END as missing_seggae
FROM session_votes;
```

## Testing

### Test Flow
1. Complete ModerationFlow
2. View mixed lyrics in Survey
3. Vote on each lyric (1-5)
4. Check terminal for vote logging
5. Verify last slide triggers submission
6. Query database to verify votes saved

### Verification Query
```sql
SELECT * FROM session_votes 
WHERE session_id = 'your-session-id';
```

### Expected Behavior
- All voted lyrics have their ID and vote stored
- Non-displayed genres have "-" for AI ID and null for votes
- created_at timestamp is set automatically

## Benefits

1. **Complete Tracking**: Every vote is recorded with context
2. **Flexible Structure**: Handles missing genres gracefully
3. **Data Integrity**: Upsert prevents duplicates
4. **Analytics Ready**: Easy to query and analyze results
5. **Blind Study**: Genre mapping preserves study integrity
6. **Timestamp**: Track when votes were submitted

## Future Enhancements

1. Add vote confidence intervals
2. Track time spent on each lyric
3. Add vote revision capability
4. Implement partial save (save after each vote)
5. Add vote validation rules
6. Track vote changes (if user goes back)