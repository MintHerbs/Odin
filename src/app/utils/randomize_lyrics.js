import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

/**
 * Map genre to color code
 * @param {string} genre - Genre name
 * @returns {string} Color code from APP_COLORS
 */
const getColorCodeForGenre = (genre) => {
  const genreLower = genre?.toLowerCase() || '';
  
  if (genreLower.includes('romance')) return 'pink';
  if (genreLower.includes('politics')) return 'blue';
  if (genreLower.includes('celebration')) return 'purple';
  if (genreLower.includes('tipik')) return 'yellow';
  if (genreLower.includes('engager')) return 'gray';
  if (genreLower.includes('seggae')) return 'mint';
  
  // Default fallback
  return 'blue';
};

/**
 * Select 5 human lyrics from survey_data based on user preferences
 * @param {Object} userPreferences - User input from ModerationFlow
 * @param {number} userPreferences.age - User's age
 * @param {number} userPreferences.segaFamiliarity - Sega familiarity (1-5)
 * @param {number} userPreferences.aiSentiment - AI sentiment (1-5)
 * @returns {Promise<Object>} Object containing lyrics array and selected IDs
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
        source: 'human',
        lottie: lyric.lottie || lyric.genre?.toLowerCase(), // Add lottie field for genre mapping
        color_code: getColorCodeForGenre(lyric.genre) // Map genre to color
      }));

    // Extract the SIDs for storage
    const selectedSIDs = selectedLyrics.map(lyric => lyric.sid);

    console.log('✅ Selected 5 human lyrics:');
    selectedLyrics.forEach((lyric, index) => {
      console.log(`  ${index + 1}. Genre: ${lyric.genre}, SID: ${lyric.sid}`);
    });

    console.log('📋 Selected SIDs:', selectedSIDs);

    return {
      lyrics: selectedLyrics,
      selectedSIDs: selectedSIDs
    };

  } catch (error) {
    console.error('❌ Error in selectHumanLyrics:', error);
    throw error;
  }
};

/**
 * Fetch AI-generated lyrics for a specific session
 * STRICT: Returns exactly 5 AI lyrics (excludes 1 random genre)
 * @param {string} sessionId - The session ID
 * @returns {Promise<Array>} Array of exactly 5 AI lyric objects
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
    const allAILyrics = [];
    const genres = ['politics', 'engager', 'romance', 'celebration', 'tipik', 'seggae'];

    genres.forEach((genre) => {
      const idField = `${genre}_ai_id`;
      const segaField = `${genre}_ai_sega`;

      if (data[idField] && data[segaField] && data[segaField] !== '-') {
        const genreName = genre.charAt(0).toUpperCase() + genre.slice(1);
        allAILyrics.push({
          sid: data[idField],
          genre: genreName,
          lyrics: data[segaField],
          is_ai: true,
          source: 'ai',
          session_id: sessionId,
          lottie: genre, // Add lottie field for genre mapping
          color_code: getColorCodeForGenre(genreName) // Map genre to color
        });
      }
    });

    console.log(`📊 Found ${allAILyrics.length} AI-generated lyrics`);

    // STRICT: Return exactly 5 AI lyrics
    // If we have 6, randomly exclude 1 genre
    if (allAILyrics.length === 6) {
      const randomIndex = Math.floor(Math.random() * 6);
      const excludedLyric = allAILyrics[randomIndex];
      const selectedAILyrics = allAILyrics.filter((_, index) => index !== randomIndex);
      
      console.log(`🎲 Randomly excluding AI genre: ${excludedLyric.genre}`);
      console.log(`✅ Returning exactly 5 AI lyrics`);
      
      return selectedAILyrics;
    } else if (allAILyrics.length === 5) {
      console.log(`✅ Already have exactly 5 AI lyrics`);
      return allAILyrics;
    } else {
      console.warn(`⚠️  Expected 5-6 AI lyrics, got ${allAILyrics.length}`);
      return allAILyrics.slice(0, 5); // Take first 5 as fallback
    }

  } catch (error) {
    console.error('❌ Error in fetchAILyrics:', error);
    throw error;
  }
};

/**
 * Save selected human lyric IDs to session_real_sega_chosen table
 * @param {string} sessionId - The session ID
 * @param {Array<number>} selectedSIDs - Array of 5 selected SIDs
 * @returns {Promise<Object>} Result of the database operation
 */
export const saveSelectedSIDs = async (sessionId, selectedSIDs) => {
  try {
    console.log('💾 Saving selected SIDs to session_real_sega_chosen...');
    console.log(`Session ID: ${sessionId}`);
    console.log(`SIDs: [${selectedSIDs.join(', ')}]`);

    if (!selectedSIDs || selectedSIDs.length !== 5) {
      throw new Error(`Expected 5 SIDs, got ${selectedSIDs?.length || 0}`);
    }

    const payload = {
      session_id: sessionId,
      sid1: selectedSIDs[0],
      sid2: selectedSIDs[1],
      sid3: selectedSIDs[2],
      sid4: selectedSIDs[3],
      sid5: selectedSIDs[4]
    };

    const { data, error } = await supabase
      .from('session_real_sega_chosen')
      .upsert(payload, {
        onConflict: 'session_id'
      });

    if (error) {
      console.error('Error saving selected SIDs:', error);
      throw new Error(`Failed to save selected SIDs: ${error.message}`);
    }

    console.log('✅ Successfully saved selected SIDs to database');
    return { success: true, data };

  } catch (error) {
    console.error('❌ Error in saveSelectedSIDs:', error);
    throw error;
  }
};