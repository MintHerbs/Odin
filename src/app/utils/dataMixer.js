/**
 * Fisher-Yates shuffle algorithm for true randomization
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Mix human and AI lyrics into a single shuffled array
 * STRICT: Returns exactly 10 lyrics (5 Human + 5 AI)
 * @param {Array} humanLyrics - Array of 5 human lyric objects
 * @param {Array} aiLyrics - Array of AI lyric objects (will be limited to 5)
 * @returns {Object} Object containing mixed array and metadata
 */
export const mixLyrics = (humanLyrics, aiLyrics) => {
  try {
    console.log('🎭 Mixing lyrics...');
    console.log(`  Human lyrics: ${humanLyrics.length}`);
    console.log(`  AI lyrics: ${aiLyrics.length}`);

    // Validate inputs
    if (!Array.isArray(humanLyrics) || humanLyrics.length !== 5) {
      throw new Error(`humanLyrics must contain exactly 5 items, got ${humanLyrics?.length || 0}`);
    }

    if (!Array.isArray(aiLyrics)) {
      throw new Error('aiLyrics must be an array');
    }

    // STRICT: Limit AI lyrics to exactly 5
    const limitedAILyrics = aiLyrics.slice(0, 5);
    
    if (limitedAILyrics.length !== 5) {
      console.warn(`⚠️  Expected 5 AI lyrics, got ${limitedAILyrics.length}. Padding may be needed.`);
    }

    console.log(`✅ Using ${limitedAILyrics.length} AI lyrics (limited to 5)`);

    // Ensure all human lyrics have is_ai flag
    const markedHumanLyrics = humanLyrics.map(lyric => ({
      ...lyric,
      is_ai: false,
      source: 'human'
    }));

    // Ensure all AI lyrics have is_ai flag
    const markedAILyrics = limitedAILyrics.map(lyric => ({
      ...lyric,
      is_ai: true,
      source: 'ai'
    }));

    // Merge the arrays - MUST be exactly 10 items
    const mergedLyrics = [...markedHumanLyrics, ...markedAILyrics];

    if (mergedLyrics.length !== 10) {
      throw new Error(`Expected exactly 10 lyrics, got ${mergedLyrics.length} (${markedHumanLyrics.length} human + ${markedAILyrics.length} AI)`);
    }

    console.log(`📦 Total lyrics before shuffle: ${mergedLyrics.length} ✅`);

    // Perform true shuffle
    const shuffledLyrics = shuffleArray(mergedLyrics);

    // Add display index to each lyric
    const indexedLyrics = shuffledLyrics.map((lyric, index) => ({
      ...lyric,
      displayIndex: index + 1
    }));

    console.log('✅ Lyrics mixed and shuffled successfully');
    console.log('🎲 Shuffle order (for verification):');
    indexedLyrics.forEach((lyric, index) => {
      console.log(`  ${index + 1}. ${lyric.source.toUpperCase()} - Genre: ${lyric.genre}, ID: ${lyric.sid}`);
    });

    return {
      mixedLyrics: indexedLyrics,
      metadata: {
        totalCount: indexedLyrics.length,
        humanCount: markedHumanLyrics.length,
        aiCount: markedAILyrics.length,
        shuffleTimestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('❌ Error in mixLyrics:', error);
    throw error;
  }
};

/**
 * Fallback function when AI lyrics are not available
 * @param {Array} humanLyrics - Array of human lyric objects
 * @returns {Object} Object containing human-only array and metadata
 */
export const fallbackToHumanOnly = (humanLyrics) => {
  console.warn('⚠️  Falling back to human-only lyrics');
  
  const shuffledHumanLyrics = shuffleArray(humanLyrics).map((lyric, index) => ({
    ...lyric,
    is_ai: false,
    source: 'human',
    displayIndex: index + 1
  }));

  return {
    mixedLyrics: shuffledHumanLyrics,
    metadata: {
      totalCount: shuffledHumanLyrics.length,
      humanCount: shuffledHumanLyrics.length,
      aiCount: 0,
      fallbackMode: true,
      shuffleTimestamp: new Date().toISOString()
    }
  };
};