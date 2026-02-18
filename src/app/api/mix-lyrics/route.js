import { selectHumanLyrics, fetchAILyrics, saveSelectedSIDs } from '../../utils/randomize_lyrics.js';
import { mixLyrics, fallbackToHumanOnly } from '../../utils/dataMixer.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { session_id, age, segaFamiliarity, aiSentiment } = body;

    console.log('🎵 Starting lyric mixing process...');
    console.log('Session ID:', session_id);
    console.log('User preferences:', { age, segaFamiliarity, aiSentiment });

    if (!session_id) {
      return Response.json({ error: 'session_id is required' }, { status: 400 });
    }

    // Step 1: Fetch AI lyrics from warm pool (5 most recent)
    console.log('🤖 Step 1: Fetching AI lyrics from warm pool...');
    const aiLyrics = await fetchAILyrics(session_id);
    
    if (aiLyrics.length > 0) {
      console.log(`✅ Using ${aiLyrics.length} lyrics from warm pool (instant!)`);
    } else {
      console.log('⚠️  No AI lyrics in warm pool - will use human-only fallback');
    }
    
    // Extract AI genres for diversity guardrail
    const aiGenres = aiLyrics.map(lyric => lyric.genre);
    console.log('📊 AI genres:', aiGenres);

    // Step 2: Select 5 human lyrics based on user preferences and AI genres
    console.log('📊 Step 2: Selecting human lyrics with genre diversity...');
    const humanSelection = await selectHumanLyrics({
      age,
      segaFamiliarity,
      aiSentiment
    }, aiGenres);

    const humanLyrics = humanSelection.lyrics;
    const selectedSIDs = humanSelection.selectedSIDs;

    // Step 3: Save selected SIDs to session_real_sega_chosen table
    console.log('💾 Step 3: Saving selected SIDs...');
    await saveSelectedSIDs(session_id, selectedSIDs);

    // Step 4: Mix the lyrics
    console.log('🎭 Step 4: Mixing lyrics...');
    let result;

    if (aiLyrics.length === 0) {
      console.warn('⚠️  No AI lyrics available, using fallback mode (human-only)');
      result = fallbackToHumanOnly(humanLyrics);
    } else {
      result = mixLyrics(humanLyrics, aiLyrics);
    }

    console.log('✅ Lyric mixing completed successfully');
    console.log(`📦 Total lyrics: ${result.metadata.totalCount}`);
    console.log(`👤 Human: ${result.metadata.humanCount}, 🤖 AI: ${result.metadata.aiCount}`);
    console.log(`📋 Selected human SIDs: [${selectedSIDs.join(', ')}]`);

    // Step 5: Generate AI lyrics for next user (await to ensure completion)
    console.log('🚀 Step 5: Generating AI lyrics for next user...');
    let generationResult = null;
    
    try {
      const { generateAllLyrics } = await import('../../lib/generateLyrics.js');
      
      // Generate a proper UUID for the background session
      const bgSessionId = crypto.randomUUID();
      
      console.log(`📡 Starting generation for ${bgSessionId}...`);
      
      // AWAIT the generation to ensure it completes (only 6-10 seconds)
      generationResult = await generateAllLyrics(bgSessionId);
      
      console.log(`✅ Generation completed:`, generationResult);
    } catch (bgError) {
      console.error('❌ Generation failed (non-critical):', bgError.message);
    }

    return Response.json({
      success: true,
      session_id: session_id,
      lyrics: result.mixedLyrics,
      metadata: {
        ...result.metadata,
        selectedSIDs: selectedSIDs,
        aiSource: aiLyrics.length > 0 ? 'warm_pool' : 'none',
        warmPoolSize: aiLyrics.length,
        newLyricsGenerated: generationResult ? generationResult.count : 0,
        generationSuccess: !!generationResult
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in mix-lyrics API:', error);
    return Response.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}