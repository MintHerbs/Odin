# Opinion Screen Implementation

## Overview
Added a final opinion collection screen after the 10-vote survey and before the conclusion screen. This screen asks users for their thoughts on AI as a creative tool.

---

## Features

### Visual Design
- **Lottie Animation:** Uses `opinion.json` lottie file
- **Color Theme:** New `opinion` color block in `colors.js`
  - Primary: `#D9E5FF`
  - Secondary: `#F2E7FF`
  - Background: `#F2E7FF`

### Question
**Title:** "What are your thoughts on using AI as a creative tool to aid artists, rather than a replacement?"

### Text Input
- **Dimensions:** 300px width × 80px height
- **Background:** `#1F2429` at 60% opacity
- **Placeholder:** "Type your answer here"
- **Max Words:** 200 words
- **Word Counter:** Displays current/max word count below textarea
- **Validation:** Shows error if exceeds 200 words or empty submission

### Submit Button
- **Label:** "Submit" (not "Next")
- **Behavior:** Saves opinion to database then proceeds to ConclusionScreen

---

## Flow Integration

### Updated User Journey
1. Moderation Screen
2. Loading Screen
3. Survey Screen (10 votes)
4. **Opinion Screen** ← NEW
5. Conclusion Screen

### Code Changes in `page.js`
```javascript
// New view state: 'opinion'
const handleSurveyComplete = async () => {
  // Lock vote (existing logic)
  setView('opinion'); // Changed from 'conclusion'
};

const handleOpinionComplete = () => {
  setView('conclusion');
};
```

---

## Components Created

### 1. `src/app/components/TextInput.js`
- Custom textarea component
- Word count validation
- Real-time word counter display
- Prevents input beyond 200 words

### 2. `src/app/components/SubmitButton.js`
- Styled submit button
- Disabled state handling
- Hover effects

### 3. `src/app/screen/OpinionScreen.js`
- Main opinion screen component
- Uses StackCard layout
- Integrates TextInput and SubmitButton
- Handles API submission

---

## API Endpoint

### `/api/save-opinion` (POST)

**Request:**
```json
{
  "session_id": "abc-123-def-456",
  "opinion": "User's opinion text here..."
}
```

**Response (Success):**
```json
{
  "success": true,
  "session_id": "abc-123-def-456",
  "word_count": 45,
  "message": "Opinion saved successfully"
}
```

**Response (Error - Too Many Words):**
```json
{
  "error": "Opinion exceeds 200 word limit",
  "word_count": 250
}
```

**Implementation:** `src/app/api/save-opinion/route.js`

---

## Database

### Table: `session`
**New Column:** `opinion` (TEXT)

```sql
ALTER TABLE session ADD COLUMN opinion TEXT;
```

This column stores the user's opinion text (max 200 words).

---

## Validation Rules

1. **Word Count:** Maximum 200 words
   - Counted by splitting on whitespace
   - Empty strings don't count as words

2. **Required Field:** Cannot submit empty opinion
   - Shows error: "Please provide a valid answer (max 200 words)"

3. **Error Display:** 
   - Red text below submit button
   - Auto-dismisses after 3 seconds
   - Persists if validation fails

---

## Files Created

1. `src/app/screen/OpinionScreen.js` - Main screen component
2. `src/app/components/TextInput.js` - Text input with word counter
3. `src/app/components/SubmitButton.js` - Submit button component
4. `src/app/api/save-opinion/route.js` - API endpoint for saving opinion

---

## Files Modified

1. `src/app/page.js` - Added opinion view to flow
2. `src/app/config/colors.js` - Added opinion color block
3. `src/app/backend/database.sql` - Documented opinion column

---

## Testing Checklist

- [ ] Opinion screen displays after completing 10 votes
- [ ] Lottie animation loads correctly
- [ ] Text input accepts text up to 200 words
- [ ] Word counter updates in real-time
- [ ] Error shows when exceeding 200 words
- [ ] Error shows when submitting empty text
- [ ] Submit button saves to database
- [ ] Redirects to conclusion screen after submission
- [ ] Opinion appears in session table in database
- [ ] Color theme matches specification

---

## Design Specifications Met

✅ Lottie animation: `opinion.json`  
✅ Title: "What are your thoughts on using AI as a creative tool to aid artists, rather than a replacement?"  
✅ No subtext  
✅ No square buttons (rating buttons)  
✅ Text box: 300×80px, #1F2429 at 60% opacity  
✅ Placeholder: "Type your answer here"  
✅ Color block: opinion (primary: #D9E5FF, secondary: #F2E7FF, background: #F2E7FF)  
✅ Database: opinion column in session table (TEXT)  
✅ Max 200 words with validation  
✅ Submit button (not "Next")  
✅ Flows to ConclusionScreen after submission  
✅ No changes to other frontend components
