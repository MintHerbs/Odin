import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

// All 6 genres that should be populated
const REQUIRED_GENRES = ['politics', 'engager', 'romance', 'celebration', 'tipik', 'seggae'];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const session_id = searchParams.get('session_id');

    if (!session_id) {
      return Response.json({ error: 'session_id is required' }, { status: 400 });
    }

    console.log(`🔍 Checking AI lyrics status for session: ${session_id}`);

    // Fetch AI lyrics for this session
    const { data, error } = await supabase
      .from('survey_ai_lyrics')
      .select('*')
      .eq('session_id', session_id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Record not found - AI generation not started or failed
        console.log('⏳ AI lyrics record not found yet');
        return Response.json({
          ready: false,
          status: 'not_started',
          message: 'AI lyrics generation not started',
          session_id: session_id
        });
      }
      throw new Error(`Database error: ${error.message}`);
    }

    if (!data) {
      console.log('⏳ AI lyrics data is empty');
      return Response.json({
        ready: false,
        status: 'not_started',
        message: 'AI lyrics data not found',
        session_id: session_id
      });
    }

    // Check if all required genres are populated (not "-" and not null)
    let populatedCount = 0;
    const genreStatus = {};

    REQUIRED_GENRES.forEach(genre => {
      const idField = `${genre}_ai_id`;
      const segaField = `${genre}_ai_sega`;
      
      const isPopulated = data[idField] && 
                         data[idField] !== '-' && 
                         data[segaField] && 
                         data[segaField] !== '-';
      
      genreStatus[genre] = isPopulated;
      if (isPopulated) populatedCount++;
    });

    const isReady = populatedCount === REQUIRED_GENRES.length;

    console.log(`📊 AI Lyrics Status: ${populatedCount}/${REQUIRED_GENRES.length} genres populated`);
    console.log('Genre status:', genreStatus);

    if (isReady) {
      console.log('✅ All AI lyrics are ready!');
      return Response.json({
        ready: true,
        status: 'complete',
        message: 'All AI lyrics generated successfully',
        session_id: session_id,
        genres_populated: populatedCount,
        total_genres: REQUIRED_GENRES.length,
        genre_status: genreStatus
      });
    } else {
      console.log(`⏳ AI lyrics still generating... (${populatedCount}/${REQUIRED_GENRES.length})`);
      return Response.json({
        ready: false,
        status: 'generating',
        message: 'AI lyrics generation in progress',
        session_id: session_id,
        genres_populated: populatedCount,
        total_genres: REQUIRED_GENRES.length,
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