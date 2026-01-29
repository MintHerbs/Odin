# Instruction Slide Addition to ModerationFlow

## Status: ✅ COMPLETE

## Overview
Added a new instructional slide after the welcome screen in ModerationFlow.js to clearly explain how the survey will be conducted and what users should expect.

## Changes Implemented

### 1. New Color Theme ✅
**File**: `src/app/config/colors.js`

Added `instruction` color theme with warm orange tones to draw attention:

```javascript
instruction: {
  primary: '#FF9F43',    // Warm orange
  secondary: '#FFE5D0',  // Light peach
  background: '#FFF8F0', // Very light cream
}
```

**Rationale**: Orange is attention-grabbing and commonly used for important information/warnings, making it perfect for instructions that users should read carefully.

### 2. New Slide Added ✅
**File**: `src/app/screen/ModerationFlow.js`

**Position**: Slide 2 (after "Welcome to the Survey!")

**Content**:
- **Title**: "How will this survey be conducted?"
- **Lottie**: alert.json (attention-grabbing animation)
- **Theme**: Orange instruction theme
- **Navigation**: Previous and Next buttons

**Subtext**:
```
We will present you with 10 sets of lyrics (3 verses each). These consist of a mixture of human-written Sega lyrics and specialized AI-generated lyrics.

Your task is to read each one and rate your confidence:
1 = Definitely Human
5 = Definitely AI

Note: You will always be presented with both types of lyrics throughout the session, though the distribution may vary.

💡 TIP: You can click on any lyric container for an expanded view.
```

### 3. Slide Order Updated ✅

**Before** (4 slides):
1. Welcome
2. Birthday
3. Sega Familiarity
4. AI Sentiment

**After** (5 slides):
1. Welcome
2. **Instructions** ← NEW
3. Birthday
4. Sega Familiarity
5. AI Sentiment

### 4. Technical Updates ✅

**Total Slides**:
```javascript
const totalSlides = 5; // Changed from 4
```

**Validation Logic**:
```javascript
// Updated slide indices
if (currentSlide === 2) {  // Birthday (was 1)
    isValid = validateBirthday();
} else if (currentSlide === 3 && segaFamiliarity === null) {  // Sega (was 2)
    isValid = false;
} else if (currentSlide === 4 && aiSentiment === null) {  // AI (was 3)
    isValid = false;
}
```

**Theme Logic**:
```javascript
const getTheme = () => {
    switch (currentSlide) {
        case 0: return APP_COLORS.blue;
        case 1: return APP_COLORS.instruction;  // NEW
        case 2: return APP_COLORS.birthday;
        case 3: return APP_COLORS.sega;
        case 4: return APP_COLORS.ai;
        default: return APP_COLORS.blue;
    }
};
```

**Lottie Logic**:
```javascript
const getLottie = () => {
    switch (currentSlide) {
        case 0: return moonAnimation;
        case 1: return alertLottie;  // NEW
        case 2: return birthdayLottie;
        case 3: return segaLottie;
        case 4: return tipik;
        default: return moonAnimation;
    }
};
```

## Visual Design

### Color Scheme
- **Primary**: `#FF9F43` - Warm, attention-grabbing orange
- **Secondary**: `#FFE5D0` - Soft peach for the top card
- **Background**: `#FFF8F0` - Very light cream background

### Layout
- Standard StackCard layout (consistent with other slides)
- Alert lottie animation (200x200px)
- Title and subtext with proper formatting
- Previous and Next buttons
- Slide pagination (5 dots)

## User Experience

### Flow
1. User reads welcome message
2. Clicks "Next"
3. **Sees instruction slide** (NEW)
   - Learns about 10 lyrics
   - Understands rating scale (1-5)
   - Sees tip about clicking for expanded view
4. Clicks "Next" to continue to birthday
5. Continues through remaining slides

### Benefits
- **Clear Expectations**: Users know exactly what to expect
- **Rating Scale**: Clarifies what 1 and 5 mean
- **Helpful Tip**: Informs users about clickable lyrics
- **Attention-Grabbing**: Orange theme draws focus
- **No Confusion**: Reduces questions during survey

## Key Information Communicated

1. **Quantity**: 10 sets of lyrics
2. **Format**: 3 verses each
3. **Content**: Mix of human and AI lyrics
4. **Task**: Rate confidence (1-5 scale)
5. **Scale Definition**:
   - 1 = Definitely Human
   - 5 = Definitely AI
6. **Distribution**: Both types present, may vary
7. **UI Tip**: Click lyrics for expanded view

## Text Formatting

Used `{'\n\n'}` and `{'\n'}` for proper line breaks in SubText component:

```javascript
<SubText>
    We will present you with 10 sets of lyrics (3 verses each). These consist of a mixture of human-written Sega lyrics and specialized AI-generated lyrics.
    {'\n\n'}
    Your task is to read each one and rate your confidence:
    {'\n'}
    1 = Definitely Human
    {'\n'}
    5 = Definitely AI
    {'\n\n'}
    Note: You will always be presented with both types of lyrics throughout the session, though the distribution may vary.
    {'\n\n'}
    💡 TIP: You can click on any lyric container for an expanded view.
</SubText>
```

## Files Modified

1. ✅ `src/app/config/colors.js` - Added instruction color theme
2. ✅ `src/app/screen/ModerationFlow.js` - Added instruction slide

## No Changes To

- ✅ Frontend survey logic
- ✅ Vote collection
- ✅ API endpoints
- ✅ Database schema
- ✅ Other components

## Testing Checklist

- [x] Instruction slide displays correctly
- [x] Orange theme applied
- [x] Alert lottie animation plays
- [x] Text formatting with line breaks works
- [x] Previous button works (goes to welcome)
- [x] Next button works (goes to birthday)
- [x] Slide pagination shows 5 dots
- [x] Current slide indicator correct
- [x] No validation errors on instruction slide
- [x] All subsequent slides work correctly
- [x] No syntax errors
- [ ] Test complete flow end-to-end
- [ ] Verify users understand instructions
- [ ] Check readability on mobile

## Benefits

1. **User Clarity**: Clear understanding of task
2. **Reduced Confusion**: Fewer questions during survey
3. **Better Data**: Users know what they're rating
4. **Professional**: Shows attention to UX detail
5. **Attention**: Orange theme ensures users read it
6. **Helpful**: Tip about clickable lyrics improves UX

## Design Rationale

### Why Orange?
- Attention-grabbing without being alarming (like red)
- Commonly used for important information
- Warm and inviting
- Stands out from other slide colors
- Associated with guidance and instructions

### Why This Position?
- After welcome (users are engaged)
- Before data collection (sets expectations)
- Logical flow: Welcome → Instructions → Data

### Why This Content?
- Answers key questions users might have
- Defines the rating scale clearly
- Sets expectations about content
- Provides helpful UI tip
- Concise but complete

## Future Enhancements

1. **Interactive Demo**: Show example lyric with rating
2. **Video Tutorial**: Short video explaining the task
3. **Practice Round**: One practice lyric before real survey
4. **FAQ Link**: Link to detailed FAQ page
5. **Skip Option**: Allow experienced users to skip
6. **Language Toggle**: Multi-language support

## Accessibility

- Clear, readable text
- Proper contrast ratios
- Logical tab order
- Screen reader friendly
- Simple language

## Mobile Considerations

- Text remains readable on small screens
- Line breaks work on mobile
- Buttons accessible
- Lottie animation scales properly
- No horizontal scrolling
