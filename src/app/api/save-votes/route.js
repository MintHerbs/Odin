import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

// All 6 genres
const GENRES = ['politics', 'engager', 'romance', 'celebration', 'tipik', 'seggae'];

export async function POST(request) {
  try {
    const body = await request.json();
    const { session_id, votes } = body;

    console.log('🗳️  Saving votes for session:', session_id);
    console.log('📊 Votes received:', votes);

    if (!session_id) {
      return Response.json({ error: 'session_id is required' }, { status: 400 });
    }

    if (!votes || !Array.isArray(votes)) {
      return Response.json({ error: 'votes must be an array' }, { status: 400 });
    }

    // Initialize payload with all fields set to "-"
    const votePayload = {
      session_id: session_id
    };

    // Initialize all genre fields to "-"
    GENRES.forEach(genre => {
      votePayload[`${genre}_ai_id`] = "-";
      votePayload[`${genre}_ai_vote`] = null;
      votePayload[`${genre}_sega_id`] = null;
      votePayload[`${genre}_sega_vote`] = null;
    });

    console.log('📦 Initialized vote payload with "-" placeholders');

    // Process each vote
    votes.forEach((vote, index) => {
      const { lyricId, genre, vote: voteValue, isAI } = vote;
      
      console.log(`  Processing vote ${index + 1}:`, { lyricId, genre, voteValue, isAI });

      if (!genre || !lyricId || !voteValue) {
        console.warn(`    ⚠️  Skipping incomplete vote:`, vote);
        return;
      }

      // Normalize genre to lowercase
      const normalizedGenre = genre.toLowerCase().trim();

      // Check if genre is valid
      if (!GENRES.includes(normalizedGenre)) {
        console.warn(`    ⚠️  Invalid genre "${normalizedGenre}", skipping`);
        return;
      }

      // Determine if this is AI or human (sega) lyric
      if (isAI) {
        // AI lyric
        votePayload[`${normalizedGenre}_ai_id`] = lyricId;
        votePayload[`${normalizedGenre}_ai_vote`] = voteValue;
        console.log(`    ✅ Mapped AI vote: ${normalizedGenre}_ai_id = ${lyricId}, ${normalizedGenre}_ai_vote = ${voteValue}`);
      } else {
        // Human (sega) lyric
        votePayload[`${normalizedGenre}_sega_id`] = parseInt(lyricId);
        votePayload[`${normalizedGenre}_sega_vote`] = voteValue;
        console.log(`    ✅ Mapped Sega vote: ${normalizedGenre}_sega_id = ${lyricId}, ${normalizedGenre}_sega_vote = ${voteValue}`);
      }
    });

    console.log('📊 Final vote payload:');
    console.log(JSON.stringify(votePayload, null, 2));

    // Upsert to database
    console.log('💾 Saving votes to database...');
    const { data, error } = await supabase
      .from('session_votes')
      .upsert(votePayload, {
        onConflict: 'session_id'
      });

    if (error) {
      console.error('❌ Database error:', error);
      return Response.json({
        success: false,
        error: `Failed to save votes: ${error.message}`
      }, { status: 500 });
    }

    console.log('✅ Successfully saved votes to session_votes table');

    return Response.json({
      success: true,
      session_id: session_id,
      votes_saved: votes.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in save-votes API:', error);
    return Response.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}