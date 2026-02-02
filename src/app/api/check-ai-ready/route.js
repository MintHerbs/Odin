import { createClient } from '@supabase/supabase-js';

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ CRITICAL: Supabase environment variables are missing!');
  console.error('Required variables:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
  console.error('  - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:', supabaseKey ? '✓ Set' : '✗ Missing');
  throw new Error('Missing required Supabase environment variables. Check your .env.local file.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// All 8 genres that could be generated (but only 5 will be selected per session)
const ALL_GENRES = ['politics', 'engager', 'romance', 'celebration', 'tipik', 'seggae', 'hotel', 'modern'];
const EXPECTED_GENRE_COUNT = 5; // Only 5 genres per session

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const session_id = searchParams.get('session_id');

    if (!session_id) {
      return Response.json({ error: 'session_id is required' }, { status: 400 });
    }

    console.log(`🔍 Checking AI lyrics status for session: ${session_id}`);

    // Fetch AI lyrics for this session from normalized table
    const { data, error } = await supabase
      .from('session_ai_lyrics')
      .select('*')
      .eq('session_id', session_id);

    if (error) {
      console.error('Database error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    if (!data || data.length === 0) {
      // No records found - AI generation not started or failed
      console.log('⏳ AI lyrics records not found yet');
      return Response.json({
        ready: false,
        status: 'not_started',
        message: 'AI lyrics generation not started',
        session_id: session_id
      });
    }

    // Check which genres are populated
    const populatedGenres = data.map(row => row.genre);
    const populatedCount = populatedGenres.length;
    
    const genreStatus = {};
    ALL_GENRES.forEach(genre => {
      genreStatus[genre] = populatedGenres.includes(genre);
    });

    const isReady = populatedCount === EXPECTED_GENRE_COUNT;

    console.log(`📊 AI Lyrics Status: ${populatedCount}/${EXPECTED_GENRE_COUNT} genres populated`);
    console.log('Genre status:', genreStatus);

    if (isReady) {
      console.log('✅ All 5 AI lyrics are ready!');
      return Response.json({
        ready: true,
        status: 'complete',
        message: 'All AI lyrics generated successfully',
        session_id: session_id,
        genres_populated: populatedCount,
        total_genres: EXPECTED_GENRE_COUNT,
        genre_status: genreStatus
      });
    } else {
      console.log(`⏳ AI lyrics still generating... (${populatedCount}/${EXPECTED_GENRE_COUNT})`);
      return Response.json({
        ready: false,
        status: 'generating',
        message: 'AI lyrics generation in progress',
        session_id: session_id,
        genres_populated: populatedCount,
        total_genres: EXPECTED_GENRE_COUNT,
        genre_status: genreStatus
      });
    }

  } catch (error) {
    console.error('❌ Error checking AI lyrics status:', error);
    return Response.json({
      ready: false,
      status: 'error',
      error: error.message,
      session_id: searchParams.get('session_id')
    }, { status: 500 });
  }
}