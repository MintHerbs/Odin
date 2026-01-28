/**
 * Combines AI lyrics and Human lyrics into a single shuffled array.
 * Each object is tagged with a 'type' for later analysis.
 */
export const mixLyrics = (aiData, humanRecords) => {
  // 1. Format Human Records from survey_data
  const formattedHumans = humanRecords.map(rec => ({
    id: rec.sid,
    type: 'human',
    genre: rec.genre,
    lyrics: rec.lyrics,
    color_code: rec.color_code,
    lottie: rec.lottie
  }));

  // 2. Format AI Data from survey_ai_lyrics
  const genres = ['politics', 'engager', 'romance', 'celebration', 'tipik', 'seggae'];
  const formattedAI = [];

  genres.forEach(genre => {
    const text = aiData[`${genre}_ai_sega`];
    const id = aiData[`${genre}_ai_id`];
    
    // Only include if the genre was generated (not marked as "-")
    if (text && text !== "-") {
      formattedAI.push({
        id: id,
        type: 'ai',
        genre: genre,
        lyrics: text,
        color_code: 'ai', // Uses the 'ai' theme from APP_COLORS
        lottie: genre
      });
    }
  });

  // 3. Combine and Shuffle (Fisher-Yates Shuffle)
  const combined = [...formattedHumans, ...formattedAI];
  for (let i = combined.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [combined[i], combined[j]] = [combined[j], combined[i]];
  }

  return combined;
};