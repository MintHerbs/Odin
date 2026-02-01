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
  if (genreLower.includes('hotel')) return 'red';
  if (genreLower.includes('modern')) return 'green';
  
  // Default fallback
  return 'blue';
};

/**
 * Select 5 human lyrics from survey_data based on user preferences
 * with genre diversity guardrail (max 3 per genre)
 * @param {Object} userPreferences - User input from ModerationFlow
 * @param {number} userPreferences.age - User's age
 * @param {number} userPreferences.segaFamiliarity - Sega familiarity (1-5)
 * @param {number} userPreferences.aiSentiment - AI sentiment (1-5)
 * @param {Array<string>} aiGenres - Array of AI-generated genres to avoid overexposure
 * @returns {Promise<Object>} Object containing lyrics array and selected IDs
 */
export const selectHumanLyrics = async (userPreferences, aiGenres = []) => {
  try {
    console.log('🎵 Selecting human lyrics based on preferences:', userPreferences);
    console.log('🤖 AI genres to consider for diversity:', aiGenres);

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
                            lyric.genre.toLowerCase().includes('celebration') ||
                            lyric.genre.toLowerCase().includes('modern'))) {
          score += 15;
        }
      }

      // AI sentiment influence on genre selection
      if (aiSentiment >= 4) {
        // Pro-AI users might appreciate more experimental genres
        if (lyric.genre && (lyric.genre.toLowerCase().includes('engager') ||
                            lyric.genre.toLowerCase().includes('modern'))) {
          score += 10;
        }
      } else if (aiSentiment <= 2) {
        // Anti-AI users might prefer traditional authentic content
        if (lyric.genre && lyric.genre.toLowerCase().includes('tipik')) {
          score += 10;
        }
      }

      // Age-based genre preferences
      if (age) {
        // Young participants (18-30) prefer modern genres
        if (age >= 18 && age <= 30) {
          if (lyric.genre && (lyric.genre.toLowerCase().includes('modern') ||
                              lyric.genre.toLowerCase().includes('engager'))) {
            score += 12;
          }
        }
        // Middle-aged participants (40-60) prefer hotel/tourism themes
        else if (age >= 40 && age <= 60) {
          if (lyric.genre && lyric.genre.toLowerCase().includes('hotel')) {
            score += 12;
          }
        }
        // Older participants (60+) prefer traditional
        else if (age > 60) {
          if (lyric.genre && lyric.genre.toLowerCase().includes('tipik')) {
            score += 12;
          }
        }
      }

      // Add some randomness to avoid always selecting the same lyrics
      score += Math.random() * 5;

      return {
        ...lyric,
        selectionScore: score
      };
    });

    // Sort by score and select top 5 with genre diversity guardrail
    const sortedLyrics = scoredLyrics.sort((a, b) => b.selectionScore - a.selectionScore);
    
    // Count AI genres to track exposure
    const genreCount = {};
    aiGenres.forEach(genre => {
      const normalizedGenre = genre.toLowerCase();
      genreCount[normalizedGenre] = (genreCount[normalizedGenre] || 0) + 1;
    });
    
    console.log('📊 AI genre distribution:', genreCount);
    
    // Select lyrics with genre diversity guardrail (max 3 per genre)
    const selectedLyrics = [];
    const MAX_GENRE_EXPOSURE = 3;
    
    for (const lyric of sortedLyrics) {
      if (selectedLyrics.length >= 5) break;
      
      const lyricGenre = lyric.genre?.toLowerCase() || '';
      const currentCount = genreCount[lyricGenre] || 0;
      
      // Check if adding this lyric would exceed the genre limit
      if (currentCount < MAX_GENRE_EXPOSURE) {
        selectedLyrics.push({
          ...lyric,
          is_ai: false,
          source: 'human',
          lottie: lyric.lottie || lyric.genre?.toLowerCase(),
          color_code: getColorCodeForGenre(lyric.genre)
        });
        
        // Update genre count
        genreCount[lyricGenre] = currentCount + 1;
        
        console.log(`  ✅ Selected: ${lyric.genre} (total exposure: ${genreCount[lyricGenre]}/3)`);
      } else {
        console.log(`  ⚠️  Skipped: ${lyric.genre} (already at max exposure: ${currentCount}/3)`);
      }
    }
    
    // If we couldn't get 5 lyrics due to genre limits, fill with remaining best options
    if (selectedLyrics.length < 5) {
      console.warn(`⚠️  Only selected ${selectedLyrics.length} lyrics with genre guardrail. Filling remaining slots...`);
      
      for (const lyric of sortedLyrics) {
        if (selectedLyrics.length >= 5) break;
        
        // Check if this lyric is already selected
        const alreadySelected = selectedLyrics.some(selected => selected.sid === lyric.sid);
        if (!alreadySelected) {
          selectedLyrics.push({
            ...lyric,
            is_ai: false,
            source: 'human',
            lottie: lyric.lottie || lyric.genre?.toLowerCase(),
            color_code: getColorCodeForGenre(lyric.genre)
          });
          console.log(`  ➕ Filled slot: ${lyric.genre}`);
        }
      }
    }

    // Extract the SIDs for storage
    const selectedSIDs = selectedLyrics.map(lyric => lyric.sid);

    console.log('✅ Selected 5 human lyrics with genre diversity:');
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
 * Returns exactly 5 AI lyrics (one random genre is excluded during generation)
 * @param {string} sessionId - The session ID
 * @returns {Promise<Array>} Array of exactly 5 AI lyric objects
 */
export const fetchAILyrics = async (sessionId) => {
  try {
    console.log('🤖 Fetching AI lyrics for session:', sessionId);

    const { data, error } = await supabase
      .from('session_ai_lyrics')
      .select('*')
      .eq('session_id', sessionId);

    if (error) {
      console.error('Error fetching AI lyrics:', error);
      throw new Error(`Failed to fetch AI lyrics: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.warn('⚠️  No AI lyrics found for this session');
      return [];
    }

    // Transform normalized rows into lyric objects
    const allAILyrics = data.map((row) => {
      const genreName = row.genre.charAt(0).toUpperCase() + row.genre.slice(1);
      return {
        sid: row.ai_id,
        genre: genreName,
        lyrics: row.lyrics,
        is_ai: true,
        source: 'ai',
        session_id: sessionId,
        lottie: row.genre, // Add lottie field for genre mapping
        color_code: getColorCodeForGenre(genreName) // Map genre to color
      };
    });

    console.log(`📊 Found ${allAILyrics.length} AI-generated lyrics`);

    // Validate we have exactly 5 AI lyrics
    if (allAILyrics.length !== 5) {
      console.error(`❌ Expected exactly 5 AI lyrics, got ${allAILyrics.length}`);
      throw new Error(`Expected exactly 5 AI lyrics, got ${allAILyrics.length}`);
    }

    console.log(`✅ Returning exactly 5 AI lyrics`);
    return allAILyrics;

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