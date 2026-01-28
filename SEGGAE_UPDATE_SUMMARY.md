# Seggae Genre Update Summary

## Overview
Updated the system to support 6 genres instead of 5, adding "Seggae" as the 6th genre.

## Changes Made

### 1. Database Schema (`src/app/backend/database.sql`)
**Added columns**:
- `seggae_ai_id TEXT`
- `seggae_ai_sega TEXT`

**Total columns in `survey_ai_lyrics`**: 14 (session_id + 12 genre columns)

### 2. `example.mjs` (Complete Rewrite)
**Key Features**:

#### Full Initialization
```javascript
const dbPayload = {
  session_id: sessionId,
  politics_ai_id: "-",
  politics_ai_sega: "-",
  engager_ai_id: "-",
  engager_ai_sega: "-",
  romance_ai_id: "-",
  romance_ai_sega: "-",
  celebration_ai_id: "-",
  celebration_ai_sega: "-",
  tipik_ai_id: "-",
  tipik_ai_sega: "-",
  seggae_ai_id: "-",
  seggae_ai_sega: "-"
};
```

#### Normalized Mapping
```javascript
lyricsData.lyrics.forEach((lyric, index) => {
  // Normalize genre to lowercase
  const normalizedGenre = lyric.genre.toLowerCase().trim();
  
  // Verify genre is in allowed list
  if (ALLOWED_GENRES.includes(normalizedGenre)) {
    const idKey = `${normalizedGenre}_ai_id`;
    const segaKey = `${normalizedGenre}_ai_sega`;
    
    dbPayload[idKey] = `${normalizedGenre}_${index + 1}`;
    dbPayload[segaKey] = lyric.lyrics;
  }
});
```

#### Upsert to Database
```javascript
const { data, error } = await supabase
  .from('survey_ai_lyrics')
  .upsert(dbPayload, {
    onConflict: 'session_id'
  });
```

**New Features**:
- ✅ Initializes all 12 attributes to "-" before processing
- ✅ Normalizes genre names with `.toLowerCase()`
- ✅ Verifies genres against allowed list
- ✅ Uses upsert for database operations
- ✅ Integrated Supabase client directly in script
- ✅ Comprehensive logging at each step
- ✅ Generates 6 lyrics instead of 5

### 3. `src/app/utils/randomize_lyrics.js`
**Updated**:
- Added 'seggae' to genres array
- Added filter to exclude "-" placeholder values
- Now handles 6 AI lyrics instead of 5

```javascript
const genres = ['politics', 'engager', 'romance', 'celebration', 'tipik', 'seggae'];

if (data[idField] && data[segaField] && data[segaField] !== '-') {
  // Process lyric
}
```

### 4. `src/app/api/generate-lyrics/route.js`
**Updated**:
- Added seggae_ai_id and seggae_ai_sega to update query

## Genre Descriptions

### 1. Politics
Social issues, governance, community concerns in Mauritius

### 2. Engager
Modern social engagement, contemporary issues, activism

### 3. Romance
Love, relationships, heartbreak in Mauritian context

### 4. Celebration
Festive songs for parties, joy, community gatherings

### 5. Tipik
Traditional authentic Mauritian Sega with cultural elements

### 6. Seggae (NEW)
Fusion of Sega and Reggae, with social consciousness themes

## Database Structure

### Before (5 genres, 10 columns + session_id)
```
session_id
politics_ai_id, politics_ai_sega
engager_ai_id, engager_ai_sega
romance_ai_id, romance_ai_sega
celebration_ai_id, celebration_ai_sega
tipik_ai_id, tipik_ai_sega
```

### After (6 genres, 12 columns + session_id)
```
session_id
politics_ai_id, politics_ai_sega
engager_ai_id, engager_ai_sega
romance_ai_id, romance_ai_sega
celebration_ai_id, celebration_ai_sega
tipik_ai_id, tipik_ai_sega
seggae_ai_id, seggae_ai_sega  ← NEW
```

## Example Output

### Terminal Output
```
🎵 Starting Sega lyrics generation for session: abc-123
🎲 Randomized genres: seggae, politics, romance, tipik, celebration, engager
🚀 Sending request to OpenAI...
📄 Raw OpenAI Response:
---START RESPONSE---
{"session_id":"abc-123","lyrics":[...]}
---END RESPONSE---
✅ Successfully generated and parsed Sega lyrics!
📦 Initializing database payload...
🔄 Processing AI lyrics and mapping to database structure...
  Processing lyric 1: genre="seggae"
    ✅ Mapped to seggae_ai_id and seggae_ai_sega
  Processing lyric 2: genre="politics"
    ✅ Mapped to politics_ai_id and politics_ai_sega
  ...
📊 Final database payload:
{
  "session_id": "abc-123",
  "politics_ai_id": "politics_2",
  "politics_ai_sega": "verse 1\n\nverse 2\n\nverse 3",
  "seggae_ai_id": "seggae_1",
  "seggae_ai_sega": "verse 1\n\nverse 2\n\nverse 3",
  ...
}
💾 Saving to database...
✅ Successfully saved to survey_ai_lyrics table!
```

### Database Record
```javascript
{
  session_id: "abc-123-def",
  politics_ai_id: "politics_2",
  politics_ai_sega: "Mo pena konfians dan gouvernman...\n\nZot promis...",
  engager_ai_id: "engager_6",
  engager_ai_sega: "Leve to lavi...\n\nBat pou...",
  romance_ai_id: "romance_3",
  romance_ai_sega: "Mo kœr pe plore...\n\nKan mo...",
  celebration_ai_id: "celebration_5",
  celebration_ai_sega: "Vini danse...\n\nSa swar...",
  tipik_ai_id: "tipik_4",
  tipik_ai_sega: "Ravann pe bat...\n\nSega tipik...",
  seggae_ai_id: "seggae_1",
  seggae_ai_sega: "Roots and culture...\n\nOne love..."
}
```

## Migration Notes

### For Existing Databases
If you have an existing `survey_ai_lyrics` table, run this SQL to add the new columns:

```sql
ALTER TABLE survey_ai_lyrics 
ADD COLUMN seggae_ai_id TEXT,
ADD COLUMN seggae_ai_sega TEXT;
```

### For New Databases
Use the updated schema in `src/app/backend/database.sql`

## Testing

### Test Command
```bash
node example.mjs test-session-123
```

### Expected Behavior
1. Generates 6 randomized Sega lyrics
2. Initializes all 12 columns with "-"
3. Maps each lyric to correct column based on normalized genre
4. Upserts to database
5. Logs complete process to terminal

### Verification
Check database after running:
```sql
SELECT * FROM survey_ai_lyrics WHERE session_id = 'test-session-123';
```

Should see all 6 genres populated with lyrics, no "-" placeholders.

## Error Handling

### Invalid Genre
If OpenAI returns an invalid genre:
```
⚠️  Genre "invalid_genre" not in allowed list, skipping
```
Column remains as "-"

### Database Error
```
❌ Database upsert error: [error details]
```
Process exits with code 1

### OpenAI Error
```
❌ Error generating Sega lyrics: [error message]
💥 ERROR RESULT: {...}
```
Process exits with code 1

## Benefits

1. **Complete Coverage**: All 6 genres properly handled
2. **Data Integrity**: Initialization prevents null/undefined issues
3. **Normalization**: Case-insensitive genre matching
4. **Validation**: Only allowed genres are processed
5. **Upsert Safety**: Can re-run without duplicates
6. **Comprehensive Logging**: Easy debugging and monitoring
7. **Supabase Integration**: Direct database access from script