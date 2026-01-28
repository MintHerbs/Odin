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

    // Step 1: Select 5 human lyrics based on user preferences
    console.log('📊 Step 1: Selecting human lyrics...');
    const humanSelection = await selectHumanLyrics({
      age,
      segaFamiliarity,
      aiSentiment
    });

    const humanLyrics = humanSelection.lyrics;
    const selectedSIDs = humanSelection.selectedSIDs;

    // Step 2: Save selected SIDs to session_real_sega_chosen table
    console.log('💾 Step 2: Saving selected SIDs...');
    await saveSelectedSIDs(session_id, selectedSIDs);

    // Step 3: Fetch AI lyrics for this session
    console.log('🤖 Step 3: Fetching AI lyrics...');
    const aiLyrics = await fetchAILyrics(session_id);

    // Step 4: Mix the lyrics
    console.log('🎭 Step 4: Mixing lyrics...');
    let result;

    if (aiLyrics.length === 0) {
      console.warn('⚠️  No AI lyrics available, using fallback mode');
      result = fallbackToHumanOnly(humanLyrics);
    } else {
      result = mixLyrics(humanLyrics, aiLyrics);
    }

    console.log('✅ Lyric mixing completed successfully');
    console.log(`📦 Total lyrics: ${result.metadata.totalCount}`);
    console.log(`👤 Human: ${result.metadata.humanCount}, 🤖 AI: ${result.metadata.aiCount}`);
    console.log(`📋 Selected human SIDs: [${selectedSIDs.join(', ')}]`);

    return Response.json({
      success: true,
      session_id: session_id,
      lyrics: result.mixedLyrics,
      metadata: {
        ...result.metadata,
        selectedSIDs: selectedSIDs
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