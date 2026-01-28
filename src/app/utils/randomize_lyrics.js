import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

/**
 * Select 5 human lyrics from survey_data based on user preferences
 * @param {Object} userPreferences - User input from ModerationFlow
 * @param {number} userPreferences.age - User's age
 * @param {number} userPreferences.segaFamiliarity - Sega familiarity (1-5)
 * @param {number} userPreferences.aiSentiment - AI sentiment (1-5)
 * @returns {Promise<Array>} Array of 5 human lyric objects
 */
export const selectHumanLyrics = async (userPreferences) => {
  try {
    console.log('🎵 Selecting human lyrics based on preferences:', userPreferences);

    const { age, segaFamiliarity, aiSentiment } = userPreferences;

    // Fetch all human lyrics from survey_data
    const { data: allLyrics, error } = await supabase
      .from('survey_data')
      .select('*');

    if (error) {
      console.error('Error fetching survey_data:', error);
      throw new Error(`Failed to fetch human lyrics: ${error.message}`);
    }

    if (!allLyrics || allLyrics.length === 0) {
      throw new Error('No human lyrics found in survey_data table');
    }

    console.log(`📊 Found ${allLyrics.length} human lyrics in database`);

    // Score each lyric based on user preferences
    const scoredLyrics = allLyrics.map(lyric => {
      let score = 0;

      // Age proximity scoring (if age field exists in survey_data)
      if (lyric.age && age) {
        const ageDiff = Math.abs(lyric.age - age);
        score += Math.max(0, 10 - ageDiff); // Closer age = higher score
      }

      // Popularity scoring (if popularity field exists)
      if (lyric.popularity) {
        score += lyric.popularity * 2;
      }

      // Comments density scoring (engagement indicator)
      if (lyric.comments_density) {
        score += lyric.comments_density * 1.5;
      }

      // Sega familiarity influence
      // Higher familiarity = prefer more traditional/authentic lyrics
      if (segaFamiliarity >= 4) {
        // Prefer traditional genres
        if (lyric.genre && (lyric.genre.toLowerCase().includes('tipik') || 
                            lyric.genre.toLowerCase().includes('traditional'))) {
          score += 15;
        }
      } else if (segaFamiliarity <= 2) {
        // Prefer modern/popular genres
        if (lyric.genre && (lyric.genre.toLowerCase().includes('engager') || 
                            lyric.genre.toLowerCase().includes('celebration'))) {
          score += 15;
        }
      }

      // AI sentiment influence on genre selection
      if (aiSentiment >= 4) {
        // Pro-AI users might appreciate more experimental genres
        if (lyric.genre && lyric.genre.toLowerCase().includes('engager')) {
          score += 10;
        }
      } else if (aiSentiment <= 2) {
        // Anti-AI users might prefer traditional authentic content
        if (lyric.genre && lyric.genre.toLowerCase().includes('tipik')) {
          score += 10;
        }
      }

      // Add some randomness to avoid always selecting the same lyrics
      score += Math.random() * 5;

      return {
        ...lyric,
        selectionScore: score
      };
    });

    // Sort by score and select top 5
    const selectedLyrics = scoredLyrics
      .sort((a, b) => b.selectionScore - a.selectionScore)
      .slice(0, 5)
      .map(({ selectionScore, ...lyric }) => ({
        ...lyric,
        is_ai: false, // Mark as human-generated
        source: 'human'
      }));

    console.log('✅ Selected 5 human lyrics:');
    selectedLyrics.forEach((lyric, index) => {
      console.log(`  ${index + 1}. Genre: ${lyric.genre}, SID: ${lyric.sid}`);
    });

    return selectedLyrics;

  } catch (error) {
    console.error('❌ Error in selectHumanLyrics:', error);
    throw error;
  }
};

/**
 * Fetch AI-generated lyrics for a specific session
 * @param {string} sessionId - The session ID
 * @returns {Promise<Array>} Array of AI lyric objects
 */
export const fetchAILyrics = async (sessionId) => {
  try {
    console.log('🤖 Fetching AI lyrics for session:', sessionId);

    const { data, error } = await supabase
      .from('survey_ai_lyrics')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.warn('⚠️  No AI lyrics found for this session');
        return [];
      }
      throw new Error(`Failed to fetch AI lyrics: ${error.message}`);
    }

    if (!data) {
      console.warn('⚠️  AI lyrics data is empty');
      return [];
    }

    // Transform the flat structure into an array of lyric objects
    const aiLyrics = [];
    const genres = ['politics', 'engager', 'romance', 'celebration', 'tipik', 'seggae'];

    genres.forEach((genre, index) => {
      const idField = `${genre}_ai_id`;
      const segaField = `${genre}_ai_sega`;

      if (data[idField] && data[segaField] && data[segaField] !== '-') {
        aiLyrics.push({
          sid: data[idField],
          genre: genre.charAt(0).toUpperCase() + genre.slice(1),
          lyrics: data[segaField],
          is_ai: true,
          source: 'ai',
          session_id: sessionId
        });
      }
    });

    console.log(`✅ Found ${aiLyrics.length} AI-generated lyrics`);

    return aiLyrics;

  } catch (error) {
    console.error('❌ Error in fetchAILyrics:', error);
    throw error;
  }
};