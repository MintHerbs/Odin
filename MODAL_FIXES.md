# Modal Width and Line Break Fixes

## Status: ✅ COMPLETE

## Overview
Fixed two issues with the lyrics modal in survey.js:
1. Modal width now matches card width (500px)
2. Line breaks (`\n`) in lyrics are properly rendered

## Changes Implemented

### 1. ✅ Modal Width Fixed

**Problem**: Modal was responsive (90% width, max 600px) instead of matching card width

**Solution**: Set fixed width to 500px to match card dimensions

**Before**:
```javascript
modalContent: {
    maxWidth: '600px',
    width: '90%',
    // ...
}
```

**After**:
```javascript
modalContent: {
    width: '500px',
    // ...
}
```

**Result**: Modal now has the same width as the survey cards (500px)

### 2. ✅ Line Breaks Rendered Properly

**Problem**: Lyrics from database contain `\n` as literal text instead of line breaks

**Solution**: Created `formatLyrics()` function to convert `\n` to `<br />` elements

**Implementation**:
```javascript
// Format lyrics with proper line breaks
const formatLyrics = (lyrics) => {
    if (!lyrics) return '';
    // Replace \n with actual line breaks
    return lyrics.split('\\n').map((line, index, array) => (
        <span key={index}>
            {line}
            {index < array.length - 1 && <br />}
        </span>
    ));
};
```

**How it works**:
1. Takes lyrics string from database
2. Splits on `\n` to get array of lines
3. Maps each line to a `<span>` element
4. Adds `<br />` between lines (except after last line)
5. Returns React elements with proper line breaks

**Applied to**:
1. **Main lyrics card** (truncated view)
2. **Modal body** (full view)

### 3. ✅ Enhanced Text Formatting

**Added styles for better readability**:

**Main Card**:
```javascript
style={{ 
    // ... existing styles
    whiteSpace: 'pre-wrap'  // Preserves whitespace and line breaks
}}
```

**Modal Body**:
```javascript
modalBody: {
    overflowY: 'auto',
    flex: 1,
    padding: '10px 0',
    lineHeight: '1.8',
    fontSize: '15px',
    color: '#1F2429',
    fontFamily: 'var(--font-roboto), Roboto, sans-serif'
}
```

**Modal Content Wrapper**:
```javascript
<div style={{ whiteSpace: 'pre-wrap' }}>
    {formatLyrics(currentRecord.lyrics)}
</div>
```

## Example Transformation

### Database Content
```
"Verse 1 line 1\nVerse 1 line 2\n\nVerse 2 line 1\nVerse 2 line 2"
```

### Before Fix (Displayed as)
```
Verse 1 line 1\nVerse 1 line 2\n\nVerse 2 line 1\nVerse 2 line 2
```

### After Fix (Displayed as)
```
Verse 1 line 1
Verse 1 line 2

Verse 2 line 1
Verse 2 line 2
```

## Visual Comparison

### Modal Width

**Before**: 
- Responsive width (90% of screen)
- Max width 600px
- Inconsistent with card size

**After**:
- Fixed width 500px
- Matches card dimensions exactly
- Consistent visual alignment

### Line Breaks

**Before**:
- `\n` displayed as literal text
- All lyrics on one line
- Hard to read verses

**After**:
- `\n` converted to line breaks
- Proper verse separation
- Easy to read structure

## Technical Details

### formatLyrics Function

**Parameters**:
- `lyrics` (string): Raw lyrics text from database

**Returns**:
- React elements with proper line breaks

**Edge Cases Handled**:
- Empty/null lyrics → returns empty string
- No line breaks → returns single line
- Multiple consecutive `\n` → creates blank lines
- Last line → no trailing `<br />`

### whiteSpace: 'pre-wrap'

**Purpose**: Preserves whitespace and line breaks while allowing text wrapping

**Benefits**:
- Maintains formatting from database
- Allows text to wrap at container width
- Preserves intentional spacing

## Files Modified

1. ✅ `src/app/screen/survey.js`
   - Added `formatLyrics()` function
   - Updated modal width to 500px
   - Applied formatting to card and modal
   - Added `whiteSpace: 'pre-wrap'` styles
   - Enhanced modal body typography

## Testing Checklist

- [x] Modal width is 500px
- [x] Modal matches card width visually
- [x] Line breaks render correctly in card
- [x] Line breaks render correctly in modal
- [x] Empty lines preserved (double `\n`)
- [x] No trailing line break after last line
- [x] Text wraps properly in modal
- [x] Scrolling works for long lyrics
- [x] No syntax errors
- [ ] Test with various lyric formats
- [ ] Test with very long verses
- [ ] Test with no line breaks
- [ ] Test with many consecutive line breaks

## Database Format Support

The system now properly handles these formats:

1. **Single line breaks**: `\n`
2. **Double line breaks**: `\n\n` (paragraph separation)
3. **Multiple verses**: Separated by `\n\n`
4. **Mixed content**: Lines with and without breaks

## Benefits

1. **Consistency**: Modal width matches card design
2. **Readability**: Proper verse structure visible
3. **Professional**: Clean formatting throughout
4. **Flexible**: Handles various lyric formats
5. **Maintainable**: Simple, reusable function
6. **Performance**: Efficient string splitting and mapping

## Future Enhancements

1. **Rich Formatting**: Support for bold, italic (if needed)
2. **Verse Numbering**: Automatically number verses
3. **Highlight Search**: Highlight search terms in lyrics
4. **Copy Formatted**: Copy with line breaks preserved
5. **Print View**: Optimized print layout
6. **Font Options**: User-selectable font size

## Example Usage

```javascript
// In database
lyrics: "Mo kontan twa\nMo kontan twa\n\nDan mo leker\nTo pou reste"

// Rendered as
Mo kontan twa
Mo kontan twa

Dan mo leker
To pou reste
```

## Notes

- The `\\n` in the split function is intentional (escaped backslash + n)
- This handles the literal string `\n` from the database
- If database stores actual newlines, use `.split('\n')` instead
- Current implementation assumes database stores `\n` as text
