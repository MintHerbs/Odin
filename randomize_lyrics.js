/**
 * Logic to pick 5 human lyrics based on 6 genres and user survey variables.
 * @param {Array} allRecords - The full survey_data JSON.
 * @param {Object} userData - { age, segaFamiliarity, aiSentiment }
 */
export const getRecommendedHumanLyrics = (allRecords, userData) => {
  const { age, segaFamiliarity, aiSentiment } = userData;

  // 1. Filter out placeholder/pending rows
  let pool = allRecords.filter(r => r.lyrics !== "pending" && r.sid.length < 10); // Simple check for sample data vs UUIDs

  const scoredPool = pool.map(record => {
    let score = 0;

    // --- Age Match (Weight: 10) ---
    const ageDiff = Math.abs(record.age - age);
    if (ageDiff <= 10) score += 10;

    // --- Sega Literacy vs Popularity (Weight: 20) ---
    // High familiarity (4-5) gets obscure/low-pop tracks (1-5)
    if (segaFamiliarity >= 4 && record.popularity <= 5) score += 20;
    // Low familiarity (1-2) gets famous/high-pop tracks (8-10)
    if (segaFamiliarity <= 2 && record.popularity >= 8) score += 20;

    // --- AI Sentiment vs Genre (Weight: 30) ---
    const genre = record.genre.toLowerCase();
    
    if (aiSentiment <= 2) {
      // Skeptics get Traditional/Soulful genres
      if (genre === 'tipik' || genre === 'seggae') score += 30;
    } else if (aiSentiment === 3) {
      // Neutrals get Lyrical/Topical genres
      if (genre === 'romance' || genre === 'politics') score += 30;
    } else {
      // Supporters get Modern/Active genres
      if (genre === 'engager' || genre === 'celebration') score += 30;
    }

    return { ...record, matchScore: score };
  });

  // 3. Sort by matchScore and pick 5. 
  // We include a random element so the user sees a variety of genres.
  return scoredPool
    .sort((a, b) => (b.matchScore + Math.random() * 10) - (a.matchScore + Math.random() * 10))
    .slice(0, 5);
};