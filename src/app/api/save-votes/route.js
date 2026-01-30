import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

export async function POST(request) {
  try {
    const body = await request.json();
    const { session_id, votes, ip_address } = body;

    console.log('🗳️  Processing votes for session:', session_id);
    console.log(`📊 Total votes received: ${votes?.length || 0}`);
    console.log(`📍 IP Address: ${ip_address || 'not provided'}`);

    if (!session_id || !votes) {
      return Response.json({ error: 'Missing session_id or votes' }, { status: 400 });
    }

    // STRICT VALIDATION: Must have exactly 10 votes
    if (votes.length !== 10) {
      console.error(`❌ Expected exactly 10 votes, got ${votes.length}`);
      return Response.json({ 
        error: `Expected exactly 10 votes, got ${votes.length}`,
        votes_received: votes.length 
      }, { status: 400 });
    }

    // Count human vs AI votes
    const humanVotes = votes.filter(v => !v.isAI);
    const aiVotes = votes.filter(v => v.isAI);
    
    console.log(`👤 Human votes: ${humanVotes.length}`);
    console.log(`🤖 AI votes: ${aiVotes.length}`);

    // Validate we have 5 of each
    if (humanVotes.length !== 5 || aiVotes.length !== 5) {
      console.warn(`⚠️  Expected 5 human and 5 AI votes, got ${humanVotes.length} human and ${aiVotes.length} AI`);
    }

    // Transform votes array into normalized rows for the 'votes' table
    const voteRows = votes.map((vote, index) => {
      const { lyricId, genre, vote: voteValue, isAI, lottie } = vote;
      
      // Use lottie field for genre mapping (more reliable)
      const genreKey = lottie || genre;
      const normalizedGenre = genreKey ? genreKey.toLowerCase().trim() : null;

      if (!normalizedGenre) {
        console.warn(`⚠️  Vote ${index + 1} missing genre/lottie field:`, vote);
      }

      // Build the row object for normalized table
      const row = {
        session_id: session_id,
        genre: normalizedGenre,
        is_ai: Boolean(isAI),
        vote_value: parseInt(voteValue)
      };

      // Type-safe ID assignment
      if (isAI) {
        // AI lyrics: ai_id as string, sega_id as null
        row.ai_id = String(lyricId);
        row.sega_id = null;
        console.log(`  ✅ Row ${index + 1}: AI vote - Genre: ${normalizedGenre}, ID: ${lyricId}, Vote: ${voteValue}`);
      } else {
        // Human lyrics: sega_id as integer, ai_id as null
        const humanId = parseInt(lyricId);
        if (isNaN(humanId)) {
          console.error(`❌ Invalid human lyric ID at vote ${index + 1}: ${lyricId}`);
          row.sega_id = null;
        } else {
          row.sega_id = humanId;
        }
        row.ai_id = null;
        console.log(`  ✅ Row ${index + 1}: Human vote - Genre: ${normalizedGenre}, SID: ${row.sega_id}, Vote: ${voteValue}`);
      }

      return row;
    });

    console.log(`📦 Prepared ${voteRows.length} rows for insertion`);

    // ATOMIC REFRESH: Delete existing votes for this session before inserting new ones
    console.log(`🗑️  Deleting existing votes for session: ${session_id}`);
    const { error: deleteError } = await supabase
      .from('votes')
      .delete()
      .eq('session_id', session_id);

    if (deleteError) {
      console.error('❌ Error deleting existing votes:', deleteError);
      throw deleteError;
    }

    console.log('✅ Existing votes cleared');

    // Batch insert all 10 rows into the normalized 'votes' table
    const { data, error } = await supabase
      .from('votes')
      .insert(voteRows);

    if (error) {
      console.error('❌ Database insertion error:', error);
      throw error;
    }

    console.log('✅ All votes saved to database successfully');
    console.log(`📊 Summary:`);
    console.log(`   - Total rows inserted: ${voteRows.length}`);
    console.log(`   - Human votes: ${humanVotes.length}`);
    console.log(`   - AI votes: ${aiVotes.length}`);

    // Log genre distribution
    const genreCount = {};
    voteRows.forEach(row => {
      genreCount[row.genre] = (genreCount[row.genre] || 0) + 1;
    });
    console.log(`   - Genre distribution:`, genreCount);

    // LAYER 3: Lock the vote in database (if IP provided and not whitelisted)
    const WHITELIST_IP = '102.115.222.233';
    if (ip_address && ip_address !== WHITELIST_IP) {
      console.log('🔒 Locking vote in database for IP:', ip_address);
      
      const { error: lockError } = await supabase
        .from('session_trackers')
        .insert({
          ip_address,
          session_id,
          created_at: new Date().toISOString()
        });

      if (lockError && lockError.code !== '23505') {
        console.error('⚠️  Failed to lock vote:', lockError);
        // Don't fail the entire request if lock fails
      } else {
        console.log('✅ Vote locked in database');
      }
    } else if (ip_address === WHITELIST_IP) {
      console.log('⚠️  Whitelist IP - skipping database lock');
    }

    return Response.json({ 
      success: true, 
      session_id: session_id,
      votes_inserted: voteRows.length,
      human_votes: humanVotes.length,
      ai_votes: aiVotes.length,
      genre_distribution: genreCount
    });

  } catch (error) {
    console.error('❌ API Error:', error);
    return Response.json({ 
      success: false, 
      error: error.message,
      details: error.details || null
    }, { status: 500 });
  }
}